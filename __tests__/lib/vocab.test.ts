import {
  getAllWords,
  getWord,
  getWordsByCategory,
  getCategories,
  getMasteredIds,
  setMastered,
  getMasteredWords,
  getDistractors,
  getPracticeType,
} from '@/lib/vocab'

beforeEach(() => localStorage.clear())

describe('getAllWords', () => {
  it('returns an array with more than 100 words', () => {
    expect(getAllWords().length).toBeGreaterThan(100)
  })

  it('merges mastered status from localStorage', () => {
    const words = getAllWords()
    const id = words[0].id
    localStorage.setItem('wortschatz:mastered', JSON.stringify([id]))
    const reloaded = getAllWords()
    expect(reloaded.find(w => w.id === id)?.mastered).toBe(true)
    expect(reloaded.filter(w => w.id !== id).every(w => !w.mastered)).toBe(true)
  })
})

describe('getWord', () => {
  it('returns the word with matching id', () => {
    const all = getAllWords()
    const first = all[0]
    expect(getWord(first.id)).toMatchObject({ id: first.id, german: first.german })
  })

  it('returns undefined for unknown id', () => {
    expect(getWord('99999')).toBeUndefined()
  })
})

describe('getWordsByCategory', () => {
  it('returns only words in the requested category', () => {
    const cats = getCategories()
    const cat = cats[0]
    const words = getWordsByCategory(cat)
    expect(words.every(w => w.category === cat)).toBe(true)
    expect(words.length).toBeGreaterThan(0)
  })

  it('sorts alphabetically by base', () => {
    const cats = getCategories()
    const words = getWordsByCategory(cats[0])
    const sorted = [...words].sort((a, b) => a.base.localeCompare(b.base))
    expect(words).toEqual(sorted)
  })
})

describe('getCategories', () => {
  it('returns sorted unique categories', () => {
    const cats = getCategories()
    expect(cats.length).toBeGreaterThan(5)
    expect([...cats].sort()).toEqual(cats)
    expect(new Set(cats).size).toBe(cats.length)
  })
})

describe('getMasteredIds / setMastered', () => {
  it('returns empty array when nothing mastered', () => {
    expect(getMasteredIds()).toEqual([])
  })

  it('persists mastered state', () => {
    const id = getAllWords()[0].id
    setMastered(id, true)
    expect(getMasteredIds()).toContain(id)
  })

  it('removes id when un-mastering', () => {
    const id = getAllWords()[0].id
    setMastered(id, true)
    setMastered(id, false)
    expect(getMasteredIds()).not.toContain(id)
  })
})

describe('getMasteredWords', () => {
  it('returns words whose ids are in localStorage', () => {
    const words = getAllWords()
    setMastered(words[0].id, true)
    setMastered(words[1].id, true)
    const mastered = getMasteredWords()
    expect(mastered).toHaveLength(2)
    expect(mastered.map(w => w.id)).toContain(words[0].id)
    expect(mastered.map(w => w.id)).toContain(words[1].id)
  })
})

describe('getDistractors', () => {
  it('returns the requested count', () => {
    const words = getAllWords()
    const word = words.find(w => w.category === 'food')!
    const d = getDistractors(word, 3, words)
    expect(d).toHaveLength(3)
  })

  it('does not include the target word', () => {
    const words = getAllWords()
    const word = words[0]
    const d = getDistractors(word, 3, words)
    expect(d.map(w => w.id)).not.toContain(word.id)
  })
})

describe('getPracticeType', () => {
  it('returns fill when parseInt(id) % 3 === 0', () => {
    expect(getPracticeType('003')).toBe('fill')
    expect(getPracticeType('006')).toBe('fill')
    expect(getPracticeType('009')).toBe('fill')
  })

  it('returns choice otherwise', () => {
    expect(getPracticeType('001')).toBe('choice')
    expect(getPracticeType('002')).toBe('choice')
    expect(getPracticeType('004')).toBe('choice')
  })
})
