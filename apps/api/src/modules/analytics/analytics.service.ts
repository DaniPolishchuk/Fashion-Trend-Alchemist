/**
 * Analytics service layer
 * Orchestrates business logic for sales analytics and image URL generation
 */

import type { TopBottomQuery, TopBottomResult } from '@fashion/types';
import { fetchTopBottomByProductType } from '@fashion/db';
import { getImageUrl } from '../../common/s3/seaweedfs.js';
import { ANALYTICS_DEFAULTS } from '@fashion/config';

/**
 * Get top and bottom sellers with image URLs
 * 
 * This service function:
 * 1. Validates and normalizes query parameters
 * 2. Fetches aggregated sales data from database
 * 3. Generates presigned URLs for article images
 * 4. Returns enriched result with image access
 * 
 * @param query - Analytics query parameters
 * @returns Promise resolving to top/bottom sellers with image URLs
 * 
 * @example
 * ```typescript
 * // Get top 500 sweater sellers by units (including zero sales)
 * const result = await getTopBottomSellers({
 *   productTypeName: 'Sweater',
 *   metric: 'units',
 *   limit: 500,
 *   includeZero: true
 * });
 * 
 * console.log(`Top seller: ${result.top[0].prodName}`);
 * console.log(`Units sold: ${result.top[0].unitsSold}`);
 * console.log(`Image URL: ${result.top[0].imageUrl}`);
 * ```
 */
export async function getTopBottomSellers(
  query: TopBottomQuery
): Promise<TopBottomResult> {
  // Apply default values for optional parameters
  const normalizedQuery: TopBottomQuery = {
    ...query,
    metric: query.metric || ANALYTICS_DEFAULTS.METRIC,
    limit: query.limit || ANALYTICS_DEFAULTS.LIMIT,
    includeZero: query.includeZero ?? ANALYTICS_DEFAULTS.INCLUDE_ZERO,
  };

  // Fetch aggregated data from database
  const result = await fetchTopBottomByProductType(normalizedQuery);

  // Enrich articles with presigned image URLs
  const attachImageUrls = async (articles: typeof result.top) => {
    return Promise.all(
      articles.map(async (article) => {
        try {
          const imageUrl = await getImageUrl(article.articleId);
          return { ...article, imageUrl };
        } catch (error) {
          // Log error but don't fail entire request if one image is missing
          console.error(
            `Failed to generate image URL for article ${article.articleId}:`,
            error
          );
          return article; // Return without imageUrl on error
        }
      })
    );
  };

  // Process top and bottom sellers in parallel
  const [topWithUrls, bottomWithUrls] = await Promise.all([
    attachImageUrls(result.top),
    attachImageUrls(result.bottom),
  ]);

  return {
    top: topWithUrls,
    bottom: bottomWithUrls,
  };
}