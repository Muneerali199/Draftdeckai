import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "DraftDeckAI - AI Document Creation Platform",
  description: "Create beautiful resumes, presentations, CVs and letters with AI",
};

export default function Head() {
  return (
    <>
      <title>DraftDeckAI - AI Document Creation Platform</title>
      <meta name="description" content="Create beautiful resumes, presentations, CVs and letters with AI" />
      <link rel="icon" href="/favicon.ico" />
    </>
  );
}
