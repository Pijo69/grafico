/* Ventana flotante de plantillas: abrir, cerrar, navegar con flechas, teclado y gesto. */
(() => {
    const visor = document.getElementById('visor');
    const fuente = document.getElementById('visor-datos');
    if (!visor || !fuente || typeof visor.showModal !== 'function') return;

    const datos = JSON.parse(fuente.textContent);
    const $ = (id) => document.getElementById(id);
    const img = $('visor-img');
    const texto = visor.querySelector('.visor__texto');
    const descarga = $('visor-descarga');
    const pendiente = $('visor-pendiente');
    const total = datos.length;
    const dos = (n) => String(n).padStart(2, '0');
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let actual = 0;
    let disparador = null;
    let token = 0;

    const precargar = (i) => { const p = new Image(); p.src = datos[(i + total) % total].imagen; };

    function rellenar(d) {
        $('visor-grupo').textContent = d.grupo;
        $('visor-titulo').textContent = d.nombre;
        $('visor-tipo').textContent = d.tipo;
        $('visor-desc').textContent = d.descripcion;
        $('visor-formato').textContent = d.formato;
        $('visor-archivo').textContent = d.nombreArchivo;
        $('visor-contador').textContent = `${dos(actual + 1)} / ${dos(total)}`;
        img.alt = `${d.grupo} ${d.nombre}: ${d.tipo}`;

        if (d.archivo) {
            descarga.href = d.archivo;
            descarga.setAttribute('download', d.nombreArchivo);
            descarga.hidden = false;
            pendiente.hidden = true;
        } else {
            descarga.removeAttribute('href');
            descarga.hidden = true;
            pendiente.hidden = false;
        }
    }

    function mostrar(i, dir = 0) {
        actual = (i + total) % total;
        const d = datos[actual];
        const mio = ++token;

        if (!dir || reducido) {
            img.src = d.imagen;
            rellenar(d);
        } else {
            visor.style.setProperty('--dir', dir);
            img.classList.add('is-saliendo');
            texto.classList.add('is-cambiando');
            setTimeout(() => {
                if (mio !== token) return;
                const cargada = () => {
                    if (mio !== token) return;
                    img.classList.remove('is-saliendo');
                    img.classList.add('is-entrando');
                    rellenar(d);
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                        img.classList.remove('is-entrando');
                        texto.classList.remove('is-cambiando');
                    }));
                };
                const nueva = new Image();
                nueva.onload = nueva.onerror = () => { img.src = d.imagen; cargada(); };
                nueva.src = d.imagen;
            }, 200);
        }
        precargar(actual + 1);
        precargar(actual - 1);
    }

    function abrir(i, origen) {
        disparador = origen;
        mostrar(i);
        visor.classList.remove('is-cerrando');
        visor.showModal();
        document.documentElement.style.overflow = 'hidden';
    }

    function cerrar() {
        if (!visor.open || visor.classList.contains('is-cerrando')) return;
        const fin = () => {
            visor.classList.remove('is-cerrando');
            visor.close();
        };
        if (reducido) return fin();
        visor.classList.add('is-cerrando');
        setTimeout(fin, 220);
    }

    visor.addEventListener('close', () => {
        document.documentElement.style.overflow = '';
        if (disparador) disparador.focus({ preventScroll: true });
    });

    // Esc: animamos el cierre en lugar del cierre seco del navegador
    visor.addEventListener('cancel', (e) => { e.preventDefault(); cerrar(); });

    document.querySelectorAll('[data-visor]').forEach((boton) => {
        boton.addEventListener('click', () => abrir(Number(boton.dataset.visor), boton));
    });

    visor.querySelector('[data-cerrar]').addEventListener('click', cerrar);
    visor.querySelectorAll('[data-paso]').forEach((b) => {
        b.addEventListener('click', () => { const p = Number(b.dataset.paso); mostrar(actual + p, p); });
    });

    // Clic fuera del panel
    visor.addEventListener('click', (e) => { if (e.target === visor) cerrar(); });

    visor.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(actual + 1, 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(actual - 1, -1); }
    });

    // Deslizar en pantallas táctiles
    let x0 = null;
    let y0 = null;
    const zona = visor.querySelector('.visor__imagen');
    zona.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } });
    zona.addEventListener('pointerup', (e) => {
        if (x0 === null) return;
        const dx = e.clientX - x0;
        const dy = e.clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            const p = dx < 0 ? 1 : -1;
            mostrar(actual + p, p);
        }
    });
    zona.addEventListener('pointercancel', () => { x0 = null; });
})();
