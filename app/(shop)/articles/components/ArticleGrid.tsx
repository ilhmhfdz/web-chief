'use client';

import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ArticleSummary {
  _id: string;
  slug: string;
  title: string;
  meta_description: string;
  last_adapted_at: string | null;
  createdAt: string;
  geo_keywords: string[];
}

interface ArticleGridProps {
  articles: ArticleSummary[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 20,
    },
  },
};

export default function ArticleGrid({ articles }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-display font-bold text-surface-ink mb-2">
          Belum ada artikel
        </h2>
        <p className="text-surface-sub">
          Nantikan artikel dan panduan menarik dari Chief Supplies.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {articles.map((article) => {
        const displayDate = new Date(
          article.last_adapted_at ?? article.createdAt
        ).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        return (
          <motion.div key={article._id} variants={itemVariants} className="h-full">
            <Link
              href={`/articles/${article.slug}`}
              className="group flex flex-col bg-surface-raised border border-surface-muted/30 rounded-2xl overflow-hidden h-full shadow-sm hover:shadow-xl hover:shadow-surface-ink/5 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Premium Gradient Top Border */}
              <div className="h-2 w-full bg-gradient-to-r from-surface-muted via-accent/50 to-surface-muted group-hover:via-accent transition-colors duration-500" />

              <div className="p-6 lg:p-8 flex flex-col flex-1 relative bg-white/40 backdrop-blur-sm">
                {/* Meta Info */}
                <div className="flex items-center gap-3 text-[11px] text-surface-sub font-semibold uppercase tracking-wider mb-5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    {displayDate}
                  </div>
                  {article.last_adapted_at && (
                    <span className="text-accent-dark bg-accent/10 px-2 py-0.5 rounded-md">
                      Updated
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-xl lg:text-2xl font-display font-bold text-surface-ink leading-[1.3] mb-4 group-hover:text-accent-dark transition-colors line-clamp-2">
                  {article.title}
                </h2>

                {/* Description */}
                <p className="text-surface-sub/90 text-sm leading-relaxed mb-8 line-clamp-3 font-medium">
                  {article.meta_description}
                </p>

                {/* Spacer to push tags/link to bottom */}
                <div className="flex-1" />

                {/* Footer: Tags & Link */}
                <div className="mt-auto pt-6 border-t border-surface-muted/30 flex items-center justify-between group-hover:border-surface-muted/60 transition-colors">
                  <div className="flex gap-2 truncate pr-4">
                    {article.geo_keywords.slice(0, 2).map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] font-bold text-surface-sub/80 bg-surface px-2.5 py-1 rounded-md"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                  
                  {/* Interactive Button */}
                  <div className="w-10 h-10 rounded-full bg-surface-ink/5 text-surface-ink flex items-center justify-center shrink-0 group-hover:bg-accent-dark group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-md">
                    <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
