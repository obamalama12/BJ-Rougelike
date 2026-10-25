// Balance report: runs the simulate.ts bot many times and breaks results down by town,
// table kind and Outlaw. Usage: npm run balance -- [runs] [shoe] [stake]

import type { TableLog } from './simulate';
import { NIGHTS } from '../src/game/engine';
import { HOST } from '../src/content/hosts';

process.env.SIM_LIB = '1';
const { simulate } = await import('./simulate');
const { smartStrategy } = await import('./smartbot');
/** BOT=smart plays with the Doodad-testing bot instead of the basic one. */
const bot = process.env.BOT === 'smart' ? smartStrategy : undefined;

const N = Number(process.argv[2] ?? 1000);
const shoe = process.argv[3] ?? 'paper';
const stake = Number(process.argv[4] ?? 1);

let wins = 0;
const reached = new Array(NIGHTS + 2).fill(0);
const died = new Array(NIGHTS + 2).fill(0);
const byKind: Record<string, { n: number; won: number; ratio: number }> = {};
const byHost: Record<string, { n: number; won: number; town: number[] }> = {};
const killers: Record<string, number> = {};

for (let i = 0; i < N; i++) {
  const r = simulate(`BAL${i}`, shoe, stake, undefined, bot);
  if (r.won) wins++;
  for (let t = 1; t <= Math.min(r.night, NIGHTS); t++) reached[t]++;
  if (!r.won) died[r.night]++;
  const tables: TableLog[] = (r.run as any).__log.tables;
  for (const t of tables) {
    const k = `${t.night}:${t.kind}`;
    const e = (byKind[k] ??= { n: 0, won: 0, ratio: 0 });
    e.n++;
    if (t.won) e.won++;
    e.ratio += t.score / t.target;
    if (t.kind === 'host' && t.host) {
      const h = (byHost[t.host] ??= { n: 0, won: 0, town: [] });
      h.n++;
      if (t.won) h.won++;
      h.town.push(t.night);
    }
  }
  const last = tables[tables.length - 1];
  if (!r.won && last) killers[`${last.kind}${last.host ? ':' + last.host : ''}`] = (killers[`${last.kind}${last.host ? ':' + last.host : ''}`] ?? 0) + 1;
}

const pct = (a: number, b: number) => (b ? ((100 * a) / b).toFixed(0).padStart(3) + '%' : '   -');
console.log(`${N} runs (${process.env.BOT === 'smart' ? 'smart' : 'basic'} bot, ${shoe}, stake ${stake}): ${wins} wins = ${((100 * wins) / N).toFixed(1)}%`);
console.log('\nTown  reached  died-here  (death rate)');
for (let t = 1; t <= NIGHTS; t++) console.log(`  ${t}   ${String(reached[t]).padStart(6)}  ${String(died[t]).padStart(8)}   ${pct(died[t], reached[t])}`);
console.log('\nTable win rate by town (score/target avg)');
const kinds = ['paper', 'silk', 'bank', 'gang', 'host'];
console.log('Town ' + kinds.map((k) => k.padStart(14)).join(''));
for (let t = 1; t <= NIGHTS; t++) {
  console.log(`  ${t}  ` + kinds.map((k) => {
    const e = byKind[`${t}:${k}`];
    return (e ? `${pct(e.won, e.n)} (${(e.ratio / e.n).toFixed(2)})` : '-').padStart(14);
  }).join(''));
}
console.log('\nOutlaw showdowns (attempts incl. retries)');
for (const [id, h] of Object.entries(byHost).sort((a, b) => a[1].won / a[1].n - b[1].won / b[1].n)) {
  const avgTown = h.town.reduce((a, b) => a + b, 0) / h.town.length;
  console.log(`  ${(HOST[id]?.name ?? id).padEnd(22)} ${pct(h.won, h.n)} of ${String(h.n).padStart(4)}  avg town ${avgTown.toFixed(1)}`);
}
console.log('\nWhat ended runs');
for (const [k, v] of Object.entries(killers).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${k.padEnd(28)} ${v}`);
