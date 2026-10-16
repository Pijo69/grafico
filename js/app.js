import { loadPdfFromFile, renderFirstPage, extractTextItems } from './pdfEngine.js';
import { analyzeDocument } from './analyze.js';
import { diffTextTokens, visualDiffBoxes } from './diffEngine.js';

const THUMB_WIDTH = 260;
const RESULT_WIDTH = 1100;

const els = {
  panelDetect: document.getElementById('panel-detect'),
  panelCompare: document.getElementById('panel-compare'),
  modeHint: document.getElementById('mode-hint'),
  btnGenerate: document.getElementById('btn-generate'),
  btnClear: document.getElementById('btn-clear'),
  btnDownload: document.getElementById('btn-download'),
  resultZone: document.getElementById('result-zone'),
  resultImage: document.getElementById('result-image'),
  resultBoxes: document.getElementById('result-boxes'),
  resultPlaceholder: document.getElementById('result-placeholder'),
  scanline: document.getElementById('scanline'),
  issueList: document.getElementById('issue-list'),
  modal: document.getElementById('modal'),
  modalBackdrop: document.getElementById('modal-backdrop'),
  modalClose: document.getElementById('modal-close'),
  modalImage: document.getElementById('modal-image'),
  toast: document.getElementById('toast'),
};

const slots = {
  detect: makeSlotRefs('detect'),
  compareA: makeSlotRefs('compareA'),
  compareB: makeSlotRefs('compareB'),
};

function makeSlotRefs(key) {
  const root = document.querySelector(`[data-slot="${key}"]`);
  return {
    root,
    input: root.querySelector('.upload-slot__input'),
    icon: root.querySelector('.upload-slot__icon'),
    thumb: root.querySelector('.upload-slot__thumb'),
    spinner: root.querySelector('.upload-slot__spinner'),
    removeBtn: document.querySelector(`[data-remove-slot="${key}"]`),
    file: null,
    pdfDoc: null,
  };
}

/** @type {'idle'|'detect'|'compare'} */
let activeMode = 'idle';
let resultCanvas = null; // clean render, no boxes baked in
let currentIssues = [];

function setMode(mode) {
  activeMode = mode;
  const detectLocked = mode === 'compare';
  const compareLocked = mode === 'detect';
  els.panelDetect.classList.toggle('is-locked', detectLocked);
  els.panelCompare.classList.toggle('is-locked', compareLocked);
  if (mode === 'idle') {
    els.modeHint.hidden = false;
    els.modeHint.textContent = 'Sube un archivo para activar «GENERA REVISIÓN».';
  } else {
    els.modeHint.hidden = false;
    els.modeHint.textContent =
      mode === 'detect'
        ? 'Modo «Detectar fallos» activo. Pulsa «BORRAR REVISIÓN» para usar la comparativa de archivos.'
        : 'Modo «Comparativa archivos» activo. Pulsa «BORRAR REVISIÓN» para usar detectar fallos.';
  }
  updateGenerateButton();
}

function updateGenerateButton() {
  let ready = false;
  if (activeMode === 'detect') ready = !!slots.detect.file;
  if (activeMode === 'compare') ready = !!slots.compareA.file && !!slots.compareB.file;
  els.btnGenerate.disabled = !ready;
  els.btnClear.disabled = activeMode === 'idle' && !resultCanvas;
}

async function handleFileSelected(key, file) {
  if (!file || file.type !== 'application/pdf') {
    showToast('Selecciona un archivo PDF válido.');
    return;
  }
  const slot = slots[key];
  const modeForSlot = key === 'detect' ? 'detect' : 'compare';
  if (activeMode !== 'idle' && activeMode !== modeForSlot) return;

  slot.icon.hidden = true;
  slot.spinner.hidden = false;
  slot.input.disabled = true;

  try {
    const pdfDoc = await loadPdfFromFile(file);
    const { canvas } = await renderFirstPage(pdfDoc, THUMB_WIDTH);
    slot.file = file;
    slot.pdfDoc = pdfDoc;
    slot.thumb.src = canvas.toDataURL('image/jpeg', 0.85);
    slot.thumb.hidden = false;
    slot.removeBtn.disabled = false;
    setMode(modeForSlot);
  } catch (err) {
    console.error(err);
    showToast('No se ha podido leer el PDF. Comprueba el archivo e inténtalo de nuevo.');
    slot.input.disabled = false;
    slot.icon.hidden = false;
  } finally {
    slot.spinner.hidden = true;
  }
}

function handleRemove(key) {
  const slot = slots[key];
  slot.file = null;
  slot.pdfDoc = null;
  slot.thumb.hidden = true;
  slot.thumb.src = '';
  slot.icon.hidden = false;
  slot.input.disabled = false;
  slot.input.value = '';
  slot.removeBtn.disabled = true;

  const panelEmpty =
    key === 'detect'
      ? !slots.detect.file
      : !slots.compareA.file && !slots.compareB.file;
  if (panelEmpty) setMode('idle');
  updateGenerateButton();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    els.toast.hidden = true;
  }, 3200);
}

function setGenerating(isLoading) {
  els.btnGenerate.classList.toggle('is-loading', isLoading);
  els.btnGenerate.disabled = isLoading || els.btnGenerate.disabled;
  els.scanline.hidden = !isLoading;
}

function renderResult(canvas, issues, emptyMessage) {
  resultCanvas = canvas;
  currentIssues = issues;

  els.resultPlaceholder.hidden = true;
  els.resultImage.src = canvas.toDataURL('image/jpeg', 0.9);
  els.resultImage.hidden = false;
  els.resultZone.classList.add('has-image');

  els.resultBoxes.innerHTML = '';
  els.resultBoxes.hidden = issues.length === 0;
  issues.forEach((issue, i) => {
    const box = document.createElement('div');
    box.className = 'result-box';
    box.style.left = `${issue.rectPct.xPct}%`;
    box.style.top = `${issue.rectPct.yPct}%`;
    box.style.width = `${issue.rectPct.wPct}%`;
    box.style.height = `${issue.rectPct.hPct}%`;
    box.style.animationDelay = `${i * 60}ms`;
    const tag = document.createElement('span');
    tag.className = 'result-box__tag';
    tag.textContent = String(i + 1).padStart(2, '0');
    box.appendChild(tag);
    els.resultBoxes.appendChild(box);
  });

  els.issueList.innerHTML = '';
  if (issues.length === 0) {
    const li = document.createElement('li');
    li.className = 'issue-list__empty';
    li.textContent = emptyMessage;
    els.issueList.appendChild(li);
  } else {
    issues.forEach((issue, i) => {
      const li = document.createElement('li');
      li.className = 'issue-list__item';
      li.style.animationDelay = `${i * 70}ms`;
      const badge = document.createElement('span');
      badge.className = 'issue-list__badge';
      badge.textContent = String(i + 1).padStart(2, '0');
      const text = document.createElement('span');
      text.className = 'issue-list__text';
      text.textContent = issue.message;
      li.append(badge, text);
      els.issueList.appendChild(li);
    });
  }

  els.btnDownload.disabled = false;
  els.btnClear.disabled = false;
}

async function runGenerate() {
  if (els.btnGenerate.disabled) return;
  setGenerating(true);
  try {
    if (activeMode === 'detect') {
      const slot = slots.detect;
      const { page, viewport, canvas } = await renderFirstPage(slot.pdfDoc, RESULT_WIDTH);
      const items = await extractTextItems(page, viewport);
      const issues = await analyzeDocument(items, canvas.width, canvas.height);
      renderResult(canvas, issues, 'No se han encontrado fallos.');
    } else if (activeMode === 'compare') {
      const a = slots.compareA;
      const b = slots.compareB;
      const [renderA, renderB] = await Promise.all([
        renderFirstPage(a.pdfDoc, RESULT_WIDTH),
        renderFirstPage(b.pdfDoc, RESULT_WIDTH),
      ]);
      const [itemsA, itemsB] = await Promise.all([
        extractTextItems(renderA.page, renderA.viewport),
        extractTextItems(renderB.page, renderB.viewport),
      ]);
      const textIssues = diffTextTokens(itemsA, itemsB, renderB.canvas.width, renderB.canvas.height);
      const visualIssues = visualDiffBoxes(
        renderA.canvas,
        renderB.canvas,
        textIssues.map((i) => i.rectPx),
        renderB.canvas.width,
        renderB.canvas.height
      );
      const issues = [...textIssues, ...visualIssues].sort(
        (x, y) => x.rectPx.y0 - y.rectPx.y0 || x.rectPx.x0 - y.rectPx.x0
      );
      renderResult(renderB.canvas, issues, 'No se han encontrado diferencias.');
    }
  } catch (err) {
    console.error(err);
    showToast('Ha ocurrido un error durante el análisis. Inténtalo de nuevo.');
  } finally {
    setGenerating(false);
  }
}

function runClear() {
  for (const key of Object.keys(slots)) handleRemove(key);
  setMode('idle');
  resultCanvas = null;
  currentIssues = [];
  els.resultImage.hidden = true;
  els.resultImage.src = '';
  els.resultBoxes.innerHTML = '';
  els.resultBoxes.hidden = true;
  els.resultPlaceholder.hidden = false;
  els.resultZone.classList.remove('has-image');
  els.issueList.innerHTML = '<li class="issue-list__empty">Sube un archivo y pulsa «GENERA REVISIÓN» para comenzar.</li>';
  els.btnDownload.disabled = true;
  els.btnClear.disabled = true;
}

function buildCompositeImage() {
  const out = document.createElement('canvas');
  out.width = resultCanvas.width;
  out.height = resultCanvas.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(resultCanvas, 0, 0);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffde00';
  currentIssues.forEach((issue, i) => {
    const { x0, y0, x1, y1 } = issue.rectPx;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    const label = String(i + 1).padStart(2, '0');
    ctx.font = 'bold 16px sans-serif';
    const padding = 4;
    const textW = ctx.measureText(label).width;
    const tagX = x1 - textW - padding * 2 + 8;
    const tagY = y0 - 18;
    ctx.fillStyle = '#ffde00';
    ctx.fillRect(tagX, tagY, textW + padding * 2, 20);
    ctx.fillStyle = '#19171a';
    ctx.fillText(label, tagX + padding, tagY + 15);
  });
  return out;
}

function runDownload() {
  if (!resultCanvas) return;
  const composite = buildCompositeImage();
  const link = document.createElement('a');
  link.download = `resultado-revision-${Date.now()}.jpg`;
  link.href = composite.toDataURL('image/jpeg', 0.92);
  link.click();
}

function openModal() {
  if (!resultCanvas) return;
  els.modalImage.src = els.resultImage.src;
  els.modal.hidden = false;
}

function closeModal() {
  els.modal.hidden = true;
}

for (const [key, slot] of Object.entries(slots)) {
  slot.input.addEventListener('change', (e) => handleFileSelected(key, e.target.files[0]));
  slot.removeBtn.addEventListener('click', () => handleRemove(key));
}

els.btnGenerate.addEventListener('click', runGenerate);
els.btnClear.addEventListener('click', runClear);
els.btnDownload.addEventListener('click', runDownload);
els.resultZone.addEventListener('click', openModal);
els.resultZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openModal();
  }
});
els.modalClose.addEventListener('click', closeModal);
els.modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.modal.hidden) closeModal();
});

setMode('idle');
runClear();
