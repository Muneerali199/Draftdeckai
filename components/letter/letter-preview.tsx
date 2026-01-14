interface LetterPreviewProps {
  letter: any;
}
import ReactMarkdown from 'react-markdown';

export function LetterPreview({ letter }: LetterPreviewProps) {
  if (!letter) return null;

  // Ensure letter has the expected structure to prevent "Cannot read properties of undefined" errors
  const from = letter.from || {};
  const to = letter.to || {};
  const date = letter.date || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const subject = letter.subject || "";
  const content = letter.content || "";

  return (
    <div className="p-8 max-w-[800px] mx-auto font-serif bg-white text-black">
      {/* Sender Information */}
      <div className="mb-8">
        {from.name && (
          <p className="mb-1 font-semibold">{from.name}</p>
        )}
        {from.address && (
          <p className="text-sm text-gray-700 whitespace-pre-line">{from.address}</p>
        )}
      </div>

      {/* Date */}
      <div className="mb-8">
        <p className="mb-1">{date}</p>
      </div>

      {/* Recipient Information */}
      <div className="mb-8">
        {to.name && (
          <p className="mb-1 font-semibold">{to.name}</p>
        )}
        {to.address && (
          <p className="text-sm text-gray-700 whitespace-pre-line">{to.address}</p>
        )}
      </div>

      {/* Subject Line */}
      {subject && (
        <div className="mb-6">
          <p className="font-semibold">Subject: {subject}</p>
        </div>
      )}

      {/* Letter Content */}
      <div className="text-gray-800 leading-relaxed mobile-markdown prose prose-sm max-w-none prose-headings:font-bold prose-p:mb-4 prose-ul:list-disc prose-ul:pl-4 prose-li:mb-1">
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => <p className="mb-4 whitespace-pre-wrap" {...props} />
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}