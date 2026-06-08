import React from 'react';
import { Download, AlertCircle, Sparkles, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
      <div className="w-full rounded-[2rem] overflow-hidden aspect-[4/3] flex flex-col items-center justify-center space-y-6 animate-pulse bg-surface-raised/50 border border-surface-muted/50 p-8 backdrop-blur-md shadow-sm">
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-6"
      >
        
        {/* Clean Image Card */}
        <div className="bg-surface-raised/60 backdrop-blur-xl border border-surface-muted/50 rounded-[2rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="inline-flex items-center gap-1.5 text-accent-dark text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Hasil AI Visual
            </span>
            <button 
              onClick={handleDownload}
              className="group flex items-center space-x-2 text-sm font-semibold py-2 px-5 rounded-full bg-surface-ink text-white hover:bg-accent-dark hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              <span>Simpan</span>
            </button>
          </div>
          
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-muted/10 shadow-inner group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="AI Hairstyle Recommendation"
              className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Text Analysis Card */}
        {analysisText && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-raised/60 backdrop-blur-xl border border-surface-muted/50 rounded-[2rem] p-6 shadow-sm flex items-start gap-4"
          >
            <div className="p-3 bg-gradient-to-br from-accent/20 to-accent-dark/10 text-accent-dark rounded-2xl shrink-0 shadow-inner">
               <UserCircle className="w-6 h-6" />
            </div>
            <div className="text-sm text-surface-sub leading-relaxed [text-wrap:pretty]">
              {analysisText.split('\n').map((paragraph, index) => {
                if (paragraph.trim() === '') return null;
                
                // Parse **bold** markdown
                const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                return (
                  <p key={index} className="mb-3 last:mb-0">
                    {parts.map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="text-surface-ink font-bold tracking-tight">{part.slice(2, -2)}</strong>;
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </p>
                );
              })}
            </div>
          </motion.div>
        )}

      </motion.div>
    );
  }

  return (
    <div className="w-full rounded-[2rem] overflow-hidden aspect-[4/3] flex flex-col items-center justify-center space-y-4 bg-surface-raised/30 backdrop-blur-sm border border-dashed border-surface-muted p-8 shadow-sm">
      <div className="p-5 bg-surface-raised/50 rounded-full mb-2">
        <AlertCircle className="w-8 h-8 text-surface-sub/40" />
      </div>
      <p className="text-surface-sub text-center max-w-sm text-sm [text-wrap:balance]">
        Hasil visualisasi AI akan muncul di sini.
      </p>
    </div>
  );
}
