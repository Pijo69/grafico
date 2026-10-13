<?php
$titulo_pagina = 'Branding Page';
$pagina_actual = 'home';
$scripts = ['assets/js/plantillas.js'];
require __DIR__ . '/inc/header.php';

$brandbook_pdf = primer_archivo('brandbook', ['pdf']);
$brandbook_video = primer_archivo('brandbook', ['mp4', 'webm']);

/* Datos de las plantillas para la ventana flotante. */
$datos_visor = [];
foreach (PLANTILLAS as $clave => $grupo) {
    foreach ($grupo['items'] as $item) {
        $existe = is_file(RAIZ . '/' . DIR_DESCARGAS . '/plantillas/' . $item['archivo']);
        $datos_visor[] = [
            'id'          => $item['id'],
            'grupo'       => strip_tags(str_replace('<br>', ' ', $grupo['titulo'])),
            'nombre'      => $item['nombre'],
            'tipo'        => $item['tipo'],
            'formato'     => $item['formato'],
            'descripcion' => $item['descripcion'],
            'imagen'      => 'assets/img/plantillas/' . $item['id'] . '.webp',
            'archivo'     => $existe ? url_descarga('plantillas', $item['archivo']) : null,
            'nombreArchivo' => $item['archivo'],
        ];
    }
}
$indice = 0;
?>

<section class="intro contenedor">
    <h1 class="intro__titulo" data-reveal>Branding page</h1>
    <p class="intro__sub" data-reveal style="--d:1">Por un uso correcto de nuestra marca</p>
    <p class="intro__texto" data-reveal style="--d:2">Descarga el material necesario como las plantillas y recursos que necesites para ser autosuficiente.</p>
</section>

<section class="brandbook contenedor" id="brandbook" aria-labelledby="t-brandbook">
    <h2 class="seccion-titulo" id="t-brandbook" data-reveal>Brandbook</h2>

    <div class="video<?= $brandbook_video ? ' video--con-video' : '' ?>" data-reveal="mascara">
        <?php if ($brandbook_video): ?>
            <video class="video__media" src="<?= e(url_descarga('brandbook', $brandbook_video)) ?>"
                   poster="assets/img/brand/video-poster.webp" autoplay muted playsinline preload="auto"
                   aria-label="Vídeo del brandbook de IZZON LAB" data-video-brandbook></video>
            <button type="button" class="video__boton" data-video-boton hidden>
                <span class="video__play" aria-hidden="true"></span>
                <span class="video__boton-texto">Reproducir</span>
            </button>
        <?php else: ?>
            <div class="video__vacio" aria-label="Vídeo del brandbook, próximamente">
                <span class="video__play" aria-hidden="true"></span>
                <span class="video__rotulo">VIDEO 01</span>
            </div>
        <?php endif; ?>
    </div>

    <div class="brandbook__fila">
        <div class="brandbook__info">
            <p class="texto-peq" data-reveal>Descarga y visualiza nuestro Brandbook para aprender cómo hacer un buen uso de la marca.</p>
            <?php if ($brandbook_pdf): ?>
                <a class="descarga-pdf" href="<?= e(url_descarga('brandbook', $brandbook_pdf)) ?>" download data-reveal style="--d:1">
                    <?= svg_descarga('descarga-pdf__icono') ?>
                    <span>BRANDBOOK PDF</span>
                </a>
            <?php else: ?>
                <span class="descarga-pdf is-pendiente" data-reveal style="--d:1" title="Sube el PDF a /descargas/brandbook">
                    <?= svg_descarga('descarga-pdf__icono') ?>
                    <span>BRANDBOOK PDF</span>
                    <small>Próximamente</small>
                </span>
            <?php endif; ?>
        </div>
        <figure class="brandbook__mockup" data-reveal="mascara" data-parallax>
            <img src="assets/img/brand/brandbook-mockup.webp" width="1672" height="941" loading="lazy" decoding="async"
                 alt="Brandbook de IZZON LAB abierto por las páginas de manifiesto, contexto y naming">
        </figure>
    </div>
</section>

<div id="plantillas" class="plantillas">
<?php foreach (PLANTILLAS as $clave => $grupo): ?>
    <section class="plantilla-grupo contenedor plantilla-grupo--<?= e($clave) ?>" aria-labelledby="t-<?= e($clave) ?>">
        <hr class="regla" data-reveal="linea">
        <div class="plantilla-grupo__grid">
            <div class="plantilla-grupo__cabeza">
                <h2 class="seccion-titulo" id="t-<?= e($clave) ?>" data-reveal><?= $grupo['titulo'] ?></h2>
                <p class="texto-peq" data-reveal style="--d:1"><?= e($grupo['texto']) ?></p>
            </div>
            <ul class="plantilla-grupo__items" role="list">
                <?php foreach ($grupo['items'] as $n => $item): ?>
                    <li class="ficha" data-reveal style="--d:<?= $n + 1 ?>">
                        <button type="button" class="ficha__boton" data-visor="<?= $indice++ ?>"
                                aria-label="Ver <?= e(strip_tags(str_replace('<br>', ' ', $grupo['titulo'])) . ' ' . $item['nombre']) ?> ampliada">
                            <span class="ficha__papel">
                                <img src="assets/img/plantillas/<?= e($item['id']) ?>-sm.webp" alt="" loading="lazy" decoding="async">
                                <span class="ficha__lupa" aria-hidden="true"></span>
                            </span>
                            <span class="ficha__nombre"><?= e($item['nombre']) ?></span>
                        </button>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </section>
<?php endforeach; ?>
</div>

<section class="recursos contenedor" id="recursos" aria-label="Descarga de recursos">
    <hr class="regla" data-reveal="linea">
    <p class="texto-peq recursos__intro" data-reveal>Selecciona el tipo de recursos que necesites. Entra en la página y descarga los archivos.</p>

    <ul class="recursos__grid" role="list">
        <?php $n = 0; foreach (CATEGORIAS as $clave => $cat): ?>
            <li class="recurso-opcion" data-reveal style="--d:<?= $n++ ?>">
                <h3 class="recurso-opcion__titulo"><?= $cat['titulo_html'] ?></h3>
                <a class="boton" href="<?= e($cat['pagina']) ?>">Visualiza y descarga</a>
                <p class="recurso-opcion__texto"><?= e($cat['descripcion']) ?></p>
            </li>
        <?php endforeach; ?>
    </ul>
</section>

<dialog class="visor" id="visor" aria-labelledby="visor-titulo">
    <div class="visor__panel">
        <button type="button" class="visor__cerrar" data-cerrar aria-label="Cerrar">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
        </button>

        <div class="visor__cuerpo">
            <div class="visor__imagen">
                <img id="visor-img" alt="">
            </div>
            <div class="visor__texto" aria-live="polite">
                <p class="visor__grupo" id="visor-grupo"></p>
                <h2 class="visor__titulo" id="visor-titulo"></h2>
                <p class="visor__tipo" id="visor-tipo"></p>
                <p class="visor__desc" id="visor-desc"></p>
                <dl class="visor__datos">
                    <dt>Formato</dt><dd id="visor-formato"></dd>
                    <dt>Archivo</dt><dd id="visor-archivo"></dd>
                </dl>
                <a class="boton boton--claro" id="visor-descarga" download>Descargar plantilla</a>
                <p class="visor__pendiente" id="visor-pendiente" hidden>Archivo pendiente de subir.</p>
            </div>
        </div>

        <div class="visor__nav">
            <button type="button" class="visor__flecha" data-paso="-1" aria-label="Plantilla anterior">
                <svg viewBox="0 0 40 24" aria-hidden="true"><path d="M13 3L3 12l10 9M3 12h34"/></svg>
            </button>
            <span class="visor__contador" id="visor-contador">01 / 06</span>
            <button type="button" class="visor__flecha" data-paso="1" aria-label="Plantilla siguiente">
                <svg viewBox="0 0 40 24" aria-hidden="true"><path d="M27 3l10 9-10 9M37 12H3"/></svg>
            </button>
        </div>
    </div>
</dialog>
<script type="application/json" id="visor-datos"><?= json_encode($datos_visor, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script>

<?php require __DIR__ . '/inc/footer.php'; ?>
