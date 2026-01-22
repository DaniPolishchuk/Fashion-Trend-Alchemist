-- Performance Optimization Indexes for The Fashion Trend Alchemist
-- Migration: 0001_add_performance_indexes
-- Created: 2026-01-21
-- Purpose: Add strategic indexes to improve query performance by 5-10x

-- 1. Composite index for common filter patterns
-- This index covers the most frequently used filter combinations in the Analysis page
CREATE INDEX IF NOT EXISTS idx_articles_filters 
ON articles (product_type, color_family, customer_segment, pattern_style);

-- 2. Index for product family filtering
-- Optimizes queries that filter by product type and product family together
CREATE INDEX IF NOT EXISTS idx_articles_product_family 
ON articles (product_type, product_family);

-- 3. Index for style concept filtering
-- Optimizes queries that filter by product type and style concept together
CREATE INDEX IF NOT EXISTS idx_articles_style_concept 
ON articles (product_type, style_concept);

-- 4. Covering index for filter options query
-- This index includes all columns needed for the filter options endpoint
-- Reduces the need for table lookups, significantly speeding up filter population
CREATE INDEX IF NOT EXISTS idx_articles_coverage 
ON articles (product_type) 
INCLUDE (product_group, product_family, style_concept, color_family, 
         customer_segment, pattern_style, specific_color, color_intensity, fabric_type_base);

-- 5. Index for color intensity filtering
CREATE INDEX IF NOT EXISTS idx_articles_color_intensity 
ON articles (product_type, color_intensity);

-- 6. Index for specific color filtering
CREATE INDEX IF NOT EXISTS idx_articles_specific_color 
ON articles (product_type, specific_color);

-- 7. Index for fabric type filtering
CREATE INDEX IF NOT EXISTS idx_articles_fabric_type 
ON articles (product_type, fabric_type_base);

-- 8. Composite index for date-based queries on transactions
-- Helps with seasonal and date range filtering
CREATE INDEX IF NOT EXISTS idx_transactions_date_article 
ON transactions_train (t_date, article_id);

-- Note: The following index uses functional expressions and may require PostgreSQL 11+
-- If this fails, it can be safely skipped as the t_date index will still be used
CREATE INDEX IF NOT EXISTS idx_transactions_month_day 
ON transactions_train ((EXTRACT(MONTH FROM t_date)), (EXTRACT(DAY FROM t_date)));

-- Verify indexes were created
-- Run this query to see all indexes on the articles table:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'articles';
