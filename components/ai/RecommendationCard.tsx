import React from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';

interface Props {
  result: any;
  faceShape: string;
}

export default function RecommendationCard({ result, faceShape }: Props) {
  if (!result) {
    return (
      <div className="bg-white border border-surface-muted rounded-2xl p-8 shadow-sm h-full flex flex-col items-center justify-center gap-4 min-h-[260px]">
        <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-surface-border" />
        </div>
        <p className="text-surface-sub text-sm italic">Rekomendasi AI sedang dimuat...</p>
      </div>
    );
  }

  const text: string =
    result.recommendation ||
    result.recommendations ||
    'Maaf, rekomendasi tidak tersedia saat ini.';

  // Split into paragraphs for clean rendering
  const paragraphs = text
    .split(/\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  return (
    <div className="bg-white border border-surface-muted rounded-2xl p-8 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent-dark">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold tracking-tight">Rekomendasi Grooming AI</h3>
          <p className="text-[10px] uppercase tracking-widest text-surface-sub font-bold">
            Personalized for {faceShape} Face
          </p>
        </div>
      </div>

      {/* AI Text */}
      <div className="flex-grow space-y-4">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-surface-sub leading-relaxed text-sm">
            {para}
          </p>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-8 pt-6 border-t border-surface-muted/50">
        <p className="text-[10px] uppercase tracking-widest text-surface-sub font-bold mb-3">
          Quick Tips
        </p>
        <ul className="space-y-2">
          {(result.quickTips || [
            'Gunakan sisir bergigi lebar saat rambut masih lembab.',
            'Aplikasikan pomade/clay pada rambut 80% kering untuk hold maksimal.',
            'Potong rambut setiap 3–4 minggu agar bentuk tetap terjaga.',
          ]).map((tip: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-sm text-surface-sub">
              <CheckCircle className="w-4 h-4 text-accent-dark shrink-0 mt-0.5" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
