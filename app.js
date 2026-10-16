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
      <h2><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 3 15 1-1 17-15-1Z M8 8h8M8 12h8M8 16h5"/></svg>${section.title}</h2>
      <span>${section.weight} poin</span>
    </div>
    ${section.items.map(([id, title, weight]) => `
      <div class="item">
        <label for="rating-${id}" id="label-${id}"><span class="item-code">${id}</span>${title}</label>
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
      const control = document.getElementById(`rating-${id}`);
      if (control.localName === 'wired-combo') {
        control.selected = value === undefined ? 'unrated' : String(value);
        control.refreshSelection();
      } else {
        control.value = value ?? '';
      }
      document.querySelector(`#points-${id} b`).textContent = value === undefined ? '—' : fmt(weight * value / 2);
    }
  }
}

function showStorage() {
  const status = document.getElementById('save-status');
  if (!status) return;
  status.hidden = storageAvailable;
  status.textContent = storageAvailable ? '' : 'Draf tidak dapat disimpan atau dibaca. Unduh nilai sebelum menutup halaman.';
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

for (const field of fields) document.getElementById(field).value = state[field];

document.querySelector('.student').addEventListener('input', event => {
  if (!fields.includes(event.target.id)) return;
  state[event.target.id] = event.target.value;
  save();
});

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

// Native controls work immediately; upgrade only after the optional library loads.
async function enhanceControls() {
  await Promise.all(['wired-input', 'wired-combo', 'wired-item'].map(tag => customElements.whenDefined(tag)));
  await document.fonts.ready;
  // Wired Elements measures its SVG borders only when it renders.
  const resizeObserver = new ResizeObserver(entries => {
    for (const { target } of entries) target.requestUpdate();
  });
  for (const field of fields) {
    const original = document.getElementById(field);
    if (document.activeElement === original) continue;
    const input = document.createElement('wired-input');
    input.id = field;
    input.value = state[field];
    input.setAttribute('aria-labelledby', `${field}-label`);
    original.replaceWith(input);
    await input.updateComplete;
    const inner = input.shadowRoot.querySelector('input');
    inner.setAttribute('aria-label', field === 'name' ? 'Nama mahasiswa' : 'NIM');
    inner.autocomplete = 'off';
    if (field === 'nim') inner.inputMode = 'numeric';
    input.focus = options => inner.focus(options);
    resizeObserver.observe(input);
    document.getElementById(`${field}-label`).addEventListener('click', () => input.focus());
  }
  for (const original of rubric.querySelectorAll('select')) {
    if (document.activeElement === original) continue;
    const combo = document.createElement('wired-combo');
    combo.id = original.id;
    combo.dataset.id = original.dataset.id;
    combo.setAttribute('aria-labelledby', `label-${combo.dataset.id}`);
    combo.setAttribute('aria-describedby', `points-${combo.dataset.id}`);
    for (const option of original.options) {
      const item = document.createElement('wired-item');
      item.value = option.value || 'unrated';
      item.textContent = option.textContent;
      combo.appendChild(item);
    }
    combo.selected = original.value || 'unrated';
    original.replaceWith(combo);
    await combo.updateComplete;
    const style = document.createElement('style');
    style.textContent = '#textPanel{box-sizing:border-box;width:calc(100% - 34px);min-height:48px;padding:9px 8px}#card{box-sizing:border-box;width:100%;padding:4px;box-shadow:none;border:1px solid #555}';
    combo.shadowRoot.appendChild(style);
    combo.requestUpdate();
    resizeObserver.observe(combo);
    combo.addEventListener('selected', () => {
      if (combo.selected === 'unrated') delete state.ratings[combo.dataset.id];
      else state.ratings[combo.dataset.id] = Number(combo.selected);
      update();
      save();
    });
    document.getElementById(`label-${combo.dataset.id}`).addEventListener('click', () => combo.focus());
  }
}

update();
showStorage();
enhanceControls();
