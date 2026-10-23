# Buck Ducks

A blackjack roguelike set in a frontier town full of ducks, geese and other birds.

You play a duck riding through seven towns. Each **Town** is a branching **trail** of stops:
card games, the General Store, Doc Hoot's office, campfires and strange encounters. At the
end of the trail you play the town's **Outlaw**. Beat all seven Outlaws to win the run. After
that you can keep riding for as long as you last.

## Playing

```bash
npm install
npm run dev      # open the printed URL
npm run build    # static build in dist/ (works from any folder or sub-path)
npm run build:single  # one self-contained HTML file in dist-single/
```

### How it plays

- **Grit** is your health for the whole run (10 to start). The run ends at 0 Grit.
- **The trail.** Pick your next stop each step:
  - **Saloon Game** and **High Stakes** tables. High Stakes has a bigger target and a
    bigger payout.
  - **Bank Job**: a harder table with an Outlaw's curse and a rare Doodad as the prize.
  - **General Store** (the shop), **Doc Hoot** (heal, or remove cards from your deck),
    **Campfire** (rest, level up a hand type, or polish a Doodad).
  - **Strange Happenings**: 20 encounters with choices, including a quick-draw duel.
  - The **Outlaw** at the end of the town. If you lose, you can try again as long as you
    have Grit left.
- **A table** is blackjack against a dealer. You have a number of **Hands** and **Folds**.
  Reach the target score before you run out of hands, or you lose Grit.
- **Wagers.** Before each deal, pick Penny (X1, safe), Dollar (X2, lose 1 Grit if you lose
  the hand) or Bankroll (X3, lose 2 Grit if you lose the hand).
- **Scoring.** A hand that wins or ties scores **Pot** X **Odds**. The hand type sets the
  starting Pot and Odds, each scored card adds its value to the Pot, then your Doodads apply
  from left to right.
- **Money** is **Bucks** ($). You earn them by winning tables, plus interest on what you hold.
- **Double Down** costs an extra hand and doubles the hand's score. **Split** a pair at the
  cost of an extra hand. **Fold** throws a hand away without using up a hand.
- Keys: `H` hit, `S` stand, `D` double, `P` split, `F` fold, `Space` deal.

### Hand types

| Hand | How to make it |
| --- | --- |
| Lucky Sevens | Win with exactly three cards, all 7s |
| Royal Quackjack | A natural made of an Ace and a J, Q or K of the same suit |
| Birds of a Feather | Win with exactly 21 using 3+ cards, all of one suit |
| Quackjack | A natural: 21 with your first two cards |
| Charley Horse | Hold 5 cards without busting. Wins automatically |
| Dead Eye | Win with exactly 21 using 3+ cards |
| Underduck | Win with a total of 14 or less |
| Quick Draw | Beat the dealer with a total of 15 to 20 |
| Dealer Bites the Dust | The dealer busts while you hold 15 to 20 |
| Standoff | Tie the dealer's total |

Tall Tales level these up.

## Content

- **Suits:** Horseshoes, Dynamite, Cacti and Stars. The face cards are the Duckling
  Deputy (J), the Saloon Swan (Q) and the Sheriff Drake (K).
- **217 Doodads** (common, uncommon, rare, legendary), worn in your bandolier. Examples:
  the Ten-Gallon Hat, Moneybags McDuck, the Tin Foil Hat. They cover suit and rank bonuses,
  Doodads that grow over time, money makers, rule changes (bust at 22, 4-card Charley
  Horses, see the dealer's hole card, free doubles), copiers, and 8 legendaries.
- **24 Tonics** (change cards), **10 Tall Tales** (level up hand types) and **18
  Moonshines** (strong effects with a cost).
- **38 Deeds**: permanent upgrades from the General Store, in pairs where the second needs
  the first.
- **25 Telegrams**: small rewards for skipping a table.
- **20 trail encounters** and a quick-draw duel minigame.
- **40 illustrated characters**. Every dealer and Outlaw has a face that reacts to your play.
- **33 Outlaws**, including Mother Goose, the Poker-Faced Penguin and Taxman Toucan, plus
  6 final Outlaws such as the Golden Goose.
- **16 Decks** to start with and **8 Wanted Levels** of difficulty, from Greenhorn to Legend.
- 8 card **Inks**, 4 **Finishes** and 4 **Brands**.
- 15 kinds of Crate (normal, jumbo, mega).

## Under the hood

- TypeScript + Vite, no runtime framework. All game state is plain JSON and is saved to
  `localStorage` between hands.
- Visuals: a WebGL desert-sunset shader (banded sky, setting sun, layered mesas, blowing
  dust), canvas particle layers (tumbleweeds, feathers, sparks, confetti), and CSS
  3D cards with tilt, shine and foil effects. All card and Doodad art is inline SVG.
- Audio is synthesised with WebAudio: banjo plucks, woodblock hoofbeats, an Outlaw whistle,
  and quacks and goose honks. There are no audio files.
- `npm test` runs unit tests plus dozens of headless seeded runs; `npm run sim -- 400`
  plays 400 bot runs and prints how far they got (used for balancing).
