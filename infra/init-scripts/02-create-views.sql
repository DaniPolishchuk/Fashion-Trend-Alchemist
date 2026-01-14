-- Optional materialized view for pre-aggregated sales data
-- Uncomment and customize based on actual data volume and refresh requirements

/*
CREATE MATERIALIZED VIEW IF NOT EXISTS sales_by_article AS
SELECT
  a.product_type_no,
  a.product_type_name,
  t.article_id,
  COUNT(*) AS units_sold,
  SUM(t.price) AS revenue,
  MIN(t.t_dat) AS first_sale_date,
  MAX(t.t_dat) AS last_sale_date,
  COUNT(DISTINCT t.customer_id) AS unique_customers,
  COUNT(DISTINCT t.t_dat) AS days_sold
FROM transactions_train t
JOIN articles a ON a.article_id = t.article_id
GROUP BY a.product_type_no, a.product_type_name, t.article_id;

-- Indexes on materialized view for fast querying
CREATE INDEX IF NOT EXISTS idx_mv_product_type_name 
ON sales_by_article(product_type_name);

CREATE INDEX IF NOT EXISTS idx_mv_product_type_no 
ON sales_by_article(product_type_no);

CREATE INDEX IF NOT EXISTS idx_mv_article_id 
ON sales_by_article(article_id);

-- Refresh command (run on schedule via cron or pg_cron)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY sales_by_article;
*/