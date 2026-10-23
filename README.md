# Buck Ducks

A blackjack roguelike of the duck frontier.

You're a drifter duck riding through seven frontier towns. Each **Town** is a branching
**trail**: pick your route between card games, the General Store, the Doc, campfires and
strange encounters, then face the town's **Outlaw** in a showdown at the end. Beat all seven
Outlaws and you're the Fastest Bill in the West. After that the trail goes on forever.

## Playing

```bash
npm install
npm run dev      # open the printed URL
npm run build    # static build in dist/ (works from any folder or sub-path)
npm run build:single  # one self-contained HTML file in dist-single/
```

### How it plays

- **Grit** is your health for the whole run (10 horseshoes). The run ends at 0 Grit.
- **The trail.** Choose your next stop each step:
  - **Saloon Game** and **High Stakes** tables (bigger target, bigger purse).
  - **Bank Job**: an elite table with an Outlaw's curse and a rare Doodad as loot.
  - **General Store** (shop), **Doc's Office** (heal, remove cards), **Campfire** (rest,
    level up a hand, or whittle a Doodad shiny).
  - **Strange Happenings**: 20 encounters with choices, including a Quick-Draw duel.
  - The **Showdown** with the town's Outlaw. Lose it and you can try again, if you have
    the Grit.
- **A table** is real blackjack against a dealer who reacts to every hand. You have
  **Hands** (bullets in your revolver) and **Folds**. Reach the target on the wanted poster
  before you run out of hands, or lose Grit.
- **Wagers.** Before each deal pick Penny (X1, safe), Dollar (X2, lose 1 Grit if you lose
  the hand) or Bankroll (X3, lose 2 Grit).
- **Scoring.** Winning (or tying) a hand builds a **Pot** of chips times the **Odds**. The
  hand type sets the base values, each card adds to the pot, then your Doodads fire left to
  right along your bandolier.
- **Double Down** costs an extra hand and multiplies the hand's score (X2). **Split** a pair
  at the cost of an extra hand. **Fold** throws a bad hand away *without* using up a hand.
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
- **217 Doodads** (common / uncommon / rare / legendary): the Rubber Ducky, the
  Ten-Gallon Hat, Moneybags McDuck, Fastest Bill in the West, the Tin Foil Hat... Suit and
  rank synergies, scaling critters, money engines, rule-benders (bust at 22, 4-card
  Charley Horses, peek at the hole card, free doubles), copiers, and 8 legendaries.
- **24 Snake-Oil Tonics** (card magic), **10 Tall Tales** (hand upgrades), **18 jugs of
  Moonshine** (powerful, with a hangover).
- **38 Deeds**, permanent upgrades in tiered pairs.
- **25 Telegrams**, earned on the trail.
- **20 trail encounters** and a Quick-Draw duel minigame.
- **40 illustrated characters**: every dealer and Outlaw has a face that reacts to your play.
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
