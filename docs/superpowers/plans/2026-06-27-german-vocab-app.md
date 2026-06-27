# German Vocabulary App (Wortschatz) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 web app for learning German A1 vocabulary through a 4-stage learning flow (meaning → pronunciation → memory trick → practice) and a quiz mode, with all state in localStorage.

**Architecture:** Six tasks build the app bottom-up: scaffold → data layer → shared components → home page → learn flow → quiz mode. Each task is independently testable. All pages are `'use client'` React components; no API calls, no auth, no database.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Geist fonts (via `geist` npm package), Jest + React Testing Library.

## Global Constraints

- Next.js 14 App Router — no `pages/` directory
- TypeScript throughout — no `any` types
- No UI component libraries (no shadcn, radix, headlessui, etc.) — Tailwind only
- Components must stay under 150 lines — split if they grow larger
- No dark mode
- localStorage key for mastery: `wortschatz:mastered` (stores `string[]` of word IDs)
- Web Speech API: `lang: 'de-DE'`, `rate: 0.85`
- Minimum tap target height: `44px`
- All CSS transitions: `200ms ease`
- Respect `prefers-reduced-motion` — disable Framer Motion when set
- Keyboard: Enter to confirm inputs, Escape navigates back to `/`
- Design tokens defined as CSS variables on `:root` (see Task 1)
- Tailwind color aliases map to those CSS vars (see Task 1)
- No comments in code unless the WHY is non-obvious

---

## File Map

| Path | Responsibility |
|---|---|
| `app/layout.tsx` | Root layout, Geist font variables, metadata |
| `app/globals.css` | CSS variables, Tailwind directives, body defaults |
| `app/page.tsx` | Home — word list, category filter pills, progress bar |
| `app/learn/[wordId]/page.tsx` | 4-stage learning flow for a single word |
| `app/quiz/page.tsx` | Quiz mode — 10 questions from mastered words |
| `data/vocabulary.json` | Full A1 word list (~227 words) |
| `lib/vocab.ts` | All data access: read JSON, merge localStorage, helpers |
| `components/ProgressBar.tsx` | Thin top-of-page progress line |
| `components/StageIndicator.tsx` | Dot row showing current stage |
| `components/PronounceButton.tsx` | Web Speech API button, emits onPlayed callback |
| `components/WordCard.tsx` | Stage content wrapper with Framer Motion transitions |
| `components/QuizCard.tsx` | Single question card for quiz mode |
| `__tests__/lib/vocab.test.ts` | Unit tests for all lib/vocab.ts helpers |
| `__tests__/components/*.test.tsx` | Component render + behaviour tests |
| `__tests__/app/*.test.tsx` | Page-level integration tests |
| `jest.config.ts` | Jest config for Next.js App Router |
| `jest.setup.ts` | RTL matchers + localStorage mock |

---

## Task 1: Project Scaffold + Design System

**Files:**
- Create: all scaffold files (via `create-next-app`)
- Modify: `tailwind.config.ts`
- Create: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `__tests__/smoke.test.ts`

**Interfaces:**
- Produces: Tailwind color utilities `bg-highlight`, `text-muted`, `bg-correct`, `bg-wrong`, `border-border`; font variables `--font-geist-sans`, `--font-geist-mono`; CSS vars `--bg`, `--text`, `--muted`, `--accent`, `--highlight`, `--correct`, `--wrong`, `--border`

---

- [ ] **Step 1: Scaffold the Next.js project**

Run from the parent directory `/Users/hamzazaveri/Documents/Claude/`:

```bash
npx create-next-app@latest "german vocab" \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --yes
```

Expected: project files created inside the existing `german vocab/` directory. The `german-vocab-app.md` spec file and `docs/` folder remain untouched.

- [ ] **Step 2: Install additional dependencies**

```bash
cd "/Users/hamzazaveri/Documents/Claude/german vocab"
npm install geist framer-motion
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest @types/jest
```

- [ ] **Step 3: Write `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        primary: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        highlight: 'var(--highlight)',
        correct: 'var(--correct)',
        wrong: 'var(--wrong)',
        border: 'var(--border)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      maxWidth: {
        content: '680px',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Write `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #F5F3EF;
  --text: #1A1A18;
  --muted: #8A887F;
  --accent: #2D2D2A;
  --highlight: #E8E4DA;
  --correct: #3A6B4A;
  --wrong: #8B3A3A;
  --border: #D5D2C8;
}

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 5: Write `app/layout.tsx`**

```tsx
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wortschatz — A1 German Vocabulary',
  description: 'Learn German A1 vocabulary with mnemonics and spaced practice',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: Write `jest.config.ts`**

```ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
```

- [ ] **Step 7: Write `jest.setup.ts`**

```ts
import '@testing-library/jest-dom'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
```

- [ ] **Step 8: Write `__tests__/smoke.test.ts`**

```ts
describe('jest setup', () => {
  it('localStorage mock is available', () => {
    localStorage.setItem('test', 'value')
    expect(localStorage.getItem('test')).toBe('value')
    localStorage.clear()
  })
})
```

- [ ] **Step 9: Run the smoke test**

```bash
npm test -- --testPathPattern=smoke
```

Expected output: `PASS __tests__/smoke.test.ts` — 1 test passing.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 project with design system and Jest"
```

---

## Task 2: Vocabulary Data + `lib/vocab.ts`

**Files:**
- Create: `data/vocabulary.json`
- Create: `lib/vocab.ts`
- Create: `__tests__/lib/vocab.test.ts`

**Interfaces:**
- Produces:
  - `Word` interface (exported from `lib/vocab.ts`)
  - `getAllWords(): Word[]`
  - `getWord(id: string): Word | undefined`
  - `getWordsByCategory(category: string): Word[]`
  - `getCategories(): string[]`
  - `getMasteredIds(): string[]`
  - `setMastered(id: string, mastered: boolean): void`
  - `getMasteredWords(): Word[]`
  - `getDistractors(word: Word, count: number, allWords: Word[]): Word[]`
  - `getPracticeType(id: string): 'fill' | 'choice'`

---

- [ ] **Step 1: Write failing tests in `__tests__/lib/vocab.test.ts`**

```ts
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
    expect(reloaded.find(w => w.id !== id)?.mastered).toBe(false)
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --testPathPattern=vocab
```

Expected: FAIL — module not found errors.

- [ ] **Step 3: Create `data/vocabulary.json`**

Create the file with the full A1 word list. Each entry follows this exact schema:

```json
{
  "id": "001",
  "german": "Hallo",
  "article": "",
  "base": "Hallo",
  "english": "hello",
  "phonetic": "HA-lo",
  "category": "greetings",
  "trick": "Sounds exactly like English 'hallo' — you already know this one.",
  "exampleSentence": "Hallo! Wie geht es dir?",
  "exampleTranslation": "Hello! How are you?",
  "mastered": false
}
```

Rules:
- `article`: `"der"`, `"die"`, `"das"`, or `""` (for words without an article)
- `german`: full form including article if present (`"der Apfel"`, `"Hallo"`)
- `base`: the word without article (`"Apfel"`, `"Hallo"`)
- `mastered`: always `false` in the JSON — live state comes from localStorage
- `trick`: a mnemonic, cognate link, visual story, or sound-alike — make it genuinely memorable
- `phonetic`: stress indicated by CAPS on the stressed syllable, hyphens between syllables

Generate entries for all categories below. IDs are sequential zero-padded 3-digit strings.

**greetings** (IDs 001–008) — 8 words:
Hallo (hello), Tschüss (bye), Bitte (please / you're welcome), Danke (thank you), Entschuldigung (excuse me / sorry), Guten Morgen (good morning), Guten Abend (good evening), Auf Wiedersehen (goodbye)

**people** (IDs 009–016) — 8 words:
der Mann (man), die Frau (woman), das Kind (child), der Freund (friend/boyfriend), die Familie (family), der Mensch (person/human), jemand (someone), niemand (nobody)

**family** (IDs 017–024) — 8 words:
die Mutter (mother), der Vater (father), der Bruder (brother), die Schwester (sister), die Oma (grandma), der Opa (grandpa), die Tante (aunt), der Onkel (uncle)

**numbers** (IDs 025–050) — 26 words:
null (zero), eins (one), zwei (two), drei (three), vier (four), fünf (five), sechs (six), sieben (seven), acht (eight), neun (nine), zehn (ten), elf (eleven), zwölf (twelve), dreizehn (thirteen), vierzehn (fourteen), fünfzehn (fifteen), sechzehn (sixteen), siebzehn (seventeen), achtzehn (eighteen), neunzehn (nineteen), zwanzig (twenty), dreißig (thirty), vierzig (forty), fünfzig (fifty), hundert (hundred), tausend (thousand)

**days** (IDs 051–057) — 7 words:
Montag (Monday), Dienstag (Tuesday), Mittwoch (Wednesday), Donnerstag (Thursday), Freitag (Friday), Samstag (Saturday), Sonntag (Sunday)

**months** (IDs 058–069) — 12 words:
Januar (January), Februar (February), März (March), April (April), Mai (May), Juni (June), Juli (July), August (August), September (September), Oktober (October), November (November), Dezember (December)

**seasons** (IDs 070–073) — 4 words:
der Frühling (spring), der Sommer (summer), der Herbst (autumn), der Winter (winter)

**time** (IDs 074–083) — 10 words:
heute (today), morgen (tomorrow), gestern (yesterday), jetzt (now), dann (then), später (later), früh (early), spät (late), immer (always), nie (never)

**food** (IDs 084–098) — 15 words:
das Brot (bread), das Wasser (water), die Milch (milk), der Kaffee (coffee), der Apfel (apple), das Essen (food/meal), das Fleisch (meat), der Fisch (fish), das Gemüse (vegetables), das Obst (fruit), der Käse (cheese), das Ei (egg), die Suppe (soup), der Salat (salad), der Kuchen (cake)

**drinks** (IDs 099–104) — 6 words:
der Tee (tea), der Saft (juice), das Bier (beer), der Wein (wine), die Cola (cola), das Glas (glass)

**colors** (IDs 105–114) — 10 words:
rot (red), blau (blue), grün (green), gelb (yellow), schwarz (black), weiß (white), braun (brown), grau (grey), orange (orange), lila (purple)

**clothing** (IDs 115–124) — 10 words:
das Hemd (shirt), die Hose (trousers), das Kleid (dress), die Jacke (jacket), der Schuh (shoe), die Socke (sock), der Pullover (sweater), der Rock (skirt), der Mantel (coat), die Mütze (hat/beanie)

**body** (IDs 125–134) — 10 words:
der Kopf (head), die Hand (hand), der Fuß (foot), das Auge (eye), das Ohr (ear), die Nase (nose), der Mund (mouth), der Arm (arm), das Bein (leg), der Bauch (stomach)

**places** (IDs 135–146) — 12 words:
das Haus (house), die Küche (kitchen), das Zimmer (room), die Stadt (city), der Bahnhof (train station), die Schule (school), der Markt (market), das Restaurant (restaurant), die Straße (street), das Büro (office), das Hotel (hotel), die Apotheke (pharmacy)

**transport** (IDs 147–154) — 8 words:
das Auto (car), der Bus (bus), der Zug (train), das Fahrrad (bicycle), das Flugzeug (plane), die Straßenbahn (tram), das Taxi (taxi), das Schiff (ship)

**verbs** (IDs 155–179) — 25 words:
sein (to be), haben (to have), gehen (to go), kommen (to come), machen (to make/do), sprechen (to speak), essen (to eat), trinken (to drink), heißen (to be called), wohnen (to live/reside), arbeiten (to work), lernen (to learn), schlafen (to sleep), kaufen (to buy), lesen (to read), schreiben (to write), hören (to hear), sehen (to see), kennen (to know a person), möchten (would like), können (can), müssen (must), sollen (should), dürfen (may/allowed to), wollen (to want)

For verbs, `article: ""` and `german` = `base` = the infinitive form.

**adjectives** (IDs 180–199) — 20 words:
groß (big), klein (small), gut (good), schlecht (bad), neu (new), alt (old), schön (beautiful), billig (cheap), teuer (expensive), jung (young), schnell (fast), langsam (slow), warm (warm), kalt (cold), lang (long), kurz (short), schwer (heavy/difficult), leicht (light/easy), viel (much/many), wenig (little/few)

For adjectives, `article: ""` and `german` = `base` = the adjective in base form.

**questions** (IDs 200–207) — 8 words:
was (what), wer (who), wo (where), wann (when), wie (how), warum (why), welche (which), wie viel (how much)

**occupations** (IDs 208–217) — 10 words:
der Arzt (doctor m.), die Lehrerin (teacher f.), der Student (student m.), der Kellner (waiter), der Verkäufer (salesperson m.), der Polizist (police officer m.), der Ingenieur (engineer m.), der Koch (cook m.), der Mechaniker (mechanic m.), die Sekretärin (secretary f.)

For occupations, article = "der" or "die" as appropriate.

**common** (IDs 218–227) — 10 words:
die Arbeit (work), die Zeit (time), der Tag (day), das Jahr (year), das Geld (money), der Name (name), die Adresse (address), das Land (country), die Sprache (language), die Frage (question)

Here are **10 complete example entries** covering multiple categories to guide the trick style and quality:

```json
[
  {
    "id": "001",
    "german": "Hallo",
    "article": "",
    "base": "Hallo",
    "english": "hello",
    "phonetic": "HA-lo",
    "category": "greetings",
    "trick": "Sounds exactly like English 'hallo' — you already know this one.",
    "exampleSentence": "Hallo! Wie geht es dir?",
    "exampleTranslation": "Hello! How are you?",
    "mastered": false
  },
  {
    "id": "003",
    "german": "Bitte",
    "article": "",
    "base": "Bitte",
    "english": "please / you're welcome",
    "phonetic": "BIT-teh",
    "category": "greetings",
    "trick": "Think 'bitter' — you say please with a bitter face when begging, and a kind face when welcoming.",
    "exampleSentence": "Ein Kaffee, bitte.",
    "exampleTranslation": "A coffee, please.",
    "mastered": false
  },
  {
    "id": "025",
    "german": "null",
    "article": "",
    "base": "null",
    "english": "zero",
    "phonetic": "NOOL",
    "category": "numbers",
    "trick": "Same as 'null' in programming — zero, nothing, nada.",
    "exampleSentence": "Die Temperatur ist null Grad.",
    "exampleTranslation": "The temperature is zero degrees.",
    "mastered": false
  },
  {
    "id": "026",
    "german": "eins",
    "article": "",
    "base": "eins",
    "english": "one",
    "phonetic": "AYNS",
    "category": "numbers",
    "trick": "Think of Einstein — 'ein' means one, and he was the number one genius.",
    "exampleSentence": "Ich möchte eins, bitte.",
    "exampleTranslation": "I would like one, please.",
    "mastered": false
  },
  {
    "id": "050",
    "german": "das Brot",
    "article": "das",
    "base": "Brot",
    "english": "bread",
    "phonetic": "BROHT",
    "category": "food",
    "trick": "Sounds like 'broat' — imagine a sturdy loaf-shaped boat (a bROAT) floating down a river.",
    "exampleSentence": "Ich kaufe das Brot beim Bäcker.",
    "exampleTranslation": "I buy the bread at the bakery.",
    "mastered": false
  },
  {
    "id": "105",
    "german": "rot",
    "article": "",
    "base": "rot",
    "english": "red",
    "phonetic": "ROHT",
    "category": "colors",
    "trick": "Rot rhymes with 'hot' — red things are hot: fire, lava, the sun.",
    "exampleSentence": "Das Auto ist rot.",
    "exampleTranslation": "The car is red.",
    "mastered": false
  },
  {
    "id": "155",
    "german": "sein",
    "article": "",
    "base": "sein",
    "english": "to be",
    "phonetic": "ZAYN",
    "category": "verbs",
    "trick": "Think of 'Sein' as 'sane' — to be sane is to exist. Descartes: I think therefore I 'sein'.",
    "exampleSentence": "Ich bin müde.",
    "exampleTranslation": "I am tired.",
    "mastered": false
  },
  {
    "id": "180",
    "german": "groß",
    "article": "",
    "base": "groß",
    "english": "big",
    "phonetic": "GROHS",
    "category": "adjectives",
    "trick": "Sounds like 'gross' in English — something gross is usually big and overwhelming.",
    "exampleSentence": "Das Haus ist sehr groß.",
    "exampleTranslation": "The house is very big.",
    "mastered": false
  },
  {
    "id": "200",
    "german": "was",
    "article": "",
    "base": "was",
    "english": "what",
    "phonetic": "VAHS",
    "category": "questions",
    "trick": "Almost the same as English 'was' — but here it means 'what', not the past tense of 'be'.",
    "exampleSentence": "Was ist das?",
    "exampleTranslation": "What is that?",
    "mastered": false
  },
  {
    "id": "218",
    "german": "die Arbeit",
    "article": "die",
    "base": "Arbeit",
    "english": "work",
    "phonetic": "AR-byt",
    "category": "common",
    "trick": "Think 'arbeit' sounds like 'are bite' — work is when you 'are' forced to 'bite' the bullet.",
    "exampleSentence": "Die Arbeit beginnt um neun Uhr.",
    "exampleTranslation": "Work starts at nine o'clock.",
    "mastered": false
  }
]
```

Generate the full `vocabulary.json` as a JSON array of 227 entries following these examples exactly.

- [ ] **Step 4: Write `lib/vocab.ts`**

```ts
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
```

- [ ] **Step 5: Run tests**

```bash
npm test -- --testPathPattern=vocab
```

Expected: `PASS __tests__/lib/vocab.test.ts` — all tests green.

- [ ] **Step 6: Commit**

```bash
git add data/vocabulary.json lib/vocab.ts __tests__/lib/vocab.test.ts
git commit -m "feat: add A1 vocabulary data and vocab helpers"
```

---

## Task 3: Shared Components

**Files:**
- Create: `components/ProgressBar.tsx`
- Create: `components/StageIndicator.tsx`
- Create: `components/PronounceButton.tsx`
- Create: `__tests__/components/ProgressBar.test.tsx`
- Create: `__tests__/components/StageIndicator.test.tsx`
- Create: `__tests__/components/PronounceButton.test.tsx`

**Interfaces:**
- Consumes: CSS vars `--text`, `--border`
- Produces:
  - `<ProgressBar value={number} max={number} className?: string />`
  - `<StageIndicator total={number} current={number} />` — `current` is 1-indexed
  - `<PronounceButton word={string} onPlayed={() => void} />`

---

- [ ] **Step 1: Write failing tests for ProgressBar**

```tsx
// __tests__/components/ProgressBar.test.tsx
import { render, screen } from '@testing-library/react'
import ProgressBar from '@/components/ProgressBar'

describe('ProgressBar', () => {
  it('renders an inner bar at the correct width percentage', () => {
    const { container } = render(<ProgressBar value={3} max={10} />)
    const inner = container.querySelector('[style]') as HTMLElement
    expect(inner.style.width).toBe('30%')
  })

  it('clamps to 0% when value is 0', () => {
    const { container } = render(<ProgressBar value={0} max={10} />)
    const inner = container.querySelector('[style]') as HTMLElement
    expect(inner.style.width).toBe('0%')
  })

  it('clamps to 100% when value equals max', () => {
    const { container } = render(<ProgressBar value={10} max={10} />)
    const inner = container.querySelector('[style]') as HTMLElement
    expect(inner.style.width).toBe('100%')
  })
})
```

- [ ] **Step 2: Write failing tests for StageIndicator**

```tsx
// __tests__/components/StageIndicator.test.tsx
import { render } from '@testing-library/react'
import StageIndicator from '@/components/StageIndicator'

describe('StageIndicator', () => {
  it('renders the correct number of dots', () => {
    const { container } = render(<StageIndicator total={4} current={2} />)
    expect(container.querySelectorAll('[aria-label]').length).toBe(4)
  })

  it('marks completed dots differently from pending ones', () => {
    const { container } = render(<StageIndicator total={4} current={2} />)
    const dots = container.querySelectorAll('[aria-label]')
    expect(dots[0].getAttribute('aria-label')).toBe('completed')
    expect(dots[1].getAttribute('aria-label')).toBe('completed')
    expect(dots[2].getAttribute('aria-label')).toBe('pending')
    expect(dots[3].getAttribute('aria-label')).toBe('pending')
  })
})
```

- [ ] **Step 3: Write failing tests for PronounceButton**

```tsx
// __tests__/components/PronounceButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import PronounceButton from '@/components/PronounceButton'

const mockSpeak = jest.fn()
beforeEach(() => {
  mockSpeak.mockClear()
  Object.defineProperty(window, 'speechSynthesis', {
    value: { speak: mockSpeak },
    writable: true,
  })
})

describe('PronounceButton', () => {
  it('renders a listen button', () => {
    render(<PronounceButton word="Apfel" onPlayed={() => {}} />)
    expect(screen.getByRole('button', { name: /listen/i })).toBeInTheDocument()
  })

  it('calls speechSynthesis.speak with correct lang and rate', () => {
    render(<PronounceButton word="Apfel" onPlayed={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /listen/i }))
    expect(mockSpeak).toHaveBeenCalledTimes(1)
    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe('Apfel')
    expect(utterance.lang).toBe('de-DE')
    expect(utterance.rate).toBe(0.85)
  })

  it('fires onPlayed callback when clicked', () => {
    const onPlayed = jest.fn()
    render(<PronounceButton word="Apfel" onPlayed={onPlayed} />)
    fireEvent.click(screen.getByRole('button', { name: /listen/i }))
    expect(onPlayed).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 4: Run all three tests to confirm they fail**

```bash
npm test -- --testPathPattern="components/(ProgressBar|StageIndicator|PronounceButton)"
```

Expected: FAIL — component files not found.

- [ ] **Step 5: Write `components/ProgressBar.tsx`**

```tsx
interface ProgressBarProps {
  value: number
  max: number
  className?: string
}

export default function ProgressBar({ value, max, className }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className={`h-px bg-[#D5D2C8] ${className ?? ''}`}>
      <div
        className="h-full bg-[var(--text)] transition-[width] duration-200 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 6: Write `components/StageIndicator.tsx`**

```tsx
interface StageIndicatorProps {
  total: number
  current: number
}

export default function StageIndicator({ total, current }: StageIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="stage progress">
      {Array.from({ length: total }, (_, i) => {
        const done = i < current
        return (
          <div
            key={i}
            aria-label={done ? 'completed' : 'pending'}
            className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-[var(--text)]' : 'bg-[#D5D2C8]'}`}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 7: Write `components/PronounceButton.tsx`**

```tsx
'use client'

interface PronounceButtonProps {
  word: string
  onPlayed: () => void
}

export default function PronounceButton({ word, onPlayed }: PronounceButtonProps) {
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'de-DE'
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
    onPlayed()
  }

  return (
    <button
      onClick={speak}
      className="flex items-center gap-2 min-h-[44px] px-5 border border-[#D5D2C8] text-[var(--text)] text-sm font-medium tracking-wide hover:border-[var(--text)] transition-colors duration-200"
    >
      ▶ Listen
    </button>
  )
}
```

- [ ] **Step 8: Run tests**

```bash
npm test -- --testPathPattern="components/(ProgressBar|StageIndicator|PronounceButton)"
```

Expected: `PASS` — all tests green.

- [ ] **Step 9: Commit**

```bash
git add components/ __tests__/components/ProgressBar.test.tsx __tests__/components/StageIndicator.test.tsx __tests__/components/PronounceButton.test.tsx
git commit -m "feat: add ProgressBar, StageIndicator, and PronounceButton components"
```

---

## Task 4: Home Page

**Files:**
- Create: `app/page.tsx`
- Create: `__tests__/app/home.test.tsx`

**Interfaces:**
- Consumes: `getAllWords()`, `getCategories()` from `@/lib/vocab`; `ProgressBar` component
- Produces: `GET /` renders word list with category filter, progress bar, and links to `/learn/[id]` and `/quiz`

---

- [ ] **Step 1: Write failing test**

```tsx
// __tests__/app/home.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import Home from '@/app/page'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

describe('Home page', () => {
  beforeEach(() => localStorage.clear())

  it('renders the Wortschatz heading', () => {
    render(<Home />)
    expect(screen.getByText('Wortschatz')).toBeInTheDocument()
  })

  it('renders an All category filter pill', () => {
    render(<Home />)
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument()
  })

  it('renders word rows with german and english text', () => {
    render(<Home />)
    const rows = screen.getAllByRole('link')
    expect(rows.length).toBeGreaterThan(10)
  })

  it('filters words when a category pill is clicked', () => {
    render(<Home />)
    const allLinks = screen.getAllByRole('link').length
    const foodPill = screen.getByRole('button', { name: /food/i })
    fireEvent.click(foodPill)
    const filteredLinks = screen.getAllByRole('link').length
    expect(filteredLinks).toBeLessThan(allLinks)
  })

  it('Start Quiz button is disabled when nothing is mastered', () => {
    render(<Home />)
    expect(screen.getByRole('link', { name: /start quiz/i })).toHaveAttribute('aria-disabled', 'true')
  })

  it('shows mastery count', () => {
    render(<Home />)
    expect(screen.getByText(/mastered/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- --testPathPattern="home"
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `app/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllWords, getCategories, type Word } from '@/lib/vocab'
import ProgressBar from '@/components/ProgressBar'

export default function Home() {
  const [words, setWords] = useState<Word[]>(getAllWords)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = ['all', ...getCategories()]
  const filtered =
    activeCategory === 'all' ? words : words.filter(w => w.category === activeCategory)
  const masteredCount = words.filter(w => w.mastered).length
  const total = words.length
  const hasMastered = masteredCount > 0

  return (
    <main className="max-w-content mx-auto px-6 py-12">
      <h1 className="font-mono text-[32px] font-light tracking-tight text-[var(--text)]">
        Wortschatz
      </h1>
      <p className="mt-1 text-[13px] text-muted tracking-wide">A1 German vocabulary</p>

      <div className="my-6 h-px bg-[#D5D2C8]" />

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] border transition-colors duration-200 min-h-[44px] ${
              activeCategory === cat
                ? 'border-[var(--text)] text-[var(--text)]'
                : 'border-[#D5D2C8] text-muted hover:border-[var(--text)]'
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

      <ul className="divide-y divide-[#D5D2C8]">
        {filtered.map(word => (
          <li key={word.id}>
            <Link
              href={`/learn/${word.id}`}
              className="flex items-center justify-between py-3 hover:opacity-70 transition-opacity duration-200"
            >
              <span className="font-mono text-[var(--text)]">{word.german}</span>
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

      <div className="mt-10 flex justify-end">
        <Link
          href="/quiz"
          aria-disabled={!hasMastered}
          onClick={e => { if (!hasMastered) e.preventDefault() }}
          className={`px-6 py-3 text-[13px] font-medium uppercase tracking-[0.1em] border transition-colors duration-200 ${
            hasMastered
              ? 'border-[var(--text)] text-[var(--text)] hover:bg-[var(--highlight)]'
              : 'border-[#D5D2C8] text-muted cursor-not-allowed'
          }`}
        >
          Start Quiz
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- --testPathPattern="home"
```

Expected: `PASS` — all tests green.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx __tests__/app/home.test.tsx
git commit -m "feat: add home page with word list, category filter, and progress"
```

---

## Task 5: Learn Flow — WordCard + `/learn/[wordId]/page.tsx`

**Files:**
- Create: `components/WordCard.tsx`
- Create: `app/learn/[wordId]/page.tsx`
- Create: `__tests__/components/WordCard.test.tsx`
- Create: `__tests__/app/learn.test.tsx`

**Interfaces:**
- Consumes: `getWord()`, `setMastered()`, `getDistractors()`, `getPracticeType()`, `getAllWords()` from `@/lib/vocab`; `StageIndicator`, `PronounceButton` components
- Produces: 4-stage learn flow at `/learn/[wordId]`; marks word mastered in localStorage on correct Stage 4 answer

---

- [ ] **Step 1: Write failing tests for WordCard**

```tsx
// __tests__/components/WordCard.test.tsx
import { render, screen } from '@testing-library/react'
import WordCard from '@/components/WordCard'

describe('WordCard', () => {
  it('renders children', () => {
    render(<WordCard stage={1}><p>hello</p></WordCard>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('applies the highlight background', () => {
    const { container } = render(<WordCard stage={1}><p>x</p></WordCard>)
    expect(container.firstChild).toHaveClass('bg-highlight')
  })
})
```

- [ ] **Step 2: Write failing tests for the learn page**

```tsx
// __tests__/app/learn.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import LearnPage from '@/app/learn/[wordId]/page'

jest.mock('next/navigation', () => ({
  useParams: () => ({ wordId: '001' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}))

Object.defineProperty(window, 'speechSynthesis', {
  value: { speak: jest.fn() },
  writable: true,
})

describe('Learn page', () => {
  beforeEach(() => localStorage.clear())

  it('renders stage 1 with the german word and english translation', () => {
    render(<LearnPage />)
    expect(screen.getByText(/FOOD|GREETINGS|PEOPLE|NUMBERS|DAYS|MONTHS|SEASONS|TIME|COLORS|CLOTHING|BODY|PLACES|TRANSPORT|VERBS|ADJECTIVES|QUESTIONS|OCCUPATIONS|COMMON|DRINKS/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument()
  })

  it('advances to stage 2 after clicking Got it', () => {
    render(<LearnPage />)
    fireEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(screen.getByRole('button', { name: /listen/i })).toBeInTheDocument()
  })

  it('Next button is disabled until Listen is clicked in stage 2', () => {
    render(<LearnPage />)
    fireEvent.click(screen.getByRole('button', { name: /got it/i }))
    const nextBtn = screen.getByRole('button', { name: /next/i })
    expect(nextBtn).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /listen/i }))
    expect(nextBtn).not.toBeDisabled()
  })

  it('advances to stage 3 after clicking Next in stage 2', () => {
    render(<LearnPage />)
    fireEvent.click(screen.getByRole('button', { name: /got it/i }))
    fireEvent.click(screen.getByRole('button', { name: /listen/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText(/remember it like this|→/i)).toBeInTheDocument()
  })

  it('shows Check button in stage 4', () => {
    render(<LearnPage />)
    fireEvent.click(screen.getByRole('button', { name: /got it/i }))
    fireEvent.click(screen.getByRole('button', { name: /listen/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /remember/i }))
    expect(screen.getByRole('button', { name: /check/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npm test -- --testPathPattern="(WordCard|learn)"
```

Expected: FAIL — files not found.

- [ ] **Step 4: Write `components/WordCard.tsx`**

```tsx
interface WordCardProps {
  stage: number
  children: React.ReactNode
}

export default function WordCard({ children }: WordCardProps) {
  return (
    <div className="bg-highlight border border-[#D5D2C8] p-6">
      {children}
    </div>
  )
}
```

- [ ] **Step 5: Write `app/learn/[wordId]/page.tsx`**

```tsx
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
  type Word,
} from '@/lib/vocab'
import StageIndicator from '@/components/StageIndicator'
import PronounceButton from '@/components/PronounceButton'
import WordCard from '@/components/WordCard'

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
      if (e.key === 'Escape') router.push('/')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  const allWords = useMemo(() => getAllWords(), [])
  const practiceType = word ? getPracticeType(word.id) : 'choice'
  const options: Word[] = useMemo(() => {
    if (!word) return []
    return [...getDistractors(word, 3, allWords), word].sort(() => Math.random() - 0.5)
  }, [word?.id])

  if (!word) {
    return (
      <main className="max-w-content mx-auto px-6 py-12">
        <p className="text-muted">Word not found.</p>
      </main>
    )
  }

  const advance = () => {
    if (stage < 4) {
      setStage((stage + 1) as Stage)
      setHasListened(false)
    }
  }

  const handleCheck = () => {
    let correct = false
    if (practiceType === 'fill') {
      correct = userInput.trim().toLowerCase() === word.base.toLowerCase()
    } else {
      correct = selectedOption === word.english
    }
    setOutcome(correct ? 'correct' : 'wrong')
    if (correct) setMastered(word.id, true)
  }

  const motionProps = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.2, ease: 'easeInOut' as const },
      }

  const borderClass =
    outcome === 'correct'
      ? 'border-correct'
      : outcome === 'wrong'
      ? 'border-wrong'
      : 'border-[#D5D2C8]'

  return (
    <main className="max-w-content mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-muted text-sm hover:text-[var(--text)] transition-colors duration-200 min-h-[44px]"
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
              <h2 className="font-mono text-[56px] font-light tracking-[-0.02em] leading-none">
                {word.german}
              </h2>
              <p className="text-[32px] font-light text-muted">{word.english}</p>
              <WordCard stage={1}>
                <p className="italic text-[15px] text-[var(--text)]">{word.exampleSentence}</p>
                <p className="text-sm text-muted mt-1">{word.exampleTranslation}</p>
              </WordCard>
              <div className="flex justify-end">
                <button
                  onClick={advance}
                  className="min-h-[44px] px-6 border border-[var(--text)] text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200"
                >
                  Got it →
                </button>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div className="space-y-6">
              <h2 className="font-mono text-[56px] font-light tracking-[-0.02em] leading-none">
                {word.german}
              </h2>
              <p className="font-mono text-[20px] tracking-widest text-muted">
                / {word.phonetic} /
              </p>
              <PronounceButton word={word.german} onPlayed={() => setHasListened(true)} />
              <button
                onClick={advance}
                disabled={!hasListened}
                className="min-h-[44px] w-full border border-[var(--text)] text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200 disabled:border-[#D5D2C8] disabled:text-muted disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}

          {stage === 3 && (
            <div className="space-y-6">
              <h2 className="font-mono text-[56px] font-light tracking-[-0.02em] leading-none">
                {word.german}
              </h2>
              <WordCard stage={3}>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted mb-3">
                  → Remember it like this
                </p>
                <p className="text-[15px] italic text-[var(--text)] leading-relaxed">
                  {word.trick}
                </p>
              </WordCard>
              <div className="flex justify-end">
                <button
                  onClick={advance}
                  className="min-h-[44px] px-6 border border-[var(--text)] text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200"
                >
                  I'll remember →
                </button>
              </div>
            </div>
          )}

          {stage === 4 && (
            <div className="space-y-6">
              {practiceType === 'fill' ? (
                <>
                  <p className="text-[16px] text-muted">
                    {word.exampleSentence.replace(word.base, '______')}
                  </p>
                  <p className="text-sm text-muted italic">{word.exampleTranslation}</p>
                  <input
                    type="text"
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !outcome) handleCheck() }}
                    placeholder="Type here..."
                    disabled={!!outcome}
                    className={`w-full min-h-[44px] px-4 border bg-transparent text-[var(--text)] text-[16px] outline-none transition-colors duration-200 ${borderClass}`}
                  />
                </>
              ) : (
                <>
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                    What does "{word.german}" mean?
                  </p>
                  <div className="space-y-3">
                    {options.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => !outcome && setSelectedOption(opt.english)}
                        className={`w-full min-h-[44px] px-4 py-3 text-left border text-[16px] transition-colors duration-200 ${
                          selectedOption === opt.english
                            ? 'border-[var(--text)] text-[var(--text)]'
                            : 'border-[#D5D2C8] text-muted hover:border-[var(--text)]'
                        }`}
                      >
                        {opt.english}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {outcome && (
                <div
                  className={`text-[13px] font-medium uppercase tracking-[0.1em] ${
                    outcome === 'correct' ? 'text-correct' : 'text-wrong'
                  }`}
                >
                  {outcome === 'correct'
                    ? '✓ Correct'
                    : `✗ Correct answer: ${word.base}`}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                {!outcome ? (
                  <button
                    onClick={handleCheck}
                    disabled={practiceType === 'fill' ? !userInput.trim() : !selectedOption}
                    className="min-h-[44px] px-6 border border-[var(--text)] text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200 disabled:border-[#D5D2C8] disabled:text-muted disabled:cursor-not-allowed"
                  >
                    Check
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/')}
                    className="min-h-[44px] px-6 border border-[var(--text)] text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200"
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
```

- [ ] **Step 6: Run tests**

```bash
npm test -- --testPathPattern="(WordCard|learn)"
```

Expected: `PASS` — all tests green.

- [ ] **Step 7: Commit**

```bash
git add components/WordCard.tsx "app/learn/[wordId]/page.tsx" __tests__/components/WordCard.test.tsx __tests__/app/learn.test.tsx
git commit -m "feat: add 4-stage learn flow with pronunciation and practice"
```

---

## Task 6: Quiz Mode

**Files:**
- Create: `components/QuizCard.tsx`
- Create: `app/quiz/page.tsx`
- Create: `__tests__/components/QuizCard.test.tsx`
- Create: `__tests__/app/quiz.test.tsx`

**Interfaces:**
- Consumes: `getMasteredWords()`, `getDistractors()`, `setMastered()`, `getAllWords()` from `@/lib/vocab`; `QuizCard` component
- Produces: Quiz page at `/quiz` — 10 questions from mastered words, score, missed word links

---

- [ ] **Step 1: Write failing tests for QuizCard**

```tsx
// __tests__/components/QuizCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import QuizCard from '@/components/QuizCard'
import { getAllWords } from '@/lib/vocab'

const mockWord = getAllWords()[0]
const mockOptions = getAllWords().slice(0, 4)

describe('QuizCard — multiple choice', () => {
  it('renders the question text', () => {
    render(
      <QuizCard
        word={mockWord}
        type="choice"
        options={mockOptions}
        onResult={() => {}}
      />
    )
    expect(screen.getByText(new RegExp(mockWord.german, 'i'))).toBeInTheDocument()
  })

  it('calls onResult(true) when correct option selected', () => {
    const onResult = jest.fn()
    render(
      <QuizCard
        word={mockWord}
        type="choice"
        options={mockOptions}
        onResult={onResult}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: mockWord.english }))
    fireEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(onResult).toHaveBeenCalledWith(true)
  })
})

describe('QuizCard — fill', () => {
  it('renders an input', () => {
    render(
      <QuizCard
        word={mockWord}
        type="fill"
        options={[]}
        onResult={() => {}}
      />
    )
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('calls onResult(false) on wrong answer', () => {
    const onResult = jest.fn()
    render(
      <QuizCard
        word={mockWord}
        type="fill"
        options={[]}
        onResult={onResult}
      />
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(onResult).toHaveBeenCalledWith(false)
  })
})
```

- [ ] **Step 2: Write failing tests for the quiz page**

```tsx
// __tests__/app/quiz.test.tsx
import { render, screen } from '@testing-library/react'
import QuizPage from '@/app/quiz/page'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

describe('Quiz page', () => {
  beforeEach(() => {
    localStorage.clear()
    // seed 15 mastered words so quiz has enough to draw from
    const ids = Array.from({ length: 15 }, (_, i) =>
      String(i + 1).padStart(3, '0')
    )
    localStorage.setItem('wortschatz:mastered', JSON.stringify(ids))
  })

  it('renders a question', () => {
    render(<QuizPage />)
    expect(screen.getByRole('button', { name: /check/i })).toBeInTheDocument()
  })

  it('shows "No mastered words yet" when nothing mastered', () => {
    localStorage.clear()
    render(<QuizPage />)
    expect(screen.getByText(/no mastered words/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npm test -- --testPathPattern="(QuizCard|quiz)"
```

Expected: FAIL — files not found.

- [ ] **Step 4: Write `components/QuizCard.tsx`**

```tsx
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
    isCorrect === true
      ? 'border-correct'
      : isCorrect === false
      ? 'border-wrong'
      : 'border-[#D5D2C8]'

  return (
    <div className={`border p-6 space-y-5 transition-colors duration-200 ${borderClass}`}>
      {type === 'fill' ? (
        <>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            Type the German word for:
          </p>
          <p className="text-[32px] font-light text-[var(--text)]">{word.english}</p>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !checked) handleCheck() }}
            disabled={checked}
            placeholder="Type here..."
            className="w-full min-h-[44px] px-4 border border-[#D5D2C8] bg-transparent text-[16px] outline-none"
          />
        </>
      ) : (
        <>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            What does this mean?
          </p>
          <p className="font-mono text-[32px] font-light text-[var(--text)]">{word.german}</p>
          <div className="space-y-2">
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => !checked && setSelected(opt.english)}
                className={`w-full min-h-[44px] px-4 py-2 text-left border text-[16px] transition-colors duration-200 ${
                  selected === opt.english
                    ? 'border-[var(--text)] text-[var(--text)]'
                    : 'border-[#D5D2C8] text-muted hover:border-[var(--text)]'
                } ${checked && opt.english === word.english ? 'border-correct text-correct' : ''}`}
              >
                {opt.english}
              </button>
            ))}
          </div>
        </>
      )}

      {checked && (
        <p
          className={`text-[13px] font-medium uppercase tracking-[0.1em] ${
            isCorrect ? 'text-correct' : 'text-wrong'
          }`}
        >
          {isCorrect ? '✓ Correct' : `✗ Answer: ${word.german}`}
        </p>
      )}

      {!checked && (
        <div className="flex justify-end">
          <button
            onClick={handleCheck}
            disabled={type === 'fill' ? !input.trim() : !selected}
            className="min-h-[44px] px-6 border border-[var(--text)] text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200 disabled:border-[#D5D2C8] disabled:text-muted disabled:cursor-not-allowed"
          >
            Check
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Write `app/quiz/page.tsx`**

```tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getMasteredWords, getDistractors, getAllWords, type Word } from '@/lib/vocab'
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
  const [mastered] = useState<Word[]>(getMasteredWords)
  const [allWords] = useState<Word[]>(getAllWords)

  const questions: Word[] = useMemo(
    () => shuffle(mastered).slice(0, Math.min(10, mastered.length)),
    [mastered.length]
  )

  const questionTypes = useMemo(
    () => questions.map((_, i): 'fill' | 'choice' => (i % 2 === 0 ? 'choice' : 'fill')),
    [questions.length]
  )

  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState<QuizResult[]>([])
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  if (mastered.length === 0) {
    return (
      <main className="max-w-content mx-auto px-6 py-12">
        <p className="text-muted text-[16px]">
          No mastered words yet.{' '}
          <Link href="/" className="underline text-[var(--text)]">
            Go learn some words
          </Link>{' '}
          first.
        </p>
      </main>
    )
  }

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
          {score === questions.length
            ? 'Perfect round!'
            : `${questions.length - score} to review.`}
        </p>

        {missed.length > 0 && (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted mb-4">
              Review these
            </p>
            <ul className="divide-y divide-[#D5D2C8]">
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
            className="min-h-[44px] px-6 border border-[var(--text)] text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200 flex items-center"
          >
            Play again
          </Link>
          <Link
            href="/"
            className="min-h-[44px] px-6 border border-[#D5D2C8] text-[13px] font-medium uppercase tracking-[0.1em] text-muted hover:border-[var(--text)] transition-colors duration-200 flex items-center"
          >
            Back home
          </Link>
        </div>
      </main>
    )
  }

  const currentWord = questions[current]
  const type = questionTypes[current]

  // Memoized per question index to prevent options reshuffling on re-render
  const options = useMemo(
    () =>
      type === 'choice'
        ? shuffle([...getDistractors(currentWord, 3, allWords), currentWord])
        : [],
    [current, allWords.length]
  )

  return (
    <main className="max-w-content mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="text-muted text-sm hover:text-[var(--text)] transition-colors duration-200 min-h-[44px]"
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
          onClick={handleAdvance}
          className="min-h-[44px] w-full border border-[var(--text)] text-[13px] font-medium uppercase tracking-[0.1em] hover:bg-highlight transition-colors duration-200"
        >
          {isLastQuestion ? 'See results →' : 'Next question →'}
        </button>
      )}
    </main>
  )
}
```

- [ ] **Step 6: Run tests**

```bash
npm test -- --testPathPattern="(QuizCard|quiz)"
```

Expected: `PASS` — all tests green.

- [ ] **Step 7: Run the full test suite**

```bash
npm test
```

Expected: all test files passing.

- [ ] **Step 8: Start dev server and verify the golden path**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
1. Home page loads with word list and category filter pills
2. Click a word → learn flow opens at stage 1
3. Click through all 4 stages; pronunciation button plays audio
4. Stage 4 practice works (fill-in and multiple choice)
5. Correct answer marks word with ✓ on home page
6. "Start Quiz" becomes active; quiz runs 10 questions and shows score
7. Missed words link back to their learn pages

- [ ] **Step 9: Commit**

```bash
git add components/QuizCard.tsx app/quiz/page.tsx __tests__/components/QuizCard.test.tsx __tests__/app/quiz.test.tsx
git commit -m "feat: add quiz mode with score screen and missed word links"
```
