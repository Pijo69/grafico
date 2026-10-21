<?php
/* Listado de archivos descargables y generación de miniaturas. */

require_once __DIR__ . '/config.php';

const EXT_IMAGEN  = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
const EXT_OFFICE  = ['pptx', 'potx', 'ppsx', 'pptm', 'docx', 'dotx', 'docm', 'xlsx', 'xltx', 'xlsm'];
const EXT_PDF     = ['pdf', 'ai', 'eps'];
const IGNORAR     = ['index.html', 'index.php', '.htaccess', 'thumbs.db', 'desktop.ini'];

function dir_categoria(string $categoria): string
{
    return RAIZ . '/' . DIR_DESCARGAS . '/' . $categoria;
}

/* Nombres que nunca se listan: ocultos, "_borrador", índices del servidor... */
function ignorado(string $nombre): bool
{
    return $nombre === '' || $nombre[0] === '.' || $nombre[0] === '_' || in_array(strtolower($nombre), IGNORAR, true);
}

/*
 * Archivos de una categoría (o de una de sus subcarpetas) ordenados por
 * nombre en orden natural.
 */
function listar_archivos(string $categoria, string $subcarpeta = ''): array
{
    $dir = dir_categoria($categoria) . ($subcarpeta !== '' ? '/' . $subcarpeta : '');
    if (!is_dir($dir)) {
        return [];
    }
    $archivos = [];
    foreach (scandir($dir) ?: [] as $nombre) {
        $ruta = $dir . '/' . $nombre;
        if (ignorado($nombre) || !is_file($ruta)) {
            continue;
        }
        $relativa = ($subcarpeta !== '' ? $subcarpeta . '/' : '') . $nombre;
        $ext = strtolower(pathinfo($nombre, PATHINFO_EXTENSION));
        $archivos[] = [
            'nombre'  => $nombre,
            'titulo'  => titulo_legible($nombre),
            'ext'     => $ext,
            'peso'    => filesize($ruta),
            'url'     => url_descarga($categoria, $relativa),
            'mini'    => url_miniatura($categoria, $relativa, $ext, filemtime($ruta)),
            'oscuro'  => (bool) preg_match('/(blanc|white|negativ)/i', $nombre),
        ];
    }
    usort($archivos, fn($a, $b) => strnatcasecmp($a['nombre'], $b['nombre']));
    return $archivos;
}

/*
 * Apartados de una categoría: los archivos sueltos (sin título) y después
 * uno por cada subcarpeta, titulado con el nombre de la carpeta.
 */
function listar_apartados(string $categoria): array
{
    $apartados = [];
    $sueltos = listar_archivos($categoria);
    if ($sueltos) {
        $apartados[] = ['titulo' => null, 'id' => 'general', 'archivos' => $sueltos];
    }

    $dir = dir_categoria($categoria);
    $carpetas = [];
    foreach (is_dir($dir) ? (scandir($dir) ?: []) : [] as $nombre) {
        if (!ignorado($nombre) && is_dir($dir . '/' . $nombre)) {
            $carpetas[] = $nombre;
        }
    }
    natcasesort($carpetas);

    foreach ($carpetas as $carpeta) {
        $archivos = listar_archivos($categoria, $carpeta);
        // Un número delante del nombre ("01 SVG", "02_PNG") solo fija el orden: no se muestra.
        $titulo = trim(preg_replace('/[_\s]+/', ' ', preg_replace('/^\d+[\s._-]+/', '', $carpeta)));
        if ($archivos) {
            $apartados[] = [
                'titulo'   => $titulo,
                'descripcion' => leer_descripcion(dir_categoria($categoria) . '/' . $carpeta),
                'id'       => 'apartado-' . trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $titulo) ?: $titulo)), '-'),
                'archivos' => $archivos,
            ];
        }
    }
    return $apartados;
}

/* Texto opcional bajo el título del apartado: _descripcion.txt dentro de la carpeta. */
function leer_descripcion(string $dir): ?string
{
    $ruta = $dir . '/_descripcion.txt';
    if (!is_file($ruta)) {
        return null;
    }
    $texto = trim((string) file_get_contents($ruta));
    $texto = preg_replace('/^\xEF\xBB\xBF/', '', $texto); // BOM de algunos editores
    return $texto !== '' ? $texto : null;
}

function titulo_legible(string $nombre): string
{
    $base = pathinfo($nombre, PATHINFO_FILENAME);
    $base = preg_replace('/[-_\s]+(copia|copy)(\s*\d+)?$/i', '', $base);
    return trim(preg_replace('/[_\s]+/', ' ', $base));
}

/* null = sin miniatura posible: se muestra una ficha con la extensión. */
function url_miniatura(string $categoria, string $nombre, string $ext, int $mtime): ?string
{
    if ($ext === 'svg') {
        return url_descarga($categoria, $nombre);
    }
    if (in_array($ext, EXT_IMAGEN, true) || in_array($ext, EXT_OFFICE, true) || in_array($ext, EXT_PDF, true)) {
        return 'miniatura.php?c=' . rawurlencode($categoria) . '&f=' . rawurlencode($nombre) . '&v=' . $mtime;
    }
    return null;
}

function peso_legible(int $bytes): string
{
    $u = ['B', 'KB', 'MB', 'GB'];
    $i = 0;
    $v = (float) $bytes;
    while ($v >= 1000 && $i < count($u) - 1) {
        $v /= 1024;
        $i++;
    }
    return number_format($v, $i === 0 ? 0 : 1, ',', '.') . ' ' . $u[$i];
}

/*
 * Devuelve la ruta de la miniatura en caché, creándola si hace falta.
 * La clave incluye fecha y tamaño: si se sustituye un archivo, se regenera.
 */
function miniatura(string $categoria, string $nombre): ?string
{
    $ruta = dir_categoria($categoria) . '/' . $nombre;
    $ext = strtolower(pathinfo($nombre, PATHINFO_EXTENSION));
    $formato = function_exists('imagewebp') ? 'webp' : 'png';

    $cache_dir = RAIZ . '/' . DIR_MINIATURAS . '/' . $categoria;
    $clave = sha1($nombre . '|' . filemtime($ruta) . '|' . filesize($ruta) . '|' . MINIATURA_MAX);
    $destino = $cache_dir . '/' . $clave . '.' . $formato;
    $fallo = $cache_dir . '/' . $clave . '.none';

    if (is_file($destino)) {
        return $destino;
    }
    if (is_file($fallo)) {
        return null;
    }
    if (!is_dir($cache_dir) && !@mkdir($cache_dir, 0775, true) && !is_dir($cache_dir)) {
        return null;
    }

    @ini_set('memory_limit', '512M');
    $origen = null;
    if (in_array($ext, EXT_IMAGEN, true)) {
        $origen = @imagecreatefromstring((string) file_get_contents($ruta));
    } elseif (in_array($ext, EXT_OFFICE, true)) {
        $origen = miniatura_office($ruta);
    } elseif (in_array($ext, EXT_PDF, true)) {
        $origen = miniatura_pdf($ruta);
    }

    if (!$origen) {
        @touch($fallo);
        return null;
    }

    $mini = redimensionar($origen, MINIATURA_MAX);
    $ok = $formato === 'webp' ? imagewebp($mini, $destino, 82) : imagepng($mini, $destino, 6);
    imagedestroy($mini);
    if ($mini !== $origen) {
        imagedestroy($origen);
    }
    return $ok ? $destino : null;
}

/* Office guarda una vista previa de la primera página/diapositiva en docProps. */
function miniatura_office(string $ruta)
{
    if (!class_exists('ZipArchive')) {
        return null;
    }
    $zip = new ZipArchive();
    if ($zip->open($ruta) !== true) {
        return null;
    }
    $img = null;
    foreach (['docProps/thumbnail.jpeg', 'docProps/thumbnail.jpg', 'docProps/thumbnail.png'] as $interna) {
        $datos = $zip->getFromName($interna);
        if ($datos !== false) {
            $img = @imagecreatefromstring($datos);
            if ($img) {
                break;
            }
        }
    }
    $zip->close();
    return $img ?: null;
}

/* Primera página de PDF/AI/EPS con Imagick (si el hosting lo tiene). */
function miniatura_pdf(string $ruta)
{
    if (!class_exists('Imagick')) {
        return null;
    }
    try {
        $im = new Imagick();
        $im->setResolution(110, 110);
        $im->readImage($ruta . '[0]');
        $im->setImageBackgroundColor('white');
        $im = $im->mergeImageLayers(Imagick::LAYERMETHOD_FLATTEN);
        $im->setImageFormat('png');
        $img = @imagecreatefromstring($im->getImageBlob());
        $im->clear();
        return $img ?: null;
    } catch (Throwable $e) {
        return null;
    }
}

function redimensionar($img, int $max)
{
    $w = imagesx($img);
    $h = imagesy($img);
    $escala = min(1, $max / max($w, $h));
    $nw = max(1, (int) round($w * $escala));
    $nh = max(1, (int) round($h * $escala));

    $mini = imagecreatetruecolor($nw, $nh);
    imagealphablending($mini, false);
    imagesavealpha($mini, true);
    imagefill($mini, 0, 0, imagecolorallocatealpha($mini, 0, 0, 0, 127));
    imagecopyresampled($mini, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
    return $mini;
}
