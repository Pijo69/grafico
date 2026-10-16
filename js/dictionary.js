// Lazily builds the vendored Spanish Hunspell dictionary through typo.js
// (typo.js itself is loaded as a static <script> in index.html, not
// injected at runtime, so it survives a strict CSP). Any failure (missing
// files, parse error) resolves to null so spelling checks are simply
// skipped instead of breaking the rest of the analysis.

let typoPromise = null;

export function getSpanishTypo() {
  if (typoPromise) return typoPromise;
  typoPromise = (async () => {
    try {
      if (!window.Typo) throw new Error('El corrector ortográfico (typo.js) no se ha cargado.');
      const [aff, dic] = await Promise.all([
        fetch('vendor/dictionary-es/es.aff').then((r) => r.text()),
        fetch('vendor/dictionary-es/es.dic').then((r) => r.text()),
      ]);
      return new window.Typo('es', aff, dic);
    } catch (err) {
      console.warn('Comprobación ortográfica desactivada:', err);
      return null;
    }
  })();
  return typoPromise;
}
