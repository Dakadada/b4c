import { BEADS_BY_ID } from './beads.js';

// ⚠️ Placeholder people — edit this array only; the page renders itself.
// `beadId` picks the member's avatar bead (any id from beads.js).
const TEAM = [
  { name: 'Srihari Kumaresan', role: 'Founder', line: 'Started Brace4Change from his kitchen table with a bag of beads', beadId: 'garnet' },
  { name: 'Savi Reddy', role: 'Co-founder', line: 'Keeps the twin of every bracelet honest.', beadId: 'gold' },
  { name: 'Quinnlyn Schulte', role: 'Management', line: 'Knows the kaleidoscopics by heart.', beadId: 'oil-slick' },
  { name: 'Chloe Kiekhafer', role: 'Bead lead', line: 'Strings the fastest.', beadId: 'copper' },
  { name: 'Linda Lu', role: 'Headbeader', line: 'Sorts, counts, and restocks every finish.', beadId: 'ivory-pearl' },
  { name: 'Zoe Studer', role: 'Note boss', line: 'Has written more encouragement than anyone we know.', beadId: 'blush-pearl' },
  { name: 'Elle Behn', role: 'Notetaker', line: 'Walks the twins and their notes to nursing homes across Des Moines.', beadId: 'cornflower' },
  { name: 'Brianna Launderville', role: 'Notary', line: 'Coordinates with shelters so every bracelet lands on the right wrist.', beadId: 'seafoam-pearl' },
  { name: 'Adino Dyett', role: 'Outreach', line: 'the goat?', beadId: 'peacock' },
];

const grid = document.getElementById('team-grid');
TEAM.forEach((member) => {
  const card = document.createElement('article');
  const avatar = document.createElement('span');
  avatar.className = 'team-avatar';
  avatar.style.background = BEADS_BY_ID[member.beadId].color;
  avatar.setAttribute('aria-hidden', 'true');
  const name = document.createElement('h3');
  name.textContent = member.name;
  const role = document.createElement('p');
  role.className = 'team-role';
  role.textContent = member.role;
  const line = document.createElement('p');
  line.textContent = member.line;
  card.append(avatar, name, role, line);
  grid.appendChild(card);
});
