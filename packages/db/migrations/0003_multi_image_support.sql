-- Migration: Add multi-image support to generated_designs table
-- This adds support for front/back/model views with per-view generation status

-- Add created_at column if not exists (with default for existing rows)
ALTER TABLE generated_designs
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Add generated_images JSONB column for multi-image support
-- Structure: { front: { url, status }, back: { url, status }, model: { url, status } }
ALTER TABLE generated_designs
ADD COLUMN IF NOT EXISTS generated_images JSONB;

-- Migrate existing data: convert generated_image_url to generated_images.front
-- Only for rows that have an image URL but no generated_images yet
UPDATE generated_designs
SET generated_images = jsonb_build_object(
  'front', jsonb_build_object(
    'url', generated_image_url,
    'status', CASE
      WHEN image_generation_status = 'completed' THEN 'completed'
      WHEN image_generation_status = 'failed' THEN 'failed'
      WHEN image_generation_status = 'generating' THEN 'generating'
      ELSE 'pending'
    END
  ),
  'back', jsonb_build_object('url', NULL, 'status', 'pending'),
  'model', jsonb_build_object('url', NULL, 'status', 'pending')
)
WHERE generated_image_url IS NOT NULL
  AND generated_images IS NULL;

-- For rows with no image at all, initialize with all pending
UPDATE generated_designs
SET generated_images = jsonb_build_object(
  'front', jsonb_build_object('url', NULL, 'status',
    CASE
      WHEN image_generation_status = 'generating' THEN 'generating'
      WHEN image_generation_status = 'failed' THEN 'failed'
      ELSE 'pending'
    END
  ),
  'back', jsonb_build_object('url', NULL, 'status', 'pending'),
  'model', jsonb_build_object('url', NULL, 'status', 'pending')
)
WHERE generated_images IS NULL;

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_generated_designs_created_at
ON generated_designs(created_at DESC);

-- Note: We keep generated_image_url and image_generation_status for backward compatibility
-- They can be removed in a future migration once all clients are updated
