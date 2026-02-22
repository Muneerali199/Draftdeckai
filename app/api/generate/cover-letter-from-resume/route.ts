import { NextResponse } from "next/server";

type Body = {
  resume?: string;
  jobDescription?: string;
  tone?: string;
};

function buildPrompt(resume: string, jobDescription: string, tone?: string) {
  const t = tone && tone.trim().length > 0 ? tone.trim() : "professional";
  return [
    "Write a tailored cover letter using the following resume and job description.",
    "Goals:",
    "- Mirror the resume’s tone, keywords, and achievements.",
    "- Align with the job description’s requirements and terminology.",
    "- Keep it concise, one page, clear sections, and easy to scan.",
    "- Use the same voice and tense as the resume.",
    "- Avoid repeating the resume verbatim; synthesize and contextualize.",
    `Tone: ${t}`,
    "",
    "Resume:",
    "-----",
    resume,
    "-----",
    "",
    "Job Description:",
    "-----",
    jobDescription,
    "-----",
    "",
    "Return only the final cover letter text."
  ].join("\n");
}

async function callGemini(prompt: string): Promise<string> {
  const gemini: any = await import("../../../../lib/gemini").catch(() => ({}));
  let output = "";
  try {
    if (typeof gemini.generateText === "function") {
      const r = await gemini.generateText(prompt);
      if (typeof r === "string" && r.trim().length > 0) return r;
      if (r && typeof r.text === "function") return r.text();
      if (r && typeof r.text === "string") return r.text;
    }
  } catch {}
  try {
    const model = gemini.model || gemini.gemini || gemini.client || gemini.default || gemini;
    if (model && typeof model.generateContent === "function") {
      const r = await model.generateContent(prompt as any);
      if (r?.response?.text && typeof r.response.text === "function") return r.response.text();
      if (r?.response?.candidates?.[0]?.content?.parts?.[0]?.text) return r.response.candidates[0].content.parts[0].text;
      if (typeof r?.text === "function") return r.text();
      if (typeof r?.text === "string") return r.text;
    }
  } catch {}
  throw new Error("Gemini client unavailable or incompatible");
}

export async function POST(req: Request) {
  try {
    const body: Body = await req.json().catch(() => ({}));
    const resume = typeof body.resume === "string" ? body.resume.trim() : "";
    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
    const tone = typeof body.tone === "string" ? body.tone : undefined;
    if (!resume || !jobDescription) {
      return NextResponse.json({ error: "Missing resume or jobDescription" }, { status: 400 });
    }
    const prompt = buildPrompt(resume, jobDescription, tone);
    const text = await callGemini(prompt);
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

