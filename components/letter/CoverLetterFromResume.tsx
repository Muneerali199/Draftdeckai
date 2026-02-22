\"use client\";

import { useState } from "react";

export default function CoverLetterFromResume() {
  const [resume, setResume] = useState(\"\"");
  const [jobDescription, setJobDescription] = useState(\"\"");
  const [tone, setTone] = useState(\"professional\");
  const [output, setOutput] = useState(\"\"");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(\"\"");

  async function generate() {
    setError(\"\");
    setOutput(\"\"");
    if (!resume.trim() || !jobDescription.trim()) {
      setError(\"Please provide both resume and job description\");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(\"/api/generate/cover-letter-from-resume\", {
        method: \"POST\",
        headers: { \"Content-Type\": \"application/json\" },
        body: JSON.stringify({ resume, jobDescription, tone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || \"Failed to generate cover letter\");
      } else {
        setOutput(data?.text || \"\");
      }
    } catch (e: any) {
      setError(e?.message || \"Failed to generate cover letter\");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: \"grid\", gap: 16 }}>
      <div style={{ display: \"grid\", gap: 8 }}>
        <label>Resume</label>
        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          rows={10}
          placeholder=\"Paste your resume content\"
          style={{ width: \"100%\" }}
        />
      </div>
      <div style={{ display: \"grid\", gap: 8 }}>
        <label>Job Description</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={10}
          placeholder=\"Paste the job description\"
          style={{ width: \"100%\" }}
        />
      </div>
      <div style={{ display: \"grid\", gap: 8 }}>
        <label>Tone</label>
        <input
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          placeholder=\"e.g., professional, friendly\"
          style={{ width: \"100%\" }}
        />
      </div>
      <button onClick={generate} disabled={loading} style={{ padding: 10 }}>
        {loading ? \"Generating...\" : \"Generate Cover Letter\"}
      </button>
      {error ? <div style={{ color: \"red\" }}>{error}</div> : null}
      <div style={{ display: \"grid\", gap: 8 }}>
        <label>Output</label>
        <textarea
          value={output}
          readOnly
          rows={16}
          placeholder=\"The generated cover letter will appear here\"
          style={{ width: \"100%\" }}
        />
      </div>
    </div>
  );
}

