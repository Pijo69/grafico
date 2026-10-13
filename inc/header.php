<?php
/*
 * Cabecera común a todas las páginas.
 * Antes de incluirla se pueden definir $titulo_pagina y $pagina_actual.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/svg.php';

$titulo_pagina = $titulo_pagina ?? 'Branding Page';
$pagina_actual = $pagina_actual ?? 'home';
$inicio = $pagina_actual === 'home' ? '' : 'index.php';
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($titulo_pagina) ?> · IZZON LAB</title>
<meta name="description" content="Branding Page de IZZON LAB: brandbook, plantillas y recursos para un uso correcto de nuestra marca.">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#f7f7f8">
<link rel="icon" href="assets/img/brand/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fahkwang:wght@600;700&family=Montserrat:wght@300;400;500;600;700&display=swap">
<link rel="stylesheet" href="assets/css/main.css?v=1">
<script>document.documentElement.classList.add('js');</script>
</head>
<body class="pagina-<?= e($pagina_actual) ?>">
<a class="saltar" href="#contenido">Saltar al contenido</a>

<header class="cabecera">
    <a class="marca-agua" href="<?= $inicio ?: '#top' ?>" aria-label="IZZON LAB, ir al inicio" id="top">
        <?= svg_logo('marca-agua__logo', 'IZZON LAB') ?>
    </a>

    <nav class="barra" aria-label="Principal" data-barra>
        <div class="barra__inner">
            <a class="barra__logo" href="<?= $inicio ?: '#top' ?>" aria-label="IZZON LAB, inicio">
                <?= svg_logo('', 'IZZON LAB') ?>
            </a>
            <ul class="barra__links">
                <li><a href="<?= $inicio ?>#brandbook">Brandbook</a></li>
                <li><a href="<?= $inicio ?>#plantillas">Plantillas</a></li>
                <li><a href="<?= $inicio ?>#recursos"<?= $pagina_actual !== 'home' ? ' aria-current="true"' : '' ?>>Recursos</a></li>
            </ul>
        </div>
    </nav>
</header>

<main id="contenido">
