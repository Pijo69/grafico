// Lazily loads the vendored Spanish Hunspell dictionary through typo.js.
// Any failure (missing files, parse error) resolves to null so spelling
// checks are simply skipped instead of breaking the rest of the analysis.

let typoPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

export function getSpanishTypo() {
  if (typoPromise) return typoPromise;
  typoPromise = (async () => {
    try {
      if (!window.Typo) await loadScript('vendor/typo/typo.js');
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
