/*
 * Display settings: theme (light/dark/auto), accent colour, menu style, text size, animations.
 * Choices are saved in this browser (localStorage "hs-prefs") and applied before the page draws
 * by the small script in <head>. This file runs the settings panel and applies changes live.
 */
(function () {
    const root = document.documentElement;
    const KEY = 'hs-prefs';
    const OPTIONS = {
        theme: ['light', 'dark', 'auto'],
        accent: ['blue', 'green', 'purple', 'orange', 'red', 'teal'],
        header: ['auto', 'light', 'dark', 'accent'],
        text: ['sm', 'md', 'lg', 'xl'],
        motion: ['on', 'off'],
    };
    const DEFAULTS = { theme: 'light', accent: 'blue', header: 'auto', text: 'md', motion: 'on' };
    const darkQuery = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;

    function load() {
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) {}
        const prefs = {};
        Object.keys(DEFAULTS).forEach(k => { prefs[k] = OPTIONS[k].includes(saved[k]) ? saved[k] : DEFAULTS[k]; });
        return prefs;
    }
    let prefs = load();

    function resolvedTheme() {
        if (prefs.theme !== 'auto') return prefs.theme;
        return darkQuery && darkQuery.matches ? 'dark' : 'light';
    }

    function apply() {
        root.setAttribute('data-theme', resolvedTheme());
        root.setAttribute('data-accent', prefs.accent);
        root.setAttribute('data-header', prefs.header);
        root.setAttribute('data-text', prefs.text);
        root.setAttribute('data-motion', prefs.motion);

        // Browser UI colour (mobile address bar) follows the chosen accent
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', 'rgb(' + getComputedStyle(root).getPropertyValue('--brand-950').trim().split(/\s+/).join(',') + ')');

        document.querySelectorAll('[data-pref]').forEach(btn => {
            btn.setAttribute('aria-pressed', String(prefs[btn.dataset.pref] === btn.dataset.value));
        });
        document.dispatchEvent(new CustomEvent('prefschange', { detail: { ...prefs, resolvedTheme: resolvedTheme() } }));
    }

    function save() {
        const changed = {};
        Object.keys(prefs).forEach(k => { if (prefs[k] !== DEFAULTS[k]) changed[k] = prefs[k]; });
        try {
            if (Object.keys(changed).length) localStorage.setItem(KEY, JSON.stringify(changed));
            else localStorage.removeItem(KEY);
        } catch (_) { /* storage blocked: settings still work for this visit */ }
    }

    function set(key, value) {
        if (!OPTIONS[key] || !OPTIONS[key].includes(value)) return;
        prefs[key] = value;
        apply();
        save();
    }

    // Follow the device when Theme = Auto and the device switches between light and dark
    if (darkQuery) {
        const onDeviceChange = () => { if (prefs.theme === 'auto') apply(); };
        if (darkQuery.addEventListener) darkQuery.addEventListener('change', onDeviceChange);
        else if (darkQuery.addListener) darkQuery.addListener(onDeviceChange);
    }

    // Keep several open tabs in sync
    window.addEventListener('storage', e => { if (e.key === KEY) { prefs = load(); apply(); } });

    // ---------- Panel ----------
    const panel = document.getElementById('settingsPanel');
    const openBtn = document.getElementById('settingsBtn');
    if (!panel || !openBtn) { apply(); return; }

    function focusables() {
        return [...panel.querySelectorAll('button, [href], input, select, [tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && el.offsetParent !== null);
    }

    function open() {
        panel.hidden = false;
        openBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        const current = panel.querySelector('[aria-pressed="true"]');
        (current || focusables()[0]).focus();
    }

    function close() {
        if (panel.hidden) return;
        panel.hidden = true;
        openBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        openBtn.focus();
    }

    openBtn.addEventListener('click', open);
    panel.addEventListener('click', e => {
        if (e.target.closest('[data-close]')) { close(); return; }
        const btn = e.target.closest('[data-pref]');
        if (btn) set(btn.dataset.pref, btn.dataset.value);
    });
    document.getElementById('settingsReset').addEventListener('click', () => {
        prefs = { ...DEFAULTS };
        apply();
        save();
    });

    panel.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
        if (e.key !== 'Tab') return;
        // Keep keyboard focus inside the open panel
        const f = focusables();
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.Settings = { get: () => ({ ...prefs }), set, resolvedTheme };
    apply();
})();
