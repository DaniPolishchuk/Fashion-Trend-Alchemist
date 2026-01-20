/**
 * API-Lite Server
 * Minimal Fastify backend serving taxonomy data from database
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fetchProductTaxonomy, pool } from '@fashion/db';
import type { Taxonomy, FiltersResponse, ProductsResponse } from '@fashion/types';
import { llmConfig } from '@fashion/config';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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
    return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to fetch taxonomy' } as any);
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
      const [fromMonth, fromDay] = mdFrom.split('-').map(Number);
      const [toMonth, toDay] = mdTo.split('-').map(Number);
      
      if (fromMonth === toMonth && fromDay === toDay) {
        whereClauses.push(`(EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) = ${fromDay})`);
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
    
    if (season) {
      const months = { spring: '(3,4,5)', summer: '(6,7,8)', autumn: '(9,10,11)', winter: '(12,1,2)' }[season.toLowerCase()];
      if (months) whereClauses.push(`EXTRACT(MONTH FROM t.t_date) IN ${months}`);
    } else if (mdFrom && mdTo) {
      const [fromMonth, fromDay] = mdFrom.split('-').map(Number);
      const [toMonth, toDay] = mdTo.split('-').map(Number);
      
      if (fromMonth === toMonth && fromDay === toDay) {
        whereClauses.push(`(EXTRACT(MONTH FROM t.t_date) = ${fromMonth} AND EXTRACT(DAY FROM t.t_date) = ${fromDay})`);
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
    let orderByClause = '';
    const sortD = sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    
    if (sortBy === 'article_id') {
      orderByClause = `ORDER BY a.article_id ${sortD}`;
    } else {
      orderByClause = `ORDER BY a.${sortBy} ${sortD}`;
    }

    const idsQuery = `
      SELECT DISTINCT a.article_id
      FROM transactions_train t
      INNER JOIN articles a ON a.article_id = t.article_id
      WHERE ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

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

    const foundIds = rows.map((r: any) => r.article_id);
    const idPlaceholders = foundIds.map((_, i) => `$${i + 1}`).join(', ');
    
    const detailsQuery = `SELECT * FROM articles WHERE article_id IN (${idPlaceholders})`;
    const detailsResult = await pool.query(detailsQuery, foundIds);
    
    const detailsMap = new Map();
    detailsResult.rows.forEach((d: any) => detailsMap.set(d.article_id, d));

    const items = rows.map((row: any) => {
      const details = detailsMap.get(row.article_id) || {};
      return {
        ...details,
        articleId: row.article_id,
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

/**
 * POST /generate-attributes
 * UI-based attribute generation with conversation history support
 */
fastify.post<{ 
  Body: { 
    productTypes: string[];
    feedback?: string;
    conversationHistory?: any[];
  } 
}>('/generate-attributes', async (request, reply) => {
  try {
    const { productTypes, feedback, conversationHistory } = request.body;
    
    if (!productTypes || productTypes.length === 0) {
      return reply.status(400).send({ error: 'No product types provided' });
    }

    console.log(`\n🎨 Generating attributes for: ${productTypes.join(', ')}`);
    if (feedback) console.log(`💬 With feedback: ${feedback}`);

    // Read files from monorepo root
    const systemPrompt = readFileSync(resolve(process.cwd(), '../../attributeSetSystemPromt.txt'), 'utf-8');
    const examples = readFileSync(resolve(process.cwd(), '../../attributeSetExamples.json'), 'utf-8');

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: llmConfig.apiKey,
      baseURL: llmConfig.apiUrl,
    });

    // Build messages array
    let messages: any[];
    
    if (conversationHistory && conversationHistory.length > 0) {
      // Continue existing conversation with feedback
      messages = [...conversationHistory];
      if (feedback) {
        messages.push({
          role: 'user',
          content: `The previous attribute set needs improvement. Here is the feedback:\n\n${feedback}\n\nPlease regenerate the attribute schema addressing this feedback. Remember to follow the same JSON format.`
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
        { role: 'user', content: initialUserMessage }
      ];
    }

    // Make LLM request
    console.log('⏳ Calling LLM...');
    const completion = await openai.chat.completions.create({
      model: llmConfig.model,
      messages: messages,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || '';
    
    // Add assistant response to conversation history
    messages.push({ role: 'assistant', content: responseContent });
    
    // Try to parse JSON from response
    let attributeSet: any;
    try {
      const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || responseContent.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : responseContent;
      attributeSet = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response');
      return reply.status(500).send({ 
        error: 'Failed to parse LLM response',
        rawResponse: responseContent 
      });
    }

    console.log('✅ Attributes generated successfully\n');

    return reply.send({ 
      success: true, 
      attributeSet,
      conversationHistory: messages
    });
    
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
