/* Animaciones comunes: entradas al hacer scroll, barra fija y parallax. */
(() => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Entradas al hacer scroll
    const elementos = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window && !reducido) {
        const io = new IntersectionObserver((entradas) => {
            for (const entrada of entradas) {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('is-in');
                    io.unobserve(entrada.target);
                }
            }
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
        elementos.forEach((el) => io.observe(el));
    } else {
        elementos.forEach((el) => el.classList.add('is-in'));
    }

    // Barra fija: aparece cuando la marca de agua sale de pantalla
    const barra = document.querySelector('[data-barra]');
    const marca = document.querySelector('.marca-agua');
    if (barra && marca && 'IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => {
            barra.classList.toggle('is-visible', !e.isIntersecting);
        }, { threshold: 0 }).observe(marca);
    }

    if (reducido) return;

    // Parallax suave de la marca de agua y del mockup del brandbook
    const logo = document.querySelector('.marca-agua__logo');
    const mockups = [...document.querySelectorAll('[data-parallax] img')];
    let pendiente = false;

    const pintar = () => {
        pendiente = false;
        const y = window.scrollY;
        if (logo && y < window.innerHeight) {
            logo.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
        }
        for (const img of mockups) {
            const r = img.parentElement.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) continue;
            const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
            const visible = img.parentElement.classList.contains('is-in');
            img.style.transform = `translate3d(0, ${p * -28}px, 0) scale(${visible ? 1.06 : 1.14})`;
        }
    };

    window.addEventListener('scroll', () => {
        if (!pendiente) {
            pendiente = true;
            requestAnimationFrame(pintar);
        }
    }, { passive: true });
    pintar();
})();
