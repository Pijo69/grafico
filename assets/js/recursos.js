/* Páginas de descarga: miniaturas de respaldo, fondo de miniaturas y aviso de descarga. */
(() => {
    const listas = [...document.querySelectorAll('[data-archivos]')];
    if (!listas.length) return;

    const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
    let pdfjs = null;

    function cargarPdfJs() {
        if (pdfjs) return pdfjs;
        pdfjs = new Promise((ok, ko) => {
            const s = document.createElement('script');
            s.src = PDFJS + 'pdf.min.js';
            s.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js';
                ok(window.pdfjsLib);
            };
            s.onerror = ko;
            document.head.appendChild(s);
        });
        return pdfjs;
    }

    // Si el servidor no puede generar la miniatura de un PDF (sin Imagick), la pinta el navegador.
    async function miniaturaPdf(enlace, contenedor) {
        try {
            const lib = await cargarPdfJs();
            const doc = await lib.getDocument(enlace.href).promise;
            const pagina = await doc.getPage(1);
            const base = pagina.getViewport({ scale: 1 });
            const escala = (360 * (window.devicePixelRatio || 1)) / Math.max(base.width, base.height);
            const vista = pagina.getViewport({ scale: escala });
            const canvas = document.createElement('canvas');
            canvas.width = vista.width;
            canvas.height = vista.height;
            await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: vista }).promise;
            contenedor.prepend(canvas);
            contenedor.classList.add('tiene-mini');
            doc.destroy();
        } catch (e) {
            /* se queda la ficha con la extensión */
        }
    }

    const fotos = ['jpg', 'jpeg', 'webp'];

    const pendientesPdf = 'IntersectionObserver' in window
        ? new IntersectionObserver((entradas, obs) => {
            for (const en of entradas) {
                if (!en.isIntersecting) continue;
                obs.unobserve(en.target);
                miniaturaPdf(en.target.closest('a'), en.target);
            }
        }, { rootMargin: '200px' })
        : null;

    document.querySelectorAll('[data-archivos] .archivo__link').forEach((enlace) => {
        const mini = enlace.querySelector('.archivo__mini');
        const img = mini.querySelector('img');
        const ext = enlace.dataset.ext;

        const sinMiniatura = () => {
            if (img) img.remove();
            if (ext === 'pdf' && pendientesPdf) pendientesPdf.observe(mini);
        };

        if (!img) return sinMiniatura();

        // Las fotos llenan el recuadro; logos e iconos se muestran enteros.
        if (fotos.includes(ext)) img.classList.add('is-foto');

        const listo = () => mini.classList.add('tiene-mini');
        if (img.complete && img.naturalWidth) listo();
        else if (img.complete) sinMiniatura();
        else {
            img.addEventListener('load', listo, { once: true });
            img.addEventListener('error', sinMiniatura, { once: true });
        }

        // Confirmación visual al descargar
        enlace.addEventListener('click', () => {
            enlace.classList.add('is-descargado');
            clearTimeout(enlace._t);
            enlace._t = setTimeout(() => enlace.classList.remove('is-descargado'), 1800);
        });
    });

    // Selector de fondo claro/oscuro para logos e iconos
    const botones = document.querySelectorAll('[data-fondo]');
    botones.forEach((b) => {
        b.addEventListener('click', () => {
            const oscuro = b.dataset.fondo === 'oscuro';
            botones.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            listas.forEach((lista) => {
                lista.classList.toggle('is-oscuro', oscuro);
                lista.classList.toggle('is-claro', !oscuro);
            });
        });
    });
})();
