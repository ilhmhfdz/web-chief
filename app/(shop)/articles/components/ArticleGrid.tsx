'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function ArticleGrid({ articles }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-light text-surface-ink mb-2">
          Belum ada artikel
        </h2>
        <p className="text-surface-sub font-light">
          Nantikan artikel dan panduan menarik dari Chief Supplies.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16"
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
          month: 'short',
          year: 'numeric',
        });

        return (
          <motion.div key={article._id} variants={itemVariants} className="h-full">
            <Link
              href={`/articles/${article.slug}`}
              className="group flex flex-col h-full relative"
            >
              {/* Minimalist Expanding Top Border on Hover */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-surface-muted/40" />
              <div className="absolute top-0 left-0 w-0 h-[1px] bg-surface-ink transition-all duration-700 ease-[0.16,1,0.3,1] group-hover:w-full" />

              <div className="pt-8 flex flex-col flex-1">
                {/* Meta Info */}
                <div className="flex items-center gap-3 text-[10px] text-surface-sub font-semibold uppercase tracking-[0.2em] mb-5">
                  <span>{displayDate}</span>
                  {article.last_adapted_at && (
                    <span className="text-accent italic tracking-widest">
                      — Updated
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-2xl lg:text-3xl font-light text-surface-ink leading-[1.25] mb-5 group-hover:text-surface-ink/70 transition-colors line-clamp-3">
                  {article.title}
                </h2>

                {/* Description */}
                <p className="text-surface-sub/80 text-sm leading-relaxed mb-10 line-clamp-3 font-light">
                  {article.meta_description}
                </p>

                {/* Spacer to push tags/link to bottom */}
                <div className="flex-1" />

                {/* Footer: Tags & Link */}
                <div className="mt-auto flex items-end justify-between">
                  <div className="flex flex-wrap gap-2 pr-4">
                    {article.geo_keywords.slice(0, 2).map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] font-medium uppercase tracking-widest text-surface-sub/50"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                  
                  {/* Interactive Minimalist Arrow */}
                  <div className="text-surface-ink shrink-0 group-hover:translate-x-3 transition-transform duration-500 ease-[0.16,1,0.3,1]">
                    <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
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
