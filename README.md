# IZZON LAB · Branding Page

Web interna con el brandbook, las plantillas corporativas y los recursos de marca de IZZON LAB.
Reproduce la estructura, colores y tipografías (Fahkwang + Montserrat) del diseño `BRANDINGPAGE_01`.

## Requisitos

Un hosting con **PHP 7.4 o superior** y la extensión **GD** (viene activada en casi todos).
`ZipArchive` (miniaturas de PowerPoint/Word/Excel) e `Imagick` (miniaturas de PDF en el servidor) son opcionales.

Para probar en local:

```bash
php -S localhost:8080
```

## Estructura

```
index.php            Home (intro, brandbook, plantillas, recursos)
logos.php            Página de descarga: logos y recursos gráficos
imagenes.php         Página de descarga: imágenes
iconos.php           Página de descarga: iconos
miniatura.php        Genera y sirve las miniaturas automáticas
inc/
  config.php         Textos de plantillas y categorías (editar aquí)
  header.php         Cabecera común a todas las páginas
  footer.php         Pie común a todas las páginas
  recursos.php       Plantilla de las páginas de descarga
  archivos.php       Listado de archivos y generación de miniaturas
  svg.php            Logotipo, símbolo ZZ e icono de descarga (vectores del PDF)
assets/              CSS, JS e imágenes de la web
descargas/           Archivos que se descargan (ver abajo)
```

## Cómo añadir material

Todo se hace subiendo archivos por FTP o el gestor de archivos del hosting. No hay que tocar código.

| Qué | Dónde se sube | Resultado |
| --- | --- | --- |
| Logos y recursos gráficos | `descargas/logos/` | Aparecen en `logos.php` |
| Imágenes | `descargas/imagenes/` o una subcarpeta (`descargas/imagenes/EMPRESA/`) | Aparecen en `imagenes.php`; cada subcarpeta es un apartado con su nombre como título |
| Iconos | `descargas/iconos/` | Aparecen en `iconos.php` |
| Brandbook en PDF | `descargas/brandbook/` (cualquier `.pdf`) | Activa el botón "Brandbook PDF" |
| Vídeo del brandbook | `descargas/brandbook/` (`.mp4` o `.webm`) | Sustituye el recuadro "VIDEO 01". Arranca solo al entrar (sin sonido, como exigen los navegadores), se reproduce una vez y al terminar muestra "Ver de nuevo" |
| Plantillas Word/Excel/PPT | `descargas/plantillas/` con el nombre indicado en `inc/config.php` | Activa "Descargar plantilla" en la ventana flotante |

Nombres esperados en `descargas/plantillas/` (se pueden cambiar en `inc/config.php`):

- `IZZON-LAB-Word-Modelo-01.docx`, `IZZON-LAB-Word-Modelo-02.docx`, `IZZON-LAB-Word-Modelo-03.docx`
- `IZZON-LAB-Excel-Modelo-01.xlsx`
- `IZZON-LAB-PPT-Interna.pptx`, `IZZON-LAB-PPT-Externa.pptx`

Mientras un archivo no esté subido, su botón aparece como "pendiente/próximamente".

### Miniaturas automáticas

La primera vez que alguien abre una página de descargas, cada archivo nuevo genera su miniatura
y se guarda en `descargas/.miniaturas/`. Si se sustituye un archivo por otro con el mismo nombre,
la miniatura se regenera sola.

| Tipo de archivo | Miniatura |
| --- | --- |
| JPG, PNG, GIF, WEBP, BMP | Reducida en el servidor (mantiene la transparencia) |
| SVG | Se muestra el propio SVG |
| PPTX, DOCX, XLSX (y plantillas `.potx/.dotx/.xltx`) | La vista previa que guarda Office dentro del archivo* |
| PDF | Primera página: en el servidor si hay Imagick; si no, la dibuja el navegador con pdf.js |
| Otros (ZIP, AI, EPS, OTF…) | Ficha con la extensión del archivo |

\* Office solo guarda la vista previa si al guardar está marcada la opción
"Guardar imagen de vista previa" (PowerPoint/Word/Excel → Archivo → Propiedades).

Los archivos cuyo nombre contiene `blanco`, `white` o `negativo` se muestran sobre fondo oscuro.
En logos e iconos hay además un selector de fondo claro/oscuro.

Esto vale para las tres páginas de recursos: una subcarpeta dentro de `logos/`, `imagenes/` o `iconos/`
se muestra como un apartado propio. Si hay más de un apartado, arriba aparecen accesos directos a cada uno.

Para fijar el orden de los apartados, pon un número delante del nombre de la carpeta
(`01 SVG`, `02 PNG`): el número no se muestra en la web. Sin número, van por orden alfabético.

Para poner un texto bajo el título de un apartado, crea dentro de su carpeta un archivo
`_descripcion.txt` con ese texto (por ejemplo `descargas/logos/01 SVG/_descripcion.txt`).

Si un archivo no trae vista previa (por ejemplo un PowerPoint guardado sin ella), sube a la misma
carpeta una imagen llamada `_miniatura_<nombre del archivo>.jpg` (o `.png`, `.webp`). Ejemplo:
`IZZON_LAB_ICONOS.pptx` → `_miniatura_IZZON_LAB_ICONOS.webp`. Se usa como miniatura y no aparece como descarga.

En `inc/config.php`, `'grande' => true` en una categoría muestra miniaturas grandes (se usa en Iconos).

Los archivos y carpetas que empiezan por `.` o `_` no se listan (útil para ocultar algo sin borrarlo).

## Editar textos

- Textos y descripciones de cada plantilla de la ventana flotante: `inc/config.php` → `PLANTILLAS`.
- Títulos y descripciones de las tres páginas de recursos: `inc/config.php` → `CATEGORIAS`.
- Para añadir otra plantilla a un grupo, se añade un elemento a su lista `items` y sus imágenes
  `assets/img/plantillas/<id>.webp` (grande) y `<id>-sm.webp` (miniatura).

## Seguridad

- `descargas/.htaccess` impide ejecutar scripts subidos a esa carpeta y el listado de directorios.
- `inc/.htaccess` bloquea el acceso directo a los parciales PHP.
- `miniatura.php` solo acepta categorías conocidas y archivos dentro de su carpeta.

Estos `.htaccess` son para Apache. En Nginx hay que replicar esas reglas en la configuración del servidor.
