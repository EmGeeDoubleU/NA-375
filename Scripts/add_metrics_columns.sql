-- Add pre-calculated metrics columns to professors table
ALTER TABLE professors 
ADD COLUMN total_publications INTEGER DEFAULT 0,
ADD COLUMN published_this_year BOOLEAN DEFAULT FALSE,
ADD COLUMN published_last_year BOOLEAN DEFAULT FALSE,
ADD COLUMN avg_papers_per_year DECIMAL(5,2) DEFAULT 0,
ADD COLUMN last_metrics_update TIMESTAMP DEFAULT NOW();

-- Add index for better performance
CREATE INDEX idx_professors_metrics ON professors(total_publications, published_this_year, published_last_year); 