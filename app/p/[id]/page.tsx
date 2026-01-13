'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SlideCard, Slide } from '@/components/presentation/real-time-generator';
import { getThemeById } from '@/lib/presentation-themes';

export default function PublicPresentationPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('id', id)
        .single();
      if (data) setData(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="text-center p-20 text-white">Loading...</div>;
  if (!data) return <div className="text-center p-20 text-white">Presentation not found.</div>;

  const storedData = data.slides || {};
  const slides = Array.isArray(storedData) ? storedData : (storedData.slides || []);
  const themeId = storedData.themeId || 'modern-blue';
  const theme = getThemeById(themeId);

  // Mock getGradient because it's required by SlideCard
  const getGradientClass = (bg?: string) => theme.colors.gradient;

  return (
    <div className="h-[100dvh] w-screen bg-black overflow-hidden relative">
      <div className="snap-y snap-mandatory h-full w-full overflow-y-scroll scroll-smooth">
        {slides.map((slide: Slide, idx: number) => (
           <div key={idx} className="h-[100dvh] w-full snap-start snap-always flex items-center justify-center p-4">
             <div 
               className="aspect-video w-full max-h-[90vh] shadow-2xl mx-auto"
               style={{ maxWidth: 'calc(90vh * 16 / 9)' }}
             >
               <SlideCard 
                 slide={slide} 
                 theme={theme} 
                 getGradientClass={getGradientClass}
               />
             </div>
           </div>
        ))}
      </div>
      
      {/* Navigation Hint */}
      <div className="fixed bottom-8 right-8 text-white/50 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md text-sm pointer-events-none animate-pulse">
        Scroll for next slide ↓
      </div>
    </div>
  );
}
