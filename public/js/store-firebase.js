// Almacenamiento en Firebase (Firestore + Auth + Cloud Messaging).
import { lastDateOf } from './recurrence.js';

const V = '10.14.1';
const CDN = `https://www.gstatic.com/firebasejs/${V}`;

let fb = null; // módulos cargados
let app, auth, db;

async function load() {
  if (fb) return fb;
  const [appM, authM, fsM] = await Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-auth.js`),
    import(`${CDN}/firebase-firestore.js`),
  ]);
  fb = { ...appM, ...authM, ...fsM };
  return fb;
}

export const firebaseStore = {
  mode: 'firebase',
  user: null,

  /** Inicializa y espera a saber si hay sesión. Devuelve { ok, user }. */
  async init() {
    const f = await load();
    app = f.initializeApp(self.FIREBASE_CONFIG);
    auth = f.getAuth(app);
    try {
      db = f.initializeFirestore(app, {
        localCache: f.persistentLocalCache({ tabManager: f.persistentMultipleTabManager() }),
      });
    } catch {
      db = f.getFirestore(app);
    }
    try {
      await f.getRedirectResult(auth);
    } catch {
      /* sin redirección pendiente */
    }
    const user = await new Promise((res) => {
      const off = f.onAuthStateChanged(auth, (u) => {
        off();
        res(u);
      });
    });
    this.user = user;
    return { ok: !!user, user };
  },

  async signIn() {
    const f = await load();
    const provider = new f.GoogleAuthProvider();
    try {
      const r = await f.signInWithPopup(auth, provider);
      this.user = r.user;
      return r.user;
    } catch (e) {
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
        await f.signInWithRedirect(auth, provider);
      }
      throw e;
    }
  },

  async signOut() {
    await fb.signOut(auth);
  },

  subscribe(fromKey, cb, onError) {
    const q = fb.query(fb.collection(db, 'activities'), fb.where('lastDate', '>=', fromKey));
    return fb.onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => onError && onError(err)
    );
  },

  async save(a) {
    const { id, ...data } = a;
    const ref = id ? fb.doc(db, 'activities', id) : fb.doc(fb.collection(db, 'activities'));
    await fb.setDoc(ref, {
      ...data,
      lastDate: lastDateOf(a),
      updatedAt: fb.serverTimestamp(),
      updatedBy: this.user?.email || null,
    });
    return ref.id;
  },

  async remove(id) {
    await fb.deleteDoc(fb.doc(db, 'activities', id));
  },

  async addException(id, day) {
    await fb.updateDoc(fb.doc(db, 'activities', id), { exceptions: fb.arrayUnion(day) });
  },

  async importMissing(items) {
    const snap = await fb.getDocs(
      fb.query(fb.collection(db, 'activities'), fb.where('source', '==', items[0]?.source || ''))
    );
    const have = new Set(snap.docs.map((d) => d.id));
    const batch = fb.writeBatch(db);
    let n = 0;
    for (const { id, ...data } of items) {
      if (have.has(id)) continue;
      batch.set(fb.doc(db, 'activities', id), {
        ...data,
        lastDate: lastDateOf(data),
        updatedAt: fb.serverTimestamp(),
        updatedBy: this.user?.email || null,
      });
      n++;
    }
    if (n) await batch.commit();
    return n;
  },

  /** Registra este dispositivo para recibir avisos push de las personas indicadas. */
  async registerDevice(persons, lang, swReg) {
    const m = await import(`${CDN}/firebase-messaging.js`);
    if (!(await m.isSupported())) throw new Error('unsupported');
    const messaging = m.getMessaging(app);
    const token = await m.getToken(messaging, {
      vapidKey: self.FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    if (!token) throw new Error('no-token');
    await fb.setDoc(fb.doc(db, 'devices', token), {
      persons,
      lang,
      email: this.user?.email || null,
      updatedAt: fb.serverTimestamp(),
    });
    m.onMessage(messaging, (payload) => {
      const n = payload.notification || payload.data || {};
      swReg.showNotification(n.title || 'Guachis Home', { body: n.body || '', icon: 'icons/icon-192.png' });
    });
    return token;
  },
};
