// Iconos SVG sencillos (trazo redondeado).
const s = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const ICON = {
  star: s('<path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6l-5.2 2.8 1-5.9L3.5 9.4l5.9-.8z" fill="currentColor" fill-opacity=".25"/>'),
  hammer: s('<path d="M14.5 6.5l3 3"/><path d="M10 4l3-1 5.5 5.5-1 3-2-2-1.5 1.5L5.6 20.4a1.6 1.6 0 01-2.3-2.3l8.4-8.4L13.2 8.2z" fill="currentColor" fill-opacity=".2"/>'),
  feather: s('<path d="M20 4c-6 0-12 4-13 12l-2 4"/><path d="M20 4c0 7-4 12-12 12" fill="currentColor" fill-opacity=".2"/><path d="M8 12h6"/>'),
  left: s('<path d="M15 5l-7 7 7 7"/>'),
  right: s('<path d="M9 5l7 7-7 7"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.6"'),
  close: s('<path d="M6 6l12 12M18 6L6 18"/>'),
  gear: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
  chat: s('<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/><path d="M8.5 10.5h7M8.5 13.5h4"/>'),
  speaker: s('<path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor" fill-opacity=".2"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/>'),
  stop: s('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'),
  bell: s('<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>'),
  calendar: s('<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
  repeat: s('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 01-3 3H3"/>'),
  trash: s('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'),
  check: s('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
};
