import React from 'react';
import { Download, AlertCircle, Sparkles, UserCircle } from 'lucide-react';

interface Props {
  imageUrl: string | null;
  isLoading: boolean;
  analysisText?: string | null;
}

export default function HairstyleVisualCard({ imageUrl, isLoading, analysisText }: Props) {
  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `hairstyle-visual-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="w-full rounded-3xl overflow-hidden aspect-[4/3] flex flex-col items-center justify-center space-y-6 animate-pulse bg-surface-raised border border-surface-muted/50 p-8 shadow-sm">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-surface-sub/20 border-t-accent-dark rounded-full animate-spin"></div>
          <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-accent-dark animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-surface-ink font-semibold tracking-wide">Menganalisis wajah Anda...</p>
          <p className="text-sm text-surface-sub">Harap tunggu ~15-30 detik</p>
        </div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="w-full space-y-6 transition-opacity duration-700 ease-out">
        
        {/* Clean Image Card */}
        <div className="bg-surface-raised border border-surface-muted/50 rounded-3xl p-4 shadow-xl">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="inline-flex items-center gap-1.5 text-accent-dark text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              AI Visual
            </span>
            <button 
              onClick={handleDownload}
              className="group flex items-center space-x-2 text-sm font-medium py-2 px-4 rounded-full bg-surface hover:bg-accent-dark hover:text-white transition-all duration-300 border border-surface-muted"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>Simpan</span>
            </button>
          </div>
          
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-muted/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="AI Hairstyle Recommendation"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Text Analysis Card */}
        {analysisText && (
          <div className="bg-surface-raised border border-surface-muted/50 rounded-3xl p-6 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-accent/10 text-accent-dark rounded-2xl shrink-0">
               <UserCircle className="w-6 h-6" />
            </div>
            <div className="text-sm text-surface-sub leading-relaxed">
              {analysisText.split('\n').map((paragraph, index) => {
                if (paragraph.trim() === '') return null;
                
                // Parse **bold** markdown
                const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                return (
                  <p key={index} className="mb-3 last:mb-0">
                    {parts.map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="text-surface-ink font-bold">{part.slice(2, -2)}</strong>;
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </p>
                );
              })}
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl overflow-hidden aspect-[4/3] flex flex-col items-center justify-center space-y-4 bg-surface border border-dashed border-surface-muted p-8 shadow-sm">
      <div className="p-5 bg-surface-raised rounded-full mb-2">
        <AlertCircle className="w-8 h-8 text-surface-sub/50" />
      </div>
      <p className="text-surface-sub text-center max-w-sm text-sm">
        Upload atau ambil foto untuk melihat visualisasi dan analisa gaya rambut AI.
      </p>
    </div>
  );
}
