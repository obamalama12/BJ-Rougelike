// What happens down each road: the little scene that plays after you pick a path, before you
// learn what it left you with. One entry per outcome in paths.ts. A scene is a reusable animated
// "beat" (src/ui/cutscene.ts draws them) plus a line of narration; `actor` is who shows up for
// beats that bring someone along (a stranger, a bandit...), and `prop` overrides the icon that
// appears at the climax (it defaults to the outcome's own icon).

export type Beat =
  | 'treasure' // something glints in the dirt and you dig it up
  | 'stranger' // someone walks up and hands you something
  | 'campfire' // a fire in the dark, a story, a song
  | 'star' // something falls out of the sky
  | 'cards' // a card game by the roadside
  | 'storm' // the sky turns on you
  | 'ambush' // somebody jumps out from behind a rock
  | 'snake' // something bites
  | 'ghost' // something not quite there
  | 'stampede' // hooves, lots of them
  | 'water' // a river, a spring, a well
  | 'thief'; // a hand in your pocket

export interface SceneDef {
  beat: Beat;
  line: string;
  actor?: string;
  prop?: string;
}

const S = (beat: Beat, line: string, extra: Partial<SceneDef> = {}): SceneDef => ({ beat, line, ...extra });

export const SCENES: Record<string, SceneDef> = {
  // --- Boons ----------------------------------------------------------------------------------
  steady_hand: S('stranger', 'An old gunslinger watches you shuffle, grunts, and shows you how to hold the deck so it stops shaking.', { actor: 'cowboyhat' }),
  sharp_eye: S('stranger', 'A squinting prospector looks you up and down, then hands over his brass spyglass. “You’ll need it more’n me.”', { actor: 'goldpan' }),
  horseshoe_luck: S('treasure', 'Something glints in the dust: a horseshoe, points up, still warm. You nail it to your saddle.'),
  dynamite_touch: S('treasure', 'You trip over a crate stamped DANGER. Inside, wrapped in straw, is the steadiest stick of dynamite you ever saw.'),
  cactus_kin: S('stranger', 'A wise old saguaro (it talks, don’t ask) decides you’re family and shares its secret.', { actor: 'cactus' }),
  lawmans_luck: S('treasure', 'Half buried in the sand: a tin star. The sheriff who lost it won’t be needing it.'),
  face_reader: S('cards', 'A riverboat gambler teaches you to read a face across the table. Kings blink first.'),
  ace_up_sleeve: S('cards', 'A card sharp gets bored, shows you his favourite trick, and forgets to take the Ace back.'),
  small_change: S('treasure', 'A torn coin purse spills pennies, nickels and dimes across the trail. Small, but it adds up.'),
  natural_talent: S('star', 'A shooting star falls right at your feet, and for a moment every card in the deck feels like a natural.'),
  five_card_fever: S('cards', 'Five cowpokes at a roadside table teach you a game where five cards always beats the house.'),
  dead_eye_aim: S('stranger', 'A one-eyed sharpshooter shoots a coin out of the air, then shows you how. Twenty-one, every time.', { actor: 'revolver' }),
  underdog_spirit: S('campfire', 'Around the fire, a scrawny coyote tells how he beat a grizzly at poker. You believe every word.'),
  iron_nerve: S('stranger', 'A grizzled marshal looks you in the eye until you stop flinching. Then he nods. “Good.”', { actor: 'badge' }),
  quick_feet: S('stranger', 'A roadrunner races you to the next post and loses on purpose, so you learn how to get out of trouble fast.', { actor: 'roadrunner' }),
  gamblers_grin: S('cards', 'You double down on a whim with a stranger and win his lucky dice. He laughs harder than you do.'),
  long_reach: S('treasure', 'A coiled lasso hangs on a dead branch. With it, you can reach one card further than anybody.'),
  quick_draw: S('stranger', 'An old gunslinger shows you how to clear leather before the other fella blinks. Fast hands win fast.', { prop: 'revolver' }),
  rabbits_foot: S('stranger', 'A tinker with a twinkle in his eye presses something soft into your palm. “Rub it when it all goes wrong. Once. Only once.”', { prop: 'clover' }),
  monkey_business: S('ghost', 'A monkey in a tiny hat drops from a tree, chattering. It swipes your bandana, then leaves something behind: a grin, and a little of its madness.', { prop: 'monkey' }),
  gamblers_glass: S('treasure', 'A gambler’s monocle, gold-rimmed, half-buried in the sand. Look through it and the backs of cards go thin as paper. Three looks, maybe, before it cracks.', { prop: 'eye' }),
  sidewinder: S('snake', 'A sidewinder slithers right past your boot without biting, then turns back like it’s sizing up the dealer for you.'),
  card_counter: S('cards', 'A schoolmarm with a slate keeps count of every card that’s been played. She lets you copy her method.'),
  hot_streak: S('campfire', 'You poke the fire and it roars up. Every spark lands closer than the last. Your luck’s heating up.'),
  gold_tooth: S('treasure', 'A gold tooth shines in the dirt. You don’t ask whose. Folks seem to pay you better with it in.'),
  thick_hide: S('stampede', 'A stampede thunders straight over you. When the dust clears you get up, slap your hat, and feel nothing.'),
  second_wind: S('ghost', 'You fall off your horse, flat on your back. A cool breeze lifts you up, and you get a second wind.'),
  big_spender: S('cards', 'A banker in a top hat loses a hand to you and tips you off: money talks, and it’s on your side now.'),
  patience: S('campfire', 'You wait out a whole night by the fire, and by dawn you know exactly when to fold ’em.'),
  last_stand: S('ambush', 'Bandits pin you down behind a rock. You fire your last bullet, and it’s the one that counts.', { actor: 'bandana' }),
  first_blood: S('stranger', 'A duellist teaches you to draw before the other fella’s finished blinking.', { actor: 'revolver' }),
  birds_of_a_feather: S('star', 'A flock of birds wheels overhead, every one the same colour. One feather drifts down to you.'),
  rainbow_trail: S('storm', 'A storm rolls through, and when it passes a rainbow lands right on the trail ahead of you.'),
  full_saddlebags: S('treasure', 'An abandoned mule stands by the road with saddlebags full to bursting. It follows you home.'),
  two_of_a_kind: S('stranger', 'Two identical twin ducks tip their hats at you. “Two’s company,” they say together.', { actor: 'duckling' }),
  trigger_happy: S('ambush', 'A rattlesnake hisses, and before you can think you’ve fired six times. Your trigger finger’s gone lively.', { actor: 'snake' }),
  stand_tall: S('stranger', 'A tall heron looks down at you and says, “Some hands you just stand on.” You start standing taller.', { actor: 'heron' }),
  tall_tale_teller: S('campfire', 'You tell a tall tale by the fire and the whole camp believes it. Word will travel.'),
  campfire_stories: S('campfire', 'Every night by the fire, the old-timers tell you about the hands they won. You start winning them too.'),
  docs_friend: S('stranger', 'Doc Hoot’s brother runs the next stage stop. He promises to patch you up whenever you ride through.', { actor: 'tonic' }),
  iron_gizzard: S('water', 'You drink from a rusty creek that would kill a horse. Instead your gizzard turns to iron.'),
  shrine_guardian: S('stranger', 'A tired old sheriff signs a pardon with your name on it. “No Outlaw’s curse will stick to you now.”', { actor: 'badge' }),
  lucky_sevens: S('cards', 'A slot machine in a ghost saloon rattles to life: seven, seven, seven.'),
  even_steven: S('stranger', 'A fussy accountant insists everything come out even. Somehow, for you, it does.', { actor: 'book' }),
  odd_job: S('stranger', 'An odd fellow offers you an odd job. It pays oddly well.', { actor: 'tophat' }),
  lazy_dealer: S('cards', 'You find a dealer asleep at a roadside table. You let him sleep. He’ll stop early from now on.'),
  high_noon: S('stranger', 'At high noon the sun stands straight overhead and a rival duellist turns tail. Twenty is your number now.', { actor: 'sun' }),
  peacemaker: S('stranger', 'You talk two feuding families into a handshake. Ties go your way now.', { actor: 'heart' }),
  insurance_man: S('stranger', 'An insurance salesman sells you a policy you can actually use. First time for everything.', { actor: 'umbrella' }),
  split_decision: S('stranger', 'A fork-tongued lawyer argues both sides of a case and wins twice. You learn a thing or two.', { actor: 'scissors' }),
  low_profile: S('ghost', 'Fog rolls in and swallows you whole. When it lifts, nobody remembers your face.'),
  shield_of_dawn: S('treasure', 'A crate of tinfoil from a crashed weather balloon. You fold yourself a hat. Curses bounce right off.'),
  deep_pockets: S('stranger', 'A tailor sews your pockets twice as deep. Every win leaves a little extra in them.', { actor: 'needle' }),
  growing_legend: S('campfire', 'Somebody by the fire is already singing a song about you. It gets a verse longer every town.'),

  // --- Banes ----------------------------------------------------------------------------------
  shaky_hands: S('ghost', 'You spend the night in a haunted cabin. Something taps your shoulder. Your hands haven’t stopped shaking since.'),
  butterfingers: S('thief', 'You reach for your saddlebag and drop half your ammunition down a crack in the rocks.', { prop: 'hand' }),
  cold_feet: S('water', 'You wade into an icy river and lose a boot to the current. Your feet never quite warm up.'),
  short_fuse: S('ambush', 'A stick of dynamite goes off too early. Your temper’s been short ever since.', { actor: 'dynamite' }),
  squinting: S('storm', 'A dust storm hits head on. By the time it passes, you can barely see the dealer’s cards.'),
  chicken_heart: S('ghost', 'A shadow jumps out of the dark and you scream like a chicken. Your nerve stays gone.'),
  stuck_together: S('water', 'You fall into a molasses spill. Your cards stick together for good.'),
  jinxed_horseshoes: S('snake', 'You pick up a horseshoe, points down. Everybody knows that’s bad luck.', { prop: 'horseshoe' }),
  wet_powder: S('storm', 'A cloudburst soaks you to the bone, and your gunpowder with it.'),
  greedy_dealer: S('cards', 'A greedy dealer takes a shine to your purse and decides he’ll keep drawing till he gets it.'),
  soft_spot: S('cards', 'A sweet-talking dealer gets in your head. Every soft hand feels like a sure thing now, and pays like it isn’t.'),
  hanging_judge: S('stranger', 'A hanging judge looks over his spectacles at you. “Any tie, you lose. Court adjourned.”', { actor: 'jail' }),
  toll_road: S('stranger', 'A toad in a booth blocks the road. “Toll’s a dollar a step, partner.”', { actor: 'coin' }),
  tax_man: S('stranger', 'The tax man rides up with a ledger and a smile. He’ll be taking his cut every hand.', { actor: 'scroll' }),
  stage_fright: S('ghost', 'You walk into an empty theatre and the curtain rises on you. You freeze. Now you freeze every first hand.'),
  weak_knees: S('stampede', 'A runaway wagon nearly flattens you. Your knees still go wobbly when it counts.'),
  stingy_luck: S('thief', 'A miser hexes you for stepping on his shadow. Your luck goes tight-fisted.', { prop: 'piggybank' }),
  ace_allergy: S('snake', 'A scorpion stings you right on the Ace of spades in your pocket. You’ve been allergic to Aces since.', { prop: 'scorpion' }),
  lead_boots: S('water', 'You slog through a mud flat and come out with boots heavy as lead.'),
  bad_reputation: S('stranger', 'Somebody’s nailed a poster with your face on it to every post. Folks won’t give you credit for anything.', { actor: 'wanted' }),
  leaky_pockets: S('thief', 'A cactus spine pokes a hole in your pocket. Coins start trickling out with every step.', { prop: 'coin' }),
  fading_memory: S('ghost', 'You drink from a well that makes you forget. Your best tricks start slipping away.'),
  hangover: S('campfire', 'The campfire crowd passes you a jug of rotgut. You wake up feeling like you lost a fight with a mule.', { prop: 'jug' }),
  wanted_poster: S('stranger', 'A deputy pins a fresh Wanted poster to a fence post. It’s you. Everyone’s going to play you harder now.', { actor: 'wanted' }),
  gun_jam: S('ambush', 'You go for your gun and it jams solid. You can’t back out of anything now.', { actor: 'revolver' }),
  restless: S('storm', 'The wind won’t stop howling, and neither will the itch to take one more card.'),
  fools_gold: S('treasure', 'You dig up a nugget the size of an egg. It’s fool’s gold. You are the fool.', { prop: 'nugget' }),
  glass_jaw: S('ambush', 'A bandit pops you once on the chin and something goes crack. It’s never been the same.', { actor: 'fist' }),
  heavy_saddle: S('treasure', 'You find a solid iron saddle and, like a fool, you keep it. It takes up twice the room.', { prop: 'anvil' }),
  bad_company: S('campfire', 'You share a fire with a rough crowd. Word gets back to the Outlaw, and he doesn’t like it.', { prop: 'skull' }),
  lonely_road: S('ghost', 'Miles of nothing. No birds, no wind, no company. Big hands start feeling awful lonely.'),
  cursed_aces: S('ghost', 'An old witch reads your cards and scowls at every Ace. “Those are cursed now, dearie.”'),
  tin_ear: S('storm', 'A thunderclap right overhead leaves your ears ringing. You can’t hear the dealer bust anymore.'),

  // --- On the spot ------------------------------------------------------------------------------
  hidden_stash: S('treasure', 'Your horse kicks over a rock, and under it is an old coffee tin stuffed with banknotes.'),
  hot_spring: S('water', 'Steam curls off a hidden hot spring. You soak until every ache floats away.'),
  old_almanac: S('treasure', 'A dog-eared almanac in a dead man’s saddlebag. Half of it is about card games.'),
  kind_stranger: S('stranger', 'A kind old hen waves you over to her wagon and shares her supper and a few coins.', { actor: 'chicken' }),
  lucky_aces: S('treasure', 'Two Aces lie face up in the dirt, side by side. You swap your two worst cards for them.', { prop: 'cards' }),
  thin_the_herd: S('campfire', 'You go through your deck by the fire and toss the worst cards into the flames.'),
  tougher_hide: S('stampede', 'A bull charges you head on. You plant your feet, and the bull bounces off.'),
  ambush: S('ambush', 'Bandits jump out from behind the rocks and give you a proper going-over before you can draw.', { actor: 'bandana' }),
  pickpocket: S('thief', 'A friendly fella bumps into you, says sorry, and walks off with half your Bucks.', { prop: 'moneybag' }),
  rockslide: S('stampede', 'A rumble overhead, and then half the mountain comes down the slope at you.', { prop: 'rock' }),
  water_damage: S('water', 'You ford a river that turns out deeper than it looked. Your best cards come out the other side soggy and warped.'),
  stampede: S('stampede', 'A herd of longhorns tramples straight through camp. Two of your best cards don’t make it.'),
  bad_water: S('water', 'The well water tastes funny. By morning you know it was worse than funny.'),
  word_gets_around: S('stranger', 'A gossiping magpie flies ahead of you, telling everyone you’re coming.', { actor: 'magpie' }),
  snake_oil: S('stranger', 'A fast-talking salesman sells you a bottle of Miracle Tonic. It’s coloured water.', { actor: 'tonic' }),
  lost_trail: S('storm', 'A sandstorm wipes out the trail. You spend a whole day riding in circles.'),
};
