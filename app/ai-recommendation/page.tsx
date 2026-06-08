import FaceAnalyzer from '@/components/ai/FaceAnalyzer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Face Architect | Web Chief',
  description: 'AI-powered hairstyle recommendation and grooming visualization.',
};

export default function AIRecommendationPage() {
  return (
    <main className="relative min-h-screen w-full bg-surface overflow-hidden flex flex-col">
      {/* Immersive ambient background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-dark/20 blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px] mix-blend-screen pointer-events-none" />
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <FaceAnalyzer />
      </div>
    </main>
  );
}
