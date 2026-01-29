-- Migration: Fix original exclusion tracking for existing projects
-- Reset originalIsExcluded to false (all items start as included when context is locked)
-- Recalculate velocityScoresStale based on current exclusion state

-- Step 1: Reset all originalIsExcluded to false (the true original state)
UPDATE project_context_items 
SET original_is_excluded = false;

-- Step 2: Update velocityScoresStale for each project based on current exclusion state
-- If any item is excluded (isExcluded = true), set velocityScoresStale = true
-- If all items are included (isExcluded = false), set velocityScoresStale = false

UPDATE projects
SET velocity_scores_stale = (
  SELECT CASE 
    WHEN COUNT(*) FILTER (WHERE pci.is_excluded = true) > 0 THEN true
    ELSE false
  END
  FROM project_context_items pci
  WHERE pci.project_id = projects.id
)
WHERE id IN (SELECT DISTINCT project_id FROM project_context_items);