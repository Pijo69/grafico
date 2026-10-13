<?php
/*
 * miniatura.php?c=<categoría>&f=<archivo>
 * Sirve (y genera la primera vez) la miniatura de un archivo descargable.
 */
require __DIR__ . '/inc/archivos.php';

$categoria = (string) ($_GET['c'] ?? '');
$nombre = str_replace('\\', '/', (string) ($_GET['f'] ?? ''));

// Se admite "archivo.jpg" o "CARPETA/archivo.jpg", nunca rutas hacia fuera.
$partes = explode('/', $nombre);
$valido = isset(CATEGORIAS[$categoria]) && count($partes) <= 2;
foreach ($partes as $parte) {
    if ($parte === '' || $parte[0] === '.' || $parte[0] === '_') {
        $valido = false;
    }
}

$dir = $valido ? realpath(dir_categoria($categoria)) : false;
$ruta = $dir ? realpath($dir . '/' . $nombre) : false;

if (!$ruta || strpos($ruta, $dir . DIRECTORY_SEPARATOR) !== 0 || !is_file($ruta)) {
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
