import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ACTION_COSTS, TIER_LIMITS, getCreditsResetDate, shouldResetCredits, calculateRemainingCredits, hasUnlimitedDeveloperCredits } from '@/lib/credits-service';

// Service role client for credit operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }
    const hasUnlimitedCredits = hasUnlimitedDeveloperCredits(user.email);

    const { resumeData, jobDescription } = await req.json();

    if (!resumeData) {
      return NextResponse.json(
        { error: "Resume data is required" },
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
          message: `You need ${creditCost} credits to calculate ATS score. You have ${creditsRemaining} credits remaining.`,
          needsUpgrade: true,
          currentTier: userCredits.tier,
          creditsRemaining
        },
        { status: 402 }
      );
    }

    // Calculate ATS score
    const atsAnalysis = await calculateATSScore(resumeData, jobDescription);

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
            metadata: { has_job_description: !!jobDescription }
          });
        
        console.log(`💳 Deducted ${creditCost} credits for ATS score calculation`);
      }
    }

    return NextResponse.json({ atsAnalysis });
  } catch (error: any) {
    console.error("ATS score calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate ATS score" },
      { status: 500 }
    );
  }
}

// Calculate ATS score using AI
async function calculateATSScore(resumeData: any, jobDescription?: string): Promise<any> {
  // Prioritize Gemini, fallback to OpenAI
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!geminiApiKey && !openaiApiKey) {
    throw new Error("AI API key not configured. Please add GEMINI_API_KEY or OPENAI_API_KEY to your .env file");
  }

  const useGemini = !!geminiApiKey;
  const apiKey = geminiApiKey || openaiApiKey!;

  // Prepare resume text
  const resumeText = `
Name: ${resumeData.personalInfo?.name || 'N/A'}
Email: ${resumeData.personalInfo?.email || 'N/A'}
Phone: ${resumeData.personalInfo?.phone || 'N/A'}
Location: ${resumeData.personalInfo?.location || 'N/A'}

Summary: ${resumeData.summary || 'N/A'}

Experience:
${resumeData.experience?.map((exp: any) => `
- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate})
  ${exp.description || ''}
`).join('\n') || 'None'}

Education:
${resumeData.education?.map((edu: any) => `
- ${edu.degree} in ${edu.field} from ${edu.school} (${edu.year})
`).join('\n') || 'None'}

Skills: ${resumeData.skills?.join(', ') || 'None'}
`;

  const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume and provide a detailed ATS score.

Resume:
${resumeText}

${jobDescription ? `Job Description:\n${jobDescription}\n` : ''}

Provide a comprehensive ATS analysis in JSON format with:
{
  "overallScore": number (0-100),
  "scores": {
    "formatting": number (0-100),
    "keywords": number (0-100),
    "experience": number (0-100),
    "education": number (0-100),
    "skills": number (0-100)
  },
  "strengths": [array of strings],
  "weaknesses": [array of strings],
  "recommendations": [array of specific improvement suggestions],
  "keywordMatches": {
    "found": [array of keywords found],
    "missing": [array of important keywords missing]
  },
  "readabilityScore": number (0-100),
  "estimatedPassRate": number (0-100)
}

Be specific and actionable in your recommendations.`;

  if (useGemini) {
    return await callGeminiForATS(apiKey, prompt);
  } else {
    return await callOpenAIForATS(apiKey, prompt);
  }
}

async function callOpenAIForATS(apiKey: string, prompt: string): Promise<any> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert ATS (Applicant Tracking System) analyzer. Provide detailed, actionable feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API request failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Failed to parse ATS analysis");
  }
}

async function callGeminiForATS(apiKey: string, prompt: string): Promise<any> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt + "\n\nIMPORTANT: Respond ONLY with valid JSON, no markdown or explanations."
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Gemini API request failed");
  }

  const data = await response.json();
  let content = data.candidates[0]?.content?.parts[0]?.text || '';

  // Clean up Gemini response
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Failed to parse ATS analysis from Gemini");
  }
}
