# German A1 Vocabulary App — Claude Code Spec

## Overview

A minimal, aesthetic web app to learn German A1 vocabulary. Each word is taught in four stages before moving to a quiz: **meaning → pronunciation → memory trick → practice**. Vocabulary is sourced from a curated A1 word list (Spektrum Deutsch A1 / Goethe A1 core list).

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Font**: Geist Sans (variable) + Geist Mono for German words
- **Data**: Local JSON file — no database needed
- **Audio**: Web Speech API for pronunciation playback
- **State**: React `useState` / `useReducer` — no external state library
- **Animations**: Framer Motion (subtle card transitions only)

---

## Design Direction

### Aesthetic References
- [sui.io](https://www.sui.io/) — Swiss grid discipline, generous whitespace, monospaced data
- [niceatnoon.nl](https://www.niceatnoon.nl/) — warm editorial feel, confident type sizing
- [wolverineworldwide.com](https://wolverineworldwide.com/) — bold typographic hierarchy, restraint in color

### Palette
```
--bg:         #F5F3EF   /* warm off-white — the only background */
--text:       #1A1A18   /* near-black */
--muted:      #8A887F   /* secondary labels */
--accent:     #2D2D2A   /* used sparingly for borders, active states */
--highlight:  #E8E4DA   /* card surface, subtle contrast */
--correct:    #3A6B4A   /* success green — used only on correct answer */
--wrong:      #8B3A3A   /* error red — used only on wrong answer */
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
- No card shadows — use 1px borders (`#D5D2C8`) instead
- No gradients, no glass morphism
- Progress bar: thin 1px line at top, fills left to right, color `--text`
- All transitions: `200ms ease` — nothing dramatic

---

## App Structure

```
/
├── app/
│   ├── page.tsx              # Landing / word list overview
│   ├── learn/[wordId]/
│   │   └── page.tsx          # The 4-stage learning flow
│   ├── quiz/
│   │   └── page.tsx          # Quiz mode
│   └── layout.tsx
├── data/
│   └── vocabulary.json       # All A1 words
├── components/
│   ├── WordCard.tsx
│   ├── StageIndicator.tsx
│   ├── ProgressBar.tsx
│   ├── PronounceButton.tsx
│   └── QuizCard.tsx
└── lib/
    └── vocab.ts              # Helpers to read/filter vocab
```

---

## Vocabulary Data Structure

Each word in `vocabulary.json` follows this shape:

```json
{
  "id": "001",
  "german": "der Apfel",
  "article": "der",
  "base": "Apfel",
  "english": "apple",
  "phonetic": "AHF-el",
  "category": "food",
  "trick": "Think of 'Apple' — it sounds almost the same! The German word is the ancestor of the English one.",
  "exampleSentence": "Ich esse einen Apfel.",
  "exampleTranslation": "I am eating an apple.",
  "mastered": false
}
```

### Seed the JSON with these 60 A1 core words (from Spektrum Deutsch A1 / Goethe Institut A1 list):

Include words across these categories:
- **Greetings**: Hallo, Tschüss, Bitte, Danke, Entschuldigung
- **People**: der Mann, die Frau, das Kind, der Freund, die Familie
- **Numbers**: eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn
- **Food**: das Brot, das Wasser, die Milch, der Kaffee, der Apfel, das Essen
- **Places**: das Haus, die Schule, die Stadt, der Bahnhof, die Straße
- **Verbs**: sein, haben, gehen, kommen, machen, sprechen, essen, trinken, heißen, wohnen
- **Adjectives**: groß, klein, gut, schlecht, neu, alt, schön, billig, teuer
- **Time**: heute, morgen, gestern, jetzt, immer, nie, oft
- **Questions**: was, wer, wo, wann, wie, warum

Each word must have a `trick` — a mnemonic, visual association, cognate link, or story. Make the tricks clever and memorable.

---

## Learning Flow (4 Stages)

When a user clicks any word, they go through 4 sequential stages. Progress dots show which stage they're on.

### Stage 1 — Meaning

```
Layout:
  ┌─────────────────────────────────┐
  │  [1 of 4]  ●○○○                 │
  │                                 │
  │  FOOD                           │  ← category label, 11px uppercase muted
  │                                 │
  │  der Apfel                      │  ← large mono, 56px
  │                                 │
  │  apple                          │  ← english, 32px muted
  │                                 │
  │  "Ich esse einen Apfel."        │  ← example sentence, italic
  │  I am eating an apple.          │  ← translation, muted
  │                                 │
  │              [ Got it → ]       │
  └─────────────────────────────────┘
```

Show the German word large, the English translation below it, the article color-coded:
- `der` → no special color, just label
- `die` → no special color
- `das` → no special color
(Keep it clean — don't use color to encode articles, it gets distracting)

### Stage 2 — Pronunciation

```
Layout:
  ┌─────────────────────────────────┐
  │  [2 of 4]  ●●○○                 │
  │                                 │
  │  der Apfel                      │
  │                                 │
  │  /  AHF - el  /                 │  ← phonetic, mono, spaced out
  │                                 │
  │  [  ▶  Listen  ]               │  ← calls Web Speech API
  │                                 │
  │  Tip: stress the first syllable │  ← short pronunciation tip
  │                                 │
  │              [ Next → ]         │
  └─────────────────────────────────┘
```

The `Listen` button calls:
```ts
const speak = (word: string) => {
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'de-DE'
  utterance.rate = 0.85
  window.speechSynthesis.speak(utterance)
}
```

User must click Listen at least once before Next becomes active.

### Stage 3 — Memory Trick

```
Layout:
  ┌─────────────────────────────────┐
  │  [3 of 4]  ●●●○                 │
  │                                 │
  │  der Apfel                      │
  │                                 │
  │  ┌───────────────────────────┐  │
  │  │ 💡 Remember it like this  │  │  ← trick card, 1px border
  │  │                           │  │
  │  │ Think of 'Apple' — it     │  │
  │  │ sounds almost the same!   │  │
  │  │ German is the ancestor    │  │
  │  │ of the English word.      │  │
  │  └───────────────────────────┘  │
  │                                 │
  │              [ I'll remember → ]│
  └─────────────────────────────────┘
```

No emoji in the final build — replace 💡 with a simple `→` or `*` typographic marker.

### Stage 4 — Quick Practice

A single fill-in-the-blank or multiple choice (alternate every 3 words):

**Fill in the blank:**
```
"Ich esse einen ______."
(I am eating an apple.)

[ Type here... ]        [ Check ]
```

**Multiple choice (4 options):**
```
What does "der Apfel" mean?

  ○  orange
  ○  apple       ← correct
  ○  bread
  ○  water

                 [ Check ]
```

On correct: green border flash, "✓ Correct" label, word marked mastered.
On wrong: red border flash, show correct answer, "Try again" or "Continue anyway".

---

## Home / Word List Page

```
Layout:
  ┌─────────────────────────────────┐
  │  Wortschatz                     │  ← 32px, the app "title"
  │  A1 German vocabulary           │  ← 13px muted subtitle
  │                                 │
  │  ──────────────────────────     │  ← 1px divider
  │                                 │
  │  [All]  [Food]  [Verbs]  [...]  │  ← category filter pills
  │                                 │
  │  23 / 60 mastered               │  ← progress label, muted
  │  ████████░░░░░░░░░░░            │  ← thin progress bar
  │                                 │
  │  der Apfel          apple  ✓    │
  │  das Brot           bread       │
  │  die Milch          milk        │
  │  ...                            │
  │                                 │
  │              [ Start Quiz ]     │
  └─────────────────────────────────┘
```

- Each row in the word list is clickable → goes to `/learn/[wordId]`
- ✓ checkmark (text, not emoji) for mastered words
- Words are grouped alphabetically within each category tab
- "Start Quiz" only quizzes mastered words (reinforcement)

---

## Quiz Mode

After completing learning, offer a quiz of all seen words.

- 10 questions per round (random subset)
- Mix: 50% multiple choice, 50% type the German word from English prompt
- Score shown at end: `7 / 10`
- Missed words highlighted — click to go back to their learn page
- No timer — this is relaxed study, not a race

---

## Interaction Details

- **No login, no backend** — all state in `localStorage`
- `mastered` status persists in localStorage keyed by word ID
- Keyboard accessible: Enter to confirm, Escape to go back
- Reduced motion: respect `prefers-reduced-motion` — disable Framer Motion animations
- Mobile first — all tap targets min 44px height

---

## What to Build First (Priority Order)

1. `vocabulary.json` — seed all 60 words with proper tricks
2. Home page — word list with category filter + progress bar
3. Learn flow — 4 stages for a single word
4. Pronunciation button — Web Speech API
5. Quiz mode
6. localStorage persistence

---

## Notes for Claude Code

- Do not use any UI component library (shadcn, radix, etc.) — build everything from scratch with Tailwind
- Keep all components under 150 lines — split if they grow larger
- The `trick` field in JSON is the most important content — spend time making each one genuinely useful
- Test pronunciation in Chrome (best Web Speech API support) and note fallback for Firefox
- No dark mode needed for now — the warm off-white bg is intentional and sufficient
