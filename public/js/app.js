import {
  PEOPLE, PERSON, TAGS, TAG, PRIORITIES, PRIORITY, REPEATS, ALERT_OPTIONS,
  WINDOW_DAYS, DEFAULT_START_HOUR, DEFAULT_END_HOUR, PX_PER_MIN,
} from './config.js';
import { fromKey, todayKey, addDays, diffDays, timeToMin, minToTime, fmtTime, nowMin } from './dates.js';
import { LANGS, setLang, getLang, t, fmtDate } from './i18n.js';
import { occurrencesOn, occurrenceOn, layoutLanes } from './recurrence.js';
import { logoFull, logoMark, loader } from './logo.js';
import { ICON } from './icons.js';
import { personSummary, speak, stopSpeaking } from './summary.js';
import { gabriSeed } from './seed-gabri.js';
import { localStore } from './store-local.js';

/* ───────────────────────── Estado ───────────────────────── */

const PREFS_KEY = 'gh.prefs.v1';
const prefs = (() => {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
  } catch {
    return {};
  }
})();
const savePrefs = () => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* sin almacenamiento */
  }
};

const state = {
  date: todayKey(),
  selected: new Set(prefs.selected?.length ? prefs.selected : [prefs.me || 'carles']),
  activities: [],
  from: null,
  unsub: null,
  slot: null, // { day, min }
  loaded: false,
  stripRange: null,
};

let store = localStore;
let swReg = null;
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const selectedIds = () => PEOPLE.map((p) => p.id).filter((id) => state.selected.has(id));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ───────────────────────── Arranque ───────────────────────── */

async function boot() {
  setLang(prefs.lang || 'es');
  const splash = $('#splash');
  splash.innerHTML = `${logoFull('splash-logo')}<div class="splash-dots"><i></i><i></i><i></i></div>`;
  const minSplash = wait(reduceMotion() ? 400 : 2100);

  registerSW();

  const cfg = self.FIREBASE_CONFIG || {};
  if (cfg.apiKey) {
    try {
      const { firebaseStore } = await import('./store-firebase.js');
      store = firebaseStore;
    } catch (e) {
      console.warn('Firebase no disponible, modo demo', e);
      store = localStore;
    }
  }

  let session;
  try {
    session = await store.init();
  } catch (e) {
    console.warn('Error iniciando Firebase, modo demo', e);
    store = localStore;
    session = await store.init();
  }

  await minSplash;

  if (!session.ok) {
    showLogin();
    return;
  }
  startApp();
}

function showLogin(msg = '') {
  const splash = $('#splash');
  splash.classList.add('login');
  splash.innerHTML = `
    ${logoFull('splash-logo static')}
    <p class="login-sub fade-up" style="--d:0">${esc(t('signInSub'))}</p>
    ${msg ? `<p class="login-err fade-up" style="--d:1">${esc(msg)}</p>` : ''}
    <button class="btn btn-light press fade-up" style="--d:2" id="btnLogin">
      <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
      <span>${esc(t('signIn'))}</span>
    </button>`;
  $('#btnLogin').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    b.innerHTML = loader('', 'inline');
    try {
      await store.signIn();
      splash.classList.remove('login');
      startApp();
    } catch (err) {
      console.warn(err);
      showLogin(err?.message || '');
    }
  });
}

function startApp() {
  $('#app').hidden = false;
  renderShell();
  subscribe();
  if (!prefs.me) setTimeout(() => openSettings(true), 300);
  setInterval(tickNow, 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tickNow(true);
  });
}

function hideSplash() {
  const splash = $('#splash');
  if (!splash || splash.classList.contains('leave')) return;
  splash.classList.add('leave');
  document.body.classList.add('ready');
  setTimeout(() => splash.remove(), 650);
}

/* ───────────────────────── Datos ───────────────────────── */

function subscribe() {
  const base = state.date < todayKey() ? state.date : todayKey();
  state.from = addDays(base, -WINDOW_DAYS);
  state.unsub && state.unsub();
  state.unsub = store.subscribe(
    state.from,
    async (list) => {
      state.activities = list;
      if (!state.loaded) {
        state.loaded = true;
        await maybeSeed(list);
        hideSplash();
      }
      renderData();
      scheduleLocalAlerts();
    },
    (err) => {
      console.warn(err);
      hideSplash();
      if (err?.code === 'permission-denied') {
        $('#app').hidden = true;
        document.body.insertAdjacentHTML('beforeend', '<div id="splash"></div>');
        showLogin(t('notAllowed'));
        store.signOut();
      }
    }
  );
}

async function maybeSeed(list) {
  // Carga automática del horario de Gabri la primera vez (si aún no existe en la base de datos).
  if (list.some((a) => a.source === 'excel-1eso-b')) return;
  const flag = 'gh.seeded.gabri';
  try {
    if (localStorage.getItem(flag)) return;
    localStorage.setItem(flag, '1');
  } catch {
    /* sin almacenamiento */
  }
  try {
    const n = await store.importMissing(gabriSeed());
    if (n) toast(t('imported'));
  } catch (e) {
    console.warn('No se pudo importar el horario', e);
  }
}

function ensureWindow() {
  if (state.date < addDays(state.from, 3)) subscribe();
}

/* ───────────────────────── Estructura ───────────────────────── */

function renderShell() {
  $('#app').innerHTML = `
    <header class="top">
      <div class="top-row">
        <button class="brand press" id="btnToday" aria-label="${esc(t('today'))}">${logoMark()}</button>
        <button class="day-title press-soft" id="btnPick" aria-label="${esc(t('pickDate'))}">
          <span class="day-sub" id="daySub"></span>
          <span class="day-main" id="dayMain"></span>
        </button>
        <button class="icon-btn press" id="btnSettings" aria-label="${esc(t('settings'))}">${ICON.gear}</button>
      </div>
      <div class="strip-row">
        <button class="arrow press" id="btnPrev" aria-label="${esc(t('prevDay'))}">${ICON.left}</button>
        <div class="strip" id="strip"></div>
        <button class="arrow press" id="btnNext" aria-label="${esc(t('nextDay'))}">${ICON.right}</button>
      </div>
      <nav class="people" id="people" aria-label="${esc(t('who'))}"></nav>
      <div class="status-row">
        <div class="day-icons" id="dayIcons"></div>
        <button class="sum-btn press" id="btnSummary">${ICON.chat}<span>${esc(t('summary'))}</span>${ICON.speaker}</button>
      </div>
    </header>
    <main class="board" id="board">${loader(t('loading'), 'board-loader')}</main>
    <button class="fab" id="fab" aria-label="${esc(t('addActivity'))}">
      <span class="fab-ring"></span>${ICON.plus}<span class="fab-label" id="fabLabel"></span>
    </button>
    <input type="date" id="datePicker" class="sr-only" tabindex="-1" aria-hidden="true">
  `;
  $('#btnPrev').onclick = () => changeDay(-1);
  $('#btnNext').onclick = () => changeDay(1);
  $('#btnToday').onclick = () => goTo(todayKey());
  $('#btnPick').onclick = () => {
    const p = $('#datePicker');
    p.value = state.date;
    if (p.showPicker) p.showPicker();
    else p.click();
  };
  $('#datePicker').onchange = (e) => e.target.value && goTo(e.target.value);
  $('#btnSummary').onclick = openSummary;
  $('#btnSettings').onclick = () => openSettings(false);
  $('#fab').onclick = () => openEditor(null);
  $('#dayIcons').onclick = (e) => {
    const b = e.target.closest('[data-tip]');
    if (b) toast(b.dataset.tip);
  };
  bindSwipe($('#board'));
  renderTitle(0);
  renderPeople();
  renderStrip();
  renderFab();
}

function renderData() {
  renderStrip();
  renderIcons();
  renderBoard(0);
}

/* ───────────────────────── Cabecera ───────────────────────── */

function relLabel(key) {
  const d = diffDays(todayKey(), key);
  if (d === 0) return t('today');
  if (d === -1) return t('yesterday');
  if (d === 1) return t('tomorrow');
  try {
    return new Intl.RelativeTimeFormat(getLang().locale, { numeric: 'auto' }).format(d, 'day');
  } catch {
    return fmtDate(fromKey(key), { year: 'numeric' });
  }
}

function renderTitle(dir) {
  const main = fmtDate(fromKey(state.date), { weekday: 'long', day: 'numeric', month: 'long' });
  const cls = dir > 0 ? 'tx-next' : dir < 0 ? 'tx-prev' : 'tx-in';
  $('#daySub').innerHTML = `<span class="${cls}">${esc(relLabel(state.date))}</span>`;
  $('#dayMain').innerHTML = `<span class="${cls}">${esc(main.charAt(0).toUpperCase() + main.slice(1))}</span>`;
  $('#btnToday').classList.toggle('is-away', state.date !== todayKey());
}

function dayStatus(day, ids) {
  const occs = occurrencesOn(state.activities, day, ids);
  const star = occs.some((o) => o.a.priority === 'muy_importante');
  const hammer = occs.some((o) => o.a.priority === 'urgente');
  return { star, hammer, feather: !star && !hammer, occs };
}

function renderIcons() {
  const st = dayStatus(state.date, selectedIds());
  const items = [];
  if (st.star) items.push(['star', ICON.star]);
  if (st.hammer) items.push(['hammer', ICON.hammer]);
  if (st.feather) items.push(['feather', ICON.feather]);
  const html = items
    .map(([k, svg], i) => `<button class="status st-${k} press" style="--d:${i}" data-tip="${esc(t(`icon.${k}`))}" aria-label="${esc(t(`icon.${k}`))}">${svg}<span>${esc(t(`short.${k}`))}</span></button>`)
    .join('');
  const el = $('#dayIcons');
  if (el.dataset.sig !== items.map((x) => x[0]).join()) {
    el.innerHTML = html;
    el.dataset.sig = items.map((x) => x[0]).join();
  }
}

function renderPeople() {
  const me = prefs.me;
  const all = state.selected.size === PEOPLE.length;
  $('#people').innerHTML =
    PEOPLE.map((p) => {
      const on = state.selected.has(p.id);
      return `<button class="chip press ${on ? 'on' : ''}" data-person="${p.id}" style="--c:${p.color}" aria-pressed="${on}">
        <span class="chip-dot"></span><span>${esc(p.name)}</span>${p.id === me ? `<small>${esc(t('me'))}</small>` : ''}
      </button>`;
    }).join('') +
    `<button class="chip chip-all press ${all ? 'on' : ''}" data-all aria-pressed="${all}">${esc(t('everyone'))}</button>`;
  $('#people').onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-all')) {
      if (all) state.selected = new Set([prefs.me || 'carles']);
      else state.selected = new Set(PEOPLE.map((p) => p.id));
    } else {
      const id = b.dataset.person;
      if (state.selected.has(id)) {
        if (state.selected.size > 1) state.selected.delete(id);
      } else state.selected.add(id);
    }
    prefs.selected = [...state.selected];
    savePrefs();
    state.slot = null;
    renderPeople();
    renderFab();
    renderData();
  };
}

function renderStrip() {
  const today = todayKey();
  const start = [addDays(today, -WINDOW_DAYS), addDays(state.date, -10)].sort()[0];
  const end = [addDays(today, WINDOW_DAYS), addDays(state.date, 14)].sort()[1];
  const ids = selectedIds();
  const strip = $('#strip');
  let html = '';
  for (let k = start; k <= end; k = addDays(k, 1)) {
    const d = fromKey(k);
    const st = dayStatus(k, ids);
    const persons = [...new Set(st.occs.map((o) => o.a.person))];
    const mark = st.star ? ICON.star : st.hammer ? ICON.hammer : '';
    html += `<button class="dchip press ${k === state.date ? 'on' : ''} ${k === today ? 'today' : ''} ${d.getDay() % 6 === 0 ? 'weekend' : ''}" data-day="${k}">
      <span class="wd">${esc(fmtDate(d, { weekday: 'short' }).replace('.', ''))}</span>
      <span class="num">${d.getDate()}</span>
      <span class="mo">${d.getDate() === 1 || k === start ? esc(fmtDate(d, { month: 'short' }).replace('.', '')) : '&nbsp;'}</span>
      <span class="dots">${persons.map((p) => `<i style="--c:${PERSON[p].color}"></i>`).join('')}</span>
      ${mark ? `<span class="mark ${st.star ? 'st-star' : 'st-hammer'}">${mark}</span>` : ''}
    </button>`;
  }
  const keepScroll = state.stripRange === `${start}|${end}` ? strip.scrollLeft : null;
  strip.innerHTML = html;
  state.stripRange = `${start}|${end}`;
  strip.onclick = (e) => {
    const b = e.target.closest('[data-day]');
    if (b) goTo(b.dataset.day);
  };
  if (keepScroll !== null) strip.scrollLeft = keepScroll;
  centerStrip(keepScroll === null ? 'auto' : 'smooth');
}

function centerStrip(behavior = 'smooth') {
  const strip = $('#strip');
  const on = $('.dchip.on', strip);
  if (!on) return;
  const left = on.offsetLeft - strip.clientWidth / 2 + on.clientWidth / 2;
  strip.scrollTo({ left, behavior: reduceMotion() ? 'auto' : behavior });
}

/* ───────────────────────── Navegación ───────────────────────── */

function changeDay(n) {
  goTo(addDays(state.date, n));
}

function goTo(key) {
  if (key === state.date) return;
  const dir = key > state.date ? 1 : -1;
  state.date = key;
  state.slot = null;
  ensureWindow();
  renderTitle(dir);
  const inRange = state.stripRange && key >= state.stripRange.split('|')[0] && key <= state.stripRange.split('|')[1];
  if (inRange) {
    $$('.dchip', $('#strip')).forEach((b) => b.classList.toggle('on', b.dataset.day === key));
    centerStrip();
  } else renderStrip();
  renderIcons();
  renderBoard(dir);
  renderFab();
}

function bindSwipe(el) {
  let x0 = null;
  let y0 = 0;
  let t0 = 0;
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
    t0 = Date.now();
  }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 50 && Date.now() - t0 < 600) changeDay(dx < 0 ? 1 : -1);
  }, { passive: true });
}

/* ───────────────────────── Tablero (franjas) ───────────────────────── */

function renderBoard(dir) {
  const board = $('#board');
  if (!state.loaded) return;
  const ids = selectedIds();
  const cols = ids.map((id) => {
    const occs = occurrencesOn(state.activities, state.date, [id]);
    return {
      id,
      allDay: occs.filter((o) => o.allDay || o.multiDay),
      timed: layoutLanes(occs.filter((o) => !o.allDay && !o.multiDay)),
    };
  });
  const timed = cols.flatMap((c) => c.timed);
  let startH = DEFAULT_START_HOUR;
  let endH = DEFAULT_END_HOUR;
  if (timed.length) {
    startH = Math.min(startH, Math.floor(Math.min(...timed.map((o) => o.startMin)) / 60));
    endH = Math.max(endH, Math.ceil(Math.max(...timed.map((o) => o.endMin)) / 60));
  }
  endH = Math.min(24, endH);
  const hourPx = 60 * PX_PER_MIN;
  const height = (endH - startH) * hourPx;
  const single = ids.length === 1;
  const anyAllDay = cols.some((c) => c.allDay.length);
  const empty = !timed.length && !anyAllDay;

  const head = `<div class="cols-head" style="--n:${ids.length}">
      <div class="gutter-head"></div>
      ${cols.map((c) => `<div class="col-head" style="--c:${PERSON[c.id].color}"><span class="avatar">${PERSON[c.id].emoji}</span><span>${esc(PERSON[c.id].name)}</span></div>`).join('')}
    </div>`;

  const allDayRow = anyAllDay
    ? `<div class="allday-row" style="--n:${ids.length}">
        <div class="gutter-label">${esc(t('allDay'))}</div>
        ${cols.map((c) => `<div class="allday-cell">${c.allDay.map((o) => pill(o)).join('')}</div>`).join('')}
      </div>`
    : '';

  let hours = '';
  for (let h = startH; h <= endH; h++) {
    hours += `<span class="hour" style="top:${(h - startH) * hourPx}px">${h < 24 ? `${h}:00` : ''}</span>`;
  }

  const columns = cols
    .map(
      (c) => `<div class="col ${single ? 'selectable' : ''}" data-person="${c.id}" style="--c:${PERSON[c.id].color}">
        ${c.timed.map((o, i) => block(o, startH, i)).join('')}
      </div>`
    )
    .join('');

  const emptyHtml = empty
    ? `<div class="empty">${logoMark('empty-mark bob')}<strong>${esc(t('nothing'))}</strong><span>${esc(t('nothingSub'))}</span></div>`
    : '';

  const slideCls = reduceMotion() ? 'fade' : dir > 0 ? 'slide-next' : dir < 0 ? 'slide-prev' : 'fade';
  board.innerHTML = `<div class="board-inner ${slideCls}">
      ${head}${allDayRow}
      <div class="grid" style="--n:${ids.length};--hour:${hourPx}px;height:${height}px" data-start="${startH}">
        <div class="gutter">${hours}</div>
        ${columns}
        <div class="slot-layer"></div>
        <div class="now-line" hidden></div>
        ${emptyHtml}
      </div>
      ${single ? '' : `<p class="hint">${esc(t('selectOneHint'))}</p>`}
    </div>`;

  state.firstPainted = true;
  $('.grid', board).onclick = onGridClick;
  if (anyAllDay) $('.allday-row', board).onclick = onGridClick;
  renderSlot();
  tickNow();
}

function intensityStyle(o) {
  const p = PERSON[o.a.person];
  const pr = PRIORITY[o.a.priority] || PRIORITY.normal;
  return `--c:${p.color};--k:${pr.intensity}%`;
}

function prioBadge(a) {
  if (a.priority === 'muy_importante') return `<span class="badge st-star">${ICON.star}</span>`;
  if (a.priority === 'urgente') return `<span class="badge st-hammer">${ICON.hammer}</span>`;
  return '';
}

function block(o, startH, i) {
  const top = (o.startMin - startH * 60) * PX_PER_MIN;
  const h = Math.max(18, (o.endMin - o.startMin) * PX_PER_MIN - 2);
  const w = 100 / (o._lanes || 1);
  const tag = TAG[o.a.tag] || TAG.evento;
  const compact = h < 40 ? 'compact' : '';
  const time = `${fmtTime(minToTime(o.startMin))}–${fmtTime(minToTime(o.endMin))}`;
  return `<button class="act prio-${o.a.priority || 'normal'} ${compact} ${state.loaded && !state.firstPainted ? 'enter' : ''}"
      style="${intensityStyle(o)};top:${top}px;height:${h}px;left:calc(${w * o._lane}% + 2px);width:calc(${w}% - 4px);--i:${Math.min(i, 12)}"
      data-id="${esc(o.a.id)}" data-occ="${o.occStart}">
      <span class="act-top"><span class="act-icon">${tag.icon}</span><span class="act-title">${esc(o.a.title || t(`tag.${o.a.tag}`))}</span>${prioBadge(o.a)}</span>
      <span class="act-time">${time}${o.a.repeat && o.a.repeat !== 'none' ? ` ${ICON.repeat}` : ''}${o.a.alert?.enabled ? ` ${ICON.bell}` : ''}</span>
    </button>`;
}

function pill(o) {
  const tag = TAG[o.a.tag] || TAG.evento;
  const until =
    o.multiDay && !o.a.allDay
      ? ` · ${t('until')} ${fmtDate(fromKey(o.occEndDate), { weekday: 'short', day: 'numeric' })} ${fmtTime(o.a.endTime)}`
      : o.multiDay
        ? ` · ${t('until')} ${fmtDate(fromKey(o.occEndDate), { weekday: 'short', day: 'numeric' })}`
        : '';
  return `<button class="pill prio-${o.a.priority || 'normal'}" style="${intensityStyle(o)}" data-id="${esc(o.a.id)}" data-occ="${o.occStart}">
    <span>${tag.icon}</span><span class="pill-title">${esc(o.a.title || t(`tag.${o.a.tag}`))}${esc(until)}</span>${prioBadge(o.a)}
  </button>`;
}

function onGridClick(e) {
  const act = e.target.closest('[data-id]');
  if (act) {
    const a = state.activities.find((x) => x.id === act.dataset.id);
    if (a) openEditor(a, { occ: act.dataset.occ });
    return;
  }
  const slotEl = e.target.closest('.slot');
  if (slotEl) {
    openEditor(null);
    return;
  }
  const col = e.target.closest('.col.selectable');
  if (!col) return;
  const grid = col.closest('.grid');
  const rect = col.getBoundingClientRect();
  const startH = Number(grid.dataset.start);
  const min = startH * 60 + Math.floor((e.clientY - rect.top) / PX_PER_MIN / 30) * 30;
  if (state.slot && state.slot.min === min && state.slot.day === state.date) {
    openEditor(null);
    return;
  }
  state.slot = { day: state.date, min };
  renderSlot();
  renderFab();
}

function renderSlot() {
  const layer = $('.slot-layer');
  if (!layer) return;
  const grid = layer.closest('.grid');
  if (!state.slot || state.slot.day !== state.date || selectedIds().length !== 1) {
    layer.innerHTML = '';
    return;
  }
  const startH = Number(grid.dataset.start);
  const top = (state.slot.min - startH * 60) * PX_PER_MIN;
  const color = PERSON[selectedIds()[0]].color;
  const existing = $('.slot', layer);
  if (existing) {
    // transición (no keyframes) para que se pueda mover rápido entre horas
    existing.style.transform = `translateY(${top}px)`;
    $('.slot-time', existing).textContent = fmtTime(minToTime(state.slot.min));
    return;
  }
  layer.innerHTML = `<button class="slot" style="--c:${color};transform:translateY(${top}px);height:${30 * PX_PER_MIN}px">
    <span class="slot-time">${fmtTime(minToTime(state.slot.min))}</span>${ICON.plus}
  </button>`;
}

function renderFab() {
  const fab = $('#fab');
  const single = selectedIds().length === 1;
  fab.classList.toggle('hidden', !single);
  fab.style.setProperty('--c', single ? PERSON[selectedIds()[0]].color : '#222');
  const hasSlot = state.slot && state.slot.day === state.date;
  fab.classList.toggle('has-slot', !!hasSlot);
  $('#fabLabel').textContent = hasSlot ? fmtTime(minToTime(state.slot.min)) : '';
}

function tickNow(full) {
  if (full === true && state.date !== todayKey() && $('#btnToday')) renderTitle(0);
  const line = $('.now-line');
  if (!line) return;
  const grid = line.closest('.grid');
  const startH = Number(grid.dataset.start);
  const m = nowMin();
  const top = (m - startH * 60) * PX_PER_MIN;
  const show = state.date === todayKey() && top >= 0 && top <= grid.offsetHeight;
  line.hidden = !show;
  if (show) line.style.transform = `translateY(${top}px)`;
}

/* ───────────────────────── Hojas (bottom sheets) ───────────────────────── */

function openSheet(html, { onClose, cls = '' } = {}) {
  closeSheet(true);
  const root = document.createElement('div');
  root.className = 'sheet-root';
  root.innerHTML = `<div class="backdrop"></div>
    <section class="sheet ${cls}" role="dialog" aria-modal="true">
      <div class="sheet-handle"><span></span></div>
      <div class="sheet-body">${html}</div>
    </section>`;
  document.body.appendChild(root);
  root._onClose = onClose;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('open')));
  $('.backdrop', root).onclick = () => closeSheet();
  bindSheetDrag(root);
  document.body.classList.add('sheet-open');
  return root;
}

function closeSheet(instant = false) {
  const root = $('.sheet-root:not(.closing)');
  if (!root) return;
  root.classList.add('closing');
  root.classList.remove('open');
  const sheet = $('.sheet', root);
  sheet.style.transform = '';
  root._onClose && root._onClose();
  document.body.classList.remove('sheet-open');
  if (instant) root.remove();
  else setTimeout(() => root.remove(), 420);
}

function bindSheetDrag(root) {
  const sheet = $('.sheet', root);
  const handle = $('.sheet-handle', root);
  let y0 = null;
  let last = 0;
  let lastT = 0;
  let v = 0;
  handle.addEventListener('pointerdown', (e) => {
    y0 = e.clientY;
    last = e.clientY;
    lastT = performance.now();
    sheet.classList.add('dragging');
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (y0 === null) return;
    const dy = Math.max(0, e.clientY - y0);
    const now = performance.now();
    v = (e.clientY - last) / Math.max(1, now - lastT);
    last = e.clientY;
    lastT = now;
    sheet.style.transform = `translateY(${dy}px)`;
  });
  const end = (e) => {
    if (y0 === null) return;
    const dy = e.clientY - y0;
    y0 = null;
    sheet.classList.remove('dragging');
    if (dy > 120 || v > 0.5) closeSheet();
    else sheet.style.transform = '';
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

/* ───────────────────────── Editor de actividad ───────────────────────── */

function alertLabel(m) {
  if (m === 0) return t('alert.0');
  if (m === 1440) return t('alert.day');
  if (m >= 60) return t('alert.hour', { n: m / 60 });
  return t('alert.min', { n: m });
}

function openEditor(a, { occ } = {}) {
  const isNew = !a;
  const person = a ? a.person : selectedIds()[0];
  const p = PERSON[person];
  let startMin;
  if (state.slot && state.slot.day === state.date) startMin = state.slot.min;
  else if (state.date === todayKey()) startMin = Math.min(23 * 60, Math.ceil((nowMin() + 1) / 30) * 30);
  else startMin = 9 * 60;
  const d = a
    ? { ...a, alert: { enabled: false, minutesBefore: 15, ...(a.alert || {}) } }
    : {
        person,
        title: '',
        tag: 'evento',
        startDate: state.date,
        endDate: state.date,
        startTime: minToTime(startMin),
        endTime: minToTime(Math.min(24 * 60 - 1, startMin + 60)),
        allDay: false,
        repeat: 'none',
        repeatUntil: '',
        priority: 'normal',
        alert: { enabled: false, minutesBefore: 15 },
        notes: '',
        exceptions: [],
      };

  const html = `
    <form class="editor" id="editor" style="--c:${p.color}" novalidate>
      <div class="sheet-title">
        <span class="avatar big" style="--c:${p.color}">${p.emoji}</span>
        <div><h2 class="tx-in">${esc(isNew ? t('newActivity') : t('editActivity'))}</h2><p>${esc(p.name)}</p></div>
        <button type="button" class="icon-btn press" data-close aria-label="${esc(t('cancel'))}">${ICON.close}</button>
      </div>

      <label class="field"><span>${esc(t('title'))}</span>
        <input name="title" value="${esc(d.title)}" placeholder="${esc(t('titlePh'))}" autocomplete="off">
      </label>

      <div class="field"><span>${esc(t('tagLabel'))}</span>
        <div class="tags">${TAGS.map((tg) => `<button type="button" class="tag press ${d.tag === tg.id ? 'on' : ''}" data-tag="${tg.id}"><span>${tg.icon}</span>${esc(t(`tag.${tg.id}`))}</button>`).join('')}</div>
      </div>

      <div class="field">
        <div class="row-between"><span>${esc(t('from'))} / ${esc(t('to'))}</span>
          <label class="switch-label"><input type="checkbox" name="allDay" ${d.allDay ? 'checked' : ''}><i class="switch"></i>${esc(t('allDay'))}</label>
        </div>
        <div class="dt-grid ${d.allDay ? 'all-day' : ''}">
          <small>${esc(t('from'))}</small>
          <input type="date" name="startDate" value="${d.startDate}" required>
          <input type="time" name="startTime" value="${d.startTime || '09:00'}" step="300">
          <small>${esc(t('to'))}</small>
          <input type="date" name="endDate" value="${d.endDate || d.startDate}" required>
          <input type="time" name="endTime" value="${d.endTime || '10:00'}" step="300">
        </div>
        <div class="quick">
          <small>${esc(t('duration'))}</small>
          ${[[15, '15 min'], [30, '30 min'], [60, '1 h'], [120, '2 h'], [1440, '1 d'], [2880, '2 d']].map(([m, l]) => `<button type="button" class="qchip press" data-dur="${m}">${l}</button>`).join('')}
        </div>
      </div>

      <div class="field"><span>${esc(t('repeat'))}</span>
        <div class="seg" data-seg="repeat">${REPEATS.map((r) => `<button type="button" class="press ${d.repeat === r ? 'on' : ''}" data-v="${r}">${esc(t(`repeat.${r}`))}</button>`).join('')}</div>
        <label class="inline-field ${d.repeat === 'none' ? 'hidden' : ''}" id="untilField">${esc(t('repeatUntil'))}
          <input type="date" name="repeatUntil" value="${d.repeatUntil || ''}">
        </label>
      </div>

      <div class="field"><span>${esc(t('priority'))}</span>
        <div class="prio-grid" data-seg="priority">${PRIORITIES.map((pr) => `<button type="button" class="prio press ${d.priority === pr.id ? 'on' : ''}" data-v="${pr.id}" style="--k:${pr.intensity}%">
          <i class="swatch"></i><span>${esc(t(`priority.${pr.id}`))}</span>${pr.id === 'muy_importante' ? ICON.star : pr.id === 'urgente' ? ICON.hammer : pr.id === 'relajado' ? ICON.feather : ''}
        </button>`).join('')}</div>
      </div>

      <div class="field alert-field">
        <label class="row-between switch-label big"><span>${ICON.bell} ${esc(t('alert'))}<small>${esc(t('alertHint'))}</small></span>
          <input type="checkbox" name="alertOn" ${d.alert.enabled ? 'checked' : ''}><i class="switch"></i></label>
        <label class="inline-field ${d.alert.enabled ? '' : 'hidden'}" id="alertField">${esc(t('alertBefore'))}
          <select name="alertBefore">${ALERT_OPTIONS.map((m) => `<option value="${m}" ${d.alert.minutesBefore === m ? 'selected' : ''}>${esc(alertLabel(m))}</option>`).join('')}</select>
        </label>
      </div>

      <label class="field"><span>${esc(t('notes'))}</span>
        <textarea name="notes" rows="2" placeholder="${esc(t('notesPh'))}">${esc(d.notes)}</textarea>
      </label>

      <p class="form-error" id="formError" role="alert"></p>

      <div class="actions">
        ${isNew ? '' : d.repeat && d.repeat !== 'none'
          ? `<button type="button" class="btn btn-ghost danger press" data-del="one">${ICON.trash}<span>${esc(t('deleteOne'))}</span></button>
             <button type="button" class="btn btn-ghost danger press" data-del="all"><span>${esc(t('deleteAll'))}</span></button>`
          : `<button type="button" class="btn btn-ghost danger press" data-del="all">${ICON.trash}<span>${esc(t('delete'))}</span></button>`}
        <button type="submit" class="btn btn-primary press" id="btnSave">${ICON.check}<span>${esc(t('save'))}</span></button>
      </div>
    </form>`;

  const root = openSheet(html);
  const form = $('#editor', root);
  const f = form.elements;

  form.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-close')) return closeSheet();
    if (b.dataset.tag) {
      $$('.tag', form).forEach((x) => x.classList.toggle('on', x === b));
      d.tag = b.dataset.tag;
    }
    const seg = b.closest('[data-seg]');
    if (seg && b.dataset.v) {
      $$('button', seg).forEach((x) => x.classList.toggle('on', x === b));
      d[seg.dataset.seg] = b.dataset.v;
      if (seg.dataset.seg === 'repeat') $('#untilField', form).classList.toggle('hidden', b.dataset.v === 'none');
    }
    if (b.dataset.dur) {
      const m = Number(b.dataset.dur);
      if (m >= 1440 && f.allDay.checked) {
        f.endDate.value = addDays(f.startDate.value, m / 1440 - 1);
      } else {
        const total = timeToMin(f.startTime.value) + m;
        f.endDate.value = addDays(f.startDate.value, Math.floor(total / 1440));
        f.endTime.value = minToTime(total % 1440);
      }
      b.classList.add('flash');
      setTimeout(() => b.classList.remove('flash'), 300);
    }
    if (b.dataset.del) {
      if (!b.classList.contains('confirm')) {
        $$('[data-del]', form).forEach((x) => x.classList.remove('confirm'));
        b.classList.add('confirm');
        b.querySelector('span').textContent = `${t('deleteConfirm')}`;
        return;
      }
      b.disabled = true;
      b.innerHTML = loader('', 'inline');
      try {
        if (b.dataset.del === 'one') await store.addException(a.id, occ || state.date);
        else await store.remove(a.id);
        closeSheet();
        toast(t('deleted'));
      } catch (err) {
        console.warn(err);
        $('#formError', form).textContent = err.message || String(err);
      }
    }
  };

  f.allDay.onchange = () => $('.dt-grid', form).classList.toggle('all-day', f.allDay.checked);
  f.alertOn.onchange = () => $('#alertField', form).classList.toggle('hidden', !f.alertOn.checked);
  f.startDate.onchange = () => {
    if (f.endDate.value < f.startDate.value) f.endDate.value = f.startDate.value;
  };
  f.startTime.onchange = () => {
    if (f.endDate.value === f.startDate.value && f.endTime.value <= f.startTime.value) {
      f.endTime.value = minToTime(Math.min(24 * 60 - 1, timeToMin(f.startTime.value) + 60));
    }
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const allDay = f.allDay.checked;
    const out = {
      ...(a ? { id: a.id } : {}),
      person: d.person,
      title: f.title.value.trim(),
      tag: d.tag,
      startDate: f.startDate.value,
      endDate: f.endDate.value || f.startDate.value,
      startTime: allDay ? '00:00' : f.startTime.value,
      endTime: allDay ? '23:59' : f.endTime.value,
      allDay,
      repeat: d.repeat || 'none',
      repeatUntil: d.repeat && d.repeat !== 'none' ? f.repeatUntil.value || null : null,
      priority: d.priority || 'normal',
      alert: { enabled: f.alertOn.checked, minutesBefore: Number(f.alertBefore.value) },
      notes: f.notes.value.trim(),
      exceptions: a?.exceptions || [],
      ...(a?.source ? { source: a.source } : {}),
    };
    const startAbs = `${out.startDate}T${out.startTime}`;
    const endAbs = `${out.endDate}T${out.endTime}`;
    if (!out.startDate || (!allDay && endAbs <= startAbs) || out.endDate < out.startDate) {
      const err = $('#formError', form);
      err.textContent = t('errEnd');
      err.classList.remove('shake');
      void err.offsetWidth;
      err.classList.add('shake');
      return;
    }
    const btn = $('#btnSave', form);
    btn.disabled = true;
    btn.innerHTML = loader(t('saving'), 'inline');
    try {
      await store.save(out);
      state.slot = null;
      closeSheet();
      renderFab();
      toast(t('saved'));
      if (out.alert.enabled && !prefs.notif) enableNotifications(true);
    } catch (err) {
      console.warn(err);
      btn.disabled = false;
      btn.innerHTML = `${ICON.check}<span>${esc(t('save'))}</span>`;
      $('#formError', form).textContent = err.message || String(err);
    }
  };

  if (isNew) setTimeout(() => f.title.focus({ preventScroll: true }), 420);
}

/* ───────────────────────── Resumen (texto + voz) ───────────────────────── */

function openSummary() {
  const ids = selectedIds();
  let mode = ids.length === 1 ? ids[0] : 'global';
  const html = `
    <div class="summary">
      <div class="sheet-title">
        ${logoMark('sum-mark')}
        <div><h2 class="tx-in">${esc(t('summary'))}</h2><p>${esc(fmtDate(fromKey(state.date), { weekday: 'long', day: 'numeric', month: 'long' }))}</p></div>
        <button type="button" class="icon-btn press" data-close aria-label="${esc(t('cancel'))}">${ICON.close}</button>
      </div>
      <div class="seg sum-seg">
        <button class="press" data-mode="global">${esc(t('summaryGlobal'))}</button>
        ${PEOPLE.map((p) => `<button class="press" data-mode="${p.id}" style="--c:${p.color}">${esc(p.name)}</button>`).join('')}
      </div>
      <div class="sum-text" id="sumText" aria-live="polite"></div>
      <button class="btn btn-primary press wide" id="btnSpeak">${ICON.speaker}<span>${esc(t('listen'))}</span></button>
    </div>`;
  const root = openSheet(html, { onClose: stopSpeaking });
  const textFor = () => {
    const people = mode === 'global' ? PEOPLE.map((p) => p.id) : [mode];
    return people.map((id) => ({ id, text: personSummary(state.activities, state.date, id) }));
  };
  const intro = () => `${relLabel(state.date)}, ${fmtDate(fromKey(state.date), { weekday: 'long', day: 'numeric', month: 'long' })}.`;
  const paint = () => {
    $$('.sum-seg button', root).forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
    $('#sumText', root).innerHTML = textFor()
      .map(({ id, text }, i) => `<p class="sum-p fade-up" style="--c:${PERSON[id].color};--d:${i}"><b>${PERSON[id].emoji} ${esc(PERSON[id].name)}</b>${esc(text)}</p>`)
      .join('');
  };
  paint();
  const btn = $('#btnSpeak', root);
  const setBtn = (on) => {
    btn.innerHTML = on ? `${ICON.stop}<span>${esc(t('stop'))}</span>` : `${ICON.speaker}<span>${esc(t('listen'))}</span>`;
    $('.sum-mark', root).classList.toggle('talk', on);
  };
  root.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-close')) return closeSheet();
    if (b.dataset.mode) {
      mode = b.dataset.mode;
      stopSpeaking();
      setBtn(false);
      paint();
    }
    if (b === btn) {
      if (btn.classList.toggle('speaking')) {
        const text = [intro(), ...textFor().map((x) => x.text)].join(' ');
        const ok = speak(text, () => {
          btn.classList.remove('speaking');
          setBtn(false);
        });
        if (!ok) {
          btn.classList.remove('speaking');
          toast('🔇');
        } else setBtn(true);
      } else {
        stopSpeaking();
        setBtn(false);
      }
    }
  };
}

/* ───────────────────────── Ajustes ───────────────────────── */

function openSettings(onboarding) {
  const html = `
    <div class="settings">
      <div class="sheet-title">
        ${logoMark('sum-mark')}
        <div><h2 class="tx-in">${esc(onboarding ? t('iAm') : t('settings'))}</h2><p>Guachis Home</p></div>
        <button type="button" class="icon-btn press" data-close aria-label="${esc(t('cancel'))}">${ICON.close}</button>
      </div>
      <div class="field"><span>${esc(t('iAm'))}</span>
        <div class="who-grid">${PEOPLE.map((p, i) => `<button class="who press fade-up ${prefs.me === p.id ? 'on' : ''}" data-me="${p.id}" style="--c:${p.color};--d:${i}">
          <span class="avatar big">${p.emoji}</span><b>${esc(p.name)}</b><small>${esc(t(`role_${p.role}`))}</small></button>`).join('')}</div>
      </div>
      ${onboarding ? '' : `
      <div class="field"><span>${esc(t('language'))}</span>
        <div class="seg">${LANGS.map((l) => `<button class="press ${getLang().id === l.id ? 'on' : ''}" data-lang="${l.id}">${esc(l.label)}</button>`).join('')}</div>
      </div>
      <div class="field"><span>${esc(t('notifications'))}</span>
        <button class="btn btn-ghost press wide" id="btnNotif">${ICON.bell}<span>${esc(prefs.notif ? t('notifOn') : t('enableNotif'))}</span></button>
      </div>
      <div class="field"><span>${esc(t('data'))}</span>
        <button class="btn btn-ghost press wide" id="btnImport">🏫<span>${esc(t('importGabri'))}</span></button>
        <p class="muted">${esc(t('mode'))}: ${esc(store.mode === 'firebase' ? t('modeFirebase') : t('modeLocal'))}${store.user?.email ? ` · ${esc(store.user.email)}` : ''}</p>
        ${store.mode === 'firebase' ? `<button class="btn btn-ghost press wide" id="btnOut"><span>${esc(t('signOut'))}</span></button>` : ''}
      </div>`}
    </div>`;
  const root = openSheet(html);
  root.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-close')) return closeSheet();
    if (b.dataset.me) {
      prefs.me = b.dataset.me;
      state.selected = new Set([prefs.me]);
      prefs.selected = [prefs.me];
      savePrefs();
      $$('.who', root).forEach((x) => x.classList.toggle('on', x === b));
      renderPeople();
      renderFab();
      renderData();
      if (onboarding) setTimeout(() => closeSheet(), 260);
    }
    if (b.dataset.lang) {
      prefs.lang = b.dataset.lang;
      savePrefs();
      setLang(prefs.lang);
      closeSheet(true);
      renderShell();
      renderData();
      openSettings(false);
    }
    if (b.id === 'btnNotif') enableNotifications(false, b);
    if (b.id === 'btnImport') {
      b.disabled = true;
      const old = b.innerHTML;
      b.innerHTML = loader(t('loading'), 'inline');
      try {
        await store.importMissing(gabriSeed());
        toast(t('imported'));
      } catch (err) {
        toast(err.message || String(err));
      }
      b.disabled = false;
      b.innerHTML = old;
    }
    if (b.id === 'btnOut') {
      await store.signOut();
      location.reload();
    }
  };
}

/* ───────────────────────── Avisos ───────────────────────── */

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swReg = await navigator.serviceWorker.register('sw.js');
  } catch (e) {
    console.warn('SW', e);
  }
}

async function enableNotifications(silent, btn) {
  if (!('Notification' in window) || !swReg) {
    if (!silent) toast(t('notifUnsupported'));
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    if (!silent) toast(t('notifDenied'));
    return;
  }
  try {
    if (store.mode === 'firebase') await store.registerDevice([prefs.me || selectedIds()[0]], getLang().id, swReg);
    prefs.notif = true;
    savePrefs();
    if (btn) btn.querySelector('span').textContent = t('notifOn');
    toast(t('notifOn'));
    scheduleLocalAlerts();
  } catch (e) {
    console.warn(e);
    if (!silent) toast(e.message === 'unsupported' ? t('notifUnsupported') : e.message);
  }
}

// En modo demo (sin servidor) los avisos se programan mientras la app está abierta.
// Con Firebase los envía la Cloud Function aunque la app esté cerrada.
let alertTimers = [];
function scheduleLocalAlerts() {
  alertTimers.forEach(clearTimeout);
  alertTimers = [];
  if (store.mode === 'firebase' || !prefs.notif || !swReg || Notification.permission !== 'granted') return;
  const me = prefs.me || selectedIds()[0];
  const now = Date.now();
  for (const day of [todayKey(), addDays(todayKey(), 1)]) {
    for (const a of state.activities) {
      if (a.person !== me || !a.alert?.enabled) continue;
      const o = occurrenceOn(a, day);
      if (!o || o.occStart !== day) continue;
      const start = fromKey(day);
      start.setMinutes(a.allDay ? 8 * 60 : timeToMin(a.startTime));
      const fire = start.getTime() - (a.alert.minutesBefore || 0) * 60000;
      if (fire > now && fire - now < 36 * 3600 * 1000) {
        alertTimers.push(
          setTimeout(() => {
            swReg.showNotification(t('notifTitle', { name: PERSON[a.person].name }), {
              body: `${TAG[a.tag]?.icon || ''} ${a.title || t(`tag.${a.tag}`)} · ${fmtTime(a.startTime)}`,
              icon: 'icons/icon-192.png',
              badge: 'icons/icon-192.png',
              tag: `${a.id}-${day}`,
            });
          }, fire - now)
        );
      }
    }
  }
}

/* ───────────────────────── Toast ───────────────────────── */

function toast(msg) {
  let root = $('#toasts');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toasts';
    document.body.appendChild(root);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${logoMark('toast-mark')}<span>${esc(msg)}</span>`;
  root.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2400);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSheet();
  if (document.querySelector('.sheet-root') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  if (e.key === 'ArrowLeft') changeDay(-1);
  if (e.key === 'ArrowRight') changeDay(1);
});

boot();
