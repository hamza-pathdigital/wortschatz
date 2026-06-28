'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllWords, getWordsBase, getCategories, setMastered, getStreak, getDailyCount, DAILY_GOAL, type Word } from '@/lib/vocab'
import ProgressBar from '@/components/ProgressBar'
import ArticleWord from '@/components/ArticleWord'

export default function Home() {
  const [words, setWords] = useState<Word[]>(getWordsBase)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [masteredOpen, setMasteredOpen] = useState(true)
  const [streak, setStreak] = useState(0)
  const [dailyCount, setDailyCount] = useState(0)

  useEffect(() => {
    setWords(getAllWords())
    setStreak(getStreak().count)
    setDailyCount(getDailyCount())
  }, [])

  const categories = ['all', ...getCategories()]
  const unmastered = words.filter(w => !w.mastered)
  const filtered =
    activeCategory === 'all' ? unmastered : unmastered.filter(w => w.category === activeCategory)
  const masteredWords = words.filter(w => w.mastered)
  const masteredCount = masteredWords.length
  const total = words.length
  const hasMastered = masteredCount > 0

  return (
    <main className="max-w-content mx-auto px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-mono text-[32px] font-light tracking-tight text-primary">
            Wortschatz
          </h1>
          <p className="mt-1 text-[13px] text-muted tracking-wide">A1 German vocabulary</p>
        </div>
        <Link
          href="/quiz"
          aria-disabled={!hasMastered}
          onClick={e => { if (!hasMastered) e.preventDefault() }}
          className={`mt-1 min-h-[44px] px-5 flex items-center text-[13px] font-medium uppercase tracking-[0.1em] border transition-colors duration-200 ${
            hasMastered
              ? 'border-primary text-primary hover:bg-highlight'
              : 'border-border text-muted cursor-not-allowed'
          }`}
        >
          Quiz
        </Link>
      </div>

      <div className="my-6 h-px bg-border" />

      {(streak > 0 || dailyCount > 0) && (
        <div className="flex items-center gap-6 mb-6 text-[13px] text-muted">
          {streak > 0 && (
            <span>{streak} day streak</span>
          )}
          <span className="flex items-center gap-2">
            <span>{dailyCount}/{DAILY_GOAL} today</span>
            <span className="flex gap-0.5">
              {Array.from({ length: DAILY_GOAL }, (_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < dailyCount ? 'bg-correct' : 'bg-border'}`}
                />
              ))}
            </span>
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] border transition-colors duration-200 min-h-[44px] ${
              activeCategory === cat
                ? 'border-primary text-primary'
                : 'border-border text-muted hover:border-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <p className="text-[13px] text-muted mb-2">
          {masteredCount} / {total} mastered
        </p>
        <ProgressBar value={masteredCount} max={total} />
      </div>

      {hasMastered && (
        <div className="mb-8">
          <button
            onClick={() => setMasteredOpen(o => !o)}
            className="flex items-center gap-2 w-full text-left mb-3 group min-h-[44px]"
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted group-hover:text-primary transition-colors duration-200">
              Mastered ({masteredCount})
            </span>
            <span className="text-[11px] text-muted group-hover:text-primary transition-colors duration-200">
              {masteredOpen ? '▲' : '▼'}
            </span>
          </button>

          {masteredOpen && (
            <ul className="divide-y divide-border border border-border">
              {masteredWords.map(word => (
                <li key={word.id} className="flex items-center justify-between px-4 hover:bg-highlight transition-colors duration-200">
                  <Link
                    href={`/learn/${word.id}`}
                    className="flex items-center justify-between py-3 flex-1 gap-3"
                  >
                    <ArticleWord german={word.german} article={word.article} className="font-mono text-primary" />
                    <span className="text-sm text-muted">{word.english}</span>
                  </Link>
                  <button
                    onClick={() => { setMastered(word.id, false); setWords(getAllWords()) }}
                    className="ml-4 text-[11px] text-muted hover:text-wrong transition-colors duration-200 min-h-[44px] px-1"
                  >
                    Forgot
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ul className="divide-y divide-border">
        {filtered.map(word => (
          <li key={word.id}>
            <Link
              href={`/learn/${word.id}`}
              className="flex items-center justify-between py-3 hover:opacity-70 transition-opacity duration-200"
            >
              <span className="font-mono text-primary">{word.german}</span>
              <span className="flex items-center gap-3 text-muted">
                <span className="text-sm">{word.english}</span>
                {word.mastered && (
                  <span className="text-[11px] font-medium text-correct" aria-label="mastered">
                    ✓
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>

    </main>
  )
}
