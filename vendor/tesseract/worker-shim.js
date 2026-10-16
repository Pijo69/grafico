// Tesseract's worker fetches language data from a URL it builds itself,
// always ending in ".traineddata.gz" — an extension the artifact file
// server (and some plain static hosts) won't serve. The actual bytes are
// still gzip-compressed language data regardless of what the file is
// named, and tesseract.js decompresses them itself (gzip:true), so this
// renames the request to the ".wasm"-named copy we actually publish
// before handing off to the real worker script.
const originalFetch = self.fetch.bind(self);
self.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input && input.url;
  if (typeof url === 'string' && url.endsWith('.traineddata.gz')) {
    return originalFetch(url.replace(/\.gz$/, '.wasm'), init);
  }
  return originalFetch(input, init);
};
importScripts('worker.min.js');
