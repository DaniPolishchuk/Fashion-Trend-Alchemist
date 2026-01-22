/**
 * API-Lite Server
 * Minimal Fastify backend serving taxonomy data from database
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
// Using real database taxonomy query
import { fetchProductTaxonomy, pool } from '@fashion/db';
import type { Taxonomy, FiltersResponse, ProductsResponse } from '@fashion/types';

import projectRoutes from './routes/projects.js';
import collectionRoutes from './routes/collections.js';
import enrichmentRoutes from './routes/enrichment.js';
import rpt1Routes from './routes/rpt1.js';

import { llmConfig } from '@fashion/config';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { cache, CACHE_TTL } from './services/cache.js';

const fastify = Fastify({
  logger: true,
});

// Enable CORS for web app
await fastify.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
});

/**
 * Interfaces & Types
 */
interface ProductsQuery {
  types: string;
  season?: string;
  mdFrom?: string;
  mdTo?: string;
  sortBy?: string;
  sortDir?: string;
  limit?: string;
  offset?: string;
  [key: string]: string | undefined;
}

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
 * GET /api/taxonomy
 */
fastify.get<{ Reply: Taxonomy }>('/api/taxonomy', async (request, reply) => {
  try {
    const groups = await fetchProductTaxonomy();
    return reply.status(200).send({ groups });
  } catch (error) {
    request.log.error({ error }, 'Failed to fetch taxonomy');
    return reply
      .status(500)
      .send({ error: 'Internal Server Error', message: 'Failed to fetch taxonomy' } as any);
  }
});

/**
 * GET /api/articles/count
 */
fastify.get<{ Querystring: { types: string }; Reply: { count: number } }>(
  '/api/articles/count',
  async (request, reply) => {
    try {
      const { types } = request.query;
      if (!types || types.trim() === '') return reply.status(200).send({ count: 0 });

      const typeArray = types
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);

      if (typeArray.length === 0) return reply.status(200).send({ count: 0 });

      const placeholders = typeArray.map((_: string, i: number) => `$${i + 1}`).join(', ');
      const query = `
      SELECT COUNT(DISTINCT article_id) as count
      FROM articles
      WHERE product_type IN (${placeholders})
    `;

      const result = await pool.query(query, typeArray);
      const count = result.rows[0]?.count ? parseInt(result.rows[0].count, 10) : 0;
      return reply.status(200).send({ count });
    } catch (error) {
      request.log.error({ error }, 'Failed to fetch article count');
      return reply.status(500).send({ count: 0 });
    }
  }
);

/**
 * GET /api/transactions/count
 */
fastify.get<{ Querystring: { types: string }; Reply: { count: number } }>(
  '/api/transactions/count',
  async (request, reply) => {
    try {
      const { types } = request.query;
      if (!types || types.trim() === '') return reply.status(200).send({ count: 0 });

      const typeArray = types
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);

      if (typeArray.length === 0) return reply.status(200).send({ count: 0 });

      const placeholders = typeArray.map((_: string, i: number) => `$${i + 1}`).join(', ');
      const query = `
      SELECT COUNT(*) as count
      FROM transactions_train t
      INNER JOIN articles a ON a.article_id = t.article_id
      WHERE a.product_type IN (${placeholders})
    `;

      const result = await pool.query(query, typeArray);
      const count = result.rows[0]?.count ? parseInt(result.rows[0].count, 10) : 0;
      return reply.status(200).send({ count });
    } catch (error) {
      request.log.error({ error }, 'Failed to fetch transaction count');
      return reply.status(500).send({ count: 0 });
    }
  }
);

/**
 * GET /api/filters/attributes
 */
fastify.get<{
  Querystring: { types: string; season?: string; mdFrom?: string; mdTo?: string };
  Reply: FiltersResponse;
}>('/api/filters/attributes', async (request, reply) => {
  try {
    const { types, season, mdFrom, mdTo } = request.query;

    if (!types) return reply.status(400).send({ error: 'Missing types' } as any);

    // Generate cache key from query parameters
    const cacheKey = cache.generateKey('filters', { types, season, mdFrom, mdTo });

    // Try to get from cache first
    const cached = await cache.get<FiltersResponse>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT for filters:', cacheKey);
      return reply.status(200).send(cached);
    }

    console.log('❌ Cache MISS for filters:', cacheKey);

    const typeArray = types
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    const typePlaceholders = typeArray.map((_: string, i: number) => `$${i + 1}`).join(', ');
    const whereClauses = [`a.product_type IN (${typePlaceholders})`];
    const params: any[] = [...typeArray];

    if (season) {
      const seasonMonths: Record<string, string> = {
        spring: '(3,4,5)',
        summer: '(6,7,8)',
        autumn: '(9,10,11)',
        winter: '(12,1,2)',
      };
      const s = season.toLowerCase();
      if (seasonMonths[s]) whereClauses.push(`EXTRACT(MONTH FROM t.t_date) IN ${seasonMonths[s]}`);
    } else if (mdFrom && mdTo) {
      const [fromMonth, fromDay] = mdFrom.split('-').map(Number);
      const [toMonth, toDay] = mdTo.split('-').map(Number);

      if (fromMonth === toMonth && fromDay === toDay) {
        whereClauses.push(
          `(EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) = ${fromDay})`
        );
      } else if (fromMonth < toMonth || (fromMonth === toMonth && fromDay <= toDay)) {
        whereClauses.push(`(
          (EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) >= ${fromDay})
          OR (EXTRACT(MONTH FROM t.t_date) > ${fromMonth} AND EXTRACT(MONTH FROM t.t_date) < ${toMonth})
          OR (EXTRACT(MONTH FROM t.t_date) = ${toMonth} AND EXTRACT(DAY FROM t.t_date) <= ${toDay})
        )`);
      } else {
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

    const response: FiltersResponse = {
      productGroup: row.product_group || [],
      productFamily: row.product_family || [],
      styleConcept: row.style_concept || [],
      patternStyle: row.pattern_style || [],
      colorFamily: row.color_family || [],
      colorIntensity: row.color_intensity || [],
      specificColor: row.specific_color || [],
      customerSegment: row.customer_segment || [],
      fabricTypeBase: row.fabric_type_base || [],
    };

    // Store in cache for future requests
    await cache.set(cacheKey, response, CACHE_TTL.FILTER_OPTIONS);
    console.log('💾 Cached filter options for:', cacheKey);

    return reply.status(200).send(response);
  } catch (error) {
    request.log.error({ error }, 'Failed to fetch filter attributes');
    return reply.status(500).send({ error: 'Internal Server Error' } as any);
  }
});

/**


 * GET /products
 */
const productsHandler = async (
  request: import('fastify').FastifyRequest<{ Querystring: ProductsQuery }>,
  reply: import('fastify').FastifyReply
) => {
  try {
    const {
      types,
      season,
      mdFrom,
      mdTo,
      sortBy = 'article_id',
      sortDir = 'asc',
      limit = '10',
      offset = '0',
    } = request.query;

    if (!types) return reply.status(400).send({ error: 'Missing types' } as any);

    // Generate cache key including all query parameters
    const cacheKey = cache.generateKey('products', request.query);

    // Try to get from cache first
    const cached = await cache.get<ProductsResponse>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT for products:', cacheKey);
      return reply.send(cached);
    }

    console.log('❌ Cache MISS for products:', cacheKey);

    const typeArray = types
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    const whereClauses: string[] = [];
    const params: any[] = [...typeArray];
    let paramIndex = typeArray.length + 1;

    const typePlaceholders = typeArray.map((_: string, i: number) => `$${i + 1}`).join(', ');
    whereClauses.push(`a.product_type IN (${typePlaceholders})`);

    // --- Time/Season Filters ---

    if (season) {
      const months: Record<string, string> = {
        spring: '(3,4,5)',
        summer: '(6,7,8)',
        autumn: '(9,10,11)',
        winter: '(12,1,2)',
      };
      const monthsForSeason = months[season.toLowerCase()];
      if (monthsForSeason) whereClauses.push(`EXTRACT(MONTH FROM t.t_date) IN ${monthsForSeason}`);
    } else if (mdFrom && mdTo) {
      const [fromMonth, fromDay] = mdFrom.split('-').map(Number);
      const [toMonth, toDay] = mdTo.split('-').map(Number);
      if (fromMonth === toMonth && fromDay === toDay) {
        whereClauses.push(
          `(EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) = ${fromDay})`
        );
      } else if (fromMonth < toMonth || (fromMonth === toMonth && fromDay <= toDay)) {
        whereClauses.push(`(
          (EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) >= ${fromDay})
          OR (EXTRACT(MONTH FROM t.t_date) > ${fromMonth} AND EXTRACT(MONTH FROM t.t_date) < ${toMonth})
          OR (EXTRACT(MONTH FROM t.t_date) = ${toMonth} AND EXTRACT(DAY FROM t.t_date) <= ${toDay})
        )`);
      } else {
        whereClauses.push(`(
          (EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) >= ${fromDay})
          OR (EXTRACT(MONTH FROM t.t_date) > ${fromMonth})
          OR (EXTRACT(MONTH FROM t.t_date) < ${toMonth})
          OR (EXTRACT(MONTH FROM t.t_date) = ${toMonth} AND EXTRACT(DAY FROM t.t_date) <= ${toDay})
        )`);
      }
    }

    // --- Dynamic Column Filters (Safe) ---
    const filterKeys = [
      'productGroup',
      'productFamily',
      'styleConcept',
      'patternStyle',
      'colorFamily',
      'colorIntensity',
      'specificColor',
      'customerSegment',
      'fabricTypeBase',
    ];

    const validColumns = new Set([
      'product_group',
      'product_family',
      'style_concept',
      'pattern_style',
      'color_family',
      'color_intensity',
      'specific_color',
      'customer_segment',
      'fabric_type_base',
    ]);

    for (const key of filterKeys) {
      const val = request.query[`filter_${key}`];
      if (val) {
        const values = (val as string)
          .split(',')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0);
        if (values.length > 0) {
          const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          if (validColumns.has(col)) {
            const p = values.map(() => `$${paramIndex++}`).join(', ');
            whereClauses.push(`a.${col} IN (${p})`);
            params.push(...values);
          }
        }
      }
    }

    const whereClause = whereClauses.join(' AND ');
    const sortD = sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const sortColumn = sortBy === 'article_id' ? 'article_id' : sortBy;

    const limitNum = parseInt(limit, 10) || 10;
    const offsetNum = parseInt(offset, 10) || 0;

    // Optimized single-query approach using CTEs
    // This combines the count and data fetch into one database round trip
    const optimizedQuery = `
      WITH filtered_articles AS (
        SELECT DISTINCT a.article_id
        FROM transactions_train t
        INNER JOIN articles a ON a.article_id = t.article_id
        WHERE ${whereClause}
      ),
      total_count AS (
        SELECT COUNT(*) as cnt FROM filtered_articles
      ),
      paginated_ids AS (
        SELECT fa.article_id
        FROM filtered_articles fa
        INNER JOIN articles a ON a.article_id = fa.article_id
        ORDER BY a.${sortColumn} ${sortD}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      )
      SELECT 
        a.*,
        tc.cnt as total_count
      FROM paginated_ids pi
      INNER JOIN articles a ON a.article_id = pi.article_id
      CROSS JOIN total_count tc
      ORDER BY a.${sortColumn} ${sortD};
    `;

    const result = await pool.query(optimizedQuery, [...params, limitNum, offsetNum]);

    if (result.rows.length === 0) {
      return reply.send({ items: [], total: 0, limit: limitNum, offset: offsetNum });
    }

    const total = parseInt(result.rows[0]?.total_count || '0', 10);
    const items = result.rows.map((row: any) => {
      const { total_count, ...article } = row;
      return { ...article, articleId: row.article_id };
    });

    const response: ProductsResponse = {
      items,
      total,
      limit: limitNum,
      offset: offsetNum,
    };

    // Store in cache for future requests
    await cache.set(cacheKey, response, CACHE_TTL.PRODUCTS_LIST);
    console.log('💾 Cached products for:', cacheKey);

    return reply.send(response);
  } catch (error) {
    request.log.error({ error }, 'Failed to fetch products');
    return reply.status(500).send({ error: 'Internal Server Error' } as any);
  }
};

// Register products endpoints
fastify.get<{ Querystring: ProductsQuery; Reply: ProductsResponse }>(
  '/api/products',
  productsHandler
);
fastify.get<{ Querystring: ProductsQuery; Reply: ProductsResponse }>(
  '/api/products/preview',
  productsHandler
);

// Register project routes
await fastify.register(projectRoutes, { prefix: '/api' });

// Register collection routes
await fastify.register(collectionRoutes, { prefix: '/api' });

// Register enrichment routes
await fastify.register(enrichmentRoutes, { prefix: '/api' });

// Register RPT-1 routes
await fastify.register(rpt1Routes, { prefix: '/api' });

/**
 * POST /api/cache/invalidate
 * Invalidate cache for specific patterns or clear all
 */
fastify.post<{
  Body: { pattern?: string; clearAll?: boolean };
}>('/api/cache/invalidate', async (request, reply) => {
  try {
    const { pattern, clearAll } = request.body;

    if (clearAll) {
      const success = await cache.flush();
      return reply.send({
        success,
        message: success ? 'All cache cleared' : 'Cache clear failed or not available',
      });
    }

    if (pattern) {
      const count = await cache.deletePattern(pattern);
      return reply.send({
        success: count > 0,
        message: `Deleted ${count} cache entries matching pattern: ${pattern}`,
        deletedCount: count,
      });
    }

    return reply.status(400).send({
      error: 'Must provide either "pattern" or "clearAll: true"',
    });
  } catch (error) {
    request.log.error({ error }, 'Failed to invalidate cache');
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

/**
 * Helper function to extract JSON from LLM response
 */
function extractJSON(text: string): string {
  // Try to find JSON in code blocks first
  const codeBlockMatch =
    text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0].trim();

  // Return as-is if no patterns found
  return text.trim();
}

/**
 * POST /api/generate-attributes
 * UI-based attribute generation with conversation history support
 * Includes automatic retry logic for JSON parsing failures
 */
fastify.post<{
  Body: {
    productTypes: string[];
    feedback?: string;
    conversationHistory?: any[];
  };
}>('/api/generate-attributes', async (request, reply) => {
  try {
    const { productTypes, feedback, conversationHistory } = request.body;

    if (!productTypes || productTypes.length === 0) {
      return reply.status(400).send({ error: 'No product types provided' });
    }

    console.log(`\n🎨 Generating attributes for: ${productTypes.join(', ')}`);
    if (feedback) console.log(`💬 With feedback: ${feedback}`);

    // Read files from monorepo root (go up from apps/api-lite to monorepo root)
    const systemPrompt = readFileSync(
      resolve(process.cwd(), '../..', 'attributeSetSystemPromt.txt'),
      'utf-8'
    );
    const examples = readFileSync(
      resolve(process.cwd(), '../..', 'attributeSetExamples.json'),
      'utf-8'
    );

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: llmConfig.apiKey,
      baseURL: llmConfig.apiUrl,
    });

    // Build initial messages array
    let messages: any[];

    if (conversationHistory && conversationHistory.length > 0) {
      // Continue existing conversation with feedback
      messages = [...conversationHistory];
      if (feedback) {
        messages.push({
          role: 'user',
          content: `The previous attribute set needs improvement. Here is the feedback:\n\n${feedback}\n\nPlease regenerate the attribute schema addressing this feedback. Remember to follow the same JSON format.`,
        });
      }
    } else {
      // Initial request
      const initialUserMessage = `Generate attribute set for the following product type(s): ${productTypes.join(', ')}

Here are examples of attribute sets for reference:
${examples}

Please generate a comprehensive attribute schema following the format in the examples.`;

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: initialUserMessage },
      ];
    }

    // Retry logic for JSON parsing
    const MAX_RETRIES = 3;
    let attributeSet: any;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`⏳ Calling LLM (attempt ${attempt}/${MAX_RETRIES})...`);

        const completion = await openai.chat.completions.create({
          model: llmConfig.model,
          messages: messages,
          temperature: 0.7,
        });

        const responseContent = completion.choices[0]?.message?.content || '';

        // Add assistant response to conversation history
        messages.push({ role: 'assistant', content: responseContent });

        // Try to parse JSON from response
        const jsonString = extractJSON(responseContent);
        attributeSet = JSON.parse(jsonString);

        // Success! Exit retry loop
        console.log('✅ Attributes generated and parsed successfully\n');
        return reply.send({
          success: true,
          attributeSet,
          conversationHistory: messages,
        });
      } catch (parseError) {
        lastError = parseError;
        console.error(`❌ JSON parse failed on attempt ${attempt}/${MAX_RETRIES}`);

        if (attempt < MAX_RETRIES) {
          // Add retry instruction to conversation
          messages.push({
            role: 'user',
            content:
              'The previous response was not valid JSON. Please provide ONLY valid JSON in your response, wrapped in ```json code blocks. Ensure the JSON is properly formatted with no syntax errors.',
          });
          console.log('🔄 Retrying with JSON formatting instructions...');
        } else {
          // All retries exhausted
          console.error('❌ Failed to parse JSON after all retries');
          return reply.status(500).send({
            error: 'Failed to parse LLM response after multiple attempts',
            details: lastError instanceof Error ? lastError.message : 'Unknown error',
            rawResponse: messages[messages.length - 1]?.content,
          });
        }
      }
    }
  } catch (error) {
    request.log.error({ error }, 'Failed to generate attributes');
    console.error('❌ Error generating attributes:', error);
    return reply.status(500).send({ error: 'Internal Server Error' });
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
