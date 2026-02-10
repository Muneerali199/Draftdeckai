import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Template | DraftDeckAI',
  description: 'Edit your document template',
};

export default function EditTemplateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
