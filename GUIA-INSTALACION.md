# Guía de instalación de Guachis Home (Android)

Esta guía es para hacerlo **sin experiencia y sin usar la terminal**.
Se hace **una sola vez** y lleva unos **30 minutos**.

Necesitas:
- Un **ordenador** (Windows o Mac) para la parte 1 a la 4.
- Los **móviles Android** de la familia para la parte 5.
- Una **cuenta de Google** (por ejemplo la de Carles). Solo para crear la base de datos.

> No hace falta descargar nada de la Play Store: la app se instala desde **Chrome** y queda con su icono (la casita) como cualquier otra app.

---

## PARTE 1 · Preparar los archivos

1. Descarga el archivo **`guachis-home.zip`** y guárdalo en el **Escritorio**.
2. Haz **clic derecho** sobre el archivo → **Extraer todo…** → **Extraer**.
   (En Mac: doble clic sobre el archivo).
3. Se crea la carpeta **`guachis-home`**. Dentro verás la carpeta **`public`**.
   👉 **La carpeta `public` es la app.** La usarás en la parte 4.

---

## PARTE 2 · Crear la base de datos (Firebase, gratis)

### 2.1 Entrar
Abre en el ordenador: **https://console.firebase.google.com**
Inicia sesión con tu cuenta de Google.

### 2.2 Crear el proyecto
1. Pulsa **Crear un proyecto** (o **Agregar proyecto**).
2. Escribe el nombre: `guachis-home` → **Continuar**.
3. Google Analytics: **desactívalo** → **Crear proyecto**.
4. Espera unos segundos → **Continuar**.

### 2.3 Registrar la app y copiar sus datos
1. En la página del proyecto pulsa el icono **`</>`** (significa "Web").
2. Apodo: `Guachis Home`. **No** marques la casilla "Firebase Hosting".
3. Pulsa **Registrar app**.
4. Aparece un recuadro con texto parecido a este:
   ```
   const firebaseConfig = {
     apiKey: "AIza.....",
     authDomain: "guachis-home-xxxx.firebaseapp.com",
     projectId: "guachis-home-xxxx",
     storageBucket: "guachis-home-xxxx.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   };
   ```
5. **Cópialo y guárdalo en una nota.** Lo usarás en la parte 3.
6. Pulsa **Ir a la consola**.

> Si lo pierdes: rueda dentada ⚙️ **Configuración del proyecto** → baja hasta **Tus apps**.

### 2.4 Crear la base de datos
1. Menú de la izquierda: **Compilación** → **Firestore Database**.
2. Pulsa **Crear base de datos**.
3. Ubicación: **europe-west1 (Bélgica)** → **Siguiente**.
4. Marca **Iniciar en modo de producción** → **Crear**.

### 2.5 Activar la entrada con contraseña
1. Menú de la izquierda: **Compilación** → **Authentication** → **Comenzar**.
2. Pestaña **Método de acceso** → pulsa **Correo electrónico/contraseña**.
3. Activa **solo el primer interruptor** → **Guardar**.

### 2.6 Crear la cuenta de la familia
1. Pestaña **Usuarios** → **Agregar usuario**.
2. Correo: escribe exactamente **`familia@guachis-home.app`**
   (no tiene que ser un correo real, es solo un nombre).
3. Contraseña: la que queráis (mínimo 6 letras o números).
   ✍️ **Apúntala.** Es la que pondréis en todos los móviles.
4. Pulsa **Agregar usuario**.

### 2.7 Que nadie más pueda crearse una cuenta
1. Pestaña **Configuración** → **Acciones del usuario**.
2. **Quita la marca** de **Habilitar creación (registro)** → **Guardar**.

### 2.8 Poner la seguridad
1. Vuelve a **Firestore Database** → pestaña **Reglas**.
2. **Borra todo** lo que hay en el recuadro.
3. Abre el archivo **`firestore.rules`** que está en la carpeta `guachis-home` (clic derecho → Abrir con → Bloc de notas).
4. Selecciona todo (**Ctrl + A**), copia (**Ctrl + C**) y pégalo en el recuadro de Firebase (**Ctrl + V**).
5. Pulsa **Publicar**.

---

## PARTE 3 · Conectar la app con la base de datos

Solo hay que rellenar **un archivo**.

1. Abre la carpeta: `guachis-home` → `public` → `js`.
2. Busca el archivo **`firebase-config.js`**.
3. **Clic derecho** → **Abrir con** → **Bloc de notas**.
   > En Mac usa TextEdit y antes de escribir: menú **Formato → Convertir en texto normal** y menú **Edición → Sustituciones →** quita **Comillas tipográficas**.
4. Busca estas líneas:
   ```
   self.FIREBASE_CONFIG = {
     apiKey: '',
     authDomain: '',
     projectId: '',
     storageBucket: '',
     messagingSenderId: '',
     appId: '',
   };
   ```
5. Copia cada dato de tu nota (paso 2.3) y pégalo **entre las dos comillas** `''`.
   Debe quedar así (con tus datos):
   ```
   self.FIREBASE_CONFIG = {
     apiKey: 'AIza.....',
     authDomain: 'guachis-home-xxxx.firebaseapp.com',
     projectId: 'guachis-home-xxxx',
     storageBucket: 'guachis-home-xxxx.firebasestorage.app',
     messagingSenderId: '1234567890',
     appId: '1:1234567890:web:abcdef',
   };
   ```
   ✅ Deja las comas del final de cada línea.
   ✅ No copies las comillas dobles `" "` de Firebase, solo el texto de dentro.
6. Guarda el archivo: **Ctrl + S**. Ciérralo.

---

## PARTE 4 · Publicar la app en internet (Netlify, gratis)

### 4.1 Crear la cuenta
Abre **https://app.netlify.com/signup** y regístrate (con tu email o con Google).

### 4.2 Subir la app
1. Pulsa **Add new project** (o **Add new site**).
2. Elige **Deploy manually**.
3. **Arrastra la carpeta `public`** (la de dentro de `guachis-home`) al recuadro **Drag and drop**.
4. Espera unos segundos. Te dará una dirección del tipo `https://nombre-raro-123.netlify.app`.

### 4.3 Ponerle un nombre fácil
1. Pulsa **Project configuration** (o **Site configuration**).
2. Pulsa **Change project name** (o **Change site name**).
3. Escribe por ejemplo: `guachis-home-familia` → **Save**.
4. Tu app queda en: **`https://guachis-home-familia.netlify.app`**
   ✍️ **Apunta esta dirección.**

### 4.4 Autorizar la dirección en Firebase
1. Vuelve a Firebase → **Authentication** → pestaña **Configuración**.
2. **Dominios autorizados** → **Agregar dominio**.
3. Escribe `guachis-home-familia.netlify.app` (sin `https://`) → **Agregar**.

### 4.5 Probar en el ordenador
1. Abre tu dirección en el navegador.
2. Debe salir la casita y pedir la **contraseña de la familia**. Escríbela → **Entrar**.
3. Elige quién eres. Verás la agenda con los horarios de Gabri, Franci y el trabajo de Carles y Adriana.
4. Pulsa la rueda ⚙️ **Ajustes**: debe poner **"Firebase · sincronizado con la familia"**.
   Si pone **"Modo demo"**, revisa la parte 3 y vuelve a subir la carpeta `public` (Netlify → tu proyecto → pestaña **Deploys** → arrastrar).

---

## PARTE 5 · Instalar en cada móvil Android

Repite esto en **cada** teléfono:

1. Abre **Chrome** (el navegador de Google, el icono redondo de colores).
2. Escribe arriba la dirección: **`guachis-home-familia.netlify.app`**
3. Escribe la **contraseña de la familia** → **Entrar**.
4. Elige **¿Quién eres?** (Carles, Adriana, Gabri o Franci).
5. Pulsa los **tres puntos ⋮** (arriba a la derecha).
6. Pulsa **Instalar aplicación** (o **Añadir a pantalla de inicio**) → **Instalar**.
7. Aparecerá el icono de la **casita** en la pantalla del móvil. 🏠
8. Cierra Chrome y abre la app **desde el icono**.
9. Dentro de la app: ⚙️ **Ajustes** → **Activar avisos en este móvil** → **Permitir**.

> Cada móvil recuerda quién es, aunque todos usen la misma contraseña.

---

## ✅ Comprobar que todo funciona

1. En un móvil, pulsa el botón **+** y crea una actividad de prueba.
2. Mira otro móvil: debe aparecer en **pocos segundos**.
3. Bórrala después (tócala → **Eliminar**).

---

## 🆘 Si algo no funciona

| Lo que ves | Qué hacer |
|---|---|
| **Contraseña incorrecta** | Revisa mayúsculas y minúsculas. Para cambiarla: Firebase → Authentication → Usuarios → ⋮ al lado de la cuenta. |
| En Ajustes pone **Modo demo** | El archivo `firebase-config.js` no quedó bien guardado. Repite la parte 3 y vuelve a arrastrar `public` a Netlify (pestaña **Deploys**). |
| **Esta cuenta no tiene acceso** | El correo debe ser exactamente `familia@guachis-home.app` en Firebase (paso 2.6), en `firestore.rules` y en `firebase-config.js`. |
| No sale **Instalar aplicación** | Asegúrate de usar **Chrome**. Recarga la página y espera unos segundos. |
| No veo los cambios nuevos | Cierra la app del todo y ábrela otra vez. |

---

## 🔔 Sobre los avisos

Con esta forma de publicar, los avisos suenan **mientras la app está abierta**.
Para que suenen **con la app cerrada** hace falta un paso avanzado (plan de pago "Blaze" de Firebase, casi 0 € al mes, y usar la terminal). Está explicado en `PUBLICAR.md`. Se puede hacer más adelante.

---

## 🔄 Actualizar la app en el futuro

Cuando recibas una versión nueva:
1. Copia tu archivo `firebase-config.js` ya relleno a la carpeta nueva (`public` → `js`), sustituyendo el que venga.
2. Netlify → tu proyecto → pestaña **Deploys** → **arrastra la carpeta `public` nueva**.

Los datos de la familia **no se borran**.
