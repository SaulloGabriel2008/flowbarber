/**
 * Theme Manager - Gerencia a troca de temas (Blue/Gold) e Dark Mode
 */

const themes = {
    blue: {
        '--primary': '#137fec',
        '--primary-dark': '#0f3bbd',
        '--primary-light': '#4f7aff',
        '--bg-dark': '#101922',
        '--surface-dark': '#1a2632',
        '--surface-card': '#232c48',
        '--bg-light': '#f6f7f8',
        '--text-main': '#ffffff',
        '--text-muted': '#94a3b8'
    },
    gold: {
        '--primary': '#f4c025',
        '--primary-dark': '#c59a1d',
        '--primary-light': '#f7d163',
        '--bg-dark': '#221e10',
        '--surface-dark': '#2c2616',
        '--surface-card': '#3a321d',
        '--bg-light': '#f8f8f5',
        '--text-main': '#ffffff',
        '--text-muted': '#a8a29e'
    }
};

export function initTheme() {
    const savedTheme = localStorage.getItem('app-theme') || 'blue';
    applyTheme(savedTheme);
    return savedTheme;
}

export function applyTheme(themeName) {
    const theme = themes[themeName] || themes.blue;
    const root = document.documentElement;

    Object.keys(theme).forEach(key => {
        root.style.setProperty(key, theme[key]);
    });

    localStorage.setItem('app-theme', themeName);
    
    // Disparar evento para componentes que precisam reagir
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
}

export function toggleTheme() {
    const current = localStorage.getItem('app-theme') || 'blue';
    const next = current === 'blue' ? 'gold' : 'blue';
    applyTheme(next);
    return next;
}
