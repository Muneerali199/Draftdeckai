import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Edit Template | DraftDeckAI`,
    description: "Edit your document template",
  };
}
