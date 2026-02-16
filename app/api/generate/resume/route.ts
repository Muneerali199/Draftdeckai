export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { validateAndSanitize, resumeGenerationSchema, detectSqlInjection, sanitizeInput } from '@/lib/validation';
import { createClient } from '@supabase/supabase-js';
import { ACTION_COSTS, TIER_LIMITS, getCreditsResetDate, shouldResetCredits, calculateRemainingCredits, hasUnlimitedDeveloperCredits } from '@/lib/credits-service';

// Service role client for credit operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mistral-based resume generation as fallback
async function generateResumeWithMistral({ prompt, name, email }: { prompt: string; name: string; email: string }) {
  const systemPrompt = `You are an expert ATS-optimized resume writer. Create a professional resume based on this requirement: "${prompt}".

The candidate's name is: ${name}
The candidate's email is: ${email}

Return ONLY valid JSON with this exact structure:
{
  "name": "${name}",
  "email": "${email}",
  "phone": "+1 (555) 123-4567",
  "location": "City, State",
  "summary": "Professional summary with 3-4 sentences highlighting key expertise and achievements",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "date": "01/2020 - Present",
      "description": ["• Achievement with quantified impact", "• Another achievement"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "location": "City, State",
      "date": "05/2020"
    }
  ],
  "skills": {
    "technical": ["Skill1", "Skill2", "Skill3"],
    "soft": ["Communication", "Leadership", "Problem Solving"]
  },
  "projects": [],
  "certifications": []
}

Create realistic, relevant content based on the job description. Use action verbs and quantifiable achievements.`;

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        { role: 'user', content: systemPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Mistral API error:', errorText);
    throw new Error(`Mistral API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Parse JSON from response
  const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('No JSON found in Mistral response');
  }

  return JSON.parse(jsonMatch[0]);
}

export async function POST(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Custom fetch with timeout
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(input, {
          ...init,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    // Create Supabase client with the access token and custom fetch
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          },
          fetch: customFetch
        }
      }
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }
    const hasUnlimitedCredits = hasUnlimitedDeveloperCredits(user.email);

    // Check user credits
    const creditCost = ACTION_COSTS.resume;

    // Get or create user credits
    let { data: userCredits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no credits record exists, create one
    if (!userCredits) {
      const { data: newCredits, error: insertError } = await supabaseAdmin
        .from('user_credits')
        .insert({
          user_id: user.id,
          tier: 'free',
          credits_total: TIER_LIMITS.free,
          credits_used: 0,
          credits_reset_at: getCreditsResetDate()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create credits record:', insertError);
        return NextResponse.json(
          { error: 'Failed to initialize credits' },
          { status: 500 }
        );
      }
      userCredits = newCredits;
    }

    // Check if credits need reset
    if (userCredits && shouldResetCredits(userCredits.credits_reset_at)) {
      const resetAt = getCreditsResetDate();
      const { data: updatedCredits, error: updateError } = await supabaseAdmin
        .from('user_credits')
        .update({
          credits_used: 0,
          credits_reset_at: resetAt,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to reset credits in database, applying local reset instead:', updateError);
        userCredits = {
          ...userCredits,
          credits_used: 0,
          credits_reset_at: resetAt,
        };
      } else if (updatedCredits) {
        userCredits = updatedCredits;
      } else {
        console.error('Credits reset did not return an updated record, applying local reset instead');
        userCredits = {
          ...userCredits,
          credits_used: 0,
          credits_reset_at: resetAt,
        };
      }
    }

    // Check if user has enough credits
    const creditsRemaining = hasUnlimitedCredits
      ? Number.MAX_SAFE_INTEGER
      : calculateRemainingCredits(userCredits.credits_total, userCredits.credits_used);

    if (!hasUnlimitedCredits && creditsRemaining < creditCost) {
      return NextResponse.json(
        {
          error: 'Not enough credits',
          message: `You need ${creditCost} credits to generate a resume. You have ${creditsRemaining} credits remaining.`,
          needsUpgrade: true,
          currentTier: userCredits.tier,
          creditsRemaining
        },
        { status: 402 }
      );
    }

    // Validate request body exists
    let rawBody;
    try {
      rawBody = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate and sanitize input
    let prompt, name, email;
    try {
      const validatedData = validateAndSanitize(resumeGenerationSchema, rawBody);
      prompt = validatedData.prompt;
      name = validatedData.name;
      email = validatedData.email;
    } catch (validationError: any) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationError.message },
        { status: 400 }
      );
    }


    // Additional security checks - only check name and email for SQL injection
    // Note: We don't check prompt because it contains user-generated content like LinkedIn exports
    // that naturally contain words like "SELECT candidates" which trigger false positives.
    // The prompt is only passed to the AI model, not used in SQL queries.
    if (detectSqlInjection(name) || detectSqlInjection(email)) {
      console.warn('Potential SQL injection attempt detected in name/email');
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedPrompt = sanitizeInput(prompt);
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);

    // Generate resume with Mistral
    let resume;
    try {
      console.log('🚀 Generating resume with Mistral...');
      resume = await generateResumeWithMistral({
        prompt: sanitizedPrompt,
        name: sanitizedName,
        email: sanitizedEmail
      });
      console.log('✅ Resume generated with Mistral');
    } catch (mistralError: any) {
      console.error('❌ Mistral failed:', mistralError.message);
      throw new Error('Unable to generate resume. Please try again later.');
    }

    // Deduct credits after successful generation
    if (!hasUnlimitedCredits) {
      const { error: updateError } = await supabaseAdmin
        .from('user_credits')
        .update({
          credits_used: userCredits!.credits_used + creditCost,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to deduct credits:', updateError);
        // Don't fail the request, just log the error
      } else {
        // Log the usage
        await supabaseAdmin
          .from('credit_usage_log')
          .insert({
            user_id: user.id,
            action: 'resume',
            credits_used: creditCost,
            metadata: { prompt_length: sanitizedPrompt.length }
          });

        console.log(`💳 Deducted ${creditCost} credits for resume generation`);
      }
    }

    // Save resume to documents table for history
    const resumeTitle = resume.name ? `${resume.name}'s Resume` : 'Untitled Resume';

    try {
      // First try to save to documents table
      const { data: savedDoc, error: docError } = await supabaseAdmin
        .from('documents')
        .insert({
          user_id: user.id,
          type: 'resume',
          title: resumeTitle,
          content: { resumeData: resume, prompt: sanitizedPrompt },
        })
        .select()
        .single();

      if (docError) {
        console.error('Failed to save to documents table:', docError);

        // Fallback: Try saving to resumes table
        const { error: resumeError } = await supabaseAdmin
          .from('resumes')
          .insert({
            user_id: user.id,
            title: resumeTitle,
            personal_info: {
              name: resume.name,
              email: resume.email,
              phone: resume.phone,
              location: resume.location,
            },
            content: resume,
            template: 'deedy-resume',
          });

        if (resumeError) {
          console.error('Failed to save to resumes table:', resumeError);
        } else {
          console.log('📄 Resume saved to resumes table');
        }
      } else {
        console.log('📄 Resume saved to documents table:', savedDoc?.id);
      }
    } catch (saveError) {
      console.error('Error saving resume:', saveError);
      // Don't fail the request if saving fails
    }

    return NextResponse.json(resume, { status: 200 });

  } catch (error: any) {
    console.error('❌ Resume generation error:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3)
    });

    // Provide detailed, user-friendly error messages
    let errorMessage = 'Failed to generate resume';
    let errorDetails = error.message || 'Unknown error occurred';

    if (error.message?.includes('API key')) {
      errorMessage = 'AI service configuration error';
      errorDetails = 'The AI service is not properly configured. Please contact support.';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'Service temporarily unavailable';
      errorDetails = 'The AI service has reached its limit. Please try again in a few minutes.';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timeout';
      errorDetails = 'The request took too long. Please try again with a shorter prompt.';
    } else if (error.message?.includes('JSON')) {
      errorMessage = 'AI response parsing error';
      errorDetails = 'The AI generated an invalid response. Please try rephrasing your input.';
    } else if (error.message?.includes('network')) {
      errorMessage = 'Network error';
      errorDetails = 'Unable to connect to AI service. Please check your internet connection.';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: errorDetails,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
