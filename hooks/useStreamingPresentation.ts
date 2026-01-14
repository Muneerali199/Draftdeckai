import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StreamingState {
  isStreaming: boolean;
  content: string;
  error: string | null;
  progress: number;
  creditsUsed?: number;
  creditsRemaining?: number;
}

export function useStreamingPresentation() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    content: '',
    error: null,
    progress: 0,
  });

  const supabase = createClient();

  const generatePresentation = useCallback(
    async (topic: string, audience: string, outline?: any[], settings?: any) => {
      setState({
        isStreaming: true,
        content: '',
        error: null,
        progress: 0,
      });

      try {
        // Get authentication token
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('Please sign in to create presentations');
        }

        const response = await fetch('/api/generate-presentation-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ topic, audience, outline, settings }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          if (response.status === 401) {
            throw new Error('Authentication required. Please sign in.');
          }
          
          if (response.status === 402) {
            throw new Error(errorData.message || 'Not enough credits. Please upgrade your plan.');
          }
          
          throw new Error(errorData.error || 'Failed to start stream');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('✅ Stream complete');
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.content) {
                  accumulatedContent += data.content;

                  setState((prev) => ({
                    ...prev,
                    content: accumulatedContent,
                    progress: Math.min(
                      (accumulatedContent.length / 10000) * 100,
                      95
                    ),
                  }));
                }

                if (data.done) {
                  setState((prev) => ({
                    ...prev,
                    isStreaming: false,
                    progress: 100,
                    creditsUsed: data.credits?.used,
                    creditsRemaining: data.credits?.remaining,
                  }));
                  
                  if (data.credits) {
                    console.log(`💳 Credits used: ${data.credits.used}, Remaining: ${data.credits.remaining}`);
                  }
                }

                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate presentation',
        }));
      }
    },
    [supabase]
  );

  const reset = useCallback(() => {
    setState({
      isStreaming: false,
      content: '',
      error: null,
      progress: 0,
    });
  }, []);

  return {
    ...state,
    generatePresentation,
    reset,
  };
}
