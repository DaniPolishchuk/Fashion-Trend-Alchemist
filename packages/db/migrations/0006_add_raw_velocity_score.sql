-- Migration: Add raw velocity score column
-- Store the original velocity calculation to enable proper re-normalization

-- Add column to store raw velocity score (before normalization)
ALTER TABLE project_context_items 
ADD COLUMN IF NOT EXISTS raw_velocity_score NUMERIC(10, 2);

-- For existing projects, copy current velocity_score as raw_velocity_score
-- This is a best-effort initialization for existing data
UPDATE project_context_items 
SET raw_velocity_score = velocity_score::numeric
WHERE raw_velocity_score IS NULL;

-- Make the column NOT NULL after backfilling
ALTER TABLE project_context_items 
ALTER COLUMN raw_velocity_score SET NOT NULL;

-- Add comment to explain the column's purpose
COMMENT ON COLUMN project_context_items.raw_velocity_score IS 
'Original raw velocity score from transaction data. Used for re-normalization when included items change.';