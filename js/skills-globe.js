// CSS-3D icon sphere. Items are laid out on a Fibonacci lattice and
// rotated every frame; depth drives scale, opacity and blur.
(() => {
    const wrap = document.getElementById('skills-globe');
    if (!wrap) return;

    const items = Array.from(wrap.querySelectorAll('.globe-item'));
    if (items.length === 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Unit-sphere positions
    const N = items.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const points = items.map((_, i) => {
        const y = 1 - (i / (N - 1)) * 2;          // 1 .. -1
        const r = Math.sqrt(1 - y * y);
        const theta = golden * i;
        return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
    });

    let radius = 200;
    let rotX = -0.35;               // tilt so the top is visible
    let rotY = 0;
    let velX = 0;
    let velY = reducedMotion ? 0 : 0.004;
    const IDLE_VEL = 0.004;
    let hovering = false;
    let dragging = false;
    let lastX = 0, lastY = 0;
    let running = false;
    let rafId = 0;

    const resize = () => {
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        radius = Math.min(w, h) * 0.38;
    };

    const render = () => {
        const sinX = Math.sin(rotX), cosX = Math.cos(rotX);
        const sinY = Math.sin(rotY), cosY = Math.cos(rotY);

        for (let i = 0; i < N; i++) {
            const p = points[i];
            // rotate around Y then X
            const x1 = p.x * cosY - p.z * sinY;
            const z1 = p.x * sinY + p.z * cosY;
            const y2 = p.y * cosX - z1 * sinX;
            const z2 = p.y * sinX + z1 * cosX;

            const depth = (z2 + 1) / 2;              // 0 (back) .. 1 (front)
            const scale = 0.55 + depth * 0.6;
            const opacity = 0.25 + depth * 0.75;
            const blur = (1 - depth) * 2.2;

            const el = items[i];
            el.style.transform =
                `translate3d(${(x1 * radius).toFixed(1)}px, ${(y2 * radius).toFixed(1)}px, ${(z2 * radius).toFixed(1)}px) scale(${scale.toFixed(3)})`;
            el.style.opacity = opacity.toFixed(3);
            el.style.filter = blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : '';
            el.style.zIndex = String(Math.round(depth * 100));
            el.style.pointerEvents = depth > 0.5 ? 'auto' : 'none';
        }
    };

    const tick = () => {
        if (!dragging) {
            if (!hovering && !reducedMotion) {
                // ease back to idle spin
                velY += (IDLE_VEL - velY) * 0.02;
                velX *= 0.95;
            } else {
                velY *= 0.95;
                velX *= 0.95;
            }
            rotY += velY;
            rotX += velX;
        }
        // keep the tilt within a comfortable range
        rotX = Math.max(-1.2, Math.min(1.2, rotX));
        render();

        const idle = !dragging && Math.abs(velX) < 0.0002 && Math.abs(velY) < 0.0002;
        if (idle && (hovering || reducedMotion)) {
            running = false;
            return;
        }
        rafId = requestAnimationFrame(tick);
    };

    const start = () => {
        if (running) return;
        running = true;
        rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
        running = false;
        cancelAnimationFrame(rafId);
    };

    // ---- Pointer interaction ----
    wrap.addEventListener('pointerenter', () => { hovering = true; start(); });
    wrap.addEventListener('pointerleave', () => { hovering = false; start(); });

    wrap.addEventListener('pointerdown', (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        wrap.classList.add('dragging');
        wrap.setPointerCapture(e.pointerId);
        start();
    });

    wrap.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        velY = dx * 0.005;
        velX = dy * 0.005;
        rotY += velY;
        rotX += velX;
    });

    const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        wrap.classList.remove('dragging');
        start();
    };
    wrap.addEventListener('pointerup', endDrag);
    wrap.addEventListener('pointercancel', endDrag);

    // ---- Lifecycle ----
    const visibility = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) start();
            else stop();
        });
    }, { threshold: 0.05 });

    window.addEventListener('resize', () => { resize(); render(); });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else start();
    });

    resize();
    wrap.classList.add('ready');
    render();
    visibility.observe(wrap);
})();
