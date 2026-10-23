# Buck Ducks

A blackjack roguelike of the duck frontier, inspired by Balatro.

You're a drifter duck riding the trail through seven frontier towns. Each **Town** has three
tables: the **Saloon Table**, the **High Roller Table**, and a table run by an **Outlaw**, a
varmint whose dirty trick bends the rules of blackjack. Seven towns, three tables each:
twenty-one bounties. Collect them all and you're the Fastest Bill in the West. After that
the trail goes on forever (Endless).

## Playing

```bash
npm install
npm run dev      # open the printed URL
npm run build    # static build in dist/ (works from any folder or sub-path)
```

### How a table works

- You have **Hands** (default 6) and **Folds** (default 3) per table.
- Each hand is real blackjack against the dealer (dealer stands on 17, peeks for naturals).
- Winning (or tying) a hand **scores** it: `Chips × Mult`. The hand type sets the base
  values, each card adds its chips, then your Doodads fire left to right.
- Reach the table's target before you run out of hands.
- **Double Down** costs an extra hand and multiplies the hand's score (X2).
- **Split** a pair into two hands, at the cost of an extra hand.
- **Fold** throws a bad hand away *without* using up a hand. Folds are limited.
- Keys: `H` hit, `S` stand, `D` double, `P` split, `F` fold, `Space` deal.

### Hand types

| Hand | How |
| --- | --- |
| Lucky Sevens | Win with exactly three 7s |
| Royal Quackjack | A natural: Ace with a suited J/Q/K |
| Birds of a Feather | 21 with 3+ cards, all one suit |
| Quackjack | A natural blackjack |
| Charley Horse | 5 cards without busting (auto-win) |
| Dead Eye | Exactly 21 with 3+ cards |
| Underduck | Win with 14 or less |
| Quick Draw | Beat the dealer's total |
| Dealer Bites the Dust | The dealer busts |
| Standoff | Tie |

Tall Tales level these up.

## Content

- **Suits:** Horseshoes, Dynamite, Cacti and Sheriff Stars. Face cards are the Duckling
  Deputy, the Saloon Swan and the Sheriff Drake.
- **210 Doodads** (common / uncommon / rare / legendary): the Rubber Ducky, the
  Ten-Gallon Hat, Moneybags McDuck, Fastest Bill in the West, the Tin Foil Hat... Suit and
  rank synergies, scaling critters, money engines, rule-benders (bust at 22, 4-card
  Charley Horses, peek at the hole card, free doubles), copiers, and 8 legendaries.
- **24 Snake-Oil Tonics** (card magic), **10 Tall Tales** (hand upgrades), **18 jugs of
  Moonshine** (powerful, with a hangover).
- **38 Deeds**, permanent upgrades in tiered pairs.
- **25 Telegrams**, earned by skipping tables.
- **33 Outlaws**, including Mother Goose, the Poker-Faced Penguin, Taxman Toucan, and 6
  showdown bosses like the Golden Goose.
- **16 Decks** (starting decks) and **8 Wanted Levels**, from Greenhorn to Legend.
- 8 card **Paints**, 4 **Finishes** and 4 **Brands**.
- 15 Supply Crate types (normal / jumbo / mega).

## Under the hood

- TypeScript + Vite, no runtime framework. All game state is plain JSON and is saved to
  `localStorage` between hands.
- Visuals: a WebGL desert-sunset shader (banded sky, setting sun, layered mesas, blowing
  dust), canvas particle layers (tumbleweeds, drifting feathers, sparks, confetti), and CSS
  3D cards with tilt, shine and foil effects. All card and Doodad art is inline SVG.
- Audio is synthesised with WebAudio: banjo-ish plucks, clip-clop woodblocks, an Outlaw
  whistle, and real-time synthesised quacks and goose honks. No audio files.
- `npm test` runs unit tests plus dozens of headless seeded runs; `npm run sim -- 400`
  plays 400 bot runs and prints how far they got (used for balancing).
