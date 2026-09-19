// Login / boot screen: auto-"signs in" as guest, prints a short boot log while the
// page's fonts and images finish loading, then wipes away. Purely decorative — no
// real input. Shown once per session (the <head> script decides via html.booting);
// any key, click or tap skips it. Dispatches `ide:booted` when the site is revealed.
(() => {
    const root = document.documentElement;
    const done = () => {
        window.ideBooted = true;
        document.dispatchEvent(new Event('ide:booted'));
    };
    const boot = document.getElementById('boot');
    if (!root.classList.contains('booting')) {
        boot && boot.remove();
        window.ideBooted = true;
        return;
    }
    const out = document.getElementById('boot-body');
    const fill = document.getElementById('boot-fill');
    if (!boot || !out) { root.classList.remove('booting'); done(); return; }

    let skipped = false;
    let finished = false;
    const sleep = (ms) => new Promise(r => setTimeout(r, skipped ? 0 : ms));
    const progress = (p) => fill.style.setProperty('--p', p + '%');
    const esc = (s) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

    const line = (html = '') => {
        const d = document.createElement('div');
        d.innerHTML = html;
        out.appendChild(d);
        return d;
    };
    const cursor = () => '<span class="b-cursor"></span>';

    // Types `text` after a label, with a blinking cursor while typing
    const typeInto = async (el, label, text, speed) => {
        for (let i = 0; i <= text.length; i++) {
            el.innerHTML = label + esc(text.slice(0, i)) + (i < text.length ? cursor() : '');
            await sleep(speed + Math.random() * speed * 0.6);
        }
    };

    // Resolves when fonts + the window load event are done (whichever real work remains)
    const loaded = Promise.all([
        document.fonts ? document.fonts.ready.catch(() => { }) : Promise.resolve(),
        document.readyState === 'complete' ? Promise.resolve() : new Promise(r => window.addEventListener('load', r, { once: true }))
    ]);

    const finish = () => {
        if (finished) return;
        finished = true;
        try { sessionStorage.setItem('lby-booted', '1'); } catch (_) { }
        boot.classList.add('leaving');
        // Let the hero start typing as the wipe begins
        setTimeout(done, 250);
        setTimeout(() => { root.classList.remove('booting'); boot.remove(); }, 1000);
    };

    const skip = () => {
        if (skipped) return;
        skipped = true;
        progress(100);
        finish();
    };
    window.addEventListener('keydown', skip, { once: true });
    boot.addEventListener('pointerdown', skip, { once: true });

    // Safety net: never hold the page for more than 7 seconds
    setTimeout(skip, 7000);

    (async () => {
        const date = new Date().toDateString();
        line(`<span class="b-dim">lee-os 2026.9 · tty1 · ${esc(date)}</span>`);
        line();
        await sleep(250);
        const user = line();
        await typeInto(user, 'portfolio login: ', 'guest', 70);
        const pass = line();
        await typeInto(pass, 'password: ', '••••••••', 45);
        await sleep(200);
        line();
        const auth = line('<span class="b-dim">authenticating…</span>');
        progress(18);
        await sleep(350);

        const steps = [
            'Mounting ~/projects',
            'Loading skills.json',
            'Linking journey.git',
            'Compiling about.kt',
            'Starting contact.sh'
        ];
        for (let i = 0; i < steps.length; i++) {
            line(`<span class="b-ok">[  OK  ]</span> ${esc(steps[i])}`);
            progress(18 + Math.round(((i + 1) / steps.length) * 62));
            await sleep(170);
        }

        // Hold at 80% until the page has really loaded (but no longer than 2.5s)
        await Promise.race([loaded, sleep(2500)]);
        progress(100);
        auth.innerHTML = '<span class="b-dim">authenticated.</span>';
        await sleep(250);
        line();
        line('<span class="b-accent">✓ Access granted.</span> Welcome, guest.');
        await sleep(650);
        finish();
    })();
})();
