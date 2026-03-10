/**
 * Validate Product Types for Nils PA 2 Experiments
 *
 * Run via: pnpm --filter @fashion/api-lite exec tsx src/scripts/validate-product-types.ts
 */

import { pool, closeDb } from '@fashion/db';

interface ProductTypeStats {
  productType: string;
  productGroup: string | null;
  totalArticles: number;
  articlesWithTransactions: number;
  articlesInContext: number;
  enrichedArticles: number;
  lowMismatchArticles: number;
  minVelocity: number;
  maxVelocity: number;
  avgVelocity: number;
}

async function analyzeProductTypes(): Promise<void> {
  console.log('='.repeat(80));
  console.log('PRODUCT TYPE DATA AVAILABILITY ANALYSIS');
  console.log('For Nils PA 2 - RPT-1 Sensitivity Experiments');
  console.log('='.repeat(80));
  console.log();

  // Target product types from the experiment design
  const targetProductTypes = [
    'Trousers',
    'T-shirt',
    'Dress',
    'Shorts',
    'Sweater',
    'Hoodie',
    'Coat',
    'Vest',
  ];

  console.log('Target Product Types:', targetProductTypes.join(', '));
  console.log();

  // Query 1: Get all distinct product types and their counts
  console.log('1. Querying distinct product types in database...');
  const distinctTypesResult = await pool.query(`
    SELECT
      product_type,
      product_group,
      COUNT(*) as total_articles
    FROM articles
    GROUP BY product_type, product_group
    ORDER BY COUNT(*) DESC
    LIMIT 50
  `);

  console.log(`   Found ${distinctTypesResult.rows.length} distinct product types`);
  console.log();

  // Show top 20 product types by count
  console.log('Top 20 Product Types by Article Count:');
  for (const row of distinctTypesResult.rows.slice(0, 20)) {
    console.log(`   ${row.product_type.padEnd(25)} ${String(row.total_articles).padStart(8)} articles`);
  }
  console.log();

  // Query 2: Detailed stats for target product types
  console.log('2. Analyzing target product types...');
  console.log();

  const stats: ProductTypeStats[] = [];

  for (const productType of targetProductTypes) {
    // Check if product type exists (case-insensitive search)
    const matchingType = distinctTypesResult.rows.find(
      (r: any) => r.product_type.toLowerCase() === productType.toLowerCase()
    );

    if (!matchingType) {
      console.log(`   ⚠️  "${productType}" NOT FOUND in database`);
      // Try to find similar names
      const similar = distinctTypesResult.rows.filter(
        (r: any) => r.product_type.toLowerCase().includes(productType.toLowerCase().slice(0, 4))
      );
      if (similar.length > 0) {
        console.log(`      Similar types found: ${similar.map((s: any) => s.product_type).join(', ')}`);
      }
      continue;
    }

    const actualProductType = matchingType.product_type;

    // Get detailed statistics
    const detailedStats = await pool.query(`
      WITH article_sales AS (
        SELECT
          a.article_id,
          a.product_type,
          a.product_group,
          COUNT(t.article_id) as units_sold,
          COALESCE(SUM(t.price::numeric), 0) as revenue
        FROM articles a
        LEFT JOIN transactions_train t ON a.article_id = t.article_id
        WHERE a.product_type = $1
        GROUP BY a.article_id, a.product_type, a.product_group
      ),
      context_stats AS (
        SELECT
          pci.article_id,
          pci.velocity_score,
          pci.enriched_attributes IS NOT NULL as is_enriched,
          COALESCE(pci.mismatch_confidence, 0) as mismatch_confidence
        FROM project_context_items pci
        JOIN articles a ON a.article_id = pci.article_id
        WHERE a.product_type = $1
      )
      SELECT
        COUNT(DISTINCT asales.article_id) as total_articles,
        COUNT(DISTINCT CASE WHEN asales.units_sold > 0 THEN asales.article_id END) as articles_with_transactions,
        COUNT(DISTINCT cs.article_id) as articles_in_context,
        COUNT(DISTINCT CASE WHEN cs.is_enriched THEN cs.article_id END) as enriched_articles,
        COUNT(DISTINCT CASE WHEN cs.mismatch_confidence < 30 THEN cs.article_id END) as low_mismatch_articles,
        COALESCE(MIN(cs.velocity_score::numeric), 0) as min_velocity,
        COALESCE(MAX(cs.velocity_score::numeric), 0) as max_velocity,
        COALESCE(AVG(cs.velocity_score::numeric), 0) as avg_velocity
      FROM article_sales asales
      LEFT JOIN context_stats cs ON asales.article_id = cs.article_id
    `, [actualProductType]);

    const row = detailedStats.rows[0];

    stats.push({
      productType: actualProductType,
      productGroup: matchingType.product_group,
      totalArticles: Number(row.total_articles),
      articlesWithTransactions: Number(row.articles_with_transactions),
      articlesInContext: Number(row.articles_in_context),
      enrichedArticles: Number(row.enriched_articles),
      lowMismatchArticles: Number(row.low_mismatch_articles),
      minVelocity: Number(row.min_velocity),
      maxVelocity: Number(row.max_velocity),
      avgVelocity: Number(row.avg_velocity),
    });
  }

  // Display results
  console.log('='.repeat(100));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(100));
  console.log();

  // Minimum requirements
  const MIN_TEST_ARTICLES = 200;
  const MIN_CONTEXT_ARTICLES = 500;
  const MIN_ENRICHED_ARTICLES = 300;

  console.log('Minimum Requirements:');
  console.log(`  - Test Articles (clean, mismatch < 30): >= ${MIN_TEST_ARTICLES}`);
  console.log(`  - Context Articles: >= ${MIN_CONTEXT_ARTICLES}`);
  console.log(`  - Enriched Articles: >= ${MIN_ENRICHED_ARTICLES}`);
  console.log();

  // Print table header
  console.log('Product Type Analysis:');
  console.log('-'.repeat(100));
  console.log(
    'Product Type'.padEnd(20) +
    'Total'.padStart(8) +
    'Context'.padStart(10) +
    'Enriched'.padStart(10) +
    'Clean'.padStart(10) +
    'VelMin'.padStart(8) +
    'VelMax'.padStart(8) +
    'Status'.padStart(14)
  );
  console.log('-'.repeat(100));

  const eligible: ProductTypeStats[] = [];
  const notEligible: ProductTypeStats[] = [];

  for (const s of stats) {
    const isEligible =
      s.lowMismatchArticles >= MIN_TEST_ARTICLES &&
      s.articlesInContext >= MIN_CONTEXT_ARTICLES &&
      s.enrichedArticles >= MIN_ENRICHED_ARTICLES;

    const status = isEligible ? '✅ READY' : '❌ INSUFFICIENT';

    console.log(
      s.productType.padEnd(20) +
      String(s.totalArticles).padStart(8) +
      String(s.articlesInContext).padStart(10) +
      String(s.enrichedArticles).padStart(10) +
      String(s.lowMismatchArticles).padStart(10) +
      s.minVelocity.toFixed(1).padStart(8) +
      s.maxVelocity.toFixed(1).padStart(8) +
      status.padStart(14)
    );

    if (isEligible) {
      eligible.push(s);
    } else {
      notEligible.push(s);
    }
  }

  console.log('-'.repeat(100));
  console.log();

  // Summary
  console.log('='.repeat(100));
  console.log('SUMMARY');
  console.log('='.repeat(100));
  console.log();
  console.log(`Eligible Product Types (${eligible.length}/${stats.length}):`);

  if (eligible.length > 0) {
    for (const e of eligible) {
      console.log(`  ✅ ${e.productType} (${e.enrichedArticles} enriched, ${e.lowMismatchArticles} clean)`);
    }
  } else {
    console.log('  ⚠️  No product types meet all requirements!');
  }

  console.log();

  if (notEligible.length > 0) {
    console.log('Product Types Needing Attention:');
    for (const n of notEligible) {
      const issues = [];
      if (n.lowMismatchArticles < MIN_TEST_ARTICLES) {
        issues.push(`clean: ${n.lowMismatchArticles}/${MIN_TEST_ARTICLES}`);
      }
      if (n.articlesInContext < MIN_CONTEXT_ARTICLES) {
        issues.push(`context: ${n.articlesInContext}/${MIN_CONTEXT_ARTICLES}`);
      }
      if (n.enrichedArticles < MIN_ENRICHED_ARTICLES) {
        issues.push(`enriched: ${n.enrichedArticles}/${MIN_ENRICHED_ARTICLES}`);
      }
      console.log(`  ❌ ${n.productType}: ${issues.join(', ')}`);
    }
  }

  console.log();

  // Query 3: Get list of projects with context items
  console.log('3. Available Projects with Context Items:');
  const projectsResult = await pool.query(`
    SELECT
      p.id,
      p.name,
      p.product_type,
      p.product_group,
      p.customer_segment,
      COUNT(pci.article_id) as context_count,
      COUNT(CASE WHEN pci.enriched_attributes IS NOT NULL THEN 1 END) as enriched_count
    FROM projects p
    LEFT JOIN project_context_items pci ON p.id = pci.project_id
    GROUP BY p.id, p.name, p.product_type, p.product_group, p.customer_segment
    ORDER BY context_count DESC
  `);

  console.log();
  for (const project of projectsResult.rows) {
    console.log(`   - ${project.name}: ${project.product_type || 'N/A'} (${project.context_count} context, ${project.enriched_count} enriched)`);
  }

  console.log();
  console.log('='.repeat(100));
  console.log('NEXT STEPS');
  console.log('='.repeat(100));
  console.log();

  if (eligible.length >= 4) {
    console.log('✅ Sufficient product types available to start experiments!');
    console.log(`   Recommended to start with: ${eligible.slice(0, 4).map(e => e.productType).join(', ')}`);
  } else if (eligible.length > 0) {
    console.log(`⚠️  Only ${eligible.length} product types ready. Consider:`);
    console.log('   1. Running enrichment for more product types');
    console.log('   2. Starting experiments with available types first');
  } else {
    console.log('⚠️  Need to set up data before starting experiments:');
    console.log('   1. Create projects for target product types');
    console.log('   2. Run context selection (top/bottom sellers)');
    console.log('   3. Run enrichment pipeline');
  }

  console.log();
}

// Run the analysis
analyzeProductTypes()
  .catch((error) => {
    console.error('Error analyzing product types:', error);
    process.exit(1);
  })
  .finally(() => {
    closeDb();
  });
