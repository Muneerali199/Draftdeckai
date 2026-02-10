-- DraftDeckAI Complete Database Setup
-- Run this script in the Supabase SQL Editor

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('resume', 'presentation', 'letter', 'cv')),
  content JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Enhanced metadata columns
  tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  preview_image TEXT,
  color_scheme TEXT,
  industry TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_is_default ON templates(is_default);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_difficulty_level ON templates(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_templates_rating ON templates(rating);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample templates
INSERT INTO templates (id, user_id, title, description, type, content, is_public, is_default, created_at, updated_at, tags, difficulty_level, usage_count, rating, preview_image, color_scheme, industry) VALUES
('1', 'mock-user-1', 'Professional Resume Template', 'A clean and modern resume template perfect for professionals in tech, finance, and corporate environments', 'resume', '{"personalInfo":{"name":"John Doe","email":"john.doe@email.com","phone":"+1 (555) 123-4567","location":"New York, NY","website":"johndoe.com","summary":"Experienced software engineer with 5+ years in full-stack development"},"sections":[{"id":"experience","title":"Work Experience","items":[]},{"id":"education","title":"Education","items":[]},{"id":"skills","title":"Skills","items":[]}]}', true, true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', ARRAY['professional', 'modern', 'tech', 'corporate'], 'beginner', 1247, 4.8, '/api/templates/1/preview', 'blue', 'technology'),

('2', 'mock-user-1', 'Creative Resume Template', 'A colorful and creative resume template for designers, artists, and creative professionals', 'resume', '{"personalInfo":{"name":"Jane Smith","email":"jane.smith@email.com","phone":"+1 (555) 987-6543","location":"San Francisco, CA","website":"janesmith.design","summary":"Creative designer with expertise in UI/UX and brand identity"},"sections":[{"id":"experience","title":"Work Experience","items":[]},{"id":"education","title":"Education","items":[]},{"id":"skills","title":"Skills","items":[]},{"id":"portfolio","title":"Portfolio","items":[]}]}', true, true, '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z', ARRAY['creative', 'colorful', 'design', 'artistic', 'portfolio'], 'intermediate', 892, 4.6, '/api/templates/2/preview', 'purple', 'design'),

('3', 'mock-user-1', 'Business Presentation Template', 'Professional presentation template for business meetings, quarterly reviews, and corporate presentations', 'presentation', '{"title":"Business Presentation","slides":[{"id":"1","type":"title","content":{"title":"Business Presentation","subtitle":"Professional Template"}},{"id":"2","type":"content","content":{"title":"Agenda","bullets":["Introduction","Market Analysis","Strategy","Conclusion"]}}]}', true, true, '2024-01-03T00:00:00Z', '2024-01-03T00:00:00Z', ARRAY['business', 'professional', 'corporate', 'meeting'], 'beginner', 2156, 4.7, '/api/templates/3/preview', 'blue', 'business'),

('4', 'mock-user-1', 'Cover Letter Template', 'Professional cover letter template for job applications', 'letter', '{"recipient":{"name":"Hiring Manager","company":"Company Name","address":"123 Business St, City, State 12345"},"content":{"greeting":"Dear Hiring Manager,","body":"I am writing to express my interest in the position...","closing":"Sincerely,","signature":"Your Name"}}', true, true, '2024-01-04T00:00:00Z', '2024-01-04T00:00:00Z', ARRAY['cover-letter', 'job-application', 'professional'], 'beginner', 1543, 4.5, '/api/templates/4/preview', 'green', 'general'),

('5', 'mock-user-1', 'Academic CV Template', 'Comprehensive CV template for academic professionals and researchers', 'cv', '{"personalInfo":{"name":"Dr. Academic Name","email":"academic@university.edu","phone":"+1 (555) 123-4567","location":"University City, State","website":"academic-portfolio.com","summary":"Distinguished researcher with expertise in field of study"},"sections":[{"id":"education","title":"Education","items":[]},{"id":"research","title":"Research Experience","items":[]},{"id":"publications","title":"Publications","items":[]},{"id":"grants","title":"Grants & Awards","items":[]}]}', true, true, '2024-01-05T00:00:00Z', '2024-01-05T00:00:00Z', ARRAY['academic', 'research', 'university', 'scholarly'], 'advanced', 678, 4.9, '/api/templates/5/preview', 'navy', 'academia')

ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe approach)
DROP POLICY IF EXISTS "Users can view public templates and own templates" ON templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;

-- Create policies for templates
-- Policy: Users can view public templates and their own templates
CREATE POLICY "Users can view public templates and own templates" ON templates
    FOR SELECT USING (
        is_public = true OR
        auth.uid()::text = user_id
    );

-- Policy: Users can insert their own templates
CREATE POLICY "Users can insert own templates" ON templates
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own templates" ON templates
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON templates
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for documents table
CREATE POLICY "Users can read own documents" ON documents
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents" ON documents
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents" ON documents
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents" ON documents
FOR DELETE USING (user_id = auth.uid());

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON templates TO authenticated;
GRANT SELECT ON templates TO anon;

-- Setup Storage for profile pictures
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
