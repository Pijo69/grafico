# Guachis Home · agenda familiar

App web (PWA, se instala en el móvil) para ver y editar los horarios de **Carles** (naranja), **Adriana** (fucsia), **Gabri** (verde) y **Franci** (morado), sincronizada en tiempo real con **Firebase**.

## Qué hace

- **Home**: el día actual arriba, flechas, tira de días deslizable (2 meses antes y 2 después) y selector de fecha para ir a cualquier otro día. También se puede deslizar el dedo a izquierda/derecha sobre el horario.
- **Filtro de personas**: una, varias o «Todos». Cada persona tiene su columna y su color.
- **Franjas horarias** desde las 8:00 (o antes si hay algo más temprano) hasta las 21:00 (o más tarde si hace falta), con una línea que marca la hora actual.
- **Punto rojo**: aparece en la actividad y en el día de la tira cuando algo es SÚPER IMPORTANTE.
- **Botón + flotante** (cuando hay una sola persona seleccionada): toca una hora para elegirla y pulsa + para añadir una actividad. Si tocas una actividad, se abre para editarla.
- **Editor**: etiqueta habitual (trabajo, colegio, extraescolar, deberes, fútbol, piano, solfeo, inglés, gimnasia) o extra (examen, compra, tarea, médico, burocracia, taller arte, viaje trabajo, festivo), desde/hasta (minutos, horas o días, con botones de duración rápida), repetición (extra, diario, entre semana, semanal), importancia (muy importante, urgente, normal, relajado) y **aviso en el móvil**.
- El **color de cada actividad es más o menos intenso** según su importancia.
- **Resumen** del día en texto y **voz**: global (los 4) o las personas que elijas (1, 2 o 3).
- Idiomas: **Español** (predefinido), **Italiano** y **Valenciano**.
- Pantalla de carga con el **logo animado**. El logo también aparece animado en los cargadores, los avisos y el estado vacío.
- Los **horarios de Gabri (1.º ESO B) y Franci (3.º Primaria, octubre–mayo)** de los Excel se importan automáticamente la primera vez (clases semanales del 7/9/2026 al 18/6/2027 y extraescolares). También se puede importar desde Ajustes.

## Probar ya (modo demo)

Sin configurar nada, la app funciona guardando los datos solo en ese dispositivo:

```bash
cd public
```

```bash
python3 -m http.server 8080
```

Después abre http://localhost:8080

## Conectar con Firebase (para compartirla con la familia)

👉 **Guía detallada paso a paso: [PUBLICAR.md](PUBLICAR.md)**

1. Crea un proyecto en https://console.firebase.google.com
2. **Authentication** → Métodos de acceso → activa **Google**.
3. **Firestore Database** → Crear base de datos (modo producción, región `eur3` o `europe-west1`).
4. Configuración del proyecto → **Tus apps** → añade una **App web** y copia su configuración en `public/js/firebase-config.js`.
5. **Cloud Messaging** → Certificados push web → **Generar par de claves** y pega la clave en `FIREBASE_VAPID_KEY` (en el mismo archivo).
6. En `firestore.rules` cambia los 4 correos de ejemplo por las cuentas de Google de la familia.
7. En `.firebaserc` pon el id de tu proyecto.
8. Instala la CLI y publica:

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

```bash
cd functions && npm install && cd ..
```

```bash
firebase deploy
```

La app queda en `https://TU-PROYECTO.web.app`. En el móvil: abrir la web → «Añadir a pantalla de inicio».

### Avisos con la app cerrada

- Los envía la Cloud Function `sendActivityAlerts` (cada 5 minutos, hora de Madrid), así que necesitas el **plan Blaze** de Firebase. Con el uso de una familia el coste es prácticamente cero.
- Cada móvil tiene que pulsar **Ajustes → Activar avisos en este móvil**. Cada móvil recibe los avisos de la persona que ha elegido en «¿Quién eres?».
- En **iPhone** los avisos solo funcionan si la app está añadida a la pantalla de inicio (iOS 16.4 o posterior).
- En modo demo, los avisos solo suenan mientras la app está abierta.

## Estructura

```
public/            App (HTML/CSS/JS sin compilación)
  js/app.js        Interfaz: home, franjas, editor, resumen, ajustes
  js/config.js     Personas, colores, etiquetas y prioridades
  js/i18n.js       Traducciones es / it / va
  js/logo.js       Logo en piezas para animarlo
  js/seed-gabri.js Horario de Gabri a partir del Excel
  js/store-*.js    Datos: Firebase o local (demo)
  sw.js            Service worker (sin conexión + avisos push)
functions/         Cloud Function que envía los avisos
firestore.rules    Seguridad: solo la familia puede leer y escribir
```

### Modelo de datos (`activities`)

`person`, `title`, `tag`, `priority`, `startDate`, `startTime`, `endDate`, `endTime`, `allDay`, `repeat` (`none` | `daily` | `weekdays` | `weekly`), `repeatUntil`, `exceptions[]` (días borrados de una serie), `alert { enabled, minutesBefore }`, `notes`, `lastDate` (para consultar solo la ventana de fechas necesaria).
