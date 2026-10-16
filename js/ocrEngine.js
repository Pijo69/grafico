// Falls back to OCR (Tesseract.js, loaded as a static <script> like pdf.js)
// for pages whose PDF text layer is empty or near-empty — the common case
// for a flattened "arte final" where the whole page is one placed image,
// so pdf.js's real text layer never sees any of the words printed on it.

let workerPromise = null;

function ensureTesseract() {
  if (!window.Tesseract) {
    throw new Error('El motor de OCR (Tesseract) no se ha cargado.');
  }
  return window.Tesseract;
}

function getWorker() {
  if (workerPromise) return workerPromise;
  workerPromise = (async () => {
    const Tesseract = ensureTesseract();
    return Tesseract.createWorker('spa', 1, {
      workerPath: 'vendor/tesseract/worker-shim.js',
      corePath: 'vendor/tesseract/tesseract-core-simd-lstm.wasm.js',
      langPath: 'vendor/tesseract/lang',
      cacheMethod: 'none',
      gzip: true,
      workerBlobURL: false,
    });
  })();
  return workerPromise;
}

// Returns items shaped exactly like pdfEngine's extractTextItems
// ({str, x0, y0, x1, y1} in canvas pixel space), so it's a drop-in
// alternative text source for analyze.js / diffEngine.js.
export async function ocrExtractItems(canvas) {
  const worker = await getWorker();
  const { data } = await worker.recognize(canvas);
  const items = [];
  for (const word of data.words || []) {
    if (!word.text || !word.text.trim() || !word.bbox) continue;
    items.push({ str: word.text, x0: word.bbox.x0, y0: word.bbox.y0, x1: word.bbox.x1, y1: word.bbox.y1 });
  }
  return items;
}
