<?php
/*
 * Configuración central de la Branding Page de IZZON LAB.
 * Para añadir material basta con subir los archivos a la carpeta /descargas
 * correspondiente: el listado y las miniaturas se generan solos.
 */

declare(strict_types=1);

const RAIZ = __DIR__ . '/..';
const DIR_DESCARGAS = 'descargas';
const DIR_MINIATURAS = 'descargas/.miniaturas';
const MINIATURA_MAX = 560; // px del lado mayor

/* Páginas de recursos descargables (sección inferior de la home). */
const CATEGORIAS = [
    'logos' => [
        'pagina'      => 'logos.php',
        'titulo'      => 'Logos y recursos gráficos',
        'titulo_html' => 'LOGOS Y<br>RECURSOS GRÁFICOS',
        'descripcion' => 'Logotipos en diferentes formatos y elementos para presentaciones.',
        'fondo'       => true, // muestra el selector de fondo claro/oscuro
    ],
    'imagenes' => [
        'pagina'      => 'imagenes.php',
        'titulo'      => 'Imágenes',
        'titulo_html' => 'IMÁGENES',
        'descripcion' => 'Imágenes de la empresa, fondos, ficticios y otros.',
        'fondo'       => false,
    ],
    'iconos' => [
        'pagina'      => 'iconos.php',
        'titulo'      => 'Iconos',
        'titulo_html' => 'ICONOS',
        'descripcion' => 'Iconos en formato PPT para las presentaciones.',
        'fondo'       => true,
    ],
];

/*
 * Plantillas de la home (ventana flotante). "archivo" es el nombre del
 * documento dentro de /descargas/plantillas; si aún no existe, el botón
 * de descarga aparece como "pendiente".
 */
const PLANTILLAS = [
    'word' => [
        'titulo'      => 'PLANTILLAS<br>WORD',
        'texto'       => 'Selecciona el tipo de plantilla, visualízala y si es la que se ajusta a tus necesidades, descárgala en tu ordenador.',
        'items' => [
            [
                'id' => 'word-modelo-01', 'nombre' => 'Modelo 01', 'archivo' => 'IZZON-LAB-Word-Modelo-01.docx',
                'tipo' => 'Carta corporativa', 'formato' => 'Word · A4 vertical',
                'descripcion' => 'Carta oficial con logotipo y claim en cabecera y las direcciones de nuestras sedes en el pie. Incluye fecha, destinatario, asunto, cuerpo y bloque de firma.',
            ],
            [
                'id' => 'word-modelo-02', 'nombre' => 'Modelo 02', 'archivo' => 'IZZON-LAB-Word-Modelo-02.docx',
                'tipo' => 'Carta con datos en cabecera', 'formato' => 'Word · A4 vertical',
                'descripcion' => 'Variante de la carta corporativa con las direcciones de las sedes alineadas a la derecha de la cabecera. Pensada para comunicaciones externas.',
            ],
            [
                'id' => 'word-modelo-03', 'nombre' => 'Modelo 03', 'archivo' => 'IZZON-LAB-Word-Modelo-03.docx',
                'tipo' => 'Documento general', 'formato' => 'Word · A4 vertical',
                'descripcion' => 'Documento de texto con título y cuerpo para informes, procedimientos, notas internas o cualquier contenido extenso.',
            ],
        ],
    ],
    'excel' => [
        'titulo'      => 'PLANTILLAS<br>EXCEL',
        'texto'       => 'Selecciona el tipo de plantilla, visualízala y si es la que se ajusta a tus necesidades, descárgala en tu ordenador.',
        'items' => [
            [
                'id' => 'excel-modelo-01', 'nombre' => 'Modelo 01', 'archivo' => 'IZZON-LAB-Excel-Modelo-01.xlsx',
                'tipo' => 'Hoja de datos', 'formato' => 'Excel · A4 vertical',
                'descripcion' => 'Plantilla con cabecera de indicadores comparativos y cuatro modelos de tabla: seguimiento diario, categorías con totales, estados con fechas y referencias.',
            ],
        ],
    ],
    'ppt' => [
        'titulo'      => 'PLANTILLAS PPT',
        'texto'       => 'Selecciona el tipo de plantilla que necesites, visualiza si es la correcta y descárgala en tu ordenador.',
        'items' => [
            [
                'id' => 'ppt-interna', 'nombre' => 'Interna', 'archivo' => 'IZZON-LAB-PPT-Interna.pptx',
                'tipo' => 'Presentación interna', 'formato' => 'PowerPoint · 16:9',
                'descripcion' => 'Portada con imagen de mar, logotipo y claim, y espacio para título, año y fecha. Para reuniones y presentaciones de equipo.',
            ],
            [
                'id' => 'ppt-externa', 'nombre' => 'Externa', 'archivo' => 'IZZON-LAB-PPT-Externa.pptx',
                'tipo' => 'Presentación externa', 'formato' => 'PowerPoint · 16:9',
                'descripcion' => 'Portada luminosa con velos dorados y el claim "A new horIZZON of beauty". Para clientes, proveedores y eventos.',
            ],
        ],
    ],
];

function e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/* URL de un archivo dentro de /descargas, con cada segmento codificado. */
function url_descarga(string $carpeta, string $archivo): string
{
    return DIR_DESCARGAS . '/' . rawurlencode($carpeta) . '/' . rawurlencode($archivo);
}

/* Primer archivo con alguna de las extensiones dadas dentro de una carpeta de descargas. */
function primer_archivo(string $carpeta, array $extensiones): ?string
{
    $dir = RAIZ . '/' . DIR_DESCARGAS . '/' . $carpeta;
    foreach (glob($dir . '/*') ?: [] as $ruta) {
        if (is_file($ruta) && in_array(strtolower(pathinfo($ruta, PATHINFO_EXTENSION)), $extensiones, true)) {
            return basename($ruta);
        }
    }
    return null;
}
