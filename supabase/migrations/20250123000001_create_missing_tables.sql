-- Create the letters table
CREATE TABLE IF NOT EXISTS public.letters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT,
    letter_type TEXT,
    content TEXT, -- Stored as JSON string or raw text depending on implementation
    "from" JSONB, -- Stores {name: "", address: ""}
    "to" JSONB, -- Stores {name: "", address: ""}
    date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the diagrams table (if not exists)
CREATE TABLE IF NOT EXISTS public.diagrams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    type TEXT,
    code TEXT,
    prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the presentations table (if not exists)
CREATE TABLE IF NOT EXISTS public.presentations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    slides JSONB, -- Array of slide objects
    themeId TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the resumes table (if not exists)
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    personal_info JSONB,
    experience JSONB,
    education JSONB,
    skills JSONB,
    projects JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for all tables
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Create policies for letters
CREATE POLICY "Users can view their own letters" ON public.letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own letters" ON public.letters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own letters" ON public.letters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own letters" ON public.letters FOR DELETE USING (auth.uid() = user_id);

-- Create policies for diagrams (if not exist)
DO $$ BEGIN
    CREATE POLICY "Users can view their own diagrams" ON public.diagrams FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own diagrams" ON public.diagrams FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own diagrams" ON public.diagrams FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own diagrams" ON public.diagrams FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create policies for presentations (if not exist)
DO $$ BEGIN
    CREATE POLICY "Users can view their own presentations" ON public.presentations FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own presentations" ON public.presentations FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own presentations" ON public.presentations FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own presentations" ON public.presentations FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create policies for resumes (if not exist)
DO $$ BEGIN
    CREATE POLICY "Users can view their own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own resumes" ON public.resumes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
