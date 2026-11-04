// ⚙️ Pega aquí la configuración de tu proyecto Firebase
// (Consola Firebase → Configuración del proyecto → Tus apps → App web).
// Si `apiKey` está vacío la app funciona en "modo demo" guardando los datos solo en este dispositivo.
//
// Este archivo es un script clásico para que lo puedan leer tanto la página como el service worker.
self.FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

// Clave VAPID para avisos push (Consola → Cloud Messaging → Certificados push web).
self.FIREBASE_VAPID_KEY = '';
