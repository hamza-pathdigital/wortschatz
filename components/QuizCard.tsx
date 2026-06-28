'use client'

import { useState } from 'react'
import type { Word } from '@/lib/vocab'

interface QuizCardProps {
  word: Word
  type: 'fill' | 'choice'
  options: Word[]
  onResult: (correct: boolean) => void
}

export default function QuizCard({ word, type, options, onResult }: QuizCardProps) {
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const handleCheck = () => {
    let correct = false
    if (type === 'fill') {
      correct =
        input.trim().toLowerCase() === word.base.toLowerCase() ||
        input.trim().toLowerCase() === word.german.toLowerCase()
    } else {
      correct = selected === word.english
    }
    setIsCorrect(correct)
    setChecked(true)
    onResult(correct)
  }

  const borderClass =
    isCorrect === true ? 'border-correct' : isCorrect === false ? 'border-wrong' : 'border-border'

  return (
    <div className={`border p-6 space-y-5 transition-colors duration-200 ${borderClass}`}>
      {type === 'fill' ? (
        <>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            Type the German word for:
          </p>
          <p className="text-[32px] font-light text-primary">{word.english}</p>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !checked) handleCheck() }}
            disabled={checked}
            placeholder="Type here..."
            className="w-full min-h-[44px] px-4 border border-border bg-transparent text-[16px] outline-none"
          />
        </>
      ) : (
        <>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            What does this mean?
          </p>
          <p className="font-mono text-[32px] font-light text-primary">{word.german}</p>
          <div className="space-y-2">
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => !checked && setSelected(opt.english)}
                className={`w-full min-h-[44px] px-4 py-2 text-left border text-[16px] transition-colors duration-200 ${
                  checked && opt.english === word.english
                    ? 'border-correct text-correct'
                    : selected === opt.english
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

      {checked && (
        <p className={`text-[13px] font-medium uppercase tracking-[0.1em] ${isCorrect ? 'text-correct' : 'text-wrong'}`}>
          {isCorrect ? '✓ Correct' : `✗ Answer: ${word.german || word.base}`}
        </p>
      )}

      {!checked && (
        <div className="flex justify-end">
          <button
            onClick={handleCheck}
            disabled={type === 'fill' ? !input.trim() : !selected}
            className="min-h-[44px] px-6 border border-primary text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200 disabled:border-border disabled:text-muted disabled:cursor-not-allowed"
          >
            Check
          </button>
        </div>
      )}
    </div>
  )
}
