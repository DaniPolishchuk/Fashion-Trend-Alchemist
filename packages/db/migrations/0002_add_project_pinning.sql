-- Add project pinning functionality
-- Migration: 0002_add_project_pinning

-- Add pinning columns to projects table
ALTER TABLE projects 
ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN pinned_at TIMESTAMP;

-- Add index for faster queries on pinned projects
CREATE INDEX idx_projects_pinned ON projects(is_pinned, pinned_at DESC) WHERE is_pinned = true;

-- Add comment for documentation
COMMENT ON COLUMN projects.is_pinned IS 'Whether the project is pinned (max 3 allowed)';
COMMENT ON COLUMN projects.pinned_at IS 'Timestamp when the project was pinned';
