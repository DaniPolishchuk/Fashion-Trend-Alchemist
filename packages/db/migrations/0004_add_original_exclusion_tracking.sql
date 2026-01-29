-- Migration: Add original exclusion tracking
-- Track the original inclusion state when context is locked to detect changes

-- Add column to track original exclusion state (defaults to false - included)
ALTER TABLE project_context_items 
ADD COLUMN IF NOT EXISTS original_is_excluded BOOLEAN NOT NULL DEFAULT false;

-- For existing projects, set original_is_excluded to current isExcluded value
-- This ensures existing data maintains consistency
UPDATE project_context_items 
SET original_is_excluded = is_excluded
WHERE original_is_excluded IS NULL OR original_is_excluded != is_excluded;

-- Add comment to explain the column's purpose
COMMENT ON COLUMN project_context_items.original_is_excluded IS 
'Tracks the original inclusion state when context was locked. Used to determine if velocity scores need recalculation.';