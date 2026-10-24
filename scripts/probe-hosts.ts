// Ranks every Outlaw by how hard their curse is: forces one Outlaw onto towns 2-5 of many
// bot runs and records how often the bot gets through those towns.
// Usage: npm run probe -- [runs per Outlaw]

import { HOSTS } from '../src/content/hosts';

process.env.SIM_LIB = '1';
const { simulate } = await import('./simulate');

const N = Number(process.argv[2] ?? 200);
const rows: [string, string, number, number, boolean][] = [];
for (const h of HOSTS) {
  let through = 0;
  let tables = 0;
  let tablesWon = 0;
  for (let i = 0; i < N; i++) {
    const r = simulate(`PROBE${i}`, 'paper', 1, h.id);
    if (r.won || r.night > 5) through++;
    for (const t of (r.run as any).__log.tables) if (t.night >= 2 && t.night <= 5 && t.host === h.id) { tables++; if (t.won) tablesWon++; }
  }
  rows.push([h.id, h.name, through / N, tablesWon / Math.max(1, tables), !!h.showdown]);
}
rows.sort((a, b) => a[2] - b[2]);
for (const [id, name, through, tw, sd] of rows)
  console.log(`${name.padEnd(22)} ${id.padEnd(13)} survive towns 2-5: ${(through * 100).toFixed(0).padStart(3)}%   cursed tables won: ${(tw * 100).toFixed(0).padStart(3)}%${sd ? '  (showdown)' : ''}`);
