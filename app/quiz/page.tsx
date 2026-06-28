'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getMasteredWords, getDistractors, getAllWords, getWordsBase, type Word } from '@/lib/vocab'
import QuizCard from '@/components/QuizCard'

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

interface QuizResult {
  word: Word
  correct: boolean
}

export default function QuizPage() {
  const router = useRouter()
  const [mastered, setMastered] = useState<Word[]>([])
  const [allWords, setAllWords] = useState<Word[]>(getWordsBase)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setMastered(getMasteredWords())
    setAllWords(getAllWords())
    setHydrated(true)
  }, [])

  const questions: Word[] = useMemo(
    () => shuffle(mastered).slice(0, Math.min(10, mastered.length)),
    [mastered.length]  // eslint-disable-line react-hooks/exhaustive-deps
  )

  const questionTypes = useMemo(
    () => questions.map((_, i): 'fill' | 'choice' => (i % 2 === 0 ? 'choice' : 'fill')),
    [questions.length]  // eslint-disable-line react-hooks/exhaustive-deps
  )

  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState<QuizResult[]>([])
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(false)

  // Must be before any early return to satisfy rules of hooks
  const currentWord = questions[current]
  const type = questionTypes[current] ?? 'choice'
  const options = useMemo(
    () => type === 'choice' && currentWord ? shuffle([...getDistractors(currentWord, 3, allWords), currentWord]) : [],
    [current, currentWord?.id, allWords.length]  // eslint-disable-line react-hooks/exhaustive-deps
  )

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { router.push('/'); return }
      // 1-4 select multiple choice options
      if (['1','2','3','4'].includes(e.key)) {
        const btns = document.querySelectorAll<HTMLButtonElement>('button[data-option]')
        btns[parseInt(e.key) - 1]?.click()
      }
      // Enter clicks the primary action button (Check / Next)
      if (e.key === 'Enter') {
        const btn = document.querySelector<HTMLButtonElement>('button[data-primary]')
        btn?.click()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  if (hydrated && mastered.length === 0) {
    return (
      <main className="max-w-content mx-auto px-6 py-12">
        <p className="text-muted text-[16px]">
          No mastered words yet.{' '}
          <Link href="/" className="underline text-primary">
            Go learn some words
          </Link>{' '}
          first.
        </p>
      </main>
    )
  }

  if (!hydrated) return null

  const handleResult = (correct: boolean) => {
    setResults(prev => [...prev, { word: questions[current], correct }])
    setChecked(true)
  }

  const handleAdvance = () => {
    if (current + 1 >= questions.length) {
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setChecked(false)
    }
  }

  const score = results.filter(r => r.correct).length
  const missed = results.filter(r => !r.correct).map(r => r.word)
  const isLastQuestion = current + 1 >= questions.length

  if (done) {
    return (
      <main className="max-w-content mx-auto px-6 py-12 space-y-8">
        <h2 className="font-mono text-[56px] font-light tracking-[-0.02em]">
          {score} / {questions.length}
        </h2>
        <p className="text-[16px] text-muted">
          {score === questions.length ? 'Perfect round!' : `${questions.length - score} to review.`}
        </p>

        {missed.length > 0 && (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted mb-4">
              Review these
            </p>
            <ul className="divide-y divide-border">
              {missed.map(w => (
                <li key={w.id} className="py-3">
                  <Link
                    href={`/learn/${w.id}`}
                    className="flex justify-between hover:opacity-70 transition-opacity"
                  >
                    <span className="font-mono">{w.german}</span>
                    <span className="text-muted">{w.english}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-4">
          <Link
            href="/quiz"
            className="min-h-[44px] px-6 border border-primary text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200 flex items-center"
          >
            Play again
          </Link>
          <Link
            href="/"
            className="min-h-[44px] px-6 border border-border text-[13px] font-medium uppercase tracking-[0.1em] text-muted hover:border-primary transition-colors duration-200 flex items-center"
          >
            Back home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-content mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="text-muted text-sm hover:text-primary transition-colors duration-200 min-h-[44px]"
        >
          ← Back
        </button>
        <span className="text-[13px] text-muted">
          {current + 1} / {questions.length}
        </span>
      </div>

      <QuizCard
        key={current}
        word={currentWord}
        type={type}
        options={options}
        onResult={handleResult}
      />

      {checked && (
        <button
          data-primary
          onClick={handleAdvance}
          className="min-h-[44px] w-full border border-primary text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200"
        >
          {isLastQuestion ? 'See results →' : 'Next question →'}
        </button>
      )}
    </main>
  )
}
