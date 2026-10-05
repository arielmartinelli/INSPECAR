export type ThemeId = 'clasico' | 'taller' | 'ficha';

export const THEMES: { id: ThemeId; label: string; hint: string; swatch: [string, string] }[] = [
  { id: 'clasico', label: 'Clásico', hint: 'El estilo original', swatch: ['#0f172a', '#ffffff'] },
  { id: 'taller', label: 'Taller', hint: 'Alto contraste, ideal al sol', swatch: ['#1E2124', '#FFC20E'] },
  { id: 'ficha', label: 'Ficha técnica', hint: 'Estilo plano de ingeniería', swatch: ['#102A43', '#1C7ED6'] }
];

const KEY = 'inspecar_theme';

export const loadTheme = (): ThemeId => {
  try {
    const t = localStorage.getItem(KEY) as ThemeId | null;
    return t && THEMES.some((x) => x.id === t) ? t : 'clasico';
  } catch {
    return 'clasico';
  }
};

export const applyTheme = (t: ThemeId) => {
  document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', t === 'taller' ? '#1E2124' : t === 'ficha' ? '#102A43' : '#0f172a');
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* sin almacenamiento: el tema dura sólo esta sesión */
  }
};
