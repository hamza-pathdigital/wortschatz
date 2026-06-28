import rawWords from '@/data/vocabulary.json'

export interface Word {
  id: string
  german: string
  article: string
  base: string
  english: string
  phonetic: string
  category: string
  trick: string
  exampleSentence: string
  exampleTranslation: string
  mastered: boolean
}

const STORAGE_KEY = 'wortschatz:mastered'

function getMasteredSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function mergeMastered(words: typeof rawWords): Word[] {
  const mastered = getMasteredSet()
  return words.map(w => ({ ...w, mastered: mastered.has(w.id) }))
}

export function getAllWords(): Word[] {
  return mergeMastered(rawWords as Word[])
}

export function getWord(id: string): Word | undefined {
  return getAllWords().find(w => w.id === id)
}

export function getWordsByCategory(category: string): Word[] {
  return getAllWords()
    .filter(w => w.category === category)
    .sort((a, b) => a.base.localeCompare(b.base))
}

export function getCategories(): string[] {
  return [...new Set((rawWords as Word[]).map(w => w.category))].sort()
}

export function getMasteredIds(): string[] {
  return [...getMasteredSet()]
}

export function setMastered(id: string, mastered: boolean): void {
  if (typeof window === 'undefined') return
  const set = getMasteredSet()
  if (mastered) {
    set.add(id)
  } else {
    set.delete(id)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export function getMasteredWords(): Word[] {
  return getAllWords().filter(w => w.mastered)
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function getDistractors(word: Word, count: number, allWords: Word[]): Word[] {
  const sameCategory = allWords.filter(w => w.category === word.category && w.id !== word.id)
  const pool =
    sameCategory.length >= count
      ? sameCategory
      : [...sameCategory, ...allWords.filter(w => w.category !== word.category && w.id !== word.id)]
  return shuffle(pool).slice(0, count)
}

export function getPracticeType(id: string): 'fill' | 'choice' {
  return parseInt(id, 10) % 3 === 0 ? 'fill' : 'choice'
}

// Returns all words with mastered: false — safe to call on the server (no localStorage read)
export function getWordsBase(): Word[] {
  return (rawWords as Word[]).map(w => ({ ...w, mastered: false }))
}

const STREAK_KEY = 'wortschatz:streak'
const DAILY_KEY = 'wortschatz:daily'

interface StreakData { count: number; lastDate: string }
interface DailyData { date: string; count: number }

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function getStreak(): StreakData {
  if (typeof window === 'undefined') return { count: 0, lastDate: '' }
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    return raw ? JSON.parse(raw) : { count: 0, lastDate: '' }
  } catch { return { count: 0, lastDate: '' } }
}

export function getDailyCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    if (!raw) return 0
    const data: DailyData = JSON.parse(raw)
    return data.date === todayStr() ? data.count : 0
  } catch { return 0 }
}

export function recordWordLearned(): void {
  if (typeof window === 'undefined') return
  const today = todayStr()

  // Update daily count
  const daily: DailyData = { date: today, count: getDailyCount() + 1 }
  localStorage.setItem(DAILY_KEY, JSON.stringify(daily))

  // Update streak
  const streak = getStreak()
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  let newCount = 1
  if (streak.lastDate === today) newCount = streak.count
  else if (streak.lastDate === yesterday) newCount = streak.count + 1
  localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: today }))
}

export const DAILY_GOAL = 5
