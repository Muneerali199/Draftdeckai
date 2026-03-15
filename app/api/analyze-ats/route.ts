import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ACTION_COSTS, TIER_LIMITS, getCreditsResetDate, shouldResetCredits, calculateRemainingCredits, hasUnlimitedDeveloperCredits } from '@/lib/credits-service';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// Service role client for credit operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // ✅ CHECK API KEY FIRST - fail fast if service is misconfigured
    if (!MISTRAL_API_KEY) {
      console.error('MISTRAL_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not properly configured. Please contact support.' },
        { status: 503 }
      );
    }

    // ✅ AUTHENTICATION CHECK
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to analyze resumes.' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to analyze resumes.' },
        { status: 401 }
      );
    }
    const hasUnlimitedCredits = hasUnlimitedDeveloperCredits(user.email);

    const { resumeText, jobDescription } = await request.json();

    if (!resumeText || resumeText.trim().length < 20) {
      return NextResponse.json(
        { error: 'Resume text is required and must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Check user credits
    const creditCost = ACTION_COSTS.ats_check;
    
    // Get or create user credits
    let { data: userCredits } = await supabaseAdmin
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
      const { data: updatedCredits } = await supabaseAdmin
        .from('user_credits')
        .update({
          credits_used: 0,
          credits_reset_at: resetAt,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updatedCredits) {
        userCredits = updatedCredits;
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
          message: `You need ${creditCost} credits to analyze a resume. You have ${creditsRemaining} credits remaining.`,
          needsUpgrade: true,
          currentTier: userCredits.tier,
          creditsRemaining
        },
        { status: 402 }
      );
    }

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze the provided resume text and return a detailed ATS compatibility score with actionable suggestions.

You MUST respond with a valid JSON object in this exact format:
{
  "score": <number 0-100>,
  "grade": "<A/B/C/D/F>",
  "summary": "<one sentence summary of the resume quality>",
  "categories": {
    "formatting": <number 0-100>,
    "keywords": <number 0-100>,
    "experience": <number 0-100>,
    "skills": <number 0-100>,
    "education": <number 0-100>,
    "contact_info": <number 0-100>
  },
  "suggestions": [
    "<suggestion 1>",
    "<suggestion 2>",
    "<suggestion 3>",
    "<suggestion 4>",
    "<suggestion 5>"
  ],
  "keywords_found": ["<keyword1>", "<keyword2>", ...],
  "keywords_missing": ["<keyword1>", "<keyword2>", ...]
}

Scoring Criteria:
- Formatting (20%): Clean structure, proper sections, no tables/graphics that confuse ATS
- Keywords (25%): Industry-specific terms, action verbs, skills matching
- Experience (20%): Clear job titles, quantifiable achievements, relevant experience
- Skills (15%): Technical and soft skills listed clearly
- Education (10%): Proper formatting of degrees and certifications
- Contact Info (10%): Complete and properly formatted contact details

Grade Scale:
- A: 85-100 (Excellent ATS compatibility)
- B: 70-84 (Good, minor improvements needed)
- C: 55-69 (Fair, several improvements recommended)
- D: 40-54 (Poor, significant changes needed)
- F: 0-39 (Very poor, major restructuring required)

IMPORTANT: Return ONLY the JSON object, no additional text or markdown.`;

    const userPrompt = jobDescription 
      ? `Analyze this resume for ATS compatibility, considering the target job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}`
      : `Analyze this resume for ATS compatibility:

RESUME:
${resumeText}`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mistral API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to analyze resume. Please try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No analysis result received' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let analysisResult;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse analysis result:', content);
      // Return a default analysis if parsing fails
      analysisResult = {
        score: 65,
        grade: 'C',
        summary: 'Resume analyzed but detailed parsing was limited.',
        categories: {
          formatting: 70,
          keywords: 60,
          experience: 65,
          skills: 65,
          education: 70,
          contact_info: 75
        },
        suggestions: [
          'Add more industry-specific keywords',
          'Include quantifiable achievements',
          'Ensure contact information is complete',
          'Use clear section headers',
          'Add relevant skills section'
        ],
        keywords_found: [],
        keywords_missing: ['action verbs', 'metrics', 'achievements']
      };
    }

    // ✅ DEDUCT CREDITS after successful analysis
    if (!hasUnlimitedCredits) {
      const { error: updateError } = await supabaseAdmin
        .from('user_credits')
        .update({ 
          credits_used: userCredits.credits_used + creditCost,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to deduct credits:', updateError);
      } else {
        await supabaseAdmin
          .from('credit_usage_log')
          .insert({
            user_id: user.id,
            action: 'ats_check',
            credits_used: creditCost,
            metadata: { has_job_description: !!jobDescription, resume_length: resumeText.length }
          });
        
        console.log(`💳 Deducted ${creditCost} credits for ATS analysis`);
      }
    }

    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('ATS analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume. Please try again.' },
      { status: 500 }
    );
  }
}
