'use strict';

const { sections, levels, calculate, toMarkdown } = Rubric;
const key = 'pbw2-responsi-v2';
const fields = ['name', 'nim'];
let state = { ratings: {}, name: '', nim: '' };
let storageAvailable = true;

try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && typeof saved === 'object') {
    // Preserve fields from the previous UI in existing drafts.
    for (const field of [...fields, 'className', 'examiner', 'notes']) {
      if (typeof saved[field] === 'string') state[field] = saved[field];
    }
    for (const section of sections) {
      for (const [id] of section.items) {
        const value = saved.ratings?.[id];
        if (Number.isInteger(value) && value >= 0 && value <= 2) state.ratings[id] = value;
      }
    }
  }
} catch {
  storageAvailable = false;
}

const fmt = value => value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
const rubric = document.getElementById('rubric');

rubric.innerHTML = sections.map(section => `
  <section class="rubric-section">
    <div class="section-heading">
      <h2>${section.title}</h2>
      <span>${section.weight} poin</span>
    </div>
    ${section.items.map(([id, title, weight]) => `
      <div class="item">
        <label for="rating-${id}"><span class="item-code">${id}</span>${title}</label>
        <select id="rating-${id}" data-id="${id}" aria-describedby="points-${id}">
          <option value="">Belum dinilai</option>
          ${levels.map((level, value) => `<option value="${value}">${value} — ${level}</option>`).join('')}
        </select>
        <span class="item-score" id="points-${id}"><b>—</b> / ${weight}</span>
      </div>`).join('')}
  </section>`).join('');

function update() {
  const result = calculate(state.ratings);
  document.getElementById('total').textContent = fmt(result.total);

  for (const section of sections) {
    for (const [id, , weight] of section.items) {
      const value = state.ratings[id];
      document.getElementById(`rating-${id}`).value = value ?? '';
      document.querySelector(`#points-${id} b`).textContent = value === undefined ? '—' : fmt(weight * value / 2);
    }
  }
}

function showStorage() {
  const status = document.getElementById('save-status');
  if (!status) return;
  status.textContent = storageAvailable
    ? 'Draf tersimpan di browser ini.'
    : 'Draf tidak dapat disimpan atau dibaca. Catat nilai sebelum menutup halaman.';
}

function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  showStorage();
}

rubric.addEventListener('change', event => {
  const select = event.target.closest('select[data-id]');
  if (!select) return;
  if (select.value === '') delete state.ratings[select.dataset.id];
  else state.ratings[select.dataset.id] = Number(select.value);
  update();
  save();
});

for (const field of fields) {
  const input = document.getElementById(field);
  input.value = state[field];
  input.addEventListener('input', () => {
    state[field] = input.value;
    save();
  });
}

document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Hapus identitas dan seluruh nilai untuk mahasiswa berikutnya?')) return;
  state = { ratings: {}, name: '', nim: '' };
  for (const field of fields) document.getElementById(field).value = '';
  update();
  save();
  window.scrollTo({ top: 0 });
  document.getElementById('name').focus();
});

document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([toMarkdown(state)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const identifier = state.nim.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'mahasiswa';
  link.href = url;
  link.download = `responsi-${identifier}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

update();
showStorage();
