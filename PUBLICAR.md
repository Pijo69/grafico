# Publicar Guachis Home (paso a paso)

Se hace **una sola vez**, desde un ordenador, y lleva unos 20–30 minutos.
Al terminar tendréis la app en `https://TU-PROYECTO.firebaseapp.com`, con los datos compartidos entre los 4 móviles en tiempo real.

---

## 0. Lo que necesitas

- Una cuenta de Google **solo para crear el proyecto** (la de Carles sirve). La familia **no** necesita email: entraréis todos con una **cuenta familiar** y una contraseña.
- En el ordenador: **Node.js** (versión 20 o superior) → https://nodejs.org (botón "LTS").
- **Git** → https://git-scm.com (en Mac ya viene instalado).

---

## 1. Crear el proyecto en Firebase

1. Entra en https://console.firebase.google.com y pulsa **Crear un proyecto**.
   - Nombre: por ejemplo `guachis-home`. Apunta el **ID del proyecto** que te propone (p. ej. `guachis-home-1a2b3`).
   - Google Analytics: puedes desactivarlo.
2. **Authentication** (menú izquierdo → Compilación → Authentication) → **Comenzar**:
   - Pestaña *Método de acceso* → **Correo electrónico/contraseña** → Habilitar (solo el primer interruptor) → Guardar.
   - Pestaña *Usuarios* → **Añadir usuario**:
     - Correo: `familia@guachis-home.app` (no tiene que existir, es solo un nombre de usuario)
     - Contraseña: la que queráis (mínimo 6 caracteres). **Es la contraseña que usará toda la familia.**
   - Pestaña *Configuración* → *Acciones de usuario* → **desmarca** "Habilitar la creación (registro)". Así nadie más puede crearse una cuenta.
   - (Opcional) Si alguien quiere entrar con su propio Gmail: *Método de acceso* → **Google** → Habilitar, y añade su correo en `firestore.rules` (paso 3.2).
3. **Firestore Database** → **Crear base de datos** → *Modo de producción* → ubicación **`europe-west1` (Bélgica)** → Habilitar.
4. **Configuración del proyecto** (rueda dentada ⚙️ arriba a la izquierda) → pestaña *General* → abajo, en *Tus apps*, pulsa el icono **`</>`** (Web):
   - Apodo: `Guachis Home`. **No** marques Firebase Hosting aquí (lo haremos con la terminal).
   - Te mostrará un bloque `const firebaseConfig = { apiKey: ..., authDomain: ..., ... }`. **Cópialo**, lo usarás en el paso 3.
5. **Avisos push** (para que suenen con la app cerrada): Configuración del proyecto → pestaña **Cloud Messaging** → *Configuración web* → *Certificados push web* → **Generar par de claves**. Copia la clave (empieza por `B...`).
6. **Plan Blaze** (necesario solo para los avisos con la app cerrada): abajo a la izquierda pulsa *Spark* → **Actualizar a Blaze** y añade una tarjeta. Con el uso de una familia el coste es prácticamente **0 €**. Recomendado: en Google Cloud → Facturación → *Presupuestos y alertas* crea un presupuesto de 1 € para que te avise si algo se dispara.
   - Si no quieres el plan Blaze, la app funciona igual (base de datos, sincronización, todo); solo los avisos llegarán únicamente cuando la app esté abierta.

---

## 2. Descargar el código

Abre la **Terminal** (Mac) o **PowerShell** (Windows) y escribe:

```bash
git clone -b claude/family-schedule-firebase-app-8th208 https://github.com/pijo69/grafico.git
```

```bash
cd grafico
```

---

## 3. Configurar 3 archivos

Ábrelos con cualquier editor de texto (Bloc de notas, TextEdit, VS Code…).

### 3.1 `public/js/firebase-config.js`

Pega los datos del paso 1.4 **tal cual te los da Firebase** (el ejemplo es orientativo) y la clave del paso 1.5. **Importante:** `authDomain` debe ser `TU-ID.firebaseapp.com`.

```js
self.FIREBASE_CONFIG = {
  apiKey: 'AIza...',
  authDomain: 'guachis-home-1a2b3.firebaseapp.com',
  projectId: 'guachis-home-1a2b3',
  storageBucket: 'guachis-home-1a2b3.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abcdef',
};

self.FAMILY_EMAIL = 'familia@guachis-home.app';   // el usuario que creaste en el paso 1.2

self.FIREBASE_VAPID_KEY = 'BOp...la-clave-del-paso-1.5...';
```

> La `apiKey` de Firebase **no es secreta**: identifica el proyecto. La seguridad la dan las reglas del paso 3.2.

### 3.2 `firestore.rules` — quién puede entrar

Ya viene preparado para la cuenta familiar `familia@guachis-home.app`: **no hace falta tocar nada** si usaste ese correo en el paso 1.2.

- Si elegiste otro correo para la cuenta familiar, cámbialo aquí **y** en `firebase-config.js` (deben ser iguales).
- Opcional: si alguien quiere entrar con su propio Gmail, añádelo en la lista (quitando las `//`):

```
request.auth.token.email in [
  'carles@gmail.com',
]
```

Solo la cuenta familiar (y los Gmail que añadas) podrán ver y modificar la agenda.

### 3.3 `.firebaserc`

Cambia `TU-PROYECTO-FIREBASE` por el **ID del proyecto** (p. ej. `guachis-home-1a2b3`).

---

## 4. Publicar

En la terminal, dentro de la carpeta `grafico`:

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

```bash
cd functions && npm install && cd ..
```

Con plan Blaze (todo, incluidos avisos con la app cerrada):

```bash
firebase deploy
```

Sin plan Blaze (todo menos los avisos con la app cerrada):

```bash
firebase deploy --only hosting,firestore
```

Al terminar verás: `Hosting URL: https://guachis-home-1a2b3.web.app`.
**Usad la dirección `https://guachis-home-1a2b3.firebaseapp.com`** (es la misma app; con esta el inicio de sesión de Google va mejor en los móviles, sobre todo en iPhone).

---

## 5. Instalar en cada móvil

1. Abre `https://TU-ID.firebaseapp.com`:
   - **iPhone**: con **Safari**.
   - **Android**: con **Chrome**.
2. Escribe la **contraseña de la familia** y pulsa **Entrar** (solo la primera vez: el móvil la recuerda).
3. Elige **¿Quién eres?** (Carles, Adriana, Gabri o Franci). Cada móvil recuerda quién es, aunque todos usen la misma cuenta, y los avisos llegan a la persona elegida.
4. Añádela a la pantalla de inicio (aparecerá con el icono de la casita):
   - **iPhone**: botón Compartir (cuadrado con flecha) → **Añadir a pantalla de inicio**.
   - **Android**: menú ⋮ → **Instalar aplicación** (o *Añadir a pantalla de inicio*).
5. Abre la app **desde el icono** → ⚙️ Ajustes → **Activar avisos en este móvil** → Permitir.
   - En iPhone los avisos solo funcionan con la app abierta desde el icono (iOS 16.4 o superior).

La primera vez que alguien entra, la app carga sola los horarios de **Gabri**, **Franci** y la jornada de trabajo de **Carles y Adriana**. Los demás móviles los verán al momento.

---

## 6. Comprobar que la base de datos funciona

- Crea una actividad en un móvil → debe aparecer **en segundos** en los demás.
- En la consola de Firebase → **Firestore Database** → verás la colección `activities` con todas las actividades y `devices` con los móviles que activaron avisos.
- Ajustes de la app debe decir: *Base de datos: Firebase · sincronizado con la familia*.
- Sin conexión la app sigue funcionando con lo último guardado y sincroniza al recuperar la red.

### Problemas típicos

| Síntoma | Solución |
|---|---|
| "Contraseña incorrecta" | Revisa la contraseña. Para cambiarla: Authentication → Usuarios → ⋮ junto a `familia@…` → Restablecer contraseña / Editar. |
| "Esta cuenta no tiene acceso a la agenda familiar" | El correo de la cuenta familiar no coincide entre `firebase-config.js`, `firestore.rules` y el usuario creado. Corrígelo y ejecuta `firebase deploy`. |
| Ajustes dice *Modo demo* | `firebase-config.js` está vacío o mal copiado. Corrígelo y `firebase deploy --only hosting`. |
| En iPhone no deja entrar con Google | Usa la contraseña de la familia, o abre la dirección `…firebaseapp.com` (no `…web.app`). |
| No llegan los avisos con la app cerrada | Hace falta el plan Blaze, haber publicado con `firebase deploy` y pulsar *Activar avisos* en ese móvil. En iPhone, abrir la app desde el icono. |
| `Error: HTTP 403` al publicar funciones | Activa el plan Blaze y vuelve a ejecutar `firebase deploy`. |

---

## 7. Actualizar la app más adelante

Cuando haya cambios nuevos:

```bash
git pull
```

```bash
firebase deploy
```

Los datos de la familia no se tocan: solo se actualiza la app.
