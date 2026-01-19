/**
 * API-Lite Server
 * Minimal Fastify backend serving taxonomy data from database
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fetchProductTaxonomy, pool } from '@fashion/db';
import type { Taxonomy, FiltersResponse, ProductsResponse } from '@fashion/types';

const fastify = Fastify({
  logger: true,
});

// Enable CORS for web app
await fastify.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
});

/**
 * Health check endpoint
 */
fastify.get('/health', async () => {
  return {
    status: 'ok',
    service: 'api-lite',
    timestamp: new Date().toISOString(),
  };
});

/**
 * GET /taxonomy
 */
fastify.get<{ Reply: Taxonomy }>('/taxonomy', async (request, reply) => {
  try {
    const groups = await fetchProductTaxonomy();
    return reply.status(200).send({ groups });
  } catch (error) {
    request.log.error({ error }, 'Failed to fetch taxonomy');
    return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to fetch taxonomy' });
  }
});

/**
 * GET /transactions/count
 */
fastify.get<{ Querystring: { types: string }; Reply: { count: number } }>('/transactions/count', async (request, reply) => {
  try {
    const { types } = request.query;
    if (!types || types.trim() === '') return reply.status(200).send({ count: 0 });
    
    const typeArray = types.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (typeArray.length === 0) return reply.status(200).send({ count: 0 });
    
    const placeholders = typeArray.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
      SELECT COUNT(*) as count
      FROM transactions_train t
      INNER JOIN articles a ON a.article_id = t.article_id
      WHERE a.product_type IN (${placeholders})
    `;
    
    const result = await pool.query(query, typeArray);
    return reply.status(200).send({ count: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    request.log.error({ error }, 'Failed to fetch transaction count');
    return reply.status(500).send({ count: 0 });
  }
});

/**
 * GET /filters/attributes
 */
fastify.get<{ Querystring: { types: string; season?: string; mdFrom?: string; mdTo?: string }; Reply: FiltersResponse }>('/filters/attributes', async (request, reply) => {
  try {
    const { types, season, mdFrom, mdTo } = request.query;
    
    if (!types) return reply.status(400).send({ error: 'Missing types' } as any);
    
    const typeArray = types.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const typePlaceholders = typeArray.map((_, i) => `$${i + 1}`).join(', ');
    const whereClauses = [`a.product_type IN (${typePlaceholders})`];
    const params: any[] = [...typeArray];
  
    if (season) {
      const seasonMonths: Record<string, string> = { spring: '(3,4,5)', summer: '(6,7,8)', autumn: '(9,10,11)', winter: '(12,1,2)' };
      if (seasonMonths[season.toLowerCase()]) whereClauses.push(`EXTRACT(MONTH FROM t.t_date) IN ${seasonMonths[season.toLowerCase()]}`);
    } else if (mdFrom && mdTo) {
      // Parse MM-DD format
      const [fromMonth, fromDay] = mdFrom.split('-').map(Number);
      const [toMonth, toDay] = mdTo.split('-').map(Number);
      
      if (fromMonth === toMonth && fromDay === toDay) {
        // Single day
        whereClauses.push(`(EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) = ${fromDay})`);
      } else if (fromMonth < toMonth || (fromMonth === toMonth && fromDay <= toDay)) {
        // Same year range
        whereClauses.push(`(
          (EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) >= ${fromDay})
          OR (EXTRACT(MONTH FROM t.t_date) > ${fromMonth} AND EXTRACT(MONTH FROM t.t_date) < ${toMonth})
          OR (EXTRACT(MONTH FROM t.t_date) = ${toMonth} AND EXTRACT(DAY FROM t.t_date) <= ${toDay})
        )`);
      } else {
        // Wraps around year (e.g., Dec to Jan)
        whereClauses.push(`(
          (EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) >= ${fromDay})
          OR (EXTRACT(MONTH FROM t.t_date) > ${fromMonth})
          OR (EXTRACT(MONTH FROM t.t_date) < ${toMonth})
          OR (EXTRACT(MONTH FROM t.t_date) = ${toMonth} AND EXTRACT(DAY FROM t.t_date) <= ${toDay})
        )`);
      }
    }
    
    const query = `
      SELECT
        ARRAY_AGG(DISTINCT a.product_group) FILTER (WHERE a.product_group IS NOT NULL) as product_group,
        ARRAY_AGG(DISTINCT a.product_family) FILTER (WHERE a.product_family IS NOT NULL) as product_family,
        ARRAY_AGG(DISTINCT a.style_concept) FILTER (WHERE a.style_concept IS NOT NULL) as style_concept,
        ARRAY_AGG(DISTINCT a.pattern_style) FILTER (WHERE a.pattern_style IS NOT NULL) as pattern_style,
        ARRAY_AGG(DISTINCT a.color_family) FILTER (WHERE a.color_family IS NOT NULL) as color_family,
        ARRAY_AGG(DISTINCT a.color_intensity) FILTER (WHERE a.color_intensity IS NOT NULL) as color_intensity,
        ARRAY_AGG(DISTINCT a.specific_color) FILTER (WHERE a.specific_color IS NOT NULL) as specific_color,
        ARRAY_AGG(DISTINCT a.customer_segment) FILTER (WHERE a.customer_segment IS NOT NULL) as customer_segment,
        ARRAY_AGG(DISTINCT a.fabric_type_base) FILTER (WHERE a.fabric_type_base IS NOT NULL) as fabric_type_base
      FROM transactions_train t
      INNER JOIN articles a ON a.article_id = t.article_id
      WHERE ${whereClauses.join(' AND ')}
    `;
    
    const result = await pool.query(query, params);
    const row = result.rows[0] || {};
    
    return reply.status(200).send({
      productGroup: row.product_group || [],
      productFamily: row.product_family || [],
      styleConcept: row.style_concept || [],
      patternStyle: row.pattern_style || [],
      colorFamily: row.color_family || [],
      colorIntensity: row.color_intensity || [],
      specificColor: row.specific_color || [],
      customerSegment: row.customer_segment || [],
      fabricTypeBase: row.fabric_type_base || [],
    });
  } catch (error) {
    request.log.error({ error }, 'Failed to fetch filter attributes');
    return reply.status(500).send({ error: 'Internal Server Error' } as any);
  }
});

/**
 * GET /products
 * Optimized: Skips aggregation calculations entirely.
 */
fastify.get<{
  Querystring: {
    types: string; season?: string; mdFrom?: string; mdTo?: string;
    sortBy?: string; sortDir?: string; limit?: string; offset?: string;
    [key: string]: string | undefined;
  };
  Reply: ProductsResponse;
}>('/products', async (request, reply) => {
  try {
    const { types, season, mdFrom, mdTo, sortBy = 'article_id', sortDir = 'asc', limit = '10', offset = '0' } = request.query;
    
    if (!types) return reply.status(400).send({ error: 'Missing types' } as any);
    
    const typeArray = types.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const whereClauses: string[] = [];
    const params: any[] = [...typeArray];
    let paramIndex = typeArray.length + 1;
    
    const typePlaceholders = typeArray.map((_, i) => `$${i + 1}`).join(', ');
    whereClauses.push(`a.product_type IN (${typePlaceholders})`);
    
    // --- Filters ---
    if (season) {
      const months = { spring: '(3,4,5)', summer: '(6,7,8)', autumn: '(9,10,11)', winter: '(12,1,2)' }[season.toLowerCase()];
      if (months) whereClauses.push(`EXTRACT(MONTH FROM t.t_date) IN ${months}`);
    } else if (mdFrom && mdTo) {
      // Parse MM-DD format
      const [fromMonth, fromDay] = mdFrom.split('-').map(Number);
      const [toMonth, toDay] = mdTo.split('-').map(Number);
      
      if (fromMonth === toMonth && fromDay === toDay) {
        // Single day
        whereClauses.push(`(EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) = ${fromDay})`);
      } else if (fromMonth < toMonth || (fromMonth === toMonth && fromDay <= toDay)) {
        // Same year range
        whereClauses.push(`(
          (EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) >= ${fromDay})
          OR (EXTRACT(MONTH FROM t.t_date) > ${fromMonth} AND EXTRACT(MONTH FROM t.t_date) < ${toMonth})
          OR (EXTRACT(MONTH FROM t.t_date) = ${toMonth} AND EXTRACT(DAY FROM t.t_date) <= ${toDay})
        )`);
      } else {
        // Wraps around year (e.g., Dec to Jan)
        whereClauses.push(`(
          (EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) >= ${fromDay})
          OR (EXTRACT(MONTH FROM t.t_date) > ${fromMonth})
          OR (EXTRACT(MONTH FROM t.t_date) < ${toMonth})
          OR (EXTRACT(MONTH FROM t.t_date) = ${toMonth} AND EXTRACT(DAY FROM t.t_date) <= ${toDay})
        )`);
      }
    }

    const filterKeys = ['productGroup', 'productFamily', 'styleConcept', 'patternStyle', 
                       'colorFamily', 'colorIntensity', 'specificColor', 'customerSegment', 'fabricTypeBase'];
    
    for (const key of filterKeys) {
      const val = request.query[`filter_${key}`];
      if (val) {
        const values = (val as string).split(',').map(v => v.trim()).filter(v => v.length > 0);
        if (values.length > 0) {
          const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          const p = values.map(() => `$${paramIndex++}`).join(', ');
          whereClauses.push(`a.${col} IN (${p})`);
          params.push(...values);
        }
      }
    }
    
    const whereClause = whereClauses.join(' AND ');

    // --- Safe Sorting ---
    let orderByClause = '';
    const sortD = sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    
    // We cannot sort by transaction_count anymore as we aren't calculating it
    if (sortBy === 'article_id') {
      orderByClause = `ORDER BY a.article_id ${sortD}`;
    } else {
      // For text fields, use MAX to ensure unique row per ID if we were grouping
      // Since we use DISTINCT below, we can order by the column directly if it's unique per article
      // But to be safe with DISTINCT + JOIN:
      orderByClause = `ORDER BY a.${sortBy} ${sortD}`;
    }

    // --- STEP 1: Get IDs (Distinct) ---
    // We use DISTINCT instead of GROUP BY + COUNT to save performance
    const idsQuery = `
      SELECT DISTINCT
        a.article_id
      FROM transactions_train t
      INNER JOIN articles a ON a.article_id = t.article_id
      WHERE ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // --- STEP 2: Count Total ---
    const countQuery = `
      SELECT COUNT(DISTINCT a.article_id) as total
      FROM transactions_train t
      INNER JOIN articles a ON a.article_id = t.article_id
      WHERE ${whereClause}
    `;

    const [idsResult, countResult] = await Promise.all([
      pool.query(idsQuery, [...params, parseInt(limit), parseInt(offset)]),
      pool.query(countQuery, params)
    ]);

    const rows = idsResult.rows;
    
    if (rows.length === 0) {
      return reply.send({ items: [], total: 0, limit: parseInt(limit), offset: parseInt(offset) });
    }

    // --- STEP 3: Hydrate Details ---
    const foundIds = rows.map((r: any) => r.article_id);
    const idPlaceholders = foundIds.map((_, i) => `$${i + 1}`).join(', ');
    
    const detailsQuery = `SELECT * FROM articles WHERE article_id IN (${idPlaceholders})`;
    const detailsResult = await pool.query(detailsQuery, foundIds);
    
    const detailsMap = new Map();
    detailsResult.rows.forEach((d: any) => detailsMap.set(d.article_id, d));

    // --- STEP 4: Merge & Return ---
    const items = rows.map((row: any) => {
      const details = detailsMap.get(row.article_id) || {};
      return {
        ...details, // Spreads all article columns
        articleId: row.article_id, // CamelCase ID
        // Note: transactionCount and lastSaleDate are explicitly OMITTED here
      };
    });

    return reply.send({
      items,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

  } catch (error) {
    request.log.error({ error }, 'Failed to fetch products');
    return reply.status(500).send({ error: 'Internal Server Error' } as any);
  }
});

const start = async () => {
  try {
    const port = Number(process.env.API_PORT) || 3001;
    const host = process.env.API_HOST || '0.0.0.0';
    await fastify.listen({ port, host });
    console.log(`🚀 API-Lite server running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
