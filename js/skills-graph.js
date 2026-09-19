// skills.json: a draggable force-directed dependency graph. A root node links to
// four group hubs, each hub to its skills. Built from the #skill-list markup, so
// the list stays the accessible source of truth.
(() => {
    const canvas = document.getElementById('skills-graph');
    const list = document.getElementById('skill-list');
    const section = document.getElementById('skills');
    if (!canvas || !list || !canvas.getContext) {
        section && section.classList.add('no-graph');
        return;
    }

    // ---- Phone view: the same data as a foldable, syntax-highlighted JSON file ----
    // (CSS shows it instead of the canvas below 640px; the graph is too cramped there
    // and dragging nodes would fight with page scrolling.)
    const jsonEl = document.getElementById('skills-json');
    if (jsonEl) {
        const labels = { lang: 'languages', mobile: 'mobile', data: 'data & systems', tool: 'tools' };
        const colorVar = { lang: '--accent', mobile: '--fn', data: '--type', tool: '--kw' };
        const byGroup = {};
        [...list.children].forEach(li => (byGroup[li.dataset.group] ||= []).push(li.textContent));
        const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const keys = Object.keys(labels).filter(k => byGroup[k]);
        let n = 0;
        jsonEl.innerHTML = '<div class="sj-punc">{</div>' + keys.map((k, gi) => {
            const items = byGroup[k];
            const comma = gi < keys.length - 1 ? ',' : '';
            return `<details class="sj-group" open style="--c: var(${colorVar[k]})">` +
                `<summary><span class="sj-fold" aria-hidden="true">▾</span><span class="sj-dot" aria-hidden="true"></span>` +
                `<span class="sj-key">"${esc(labels[k])}"</span><span class="sj-punc">:&nbsp;[</span>` +
                `<span class="sj-folded">… ${items.length} ]${comma}</span></summary>` +
                items.map((s, i) => `<div class="sj-item" style="--n:${n++}"><span class="str">"${esc(s)}"</span>` +
                    `<span class="sj-punc">${i < items.length - 1 ? ',' : ''}</span></div>`).join('') +
                `<div class="sj-close sj-punc">]${comma}</div></details>`;
        }).join('') + '<div class="sj-punc">}</div>';

        new IntersectionObserver((entries, obs) => {
            if (entries[0].isIntersecting) { jsonEl.classList.add('in'); obs.disconnect(); }
        }, { threshold: 0.15 }).observe(jsonEl);
        // folding changes the section height, so refresh the gutter line numbers
        jsonEl.addEventListener('toggle', () => window.ideRefresh && window.ideRefresh(), true);
    }

    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Colours come from the current theme's CSS tokens (re-read on theme change)
    const v = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const groupVar = { lang: '--accent', mobile: '--fn', data: '--type', tool: '--kw' };
    const theme = {};
    const readTheme = () => {
        theme.bg = v('--bg');
        theme.text = v('--text');
        theme.edge = v('--graph-edge');
    };
    readTheme();
    const groups = {
        lang: { label: 'languages', color: v('--accent') },
        mobile: { label: 'mobile', color: v('--fn') },
        data: { label: 'data & systems', color: v('--type') },
        tool: { label: 'tools', color: v('--kw') }
    };

    // ---- Nodes & links ----
    const nodes = [];
    const links = [];
    const root = { id: 'lee', label: '@lee', kind: 'root', color: v('--text'), r: 9 };
    nodes.push(root);
    const hubs = {};
    Object.entries(groups).forEach(([key, g]) => {
        const hub = { id: key, label: g.label, kind: 'hub', color: g.color, r: 7, group: key };
        hubs[key] = hub;
        nodes.push(hub);
        links.push({ a: root, b: hub, len: 150 });
    });
    [...list.children].forEach(li => {
        const g = li.dataset.group;
        const n = { id: li.textContent, label: li.textContent, kind: 'skill', color: groups[g].color, r: 4.5, group: g };
        nodes.push(n);
        links.push({ a: hubs[g], b: n, len: 78 });
    });

    // ---- Sizing ----
    let W = 0, H = 0, dpr = 1;
    const resize = () => {
        const r = canvas.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = r.width; H = r.height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
        nodes.forEach((n, i) => {
            const a = (i / nodes.length) * Math.PI * 2;
            const rad = n.kind === 'root' ? 0 : n.kind === 'hub' ? 90 : 170;
            n.x = W / 2 + Math.cos(a) * rad + (Math.random() - 0.5) * 20;
            n.y = H / 2 + Math.sin(a) * rad * 0.7 + (Math.random() - 0.5) * 20;
            n.vx = 0; n.vy = 0;
        });
    };

    // ---- Simulation ----
    let drag = null;
    let hover = null;
    const step = () => {
        const cx = W / 2, cy = H / 2;
        // repulsion
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                let dx = b.x - a.x, dy = b.y - a.y;
                let d2 = dx * dx + dy * dy || 0.01;
                // the root pushes harder so skill labels don't pile onto "@lee"
                const f = (a.kind === 'root' || b.kind === 'root' ? 5200 : 2600) / d2;
                const d = Math.sqrt(d2);
                dx /= d; dy /= d;
                a.vx -= dx * f; a.vy -= dy * f;
                b.vx += dx * f; b.vy += dy * f;
            }
        }
        // springs
        links.forEach(l => {
            const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
            const f = (d - l.len) * 0.02;
            const fx = (dx / d) * f, fy = (dy / d) * f;
            l.a.vx += fx; l.a.vy += fy;
            l.b.vx -= fx; l.b.vy -= fy;
        });
        // centre, keep the graph wider than tall, damping, bounds
        nodes.forEach(n => {
            n.vx += (cx - n.x) * 0.004;
            n.vy += (cy - n.y) * 0.008;
            if (n === drag) { n.vx = n.vy = 0; return; }
            n.vx *= 0.82; n.vy *= 0.82;
            n.x += n.vx; n.y += n.vy;
            n.x = Math.max(40, Math.min(W - 40, n.x));
            n.y = Math.max(24, Math.min(H - 44, n.y));
        });
    };

    const neighbours = (n) => new Set(links.filter(l => l.a === n || l.b === n).flatMap(l => [l.a, l.b]));

    const draw = (t) => {
        ctx.clearRect(0, 0, W, H);
        const focus = hover || drag;
        const near = focus ? neighbours(focus) : null;

        links.forEach(l => {
            const on = !near || (near.has(l.a) && near.has(l.b));
            ctx.strokeStyle = on ? l.b.color : theme.edge;
            ctx.globalAlpha = on ? (near ? 0.9 : 0.35) : 1;
            ctx.lineWidth = l.a.kind === 'root' ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(l.a.x, l.a.y);
            ctx.lineTo(l.b.x, l.b.y);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;

        // travelling "packets" along root→hub edges, a hint that the graph is alive
        if (!reducedMotion) {
            links.filter(l => l.a.kind === 'root').forEach((l, i) => {
                const p = ((t / 1800) + i * 0.25) % 1;
                ctx.fillStyle = l.b.color;
                ctx.beginPath();
                ctx.arc(l.a.x + (l.b.x - l.a.x) * p, l.a.y + (l.b.y - l.a.y) * p, 2, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        nodes.forEach(n => {
            const dim = near && !near.has(n);
            ctx.globalAlpha = dim ? 0.25 : 1;
            if (n.kind !== 'skill') {
                ctx.fillStyle = n.color;
                ctx.globalAlpha *= 0.18;
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r * 2.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = dim ? 0.25 : 1;
            }
            ctx.fillStyle = n.kind === 'skill' ? theme.bg : n.color;
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n === focus ? n.r + 2 : n.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.font = n.kind === 'skill' ? '12px "Geist Mono", monospace' : '600 12px "Geist Mono", monospace';
            ctx.fillStyle = n.kind === 'skill' ? theme.text : n.color;
            ctx.textBaseline = 'middle';
            const label = n.kind === 'hub' ? `"${n.label}"` : n.label;
            ctx.fillText(label, n.x + n.r + 7, n.y);
        });
        ctx.globalAlpha = 1;
    };

    // ---- Pointer ----
    const pick = (x, y) => {
        let best = null, bd = 22 * 22;
        nodes.forEach(n => {
            const d = (n.x - x) ** 2 + (n.y - y) ** 2;
            if (d < bd) { bd = d; best = n; }
        });
        return best;
    };
    const pos = (e) => {
        const r = canvas.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    };
    canvas.addEventListener('pointerdown', (e) => {
        const [x, y] = pos(e);
        drag = pick(x, y);
        if (drag) {
            canvas.setPointerCapture(e.pointerId);
            canvas.classList.add('dragging');
            wake();
        }
    });
    canvas.addEventListener('pointermove', (e) => {
        const [x, y] = pos(e);
        if (drag) {
            drag.x = x; drag.y = y;
        } else {
            const h = pick(x, y);
            if (h !== hover) { hover = h; canvas.style.cursor = h ? 'grab' : 'default'; }
        }
        wake();
    });
    const end = () => {
        drag = null;
        canvas.classList.remove('dragging');
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', () => { hover = null; });

    // ---- Loop: runs only while visible ----
    let running = false, visible = false, raf = 0;
    const loop = (t) => {
        step();
        draw(t);
        if (running) raf = requestAnimationFrame(loop);
    };
    const wake = () => {
        if (visible && !running && !reducedMotion) {
            running = true;
            raf = requestAnimationFrame(loop);
        }
        if (reducedMotion) { for (let i = 0; i < 3; i++) step(); draw(0); }
    };
    new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) wake();
        else { running = false; cancelAnimationFrame(raf); }
    }, { threshold: 0.05 }).observe(canvas);

    resize();
    seed();
    if (reducedMotion) {
        for (let i = 0; i < 400; i++) step();
        draw(0);
    }
    let rt = 0;
    window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
            const wasHidden = W === 0;
            resize();
            // the canvas was hidden (phone layout) and is now shown: lay the graph out fresh
            if (wasHidden && W > 0) {
                seed();
                if (reducedMotion) for (let i = 0; i < 400; i++) step();
            }
            draw(0);
        }, 120);
    });
    document.fonts && document.fonts.ready.then(() => draw(0));

    // Re-colour on theme change
    document.addEventListener('ide:theme', () => {
        readTheme();
        root.color = theme.text;
        nodes.forEach(n => { if (n.group) n.color = v(groupVar[n.group]); });
        draw(performance.now());
    });
})();
