<?php
/* Plantilla común de las páginas de descarga (logos, imágenes, iconos). */

require_once __DIR__ . '/archivos.php';

if (!isset($categoria, CATEGORIAS[$categoria])) {
    http_response_code(404);
    exit('Categoría no encontrada');
}

$cat = CATEGORIAS[$categoria];
$titulo_pagina = $cat['titulo'];
$pagina_actual = $categoria;
$scripts = ['assets/js/recursos.js'];
$archivos = listar_archivos($categoria);

require __DIR__ . '/header.php';
?>

<section class="descargas contenedor" aria-labelledby="t-descargas">
    <a class="volver" href="index.php#recursos" data-reveal>
        <svg viewBox="0 0 40 24" aria-hidden="true"><path d="M13 3L3 12l10 9M3 12h34"/></svg>
        Volver a la Branding Page
    </a>

    <h1 class="intro__titulo descargas__titulo" id="t-descargas" data-reveal><?= $cat['titulo_html'] ?></h1>
    <p class="intro__texto" data-reveal style="--d:1"><?= e($cat['descripcion']) ?> Haz clic sobre cualquier archivo para descargarlo.</p>

    <div class="descargas__barra" data-reveal style="--d:2">
        <p class="descargas__cuenta">
            <?= count($archivos) ?> <?= count($archivos) === 1 ? 'archivo' : 'archivos' ?>
        </p>
        <?php if ($cat['fondo'] && $archivos): ?>
            <div class="fondo-selector" role="group" aria-label="Fondo de las miniaturas">
                <button type="button" data-fondo="claro" aria-pressed="true">Fondo claro</button>
                <button type="button" data-fondo="oscuro" aria-pressed="false">Fondo oscuro</button>
            </div>
        <?php endif; ?>
    </div>

    <hr class="regla" data-reveal="linea">

    <?php if ($archivos): ?>
        <ul class="archivos" role="list" data-archivos>
            <?php foreach ($archivos as $i => $a): ?>
                <li class="archivo" data-reveal style="--d:<?= min($i, 12) ?>">
                    <a class="archivo__link" href="<?= e($a['url']) ?>" download="<?= e($a['nombre']) ?>"
                       data-ext="<?= e($a['ext']) ?>" aria-label="Descargar <?= e($a['nombre']) ?> (<?= e(peso_legible($a['peso'])) ?>)">
                        <span class="archivo__mini<?= $a['oscuro'] ? ' is-oscuro' : '' ?>">
                            <?php if ($a['mini']): ?>
                                <img src="<?= e($a['mini']) ?>" alt="" loading="lazy" decoding="async">
                            <?php endif; ?>
                            <span class="archivo__tipo" aria-hidden="true"><?= e(strtoupper($a['ext'] ?: 'archivo')) ?></span>
                            <span class="archivo__accion" aria-hidden="true">
                                <?= svg_descarga() ?>
                            </span>
                        </span>
                        <span class="archivo__nombre" title="<?= e($a['nombre']) ?>"><?= e($a['titulo']) ?></span>
                        <span class="archivo__meta"><?= e(strtoupper($a['ext'])) ?> · <?= e(peso_legible($a['peso'])) ?></span>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    <?php else: ?>
        <div class="vacio" data-reveal>
            <?= svg_zz('vacio__zz') ?>
            <p>Todavía no hay archivos en esta sección.</p>
            <p class="texto-peq">Sube los archivos a la carpeta <code>/descargas/<?= e($categoria) ?>/</code> y aparecerán aquí con su miniatura.</p>
        </div>
    <?php endif; ?>

    <nav class="otras" aria-label="Otros recursos" data-reveal>
        <?php foreach (CATEGORIAS as $clave => $otra): if ($clave === $categoria) continue; ?>
            <a class="otras__link" href="<?= e($otra['pagina']) ?>">
                <span><?= e($otra['titulo']) ?></span>
                <svg viewBox="0 0 40 24" aria-hidden="true"><path d="M27 3l10 9-10 9M37 12H3"/></svg>
            </a>
        <?php endforeach; ?>
    </nav>
</section>

<?php require __DIR__ . '/footer.php'; ?>
