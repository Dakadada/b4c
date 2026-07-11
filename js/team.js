import { BEADS_BY_ID } from './beads.js';
import { swatchStyle } from './builder.js';

// ⚠️ Placeholder people — edit this array only; the page renders itself.
// `beadId` picks the member's avatar bead (any id from js/beads.js).
const TEAM = [
  { name: 'Ava Chen', role: 'Founder', line: 'Started Brace4Change from her kitchen table with a bag of beads and a bus pass.', beadId: 'garnet' },
  { name: 'Maya Okafor', role: 'Co-founder', line: 'Keeps the twin of every bracelet honest — same beads, same order, every time.', beadId: 'gold' },
  { name: 'Liam Torres', role: 'Bead lead', line: 'Sorts, counts, and restocks every finish. Knows the kaleidoscopics by heart.', beadId: 'oil-slick' },
  { name: 'Noah Patel', role: 'Bead lead', line: 'Strings the fastest, checks the knots twice.', beadId: 'copper' },
  { name: 'Ella Nguyen', role: 'Notes lead', line: 'Reads every handwritten note before it ships. Keeps the pens stocked.', beadId: 'ivory-pearl' },
  { name: 'Sofia Reyes', role: 'Note writer', line: 'Has written more encouragement than anyone we know.', beadId: 'blush-pearl' },
  { name: 'Jack Miller', role: 'Deliveries', line: 'Walks the twins and their notes to nursing homes across Des Moines.', beadId: 'cornflower' },
  { name: 'Grace Kim', role: 'Deliveries', line: 'Coordinates with shelters so every bracelet lands on the right wrist.', beadId: 'seafoam-pearl' },
  { name: 'Omar Hassan', role: 'Outreach', line: 'Answers the DMs. If you ordered, you probably talked to Omar.', beadId: 'peacock' },
  { name: 'Ruby Larson', role: 'Volunteer coordinator', line: 'Turns first-time stringers into regulars, one Saturday at a time.', beadId: 'honey' },
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
