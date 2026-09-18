const I18N = {
  es: {
    'nav.home': 'Home',
    'nav.obra': 'Obra',
    'nav.grabado': 'Grabado',
    'nav.curriculum': 'Curriculum',
    'nav.editorial': 'Editorial',
    'nav.contacto': 'Contacto',

    'cta.text': 'Si quieres contactar conmigo, clica aquí abajo.',
    'cta.button': 'Contacto',

    'footer.email': 'contacto@manologranado.com',

    'home.title': 'Obras recientes',

    'obra.title': 'Obras',
    'obra.lede': 'Una selección de piezas recientes. Pintura, materia y gesto sobre lienzo y papel.',

    'grabado.title': 'Grabados',
    'grabado.lede': 'El grabado como laboratorio: matriz, tinta y azar controlado. Un espacio de trabajo paralelo a la pintura, donde la obra se piensa por capas y por tiempos.',
    'grabado.h2': 'Sobre la obra gráfica',
    'grabado.p1': 'Desde hace más de una década, Manolo Granado compagina la pintura con la obra gráfica, entendida como un territorio propio de experimentación. El grabado impone un tiempo distinto: cada plancha exige planificación, pero también deja espacio al accidente controlado, a la mancha que aparece donde no se esperaba.',
    'grabado.p2': 'Las series de grabado retoman el círculo como forma recurrente en toda su producción, un límite dentro del cual conviven la línea incisa, la aguada y el collage de papeles encontrados. Cada edición es corta y cada estampa, ligeramente distinta de la anterior.',
    'grabado.p3': 'Actualmente trabaja con talleres de estampación en Madrid y Lisboa, y sus grabados forman parte de colecciones privadas en España, Portugal y Francia.',

    'curriculum.title': 'Curriculum',
    'curriculum.bio.rest': '(Ibi, Alicante, 1969). Actualmente reside en Banyeres de Mariola (Alicante).',
    'curriculum.group.formation': 'Formación',
    'curriculum.group.exhibitions': 'Exposiciones individuales',
    'curriculum.group.group': 'Exposiciones colectivas',
    'curriculum.colectivas.intro': 'Cuenta con más de 80 exposiciones colectivas, entre ellas:',
    'curriculum.group.awards': 'Premios y selección de obra',
    'curriculum.group.other': 'Otras actividades',
    'curriculum.group.institutions': 'Obra en instituciones',

    'editorial.title': 'Editorial',
    'editorial.lede': 'Publicaciones, catálogos y textos sobre la obra de Manolo Granado.',

    'contacto.title': 'Contacto',
    'contacto.lede': 'Para consultas sobre obra disponible, encargos, exposiciones o prensa, escribe a través del formulario o directamente por correo electrónico.',
    'contacto.studio': 'Estudio',
    'contacto.studio.value': 'Banyeres de Mariola, Alicante',
    'contacto.email.label': 'Email',
    'contacto.social.label': 'Redes',
    'contacto.form.name': 'Nombre',
    'contacto.form.email': 'Email',
    'contacto.form.message': 'Mensaje',
    'contacto.form.send': 'Enviar',
    'contacto.form.note': 'Este formulario abre tu gestor de correo predeterminado.'
  },
  en: {
    'nav.home': 'Home',
    'nav.obra': 'Work',
    'nav.grabado': 'Prints',
    'nav.curriculum': 'CV',
    'nav.editorial': 'Editorial',
    'nav.contacto': 'Contact',

    'cta.text': 'If you would like to get in touch, click below.',
    'cta.button': 'Contact',

    'footer.email': 'contacto@manologranado.com',

    'home.title': 'Recent works',

    'obra.title': 'Work',
    'obra.lede': 'A selection of recent pieces. Paint, matter and gesture on canvas and paper.',

    'grabado.title': 'Prints',
    'grabado.lede': 'Printmaking as a laboratory: plate, ink and controlled chance. A space that runs parallel to painting, where the work is built in layers and in time.',
    'grabado.h2': 'On the graphic work',
    'grabado.p1': 'For more than a decade, Manolo Granado has combined painting with printmaking, understood as its own field of experimentation. Etching imposes a different pace: each plate demands planning, yet leaves room for the controlled accident, for the stain that appears where it was not expected.',
    'grabado.p2': 'The print series revisit the circle as a recurring form across his whole body of work, a boundary within which incised line, wash and collaged found papers coexist. Each edition is short, and every print slightly different from the last.',
    'grabado.p3': 'He currently works with print studios in Madrid and Lisbon, and his prints belong to private collections in Spain, Portugal and France.',

    'curriculum.title': 'CV',
    'curriculum.bio.rest': '(Ibi, Alicante, 1969). He currently lives in Banyeres de Mariola (Alicante).',
    'curriculum.group.formation': 'Education',
    'curriculum.group.exhibitions': 'Solo exhibitions',
    'curriculum.group.group': 'Group exhibitions',
    'curriculum.colectivas.intro': 'He has taken part in more than 80 group exhibitions, among them:',
    'curriculum.group.awards': 'Awards and selected works',
    'curriculum.group.other': 'Other activities',
    'curriculum.group.institutions': 'Work in institutions',

    'editorial.title': 'Editorial',
    'editorial.lede': 'Publications, catalogues and texts on the work of Manolo Granado.',

    'contacto.title': 'Contact',
    'contacto.lede': 'For enquiries about available work, commissions, exhibitions or press, write through the form or directly by email.',
    'contacto.studio': 'Studio',
    'contacto.studio.value': 'Banyeres de Mariola, Alicante',
    'contacto.email.label': 'Email',
    'contacto.social.label': 'Social',
    'contacto.form.name': 'Name',
    'contacto.form.email': 'Email',
    'contacto.form.message': 'Message',
    'contacto.form.send': 'Send',
    'contacto.form.note': 'This form opens your default email client.'
  }
};

function getLang() {
  return localStorage.getItem('mg_lang') || 'es';
}

function setLang(lang) {
  localStorage.setItem('mg_lang', lang);
  applyLang(lang);
}

function applyLang(lang) {
  document.documentElement.setAttribute('lang', lang);

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const dict = I18N[lang] || I18N.es;
    if (dict[key] !== undefined) {
      el.textContent = dict[key];
    }
  });

  document.querySelectorAll('.lang-switch button').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  if (typeof renderGalleries === 'function') {
    renderGalleries(lang);
  }
  if (typeof refreshLightboxText === 'function') {
    refreshLightboxText(lang);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const lang = getLang();
  applyLang(lang);

  document.querySelectorAll('.lang-switch button').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
  });

  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => nav.classList.toggle('open'));
  }
});
