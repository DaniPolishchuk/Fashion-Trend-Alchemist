-- Migration: Add sales text support to generated_designs table
-- Created: 2026-01-30

ALTER TABLE generated_designs 
ADD COLUMN sales_text TEXT,
ADD COLUMN sales_text_generation_status TEXT DEFAULT 'pending' CHECK (sales_text_generation_status IN ('pending', 'generating', 'completed', 'failed'));

-- Add index for status filtering if needed
CREATE INDEX idx_generated_designs_sales_text_status ON generated_designs(sales_text_generation_status);

-- Update existing records to have 'pending' status
UPDATE generated_designs SET sales_text_generation_status = 'pending' WHERE sales_text_generation_status IS NULL;