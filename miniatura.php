<?php
/*
 * miniatura.php?c=<categoría>&f=<archivo>
 * Sirve (y genera la primera vez) la miniatura de un archivo descargable.
 */
require __DIR__ . '/inc/archivos.php';

$categoria = (string) ($_GET['c'] ?? '');
$nombre = basename((string) ($_GET['f'] ?? ''));

$dir = realpath(dir_categoria($categoria));
$ruta = $dir ? realpath($dir . '/' . $nombre) : false;

if (!isset(CATEGORIAS[$categoria]) || !$ruta || dirname($ruta) !== $dir || !is_file($ruta) || $nombre[0] === '.') {
    http_response_code(404);
    exit;
}

$mini = miniatura($categoria, $nombre);
if (!$mini) {
    http_response_code(404);
    header('Cache-Control: no-store');
    exit;
}

header('Content-Type: ' . (substr($mini, -5) === '.webp' ? 'image/webp' : 'image/png'));
header('Content-Length: ' . filesize($mini));
header('Cache-Control: public, max-age=31536000, immutable');
readfile($mini);
