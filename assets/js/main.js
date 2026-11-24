(function () {
    // Translations live in i18n.js; fall back to plain English if it failed to load
    const I18N = window.I18N || { t: k => k, num: n => String(n), lang: 'en' };
    const t = (k, v) => I18N.t(k, v);

    const header = document.getElementById('siteHeader');
    const toTop = document.getElementById('toTop');
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    menuBtn.setAttribute('aria-label', t('openMenu'));

    // Header look + back-to-top visibility on scroll.
    // Menu style "auto" = transparent over the hero, then light (or dark in dark theme) once scrolled.
    const root = document.documentElement;
    function onScroll() {
        const y = window.scrollY;
        const solid = y > 40 || mobileMenu.classList.contains('open');
        const style = root.getAttribute('data-header') || 'auto';
        const look = style !== 'auto' ? style
            : !solid ? 'transparent'
            : root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        header.setAttribute('data-look', look);
        const show = y > 600;
        toTop.classList.toggle('opacity-0', !show);
        toTop.classList.toggle('pointer-events-none', !show);
        toTop.classList.toggle('translate-y-3', !show);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('prefschange', onScroll);
    onScroll();

    // Mobile menu
    function setMenu(open) {
        mobileMenu.classList.toggle('open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', t(open ? 'closeMenu' : 'openMenu'));
        menuBtn.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
        onScroll();
    }
    menuBtn.addEventListener('click', e => {
        e.stopPropagation(); // icon swap detaches e.target, which would trip the outside-click check
        setMenu(!mobileMenu.classList.contains('open'));
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', e => {
        if (mobileMenu.classList.contains('open') && !header.contains(e.target)) setMenu(false);
    });
    window.addEventListener('resize', () => { if (window.innerWidth >= 1024) setMenu(false); });

    // Highlight the nav link of the section in view
    const links = document.querySelectorAll('.nav-link');
    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(s => sectionObserver.observe(s));

    // Reveal on scroll
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // Count-up for hero stats
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        || root.getAttribute('data-motion') === 'off';
    if (!reduceMotion) {
        document.querySelectorAll('[data-count]').forEach(el => {
            const target = +el.dataset.count, start = performance.now(), dur = 1400;
            (function tick(now) {
                const p = Math.min((now - start) / dur, 1);
                el.textContent = I18N.num(Math.round(target * (1 - Math.pow(1 - p, 3))));
                if (p < 1) requestAnimationFrame(tick);
            })(start);
        });
    }

    // "Request a quote" on a service card pre-selects it in the form
    const serviceSelect = document.getElementById('service');
    document.querySelectorAll('.service-cta').forEach(a => {
        a.addEventListener('click', () => { serviceSelect.value = a.dataset.service; });
    });

    // Broken images: show a branded placeholder instead of the browser's broken-image icon
    document.querySelectorAll('img').forEach(img => {
        const fail = () => img.parentElement.classList.add('img-fallback');
        if (img.complete && img.naturalWidth === 0 && img.src) fail();
        else img.addEventListener('error', fail, { once: true });
    });

    // FAQ: keep only one answer open at a time
    const faqs = document.querySelectorAll('.faq');
    faqs.forEach(d => d.addEventListener('toggle', () => {
        if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
    }));

    // ---------------- Contact form ----------------
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    const DRAFT_KEY = 'hs-contact-draft';
    const draftFields = ['firstName', 'lastName', 'email', 'company', 'phone', 'service', 'message'];
    const checked = [...form.querySelectorAll('[required], [pattern], [type="email"]')];

    function validate(field) {
        const empty = field.value.trim() === '';
        const ok = field.required ? !empty && field.checkValidity() : field.checkValidity();
        field.classList.toggle('invalid', !ok);
        field.setAttribute('aria-invalid', String(!ok));
        const err = field.parentElement.querySelector('.error');
        if (err) err.classList.toggle('hidden', ok);
        return ok;
    }
    checked.forEach(f => {
        f.addEventListener('blur', () => { if (f.value || f.required) validate(f); });
        f.addEventListener('input', () => { if (f.classList.contains('invalid')) validate(f); });
    });

    function showStatus(type, text) {
        const styles = {
            success: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200',
            error: 'bg-rose-500/15 border-rose-400/30 text-rose-200',
            info: 'bg-brand-500/15 border-brand-400/30 text-brand-100',
        };
        status.className = 'text-sm rounded-xl px-4 py-3 border ' + styles[type];
        status.textContent = text;
    }

    function setLoading(on) {
        submitBtn.disabled = on;
        submitBtn.querySelector('.btn-label').textContent = t(on ? 'sending' : 'send');
        submitBtn.querySelector('.btn-icon').className = on
            ? 'btn-icon fa-solid fa-spinner fa-spin text-sm'
            : 'btn-icon fa-solid fa-paper-plane text-sm';
    }

    // Save a draft as the visitor types, so a refresh or accidental tab close doesn't lose it
    function saveDraft() {
        const data = {};
        draftFields.forEach(n => { data[n] = form[n].value; });
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch (_) { /* storage blocked */ }
    }
    function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (_) {} }
    try {
        const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
        if (saved) draftFields.forEach(n => { if (saved[n]) form[n].value = saved[n]; });
    } catch (_) {}
    form.addEventListener('input', saveDraft);
    form.addEventListener('change', saveDraft);

    function buildMailto(data) {
        const subject = `Project enquiry${data.service ? ' – ' + data.service : ''} from ${data.firstName} ${data.lastName}`.trim();
        const body = [
            `Name: ${data.firstName} ${data.lastName}`.trim(),
            `Email: ${data.email}`,
            data.phone ? `Phone: ${data.phone}` : null,
            data.company ? `Company: ${data.company}` : null,
            data.service ? `Service: ${data.service}` : null,
            '',
            data.message,
        ].filter(line => line !== null).join('\n');
        return `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const results = checked.map(validate);
        const firstBad = checked[results.indexOf(false)];
        if (firstBad) {
            firstBad.focus();
            showStatus('error', t('fixFields'));
            return;
        }

        // Spam trap filled in: pretend success, send nothing
        if (form.website.value) { form.reset(); showStatus('success', t('thanksShort')); return; }

        const data = {};
        draftFields.forEach(n => { data[n] = form[n].value.trim(); });
        const endpoint = form.dataset.endpoint.trim();

        if (!endpoint) {
            // No form service configured: hand the message to the visitor's email app
            window.location.href = buildMailto(data);
            showStatus('info', t('mailOpened', { email: form.dataset.email }));
            return;
        }

        if (!navigator.onLine) {
            showStatus('error', t('offline'));
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            showStatus('success', t('success', { name: data.firstName }));
            form.reset();
            clearDraft();
        } catch (err) {
            showStatus('error', t('failed', { email: form.dataset.email }));
        } finally {
            setLoading(false);
        }
    });

    // When the language changes: refresh the menu label and clear any message shown in the old language
    document.addEventListener('langchange', () => {
        menuBtn.setAttribute('aria-label', t(mobileMenu.classList.contains('open') ? 'closeMenu' : 'openMenu'));
        status.className = 'hidden';
    });
})();
