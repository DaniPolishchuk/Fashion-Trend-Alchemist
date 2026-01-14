-- Performance indexes for analytics queries
-- These indexes dramatically improve query performance for the top/bottom sellers endpoint

-- Index on article_id for fast transaction lookup by article
-- Used heavily in aggregation queries
CREATE INDEX IF NOT EXISTS idx_transactions_article_id 
ON transactions_train(article_id);

-- Index on transaction date for date range filtering
-- Enables efficient time-series queries
CREATE INDEX IF NOT EXISTS idx_transactions_t_dat 
ON transactions_train(t_dat);

-- Index on sales channel for channel-specific analysis
-- Allows fast filtering by online (1) vs retail (2)
CREATE INDEX IF NOT EXISTS idx_transactions_sales_channel 
ON transactions_train(sales_channel_id);

-- Index on customer_id for customer analytics (future)
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id 
ON transactions_train(customer_id);

-- Index on product_type_name for product type filtering
-- Critical for the main use case (filter by product type)
CREATE INDEX IF NOT EXISTS idx_articles_product_type_name 
ON articles(product_type_name);

-- Index on product_type_no as alternative filter
CREATE INDEX IF NOT EXISTS idx_articles_product_type_no 
ON articles(product_type_no);

-- Composite index for common query pattern
-- Useful when filtering by both product type and date
CREATE INDEX IF NOT EXISTS idx_transactions_composite 
ON transactions_train(article_id, t_dat, sales_channel_id);