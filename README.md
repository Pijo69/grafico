# IZZON Lab — Revisión de Artes Finales

Herramienta web interna para revisar archivos PDF de artes finales. No requiere build ni
backend: es HTML/CSS/JS plano que corre directamente en el navegador.

## Uso

Sirve la carpeta con cualquier servidor estático (hace falta un servidor, no `file://`,
porque el PDF y el diccionario se cargan con `fetch`):

```bash
python3 -m http.server 8080
# abre http://localhost:8080
```

## Funciones

- **Detectar fallos**: sube un PDF, pulsa «Genera revisión» y la herramienta señala en
  amarillo espacios dobles, puntuación repetida, espacio antes de puntuación, palabras
  repetidas y posibles errores ortográficos (español), con una lista numerada debajo.
- **Comparativa de archivos**: sube dos PDFs y la herramienta marca en amarillo, sobre el
  arte final 02, el texto que difiere entre ambos y las zonas con diferencias visuales
  relevantes (color/diseño).
- Ambas funciones comparten la misma zona de resultado y son mutuamente excluyentes: al
  empezar a usar una se bloquea la otra hasta pulsar «Borrar revisión».
- El resultado se puede ampliar en una ventana flotante con zoom (100%–400%, botones +/−)
  y descargar como JPG con las marcas ya incluidas.
- Si un PDF no tiene capa de texto real (p. ej. un «arte final» aplanado donde la página
  entera es una imagen colocada), la herramienta recurre automáticamente a OCR sobre la
  imagen renderizada para seguir detectando texto, ortografía y diferencias.

## Dependencias (vendorizadas, sin CDN)

`vendor/` contiene copias locales de:

- `pdfjs-dist@3.11.174` — renderizado de PDF y extracción de texto.
- `typo-js` + `dictionary-es` (Hunspell) — corrector ortográfico en español. Si estos
  archivos no cargan por cualquier motivo, la comprobación ortográfica simplemente se
  omite; el resto de comprobaciones (espaciado, puntuación, palabras repetidas,
  comparativa) sigue funcionando con normalidad.
- `tesseract.js` + datos de idioma español (OCR) — usado solo como respaldo cuando el PDF
  no trae texto real extraíble. `vendor/tesseract/worker-shim.js` es un pequeño envoltorio
  que carga el worker real de Tesseract; existe porque Tesseract pide el fichero de idioma
  con el nombre `spa.traineddata.gz`, una extensión que algunos servidores de archivos
  (incluido el de este artifact) no sirven — el shim reescribe esa petición hacia
  `spa.traineddata.wasm`, que son los mismos bytes gzip renombrados a una extensión
  servible; Tesseract los descomprime igualmente (`gzip: true`), así que el cambio de
  nombre no afecta al contenido.

## Tipografías

Montserrat (interfaz) y Fahkwang (logotipo y acentos), cargadas desde Google Fonts.
