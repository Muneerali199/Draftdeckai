import CoverLetterFromResume from "../../../components/letter/CoverLetterFromResume";

export default function Page() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 24 }}>
      <h1>Cover Letter from Resume</h1>
      <p>Create a tailored cover letter using your resume and a job description.</p>
      <CoverLetterFromResume />
    </main>
  );
}
