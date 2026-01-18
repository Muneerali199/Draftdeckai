-- Create the diagrams table
CREATE TABLE IF NOT EXISTS public.diagrams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    type TEXT, -- e.g., 'flowchart', 'sequence', 'mindmap'
    code TEXT, -- The Mermaid syntax code
    prompt TEXT, -- The prompt used to generate it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own diagrams" 
    ON public.diagrams 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagrams" 
    ON public.diagrams 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagrams" 
    ON public.diagrams 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diagrams" 
    ON public.diagrams 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_diagrams_updated_at
    BEFORE UPDATE ON public.diagrams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
