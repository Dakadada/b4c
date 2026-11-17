import { BEADS_BY_ID, CATEGORIES, SLOT_COUNT, UNIT_PRICE } from './beads.js';
import { subscribe, getState } from './store.js';

export const INSTAGRAM_HANDLE = 'brace4change.official';

const money = (n) => `$${n.toFixed(2)}`;
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

function designLines(slots) {
  const filled = slots.filter(Boolean);
  if (filled.length === 0) return ['  (no beads yet, surprise us!)'];
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

export function initOrder() {
  const $ = (id) => document.getElementById(id);
  const qtyEl = $('order-qty');
  const nameEl = $('order-name');
  const noteToggle = $('order-note-toggle');
  const noteEl = $('order-note');
  const copyLabel = $('btn-copy-label');
  const status = $('copy-status');
  const quantity = () => Math.max(1, Math.min(10, parseInt(qtyEl.value, 10) || 1));

  function buildSummary() {
    const { slots } = getState();
    const qty = quantity();
    const name = nameEl.value.trim();
    const noteText = noteEl.value.trim();
    const filled = slots.filter(Boolean).length;
    const lines = [
      'BRACE4CHANGE ORDER',
      '——————————————————',
      `Design (${filled} of ${SLOT_COUNT} beads):`,
      ...designLines(slots),
      '',
      `Quantity: ${plural(qty, 'bracelet')}`,
      `Unit price: ${money(UNIT_PRICE)}`,
      `Total: ${money(UNIT_PRICE * qty)}`,
      '',
      `Gives: ${plural(qty, 'matching bracelet')} + ${plural(qty, 'handwritten note')}`,
      '  to Des Moines nursing homes & shelters',
    ];
    if (name) lines.push('', `Name: ${name}`);
    if (noteToggle.checked && noteText) lines.push('', `Words for the note: “${noteText}”`);
    lines.push('', 'Payment & pickup arranged over DM.');
    lines.push('', 'Slot order: ' + slots.map((id, i) => `${i + 1}: ${BEADS_BY_ID[id]?.name || 'empty'}`).join(', '));
    return lines.join('\n');
  }

  function render() {
    const qty = quantity();
    $('order-summary').textContent = buildSummary();
    $('order-total').textContent = money(UNIT_PRICE * qty);
    $('order-gives').textContent = `This order gives ${plural(qty, 'bracelet')} and ${plural(qty, 'handwritten note')} to someone in Des Moines.`;
    $('order-note-field').hidden = !noteToggle.checked;
    document.dispatchEvent(new CustomEvent('order-note', { detail: noteToggle.checked ? noteEl.value.trim() : '' }));
  }

  $('btn-dm').href = `https://ig.me/m/${INSTAGRAM_HANDLE}`;
  [nameEl, noteEl].forEach((el) => el.addEventListener('input', render));
  qtyEl.addEventListener('change', () => { qtyEl.value = quantity(); render(); });
  noteToggle.addEventListener('change', render);
  $('qty-minus').addEventListener('click', () => { qtyEl.value = Math.max(1, quantity() - 1); render(); });
  $('qty-plus').addEventListener('click', () => { qtyEl.value = Math.min(10, quantity() + 1); render(); });

  let resetTimer;
  $('btn-copy').addEventListener('click', async () => {
    const text = buildSummary();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const copied = document.execCommand('copy');
      ta.remove();
      if (!copied) {
        $('order-details').open = true;
        status.textContent = 'Copy is blocked in this browser. Select the order text above, copy it, then paste it into Instagram.';
        return;
      }
    }
    copyLabel.textContent = 'Copied. Paste it in our DM';
    status.textContent = 'Order copied to your clipboard.';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { copyLabel.textContent = 'Copy order'; }, 2400);
  });

  subscribe(render);
}
