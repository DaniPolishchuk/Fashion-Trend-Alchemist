/**
 * Design Name Generation Routes
 * Handles LLM-based creative name generation for designs
 */

import { FastifyInstance } from 'fastify';
import { llmConfig } from '@fashion/config';
import OpenAI from 'openai';

interface GenerateNameRequestBody {
  productType: string;
  lockedAttributes: Record<string, string>;
  predictedAttributes: Record<string, string>;
}

export default async function designNameRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/generate-design-name
   * Generate a creative, marketable name for a fashion design
   */
  fastify.post<{ Body: GenerateNameRequestBody }>(
    '/generate-design-name',
    async (request, reply) => {
      try {
        const { productType, lockedAttributes, predictedAttributes } = request.body;

        if (!productType) {
          return reply.status(400).send({ error: 'Product type is required' });
        }

        // Format attributes for the prompt
        const formatAttributes = (attrs: Record<string, string>): string => {
          return Object.entries(attrs)
            .filter(([key]) => !key.startsWith('_')) // Filter internal keys
            .map(([key, value]) => {
              // Clean up the key name
              const cleanKey = key
                .replace(/^(article_|ontology_\w+_)/, '')
                .replace(/_/g, ' ')
                .replace(/([a-z])([A-Z])/g, '$1 $2');
              return `- ${cleanKey}: ${value}`;
            })
            .join('\n');
        };

        const givenAttrsText = formatAttributes(lockedAttributes);
        const predictedAttrsText = formatAttributes(predictedAttributes);

        const prompt = `Generate a creative, marketable name for a fashion product with these attributes:

Product Type: ${productType}

Given Attributes:
${givenAttrsText || '(none specified)'}

AI-Predicted Attributes:
${predictedAttrsText || '(none specified)'}

Requirements:
- Name should be 2-5 words
- Should be catchy and memorable
- Should reflect the style/aesthetic of the garment
- Do NOT include generic words like "clothing", "garment", "item", or "fashion"
- Do NOT include the word "${productType}" in the name
- Make it sound like a real fashion product name you'd see in a store

Return ONLY the name, nothing else. No quotes, no explanation.`;

        fastify.log.info({ productType }, 'Generating design name via LLM');

        // Initialize OpenAI client
        const openai = new OpenAI({
          apiKey: llmConfig.apiKey,
          baseURL: llmConfig.apiUrl,
        });

        const completion = await openai.chat.completions.create({
          model: llmConfig.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a fashion brand naming expert. You create short, memorable product names that capture the essence of a design. Respond with ONLY the product name, nothing else.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.9, // Higher temperature for more creative names
          max_tokens: 50,
        });

        const suggestedName = completion.choices[0]?.message?.content?.trim() || 'Unnamed Design';

        // Clean up the name - remove quotes if present
        const cleanedName = suggestedName.replace(/^["']|["']$/g, '').trim();

        fastify.log.info({ suggestedName: cleanedName }, 'Design name generated');

        return reply.send({ suggestedName: cleanedName });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to generate design name');
        return reply.status(500).send({
          error: 'Failed to generate name',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}
