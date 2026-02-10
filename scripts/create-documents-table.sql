-- Create documents table for DraftDeckAI
-- Run this script in the Supabase SQL Editor

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('resume', 'presentation', 'letter', 'cv', 'diagram')),
  content jsonb NOT NULL,
  prompt text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own documents" ON documents
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents" ON documents
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents" ON documents
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents" ON documents
FOR DELETE USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON documents TO authenticated;
