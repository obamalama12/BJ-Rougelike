# Twenty-One Lanterns

A blackjack roguelike set in a spirit night market, inspired by Balatro.

Twenty-one lanterns hang over the Night Market. Light all of them and you can go home.
Each **Night** has three tables: a Paper Lantern, a Silk Lantern, and a table run by a
**Host**, a yokai whose curse bends the rules of blackjack. Seven Nights, three tables
each: twenty-one lanterns. After that, Endless Night.

## Playing

```bash
npm install
npm run dev      # open the printed URL
npm run build    # static build in dist/ (works from any folder or sub-path)
```

### How a table works

- You have **Hands** (default 6) and **Folds** (default 3) per table.
- Each hand is real blackjack against the dealer (dealer stands on 17, peeks for naturals).
- Winning (or pushing) a hand **scores** it: `Chips × Mult`. The hand type sets the base
  values, each card adds its chips, then your Charms fire left to right.
- Reach the table's target before you run out of hands.
- **Double Down** costs an extra hand and multiplies the hand's score (X2).
- **Split** a pair into two hands, at the cost of an extra hand.
- **Fold** throws a bad hand away *without* using up a hand. Folds are limited.
- Keys: `H` hit, `S` stand, `D` double, `P` split, `F` fold, `Space` deal.

### Hand types

| Hand | How |
| --- | --- |
| Lucky Sevens | Win with exactly three 7s |
| Royal Blackjack | A natural: Ace with a suited J/Q/K |
| Spirit Flush | 21 with 3+ cards, all one suit |
| Blackjack | A natural 21 |
| Lantern Charlie | 5 cards without busting (auto-win) |
| Twenty-One | Exactly 21 with 3+ cards |
| Underdog | Win with 14 or less |
| Outdraw | Beat the dealer's total |
| Dealer Bust | The dealer busts |
| Push | Tie |

Constellations level these up.

## Content

- **210 Charms** (common / uncommon / rare / legendary): suit and rank synergies, scaling
  spirits, economy engines, rule-benders (bust at 22, 4-card Charlies, see the hole card,
  free doubles...), copiers, and 8 legendaries.
- **24 Fortunes** (card magic), **10 Constellations** (hand upgrades), **18 Masks**
  (powerful rites with a price).
- **38 Relics**, permanent upgrades in tiered pairs.
- **25 Tokens**, earned by skipping tables.
- **33 Hosts**, including 6 showdown Hosts for Night 7.
- **16 Shoes** (starting decks) and **8 Moon Phases** (difficulty stakes).
- 8 card **Inks**, 4 **Finishes** and 4 **Seals**.
- 15 Bundle types (normal / jumbo / mega).

## Under the hood

- TypeScript + Vite, no runtime framework. All game state is plain JSON and is saved to
  `localStorage` between hands.
- Visuals: a WebGL ink-nebula background shader with woodblock banding, canvas particle
  layers (sky lanterns, embers, petals), and CSS 3D cards with tilt, shine and foil effects.
  All card and charm art is inline SVG.
- Audio is synthesised with WebAudio: koto-like plucks, taiko and gongs, and a generative
  Hirajoshi-scale soundtrack that changes with the scene. No audio files.
- `npm test` runs unit tests plus dozens of headless seeded runs; `npm run sim -- 400`
  plays 400 bot runs and prints how far they got (used for balancing).
