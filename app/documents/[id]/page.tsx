import { Metadata } from 'next';
import { DocumentEditor } from '@/components/documents/document-editor';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Edit Document | DraftDeckAI',
    description: 'Edit and improve your AI-generated document',
  };
}

export default async function DocumentPage({ params }: Props) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-background">
      <DocumentEditor documentId={id} />
    </div>
  );
}
