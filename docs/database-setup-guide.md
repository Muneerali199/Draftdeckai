# Database Setup Guide

## Issue Resolution
The 404 error you're seeing indicates that the `documents` table doesn't exist in your Supabase database yet. Here's how to fix it:

## Quick Fix - Run This SQL Script

Go to your Supabase Dashboard → SQL Editor and run this script:

```sql
-- Create documents table for DraftDeckAI
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
```

## Storage Setup (for profile pictures)

Also run this for avatar uploads:

```sql
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
```

## Alternative: Use Migration Files

You can also run the existing migration files in order:

1. `supabase/migrations/20250628163807_curly_boat.sql` (users table)
2. `supabase/migrations/20250628163818_ancient_flame.sql` (documents table)
3. `supabase/migrations/20250725130000_add_template_tables.sql` (templates table)

## Verification

After running the SQL scripts, verify the tables exist:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('documents', 'templates', 'users');

-- Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

## What This Fixes

- ✅ Resolves the 404 error when fetching documents
- ✅ Enables real statistics in the profile page
- ✅ Allows profile picture uploads
- ✅ Sets up proper security policies
- ✅ Creates necessary indexes for performance

## After Setup

Once you run these scripts, refresh your profile page and you should see:
- Real statistics (0 initially, which is correct)
- Working profile picture upload
- No more 404 errors in the console

<div align="center">

📄 [Docs](https://github.com/Muneerali199/DocMagic/tree/main/docs) • 
🐛 [Issues](https://github.com/Muneerali199/DocMagic/issues) • 
🤝 [Contributions](https://github.com/Muneerali199/DocMagic/graphs/contributors) • 
💬 [Community](https://github.com/Muneerali199/DocMagic/discussions)

<p>© 2025 DraftDeckAI. All rights reserved.</p>

 Licensed under the [MIT License](https://github.com/Muneerali199/DocMagic/blob/main/LICENSE)
 
</div>

