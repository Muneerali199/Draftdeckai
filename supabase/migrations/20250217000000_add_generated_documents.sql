-- Add 'generated' type to documents table for AI-generated structured documents
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE documents ADD CONSTRAINT documents_type_check 
  CHECK (type IN ('resume', 'presentation', 'cv', 'letter', 'website', 'generated'));

-- Add metadata column for storing document generation metadata (outline, sections, etc.)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add document_type column for categorizing generated documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type TEXT;

-- Create index for document_type
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);

-- Create document_versions table for version history
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for document_versions
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at DESC);

-- Enable RLS on document_versions
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Policies for document_versions
CREATE POLICY "Users can view versions of own documents"
  ON document_versions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert versions for own documents"
  ON document_versions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get next version number
CREATE OR REPLACE FUNCTION get_next_version_number(doc_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM document_versions
  WHERE document_id = doc_id;
  
  RETURN next_version;
END;
$$ LANGUAGE plpgsql;
