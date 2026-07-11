import { BEADS_BY_ID, CATEGORIES, SLOT_COUNT, UNIT_PRICE } from './beads.js';
import { subscribe, getState } from './builder.js';

export const INSTAGRAM_HANDLE = 'brace4change';

const money = (n) => `$${n.toFixed(2)}`;

function designLines(slots) {
  const filled = slots.filter(Boolean);
  if (filled.length === 0) return ['  (no beads yet — surprise us!)'];
  const lines = [];
  CATEGORIES.forEach((cat) => {
    const counts = {};
    filled.forEach((id) => {
      const bead = BEADS_BY_ID[id];
      if (bead.category === cat.id) counts[bead.name] = (counts[bead.name] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (entries.length) {
      lines.push(`  ${cat.label}: ${entries.map(([name, n]) => `${n}× ${name}`).join(', ')}`);
    }
  });
  return lines;
}

function buildSummary() {
  const { slots } = getState();
  const qty = Math.max(1, Math.min(10, parseInt(document.getElementById('order-qty').value, 10) || 1));
  const name = document.getElementById('order-name').value.trim();
  const wantsNote = document.getElementById('order-note-toggle').checked;
  const noteText = document.getElementById('order-note').value.trim();
  const filled = slots.filter(Boolean).length;

  const lines = [
    'BRACE4CHANGE ORDER',
    '——————————————————',
    `Design (${filled} of ${SLOT_COUNT} beads):`,
    ...designLines(slots),
    '',
    `Quantity: ${qty} bracelet${qty > 1 ? 's' : ''}`,
    `Unit price: ${money(UNIT_PRICE)}`,
    `Total: ${money(UNIT_PRICE * qty)}`,
    '',
    `Gives: ${qty} matching bracelet${qty > 1 ? 's' : ''} + ${qty} handwritten note${qty > 1 ? 's' : ''}`,
    '  to Des Moines nursing homes & shelters',
  ];
  if (name) lines.push('', `Name: ${name}`);
  if (wantsNote && noteText) lines.push('', `Words for the note: “${noteText}”`);
  lines.push('', 'Payment & pickup arranged over DM.');
  return lines.join('\n');
}

export function initOrder() {
  const summaryEl = document.getElementById('order-summary');
  const copyBtn = document.getElementById('btn-copy');
  const dmLink = document.getElementById('btn-dm');
  const noteToggle = document.getElementById('order-note-toggle');
  const noteField = document.getElementById('order-note-field');
  const givesEl = document.getElementById('order-gives');

  dmLink.href = `https://ig.me/m/${INSTAGRAM_HANDLE}`;

  function render() {
    summaryEl.textContent = buildSummary();
    const qty = Math.max(1, Math.min(10, parseInt(document.getElementById('order-qty').value, 10) || 1));
    givesEl.textContent = `This order gives ${qty} bracelet${qty > 1 ? 's' : ''} and ${qty} handwritten note${qty > 1 ? 's' : ''} to someone in Des Moines.`;
    noteField.hidden = !noteToggle.checked;
  }

  ['order-qty', 'order-name', 'order-note'].forEach((id) => {
    document.getElementById(id).addEventListener('input', render);
  });
  noteToggle.addEventListener('change', render);

  document.getElementById('qty-minus').addEventListener('click', () => {
    const el = document.getElementById('order-qty');
    el.value = Math.max(1, (parseInt(el.value, 10) || 1) - 1);
    render();
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    const el = document.getElementById('order-qty');
    el.value = Math.min(10, (parseInt(el.value, 10) || 1) + 1);
    render();
  });

  copyBtn.addEventListener('click', async () => {
    const text = buildSummary();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    const original = copyBtn.textContent;
    copyBtn.textContent = 'Copied — paste it in our DM';
    setTimeout(() => (copyBtn.textContent = original), 2400);
  });

  subscribe(render);
}
