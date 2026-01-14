const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mock templates data (converted from TypeScript)
const mockTemplates = [
  {
    id: '1',
    user_id: 'mock-user-1',
    title: 'Professional Resume Template',
    description: 'A clean and modern resume template perfect for professionals in tech, finance, and corporate environments',
    type: 'resume',
    content: {
      personalInfo: {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1 (555) 123-4567',
        location: 'New York, NY',
        website: 'johndoe.com',
        summary: 'Experienced software engineer with 5+ years in full-stack development'
      },
      sections: [
        { id: 'experience', title: 'Work Experience', items: [] },
        { id: 'education', title: 'Education', items: [] },
        { id: 'skills', title: 'Skills', items: [] }
      ]
    },
    is_public: true,
    is_default: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tags: ['professional', 'modern', 'tech', 'corporate'],
    difficulty_level: 'beginner',
    usage_count: 1247,
    rating: 4.8,
    preview_image: '/api/templates/1/preview',
    color_scheme: 'blue',
    industry: 'technology'
  },
  {
    id: '2',
    user_id: 'mock-user-1',
    title: 'Creative Resume Template',
    description: 'A colorful and creative resume template for designers, artists, and creative professionals',
    type: 'resume',
    content: {
      personalInfo: {
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '+1 (555) 987-6543',
        location: 'San Francisco, CA',
        website: 'janesmith.design',
        summary: 'Creative designer with expertise in UI/UX and brand identity'
      },
      sections: [
        { id: 'experience', title: 'Work Experience', items: [] },
        { id: 'education', title: 'Education', items: [] },
        { id: 'skills', title: 'Skills', items: [] },
        { id: 'portfolio', title: 'Portfolio', items: [] }
      ]
    },
    is_public: true,
    is_default: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    tags: ['creative', 'colorful', 'design', 'artistic', 'portfolio'],
    difficulty_level: 'intermediate',
    usage_count: 892,
    rating: 4.6,
    preview_image: '/api/templates/2/preview',
    color_scheme: 'purple',
    industry: 'design'
  },
  {
    id: '3',
    user_id: 'mock-user-1',
    title: 'Business Presentation Template',
    description: 'Professional presentation template for business meetings, quarterly reviews, and corporate presentations',
    type: 'presentation',
    content: {
      title: 'Business Presentation',
      slides: [
        {
          id: '1',
          type: 'title',
          content: {
            title: 'Business Presentation',
            subtitle: 'Professional Template'
          }
        },
        {
          id: '2',
          type: 'content',
          content: {
            title: 'Agenda',
            bullets: ['Introduction', 'Market Analysis', 'Strategy', 'Conclusion']
          }
        }
      ]
    },
    is_public: true,
    is_default: true,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    tags: ['business', 'professional', 'corporate', 'meeting'],
    difficulty_level: 'beginner',
    usage_count: 2156,
    rating: 4.7,
    preview_image: '/api/templates/3/preview',
    color_scheme: 'blue',
    industry: 'business'
  }
];

async function setupDatabase() {
  console.log('Setting up database...');

  try {
    // First, create the table using raw SQL
    console.log('Creating templates table...');

    const createTableSQL = `
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
        tags TEXT[] DEFAULT '{}',
        difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
        usage_count INTEGER DEFAULT 0,
        rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
        preview_image TEXT,
        color_scheme TEXT,
        industry TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
      CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
      CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);
      CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);
    `;

    // Execute the SQL to create table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (createError) {
      console.log('Note: Could not create table via RPC, trying direct insert...');
    } else {
      console.log('Table created successfully!');
    }

    // Now try to insert templates
    console.log('Inserting templates...');

    const { data, error: insertError } = await supabase
      .from('templates')
      .insert(mockTemplates);

    if (insertError) {
      console.error('Error inserting templates:', insertError);
      console.log('This might be because the templates table does not exist yet.');
      console.log('Please create the table manually using the Supabase dashboard.');
      return;
    }

    console.log(`Successfully inserted ${mockTemplates.length} templates`);
    console.log('Database setup complete!');

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupDatabase();
