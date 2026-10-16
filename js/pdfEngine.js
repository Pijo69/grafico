// Thin wrapper around the vendored pdf.js build: loads a PDF from a File,
// renders its first page to a canvas at a given width, and extracts text
// items with their bounding boxes already converted to canvas pixel space.

let pdfjsReadyPromise = null;

function ensurePdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsReadyPromise) return pdfjsReadyPromise;
  pdfjsReadyPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'vendor/pdfjs/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('No se pudo cargar el motor de lectura de PDF.'));
    document.head.appendChild(script);
  });
  return pdfjsReadyPromise;
}

export async function loadPdfFromFile(file) {
  const pdfjsLib = await ensurePdfJs();
  const data = await file.arrayBuffer();
  const task = pdfjsLib.getDocument({ data });
  return task.promise;
}

export async function renderFirstPage(pdfDoc, targetWidth) {
  const page = await pdfDoc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const scale = targetWidth / base.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  return { page, viewport, canvas };
}

export async function extractTextItems(page, viewport) {
  const pdfjsLib = await ensurePdfJs();
  const content = await page.getTextContent();
  const items = [];
  for (const raw of content.items) {
    if (!raw.str || !raw.str.length) continue;
    const combined = pdfjsLib.Util.transform(viewport.transform, raw.transform);
    const fontHeight = Math.hypot(combined[2], combined[3]) || Math.hypot(combined[0], combined[1]) || 1;
    const scale = Math.hypot(viewport.transform[0], viewport.transform[1]) || 1;
    const width = (raw.width || 0) * scale;
    const x0 = combined[4];
    const yBaseline = combined[5];
    const y0 = yBaseline - fontHeight * 0.85;
    const y1 = yBaseline + fontHeight * 0.25;
    items.push({ str: raw.str, x0, y0, x1: x0 + width, y1 });
  }
  return items;
}
