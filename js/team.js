import { BEADS_BY_ID } from './beads.js';
import { swatchStyle } from './builder.js';

// ⚠️ Placeholder people — edit this array only; the page renders itself.
// `beadId` picks the member's avatar bead (any id from js/beads.js).
const TEAM = [
  { name: 'Srihari Kumaresan', role: 'Founder', line: 'Started Brace4Change from his kitchen table with a bag of beads', beadId: 'garnet' },
  { name: 'Savi Reddy', role: 'Co-founder', line: 'Keeps the twin of every bracelet honest — same beads, same order, every time.', beadId: 'gold' },
  { name: 'Quinnlyn Schulte', role: 'Management', line: 'Knows the kaleidoscopics by heart.', beadId: 'oil-slick' },
  { name: 'Chloe Kiekhafer', role: 'Bead lead', line: 'Strings the fastest, checks the knots twice.', beadId: 'copper' },
  { name: 'Linda Lu', role: 'Bead lead', line: 'Sorts, counts, and restocks every finish.', beadId: 'ivory-pearl' },
  { name: 'Zoe Studer', role: 'Notes', line: 'Has written more encouragement than anyone we know.', beadId: 'blush-pearl' },
  { name: 'Elle Behn', role: 'Notes', line: 'Walks the twins and their notes to nursing homes across Des Moines.', beadId: 'cornflower' },
  { name: 'Brianna Launderville', role: 'Notes', line: 'Coordinates with shelters so every bracelet lands on the right wrist.', beadId: 'seafoam-pearl' },
  { name: 'Adino Dyett', role: 'Outreach', line: 'the goat?', beadId: 'peacock' },
  { name: 'Aadil Patel', role: 'Outreach', line: 'Turns first-time stringers into regulars, one Saturday at a time.', beadId: 'honey' },
];

const grid = document.getElementById('team-grid');
TEAM.forEach((member) => {
  const card = document.createElement('article');
  card.className = 'flex flex-col items-start gap-4 border-t border-pewter pt-6';
  const avatar = document.createElement('span');
  avatar.className = 'team-avatar';
  avatar.style.cssText = swatchStyle(BEADS_BY_ID[member.beadId]);
  avatar.setAttribute('aria-hidden', 'true');
  const name = document.createElement('h3');
  name.className = 'font-display text-2xl';
  name.textContent = member.name;
  const role = document.createElement('p');
  role.className = 'font-mono text-xs uppercase tracking-widest text-garnet';
  role.textContent = member.role;
  const line = document.createElement('p');
  line.className = 'text-sm leading-relaxed text-ink/60';
  line.textContent = member.line;
  card.append(avatar, name, role, line);
  grid.appendChild(card);
});

document.getElementById('year').textContent = new Date().getFullYear();
