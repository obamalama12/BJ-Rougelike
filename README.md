# Buck Ducks

A blackjack roguelike set in a frontier town full of ducks, geese and other birds.

You play a duck riding through seven towns. Each **Town** is a branching **trail** of stops:
card games, Doc Hoot's office, campfires and strange encounters. At the end of the trail you
play the town's **Outlaw**. Beat all seven Outlaws to win the run. After that you can keep
riding for as long as you last. Beat one of the Outlaw's gang and the trail forks into three unmarked paths,
and what you find down them shapes the run.

## Playing

```bash
npm install
npm run dev      # open the printed URL
npm run build    # static build in dist/ (works from any folder or sub-path)
npm run build:single  # one self-contained HTML file in dist-single/
```

### How it plays

- **Grit** is your health for the whole run (10 to start). The run ends at 0 Grit. Riding into
  a new town restores 2.
- **The trail.** Pick your next stop each step:
  - **Saloon Game** and **High Stakes** tables. High Stakes has a bigger target and a
    bigger payout.
  - **Bank Job**: a harder table under the town Outlaw's curse. Winning it pays out loot from the vault.
  - **Doc Hoot** (heal, or remove cards from your deck) and the **Campfire** (rest, level up
    a hand type, or sleep off one of your Banes).
  - **Gang Members**: twice in every town, a whole column of the map is the Outlaw's gang, so
    every route meets two of them. They're the Outlaw's henchmen and carry the boss's curse, so
    you get a taste of the showdown on the way. Beat one for a **Bounty** (the trail forks)
    and 1 Grit. There are 25 henchmen, and you won't meet the same one twice in a normal run.
    Some have a side ability of their own: Dusty Dan stands on all 17s.
  - **Strange Happenings**: 34 encounters with choices, including a quick-draw duel. You won't
    meet the same one twice in a run until you've seen them all.
  - The **Outlaw** at the end of the town: the only boss you meet there, shown on the Wanted
    poster. Outlaws come in tiers, and each town draws from a nastier tier than the last. Once in a
    while the Outlaw is **Woodgas** instead, who doesn't know how to play and keeps hitting until
    he busts. He's a 5% chance in town 1 and the chance halves every town (2.5%, 1.25%, ...),
    down to about 0.08% for the final showdown, and stays at 0.08% in endless mode. If you lose, you can try again as long as you
    have Grit left, and each retry's target is 15% lower.
- **Forks in the road.** Beat one of the Outlaw's gang (two per town) and choose one of three unmarked paths
  ("Follow the Buzzards", "Old Mine Shaft No. 9", "The Witch's Hollow"...). You only find out
  what was down there after you take it:
  - a **Boon**: an ability that helps (bonus Odds for a suit, an extra hand every table, bust
    over 22, see the dealer's hole card, a Hot Streak multiplier...);
  - a **Bane**: an ability that hurts (bust over 20, can't Double, every target 15% higher, the
    dealer draws to 18...);
  - or something that happens on the spot (a hidden stash of Bucks, a hot spring, an ambush,
    a pickpocket, rocks shuffled into your deck...).

  There are 100 paths. Which outcome waits on which path is shuffled by the run's seed, so the
  same seed always leads the same way. You carry up to **5 abilities**, Boons and Banes alike;
  when your belt is full, a new one must replace one you already have. Some encounters hand
  you a random Boon on the spot.
- **A table** is blackjack against a dealer, who stands on a hard 17 and hits a soft 17. You have a number of **Hands** and **Folds**.
  Reach the target score before you run out of hands, or you lose Grit.
- **Showdowns and celebrations.** Each town's Outlaw gets an entrance scene with their curse and
  a taunt. Beating them jails them, pins a sheriff badge on your 7-badge strip, and shows who's
  Wanted in the next town.
- **Choose your gunslinger.** The Kid (starts with a random Boon), Belle Starling (+$12 and
  richer side bets), Doc Hollandaise (+3 max Grit) or Calamity Hen (Hot Streak builds twice as
  fast). Your pick is your face on the map, in duels and in showdowns.
- **Hot Streak.** Win hands in a row for bonus Odds: x1.25 on the second win, up to x2. It
  carries between tables; a loss or bust puts it out, folds and ties don't.
- **Side bets.** Before each deal you can put $2 on Pair Up (pays $14), Suited ($6) or Dealer
  Busts ($6).
- **Wagers.** Before each deal, pick Penny (X1, safe), Dollar (X2, lose 1 Grit if you lose
  the hand) or Bankroll (X3, lose 2 Grit if you lose the hand).
- **Scoring.** A hand that wins or ties scores **Pot** X **Odds**. The hand type sets the
  starting Pot and Odds, each scored card adds its value to the Pot, then your abilities apply
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
- **100 paths** hiding **51 Boons**, **33 Banes** and **16 on-the-spot events** (7 good, 9 bad),
  all in `src/content/paths.ts`.
- **Tonics** (change cards), **10 Tall Tales** (level up hand types) and **Moonshines**
  (strong effects with a cost), found on the trail and in Crates from Telegrams.
- **Telegrams**: small rewards from encounters.
- **20 trail encounters** and a quick-draw duel minigame.
- **40 illustrated characters**. Every dealer and Outlaw has a face that reacts to your play.
- **41 Outlaws**, including Mother Goose, the Poker-Faced Penguin and Taxman Toucan, plus
  6 final Outlaws such as the Golden Goose.
- **16 Decks** to start with and **8 Wanted Levels** of difficulty, from Greenhorn to Legend.
- 8 card **Inks**, 4 **Finishes** and 4 **Brands**.
- Crates of Tonics, Tall Tales and Moonshine (normal, jumbo, mega). Your deck never grows during
  a run: rewards change cards you already hold (ink them, reprint them) instead of adding new ones.

## Under the hood

- TypeScript + Vite, no runtime framework. All game state is plain JSON and is saved to
  `localStorage` between hands.
- Visuals: a WebGL desert-sunset shader (banded sky, setting sun, layered mesas, blowing
  dust), canvas particle layers (tumbleweeds, feathers, sparks, confetti), and CSS
  3D cards with tilt, shine and foil effects. All card and ability art is inline SVG.
- Audio is synthesised with WebAudio: banjo plucks, woodblock hoofbeats, an Outlaw whistle,
  and quacks and goose honks. There are no audio files.
- `npm test` runs unit tests plus dozens of headless seeded runs; `npm run sim -- 400`
  plays 400 bot runs and prints how far they got (used for balancing). `npm run balance -- 2000`
  breaks the same bot runs down by town, table kind and Outlaw, and `npm run probe` ranks every
  Outlaw's curse under identical conditions (that ranking sets the tiers in `content/hosts.ts`).
  `BOT=smart npm run balance -- 200` uses the smarter bot in `scripts/smartbot.ts`, which picks
  paths blind like anyone, but tests which ability to leave behind with practice hands, sheds
  Banes at the campfire, picks tables it can beat and only wagers big when it's behind.
