import { useEffect } from 'react';

export function useSendUpdateEmail() {
  useEffect(() => {
    // Example: send update email once a week or on feature update
    // This should be triggered by admin or backend, not every user
    // Here is a manual trigger for demo
    const sendUpdate = async () => {
      const res = await fetch('/api/user-emails');
      const { emails } = await res.json();
      if (!emails || emails.length === 0) return;
      await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emails,
          subject: 'Latest Updates from DraftDeckAI',
          text: 'Check out our new features and offers!',
          html: '<h2>Latest Updates</h2><p>Check out our new features and offers!</p>'
        })
      });
    };
    // Uncomment to send on mount (for demo)
    // sendUpdate();
  }, []);
}
