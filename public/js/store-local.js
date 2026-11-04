// Almacenamiento local (modo demo, sin Firebase).
import { lastDateOf } from './recurrence.js';

const KEY = 'gh.activities.v1';
const listeners = new Set();

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
  listeners.forEach((l) => l.emit());
}

const uid = () => `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const localStore = {
  mode: 'local',
  async init() {
    return { ok: true };
  },
  subscribe(fromKey, cb) {
    const l = { emit: () => cb(read().filter((a) => lastDateOf(a) >= fromKey)) };
    listeners.add(l);
    setTimeout(l.emit, 0);
    return () => listeners.delete(l);
  },
  async save(a) {
    const list = read();
    const item = { ...a, id: a.id || uid(), lastDate: lastDateOf(a), updatedAt: Date.now() };
    const i = list.findIndex((x) => x.id === item.id);
    if (i >= 0) list[i] = item;
    else list.push(item);
    write(list);
    return item.id;
  },
  async remove(id) {
    write(read().filter((a) => a.id !== id));
  },
  async addException(id, day) {
    const list = read();
    const a = list.find((x) => x.id === id);
    if (a) {
      a.exceptions = [...new Set([...(a.exceptions || []), day])];
      write(list);
    }
  },
  async importMissing(items) {
    const list = read();
    const ids = new Set(list.map((a) => a.id));
    let n = 0;
    for (const it of items) {
      if (ids.has(it.id)) continue;
      list.push({ ...it, lastDate: lastDateOf(it), updatedAt: Date.now() });
      n++;
    }
    write(list);
    return n;
  },
  async patchMany(patches) {
    const list = read();
    for (const { id, data } of patches) {
      const i = list.findIndex((x) => x.id === id);
      if (i >= 0) list[i] = { ...list[i], ...data };
    }
    write(list);
  },
  async registerDevice() {
    return null;
  },
  async signOut() {},
};
