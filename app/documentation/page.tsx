export default function DocumentationPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Documentation</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <p className="text-gray-600">
              Welcome to DraftDeckAI! This documentation will help you get started with creating and managing your documents.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Create professional documents in minutes</li>
              <li>Choose from multiple templates</li>
              <li>Customize your documents with ease</li>
              <li>Export in various formats</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
            <p className="text-gray-600">
              If you need assistance, please contact our support team at support@draftdeckai.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
