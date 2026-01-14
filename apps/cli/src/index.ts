#!/usr/bin/env node
/**
 * Fashion Trend Alchemist - Interactive CLI
 * 
 * Allows users to:
 * 1. Select a product type from all available types
 * 2. Choose analysis parameters (metric, limit, includeZero)
 * 3. View top and bottom sellers with image URLs
 */

import prompts from 'prompts';
import chalk from 'chalk';
import Table from 'cli-table3';
import { filerConfig } from '@fashion/config';
import { getDistinctProductTypeNames, fetchTopBottomByProductType, closeDb } from '@fashion/db';

/**
 * Build image URL using SeaweedFS filer configuration
 * Images are organized in folders by first 2 digits of article ID
 */
function buildImageUrl(articleId: number): string {
  const articleIdStr = articleId.toString();
  const folder = articleIdStr.slice(0, 2);
  return `${filerConfig.baseUrl}/${filerConfig.bucket}/${folder}/${articleIdStr}.jpg`;
}

/**
 * Format number with commas for readability
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format currency with 2 decimal places
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Main CLI workflow
 */
async function main() {
  console.log(chalk.bold.cyan('\n🎨 Fashion Trend Alchemist - Analytics CLI\n'));

  try {
    // Step 1: Fetch all available product types
    console.log(chalk.gray('Loading product types...'));
    const productTypes = await getDistinctProductTypeNames();
    
    if (productTypes.length === 0) {
      console.log(chalk.red('❌ No product types found in database'));
      process.exit(1);
    }

    console.log(chalk.green(`✓ Found ${productTypes.length} product types\n`));

    // Step 2: Prompt user to select product type
    const response = await prompts([
      {
        type: 'autocomplete',
        name: 'productType',
        message: 'Select a product type',
        choices: productTypes.map(type => ({ title: type, value: type })),
        suggest: async (input: string, choices: any[]) => {
          const inputLower = input.toLowerCase();
          return choices.filter(choice => 
            choice.title.toLowerCase().includes(inputLower)
          );
        }
      },
      {
        type: 'select',
        name: 'metric',
        message: 'Rank by',
        choices: [
          { title: 'Units Sold', value: 'units' },
          { title: 'Revenue', value: 'revenue' }
        ],
        initial: 0
      },
      {
        type: 'number',
        name: 'limit',
        message: 'How many top/bottom sellers to show?',
        initial: 10,
        min: 1,
        max: 500
      },
      {
        type: 'confirm',
        name: 'includeZero',
        message: 'Include products with zero sales?',
        initial: true
      }
    ], {
      onCancel: () => {
        console.log(chalk.yellow('\n⚠️  Operation cancelled'));
        process.exit(0);
      }
    });

    // Step 3: Fetch analytics data
    console.log(chalk.gray(`\nFetching ${response.metric === 'units' ? 'units sold' : 'revenue'} data for "${response.productType}"...`));
    
    const result = await fetchTopBottomByProductType({
      productTypeName: response.productType,
      metric: response.metric,
      limit: response.limit,
      includeZero: response.includeZero
    });

    // Step 4: Display top sellers
    console.log(chalk.bold.green(`\n📈 Top ${response.limit} Sellers - ${response.productType}`));
    console.log(chalk.gray(`Ranked by: ${response.metric === 'units' ? 'Units Sold' : 'Revenue'}\n`));

    if (result.top.length === 0) {
      console.log(chalk.yellow('No top sellers found'));
    } else {
      const topTable = new Table({
        head: [
          chalk.cyan('Article ID'),
          chalk.cyan('Product Name'),
          chalk.cyan('Units Sold'),
          chalk.cyan('Revenue'),
          chalk.cyan('Image URL')
        ],
        colWidths: [12, 30, 12, 12, 60],
        wordWrap: true
      });

      for (const item of result.top) {
        topTable.push([
          item.articleId.toString(),
          item.prodName,
          formatNumber(item.unitsSold),
          formatCurrency(item.revenue),
          buildImageUrl(item.articleId)
        ]);
      }

      console.log(topTable.toString());
    }

    // Step 5: Display bottom sellers
    console.log(chalk.bold.red(`\n📉 Bottom ${response.limit} Sellers - ${response.productType}`));
    console.log(chalk.gray(`Ranked by: ${response.metric === 'units' ? 'Units Sold' : 'Revenue'}\n`));

    if (result.bottom.length === 0) {
      console.log(chalk.yellow('No bottom sellers found'));
    } else {
      const bottomTable = new Table({
        head: [
          chalk.cyan('Article ID'),
          chalk.cyan('Product Name'),
          chalk.cyan('Units Sold'),
          chalk.cyan('Revenue'),
          chalk.cyan('Image URL')
        ],
        colWidths: [12, 30, 12, 12, 60],
        wordWrap: true
      });

      for (const item of result.bottom) {
        bottomTable.push([
          item.articleId.toString(),
          item.prodName,
          formatNumber(item.unitsSold),
          formatCurrency(item.revenue),
          buildImageUrl(item.articleId)
        ]);
      }

      console.log(bottomTable.toString());
    }

    // Summary statistics
    const topTotal = result.top.reduce((sum, item) => sum + item.unitsSold, 0);
    const topRevenue = result.top.reduce((sum, item) => sum + item.revenue, 0);
    const bottomTotal = result.bottom.reduce((sum, item) => sum + item.unitsSold, 0);
    const bottomRevenue = result.bottom.reduce((sum, item) => sum + item.revenue, 0);

    console.log(chalk.bold('\n📊 Summary Statistics'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.green(`Top ${response.limit} - Total Units: ${formatNumber(topTotal)}, Revenue: ${formatCurrency(topRevenue)}`));
    console.log(chalk.red(`Bottom ${response.limit} - Total Units: ${formatNumber(bottomTotal)}, Revenue: ${formatCurrency(bottomRevenue)}`));
    console.log(chalk.gray('─'.repeat(60)));

    console.log(chalk.bold.green('\n✨ Analysis complete!\n'));

  } catch (error) {
    console.error(chalk.bold.red('\n❌ Error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Close database connection
    await closeDb();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\n⚠️  Shutting down...'));
  await closeDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(chalk.yellow('\n\n⚠️  Shutting down...'));
  await closeDb();
  process.exit(0);
});

// Run the CLI
main();