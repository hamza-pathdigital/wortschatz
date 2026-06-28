'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  getWord,
  getAllWords,
  setMastered,
  getDistractors,
  getPracticeType,
  recordWordLearned,
  type Word,
} from '@/lib/vocab'
import StageIndicator from '@/components/StageIndicator'
import PronounceButton from '@/components/PronounceButton'
import WordCard from '@/components/WordCard'
import ArticleWord from '@/components/ArticleWord'

type Stage = 1 | 2 | 3 | 4
type Outcome = 'correct' | 'wrong' | null

export default function LearnPage() {
  const { wordId } = useParams<{ wordId: string }>()
  const router = useRouter()
  const prefersReduced = useReducedMotion()

  const [word, setWord] = useState<Word | undefined>(undefined)
  const [stage, setStage] = useState<Stage>(1)
  const [hasListened, setHasListened] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<Outcome>(null)

  useEffect(() => {
    setWord(getWord(wordId))
  }, [wordId])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { router.push('/'); return }
      if (e.key === 'Enter' && e.target === document.body) {
        // Enter advances through stages when not in a text input
        const btn =
          document.querySelector<HTMLButtonElement>('button[data-advance]')
        btn?.click()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  const allWords = useMemo(() => getAllWords(), [])
  const practiceType = word ? getPracticeType(word.id) : 'choice'
  const options: Word[] = useMemo(() => {
    if (!word) return []
    return [...getDistractors(word, 3, allWords), word].sort(() => Math.random() - 0.5)
  }, [word?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!word) {
    return (
      <main className="max-w-content mx-auto px-6 py-12">
        <p className="text-muted">Word not found.</p>
      </main>
    )
  }

  const advance = () => {
    if (stage < 4) setStage((stage + 1) as Stage)
    setHasListened(false)
  }

  const handleCheck = () => {
    let correct = false
    if (practiceType === 'fill') {
      const input = userInput.trim().toLowerCase()
      correct = input === word.base.toLowerCase() || input === word.german.toLowerCase()
    } else {
      correct = selectedOption === word.english
    }
    setOutcome(correct ? 'correct' : 'wrong')
    if (correct) { setMastered(word.id, true); recordWordLearned() }
  }

  const motionProps = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.2, ease: 'easeInOut' as const },
      }

  return (
    <main className="max-w-content mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-muted text-sm hover:text-primary transition-colors duration-200 min-h-[44px]"
        >
          ← Back
        </button>
        <StageIndicator total={4} current={stage} />
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
          {stage} of 4
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={stage} {...motionProps}>
          {stage === 1 && (
            <div className="space-y-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                {word.category}
              </p>
              <ArticleWord german={word.german} article={word.article} className="font-mono text-[56px] font-light tracking-[-0.02em] leading-none block" />
              <p className="text-[32px] font-light text-muted">{word.english}</p>
              <WordCard stage={1}>
                <p className="italic text-[15px] text-primary">{word.exampleSentence}</p>
                <p className="text-sm text-muted mt-1">{word.exampleTranslation}</p>
              </WordCard>
              <div className="flex justify-end">
                <button
                  onClick={advance} data-advance
                  className="min-h-[44px] px-6 border border-primary text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200"
                >
                  Got it → <span className="text-[10px] opacity-40 ml-1">↵</span>
                </button>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div className="space-y-6">
              <ArticleWord german={word.german} article={word.article} className="font-mono text-[56px] font-light tracking-[-0.02em] leading-none block" />
              <p className="font-mono text-[20px] tracking-widest text-muted">
                / {word.phonetic} /
              </p>
              <PronounceButton word={word.german} onPlayed={() => setHasListened(true)} />
              <button
                onClick={advance} data-advance
                className="min-h-[44px] w-full border border-primary text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200"
              >
                Next →
              </button>
            </div>
          )}

          {stage === 3 && (
            <div className="space-y-6">
              <ArticleWord german={word.german} article={word.article} className="font-mono text-[56px] font-light tracking-[-0.02em] leading-none block" />
              <WordCard stage={3}>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted mb-3">
                  → Remember it like this
                </p>
                <p className="text-[15px] italic text-primary leading-relaxed">
                  {word.trick}
                </p>
              </WordCard>
              <div className="flex justify-end">
                <button
                  onClick={advance} data-advance
                  className="min-h-[44px] px-6 border border-primary text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200"
                >
                  I&apos;ll remember
                </button>
              </div>
            </div>
          )}

          {stage === 4 && (
            <div className="space-y-6">
              {practiceType === 'fill' ? (
                <>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                    How do you say this in German?
                  </p>
                  <p className="text-[32px] font-light text-primary">{word.english}</p>
                  <input
                    type="text"
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !outcome) handleCheck() }}
                    placeholder="Type the German word..."
                    disabled={!!outcome}
                    className={`w-full min-h-[44px] px-4 border bg-transparent text-primary text-[16px] outline-none transition-colors duration-200 ${
                      outcome === 'correct' ? 'border-correct' : outcome === 'wrong' ? 'border-wrong' : 'border-border'
                    }`}
                  />
                </>
              ) : (
                <>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                    What does &ldquo;{word.german}&rdquo; mean?
                  </p>
                  <div className="space-y-3">
                    {options.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => !outcome && setSelectedOption(opt.english)}
                        className={`w-full min-h-[44px] px-4 py-3 text-left border text-[16px] transition-colors duration-200 ${
                          selectedOption === opt.english
                            ? 'border-primary text-primary'
                            : 'border-border text-muted hover:border-primary'
                        }`}
                      >
                        {opt.english}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {outcome && (
                <div className={`text-[13px] font-medium uppercase tracking-[0.1em] ${
                  outcome === 'correct' ? 'text-correct' : 'text-wrong'
                }`}>
                  {outcome === 'correct' ? '✓ Correct' : `✗ Correct answer: ${word.german || word.base}`}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                {!outcome ? (
                  <button
                    onClick={handleCheck}
                    disabled={practiceType === 'fill' ? !userInput.trim() : !selectedOption}
                    className="min-h-[44px] px-6 border border-primary text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200 disabled:border-border disabled:text-muted disabled:cursor-not-allowed"
                  >
                    Check
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/')}
                    className="min-h-[44px] px-6 border border-primary text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200"
                  >
                    {outcome === 'correct' ? 'Done →' : 'Continue anyway →'}
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
