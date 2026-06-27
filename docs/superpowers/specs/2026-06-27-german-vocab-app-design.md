# German A1 Vocabulary App — Design Spec
_Date: 2026-06-27_

## Overview

A minimal, aesthetic web app to learn German A1 vocabulary. Each word is taught through four sequential stages (meaning → pronunciation → memory trick → practice) before a dedicated quiz mode. Vocabulary sourced from the full Goethe Institut A1 core list (~200+ words), each with a hand-crafted mnemonic trick.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Font | Geist Sans (variable) + Geist Mono for German words |
| Data | Local `vocabulary.json` — no database |
| Audio | Web Speech API |
| State | React `useState` / `useReducer` — no external state library |
| Persistence | `localStorage` keyed by word ID |
| Animations | Framer Motion (card transitions only) |

No UI component libraries (no shadcn, radix, etc.). All components built from scratch with Tailwind.

---

## Design System

### Palette
```
--bg:         #F5F3EF   /* warm off-white — only background */
--text:       #1A1A18   /* near-black */
--muted:      #8A887F   /* secondary labels */
--accent:     #2D2D2A   /* borders, active states */
--highlight:  #E8E4DA   /* card surface */
--correct:    #3A6B4A   /* success — correct answer only */
--wrong:      #8B3A3A   /* error — wrong answer only */
```

### Typography
```
Display (German word):    Geist Mono, 56px, weight 300, tracking -0.02em
Heading (section label):  Geist Sans, 11px, weight 500, uppercase, tracking 0.12em, color --muted
Body:                     Geist Sans, 16px, weight 400, line-height 1.7
English translation:      Geist Sans, 32px, weight 300, color --muted
Trick/tip text:           Geist Sans, 15px, weight 400, italic, color --muted
```

### Layout Rules
- Max width: `680px`, centered, `padding: 0 24px`
- No card shadows — 1px borders (`#D5D2C8`) only
- No gradients, no glass morphism
- Progress bar: thin 1px line at top, fills left → right, color `--text`
- All transitions: `200ms ease`
- Mobile-first; all tap targets min 44px height
- Keyboard accessible: Enter to confirm, Escape to go back
- Respect `prefers-reduced-motion` — disable Framer Motion when set

---

## App Structure

```
/
├── app/
│   ├── page.tsx                  # Home — word list overview
│   ├── learn/[wordId]/
│   │   └── page.tsx              # 4-stage learning flow
│   ├── quiz/
│   │   └── page.tsx              # Quiz mode
│   └── layout.tsx
├── data/
│   └── vocabulary.json           # Full A1 word list (~200+ words)
├── components/
│   ├── WordCard.tsx
│   ├── StageIndicator.tsx
│   ├── ProgressBar.tsx
│   ├── PronounceButton.tsx
│   └── QuizCard.tsx
└── lib/
    └── vocab.ts                  # Helpers: read, filter, merge localStorage mastery
```

All components kept under 150 lines. Split if they grow larger.

---

## Data Model

```json
{
  "id": "001",
  "german": "der Apfel",
  "article": "der",
  "base": "Apfel",
  "english": "apple",
  "phonetic": "AHF-el",
  "category": "food",
  "trick": "Think of 'Apple' — sounds almost the same! German is the ancestor of the English word.",
  "exampleSentence": "Ich esse einen Apfel.",
  "exampleTranslation": "I am eating an apple.",
  "mastered": false
}
```

### Categories (full A1 scope)
- greetings, people, numbers, food, places, verbs, adjectives, time, questions
- Additional A1 categories to fill the full list: body, clothing, transport, home, work, weather, colors, family

Each word must have a `trick` — mnemonic, visual association, cognate link, or short story. The trick is the most important content field.

`mastered` in the JSON is always `false`; the live mastered state is stored in and read from `localStorage`.

---

## Learning Flow — 4 Stages

Progress tracked by stage dots (`●●○○`).

### Stage 1 — Meaning
- German word large (56px mono)
- English translation below (32px muted)
- Category label (11px uppercase muted)
- Example sentence (italic) + translation
- CTA: "Got it →"

### Stage 2 — Pronunciation
- German word + phonetic spelling (`/ AHF - el /`) in mono
- "Listen" button → Web Speech API (`lang: 'de-DE'`, `rate: 0.85`)
- Short pronunciation tip
- "Next →" is **disabled until Listen clicked at least once**

```ts
const speak = (word: string) => {
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'de-DE'
  utterance.rate = 0.85
  window.speechSynthesis.speak(utterance)
}
```

### Stage 3 — Memory Trick
- German word
- Trick card (1px border, `--highlight` bg) with `→` marker (no emoji)
- CTA: "I'll remember →"

### Stage 4 — Quick Practice
Alternates every 3 words between:

**Fill-in-the-blank:** show example sentence with target word blanked, user types, "Check" button.

**Multiple choice:** show German word, pick English meaning from 4 options (1 correct, 3 plausible distractors drawn from the same category; fall back to the full word list if the category has fewer than 4 words).

- Correct: green border flash (`--correct`), "✓ Correct", word marked mastered in localStorage
- Wrong: red border flash (`--wrong`), show correct answer, "Continue anyway" option

---

## Home Page

- Title: "Wortschatz" (32px), subtitle "A1 German vocabulary" (13px muted)
- 1px divider
- Category filter pills: All + each category
- Mastery progress: `n / N mastered` label + thin progress bar
- Word list rows: German | English | ✓ (plain text) for mastered — alphabetical within category
- "Start Quiz" button — only active when ≥1 word mastered; quizzes mastered words only (reinforcement)

---

## Quiz Mode

- 10 questions per round drawn randomly from **mastered words only** (reinforcement — not all seen words)
- 50% multiple choice, 50% type-the-German-word
- No timer
- Score shown at end: `7 / 10`
- Missed words listed with links back to their `/learn/[wordId]` page

---

## Persistence

- `localStorage` key: `wortschatz:mastered` → JSON array of mastered word IDs
- `lib/vocab.ts` merges localStorage state with static JSON at read time
- No login, no backend, no network calls

---

## Build Priority

1. `vocabulary.json` — full A1 word list with tricks
2. Home page — word list, category filter, progress bar
3. Learn flow — 4 stages for a single word
4. PronounceButton — Web Speech API
5. Quiz mode
6. localStorage persistence
