/**
 * Apply database migration script
 * Reads SQL migration files and executes them against the database
 */

import { pool } from '../src/client.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration(migrationFile: string) {
  const migrationPath = resolve(__dirname, '..', 'migrations', migrationFile);

  console.log(`\n📦 Applying migration: ${migrationFile}`);
  console.log(`📍 Path: ${migrationPath}\n`);

  try {
    const sql = readFileSync(migrationPath, 'utf-8');

    // Remove comments and split by semicolons
    const lines = sql.split('\n');
    const cleanedLines = lines.filter(
      (line) => !line.trim().startsWith('--') && line.trim().length > 0
    );
    const cleanedSql = cleanedLines.join('\n');

    // Split by semicolons to get individual statements
    const statements = cleanedSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 80)}...`);

      try {
        await pool.query(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error: any) {
        // If error is about index already existing, that's okay
        if (error.message?.includes('already exists')) {
          console.log(`ℹ️  Statement ${i + 1} - Index already exists (skipping)`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log(`\n✅ Migration ${migrationFile} completed successfully!\n`);

    // Verify indexes
    console.log('📊 Verifying indexes on articles table:');
    const result = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'articles' 
      ORDER BY indexname;
    `);

    console.log(`\nFound ${result.rows.length} indexes:`);
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.indexname}`);
    });

    console.log('\n📊 Verifying indexes on transactions_train table:');
    const transResult = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'transactions_train' 
      ORDER BY indexname;
    `);

    console.log(`\nFound ${transResult.rows.length} indexes:`);
    transResult.rows.forEach((row: any) => {
      console.log(`  - ${row.indexname}`);
    });
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
const migrationFile = process.argv[2] || '0001_add_performance_indexes.sql';
applyMigration(migrationFile)
  .then(() => {
    console.log('\n🎉 All done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
