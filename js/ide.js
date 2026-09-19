// Editor chrome: explorer/drawer, scroll-spy (tabs, breadcrumbs, status bar),
// line-number gutters, minimap, reveal-on-scroll, hero typing and the
// Ctrl/⌘+K command palette.
(() => {
    document.documentElement.classList.add('js');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
    const LINE = 24;

    const sections = [...document.querySelectorAll('.file-section')];
    const tabs = [...document.querySelectorAll('.tab')];
    const files = [...document.querySelectorAll('.tree .file[data-target]')];
    const titleFile = document.getElementById('title-file');
    const crumb = document.getElementById('crumb');
    const sbLang = document.getElementById('sb-lang');
    const sbPos = document.getElementById('sb-pos');
    const tabbar = document.querySelector('.tabbar');

    // ---- Toast ----
    const toast = document.getElementById('toast');
    let toastTimer = 0;
    window.ideToast = (msg) => {
        toast.textContent = msg;
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
    };

    // ---- Explorer (desktop) and drawer (mobile) ----
    const body = document.body;
    const menuBtn = document.getElementById('menu-btn');
    const backdrop = document.getElementById('drawer-backdrop');
    const explorerAct = document.querySelector('.act[data-act="explorer"]');

    const setDrawer = (open) => {
        body.classList.toggle('drawer-open', open);
        backdrop.hidden = !open;
        menuBtn.setAttribute('aria-expanded', String(open));
    };
    const toggleExplorer = () => {
        if (isMobile()) {
            setDrawer(!body.classList.contains('drawer-open'));
        } else {
            const closed = body.classList.toggle('explorer-closed');
            explorerAct.classList.toggle('active', !closed);
            setTimeout(refreshLayout, 400);
        }
    };
    menuBtn.addEventListener('click', toggleExplorer);
    backdrop.addEventListener('click', () => setDrawer(false));
    document.querySelectorAll('.tree a').forEach(a => a.addEventListener('click', () => setDrawer(false)));

    // ---- Activity bar ----
    const goTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    };
    window.ideGoTo = goTo;
    document.querySelectorAll('.act[data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
            const act = btn.dataset.act;
            if (act === 'explorer') toggleExplorer();
            if (act === 'palette') openPalette();
            if (act === 'git') goTo('journey');
            if (act === 'skills') goTo('skills');
            if (act === 'terminal') openTerminal();
        });
    });

    const openTerminal = () => {
        goTo('contact');
        setTimeout(() => document.getElementById('terminal-input').focus({ preventScroll: true }), reducedMotion ? 0 : 700);
    };
    window.ideOpenTerminal = openTerminal;

    // ---- Gutters: one line number per 24px of section height ----
    const buildGutters = () => {
        sections.forEach(sec => {
            const gutter = sec.querySelector('.gutter');
            const count = Math.max(1, Math.floor((sec.offsetHeight - 80) / LINE));
            if (gutter.childElementCount === count) return;
            const frag = document.createDocumentFragment();
            for (let i = 1; i <= count; i++) {
                const s = document.createElement('span');
                s.textContent = i;
                frag.appendChild(s);
            }
            gutter.replaceChildren(frag);
        });
    };

    // ---- Minimap ----
    const minimap = document.getElementById('minimap');
    const track = document.getElementById('minimap-track');
    const view = document.getElementById('minimap-view');
    let mmBlocks = [];

    const buildMinimap = () => {
        if (!minimap || getComputedStyle(minimap).display === 'none') return;
        const docH = document.documentElement.scrollHeight;
        const trackH = track.clientHeight;
        track.replaceChildren();
        mmBlocks = sections.map((sec, si) => {
            const block = document.createElement('div');
            block.className = 'mm-block';
            const top = (sec.offsetTop / docH) * trackH;
            const h = (sec.offsetHeight / docH) * trackH;
            block.style.top = top + 'px';
            block.style.height = h + 'px';
            const lines = Math.max(2, Math.floor(h / 4));
            // Deterministic "code" silhouette: short/long lines, headings highlighted
            for (let i = 0; i < lines; i++) {
                const l = document.createElement('div');
                l.className = 'mm-line';
                const w = 20 + ((i * 37 + si * 53) % 70);
                l.style.width = (i % 7 === 3 ? 18 : w) + '%';
                l.style.marginLeft = ((i * 13 + si) % 4) * 6 + '%';
                if (i === 2 || i === 3) l.classList.add('hl');
                block.appendChild(l);
            }
            track.appendChild(block);
            return block;
        });
        updateMinimapView();
    };

    const updateMinimapView = () => {
        if (!mmBlocks.length) return;
        const docH = document.documentElement.scrollHeight;
        const trackH = track.clientHeight;
        view.style.top = (8 + (window.scrollY / docH) * trackH) + 'px';
        view.style.height = Math.max(16, (window.innerHeight / docH) * trackH) + 'px';
    };

    minimap && minimap.addEventListener('click', (e) => {
        const r = track.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        window.scrollTo({ top: p * document.documentElement.scrollHeight - window.innerHeight / 2, behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    // ---- Scroll-spy: tabs, explorer, breadcrumbs, status bar ----
    let current = null;
    let curLineEl = null;
    let ticking = false;

    const setActive = (sec) => {
        if (sec === current) return;
        current = sec;
        const id = sec.id;
        tabs.forEach(t => t.classList.toggle('active', t.dataset.target === id));
        files.forEach(f => {
            if (f.dataset.repo !== undefined) return;
            f.classList.toggle('active', f.dataset.target === id);
        });
        const name = sec.dataset.file;
        titleFile.textContent = name;
        crumb.textContent = name;
        sbLang.textContent = sec.dataset.lang;
        mmBlocks.forEach((b, i) => b.classList.toggle('active', sections[i] === sec));
        const tab = tabs.find(t => t.dataset.target === id);
        if (tab) {
            const tl = tab.offsetLeft, tr = tl + tab.offsetWidth;
            if (tl < tabbar.scrollLeft || tr > tabbar.scrollLeft + tabbar.clientWidth) {
                tabbar.scrollTo({ left: tl - 40, behavior: reducedMotion ? 'auto' : 'smooth' });
            }
        }
        document.dispatchEvent(new CustomEvent('ide:file', { detail: id }));
    };

    let col = 1;
    window.addEventListener('pointermove', (e) => { col = 1 + Math.max(0, Math.floor((e.clientX - 300) / 9)); }, { passive: true });

    const onScroll = () => {
        ticking = false;
        const probe = window.innerHeight * 0.4;
        let sec = sections[0];
        for (const s of sections) {
            if (s.getBoundingClientRect().top <= probe) sec = s;
        }
        setActive(sec);

        // Current line: the gutter line at the middle of the viewport
        const r = sec.getBoundingClientRect();
        const line = Math.max(1, Math.floor((window.innerHeight / 2 - r.top - 40) / LINE) + 1);
        const gutter = sec.querySelector('.gutter');
        const el = gutter.children[Math.min(line, gutter.children.length) - 1];
        if (el !== curLineEl) {
            curLineEl && curLineEl.classList.remove('cur');
            el && el.classList.add('cur');
            curLineEl = el;
        }
        sbPos.textContent = `Ln ${line}, Col ${col}`;
        updateMinimapView();
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(onScroll);
        }
    }, { passive: true });

    const refreshLayout = () => {
        buildGutters();
        buildMinimap();
        onScroll();
    };
    window.ideRefresh = refreshLayout;

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!isMobile()) setDrawer(false);
            refreshLayout();
        }, 150);
    });
    window.addEventListener('load', refreshLayout);
    document.fonts && document.fonts.ready.then(refreshLayout);
    refreshLayout();

    // ---- Reveal on scroll (staggered within each section) ----
    sections.forEach(sec => sec.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 6))));
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                revealObs.unobserve(e.target);
            }
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // ---- Hero: type the name, then rotate the role line ----
    const nameEl = document.querySelector('.type-target');
    const roleEl = document.querySelector('.role-rotate');
    if (nameEl) nameEl.parentElement.setAttribute('aria-label', nameEl.dataset.text);

    if (!reducedMotion && nameEl) {
        const full = nameEl.dataset.text;
        nameEl.textContent = '';
        let i = 0;
        const typeName = () => {
            nameEl.textContent = full.slice(0, ++i);
            if (i < full.length) setTimeout(typeName, 55 + Math.random() * 60);
            else setTimeout(rotateRoles, 1800);
        };
        setTimeout(typeName, 450);
    }

    function rotateRoles() {
        if (!roleEl) return;
        let roles;
        try { roles = JSON.parse(roleEl.dataset.roles); } catch (_) { return; }
        let r = 0, c = roles[0].length, deleting = true;
        const step = () => {
            const word = roles[r];
            c += deleting ? -1 : 1;
            roleEl.textContent = word.slice(0, c);
            let delay = deleting ? 28 : 55;
            if (deleting && c === 0) {
                deleting = false;
                r = (r + 1) % roles.length;
                delay = 250;
            } else if (!deleting && c === roles[r].length) {
                deleting = true;
                delay = 2400;
            }
            setTimeout(step, delay);
        };
        step();
    }

    // ---- Test run: lines print one after another ----
    const testLines = [...document.querySelectorAll('.t-line')];
    const testObs = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        testObs.disconnect();
        testLines.forEach((l, i) => setTimeout(() => l.classList.add('on'), reducedMotion ? 0 : 250 + i * 420));
    }, { threshold: 0.4 });
    const testrun = document.getElementById('testrun');
    testrun && testObs.observe(testrun);

    // ---- Command palette ----
    const palette = document.getElementById('palette');
    const pInput = document.getElementById('palette-input');
    const pList = document.getElementById('palette-list');
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    document.getElementById('palette-kbd').textContent = isMac ? '⌘ K' : 'Ctrl K';

    const copy = (text, msg) => {
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
            .then(() => window.ideToast(msg), () => window.ideToast(text));
    };

    const commands = [
        ...sections.map(s => ({ icon: 'far fa-file-code', label: `Open ${s.dataset.file}`, hint: 'file', run: () => goTo(s.id) })),
        { icon: 'fas fa-terminal', label: 'Open terminal', hint: 'contact.sh', run: openTerminal },
        { icon: 'fas fa-file-pdf', label: 'Open resume.pdf', hint: 'new tab', run: () => window.open('resume/Lee_Boon_Yew_Resume.pdf', '_blank', 'noopener') },
        { icon: 'fas fa-copy', label: 'Copy email address', hint: 'leeboonyew06@gmail.com', run: () => copy('leeboonyew06@gmail.com', 'Email copied to clipboard') },
        { icon: 'fas fa-envelope', label: 'Send an email', hint: 'mailto', run: () => { location.href = 'mailto:leeboonyew06@gmail.com'; } },
        { icon: 'fab fa-github', label: 'Open GitHub profile', hint: 'boon-boon', run: () => window.open('https://github.com/boon-boon', '_blank', 'noopener') },
        { icon: 'fab fa-linkedin-in', label: 'Open LinkedIn profile', hint: 'new tab', run: () => window.open('https://www.linkedin.com/in/boon-yew-lee-47228836b/', '_blank', 'noopener') },
        { icon: 'far fa-copy', label: 'Toggle explorer', hint: 'sidebar', run: toggleExplorer }
    ];

    let filtered = commands;
    let sel = 0;
    let lastFocus = null;

    const renderPalette = () => {
        pList.replaceChildren(...filtered.map((c, i) => {
            const li = document.createElement('li');
            li.setAttribute('role', 'option');
            li.className = i === sel ? 'sel' : '';
            li.innerHTML = `<i class="${c.icon}" aria-hidden="true"></i><span></span><span class="hint"></span>`;
            li.children[1].textContent = c.label;
            li.children[2].textContent = c.hint;
            li.addEventListener('mouseenter', () => { sel = i; renderPalette(); });
            li.addEventListener('click', () => runCommand(c));
            return li;
        }));
        if (!filtered.length) {
            const li = document.createElement('li');
            li.textContent = 'No matching commands';
            li.style.color = 'var(--muted)';
            pList.appendChild(li);
        }
    };

    const fuzzy = (q, s) => {
        q = q.toLowerCase(); s = s.toLowerCase();
        let j = 0;
        for (let i = 0; i < s.length && j < q.length; i++) if (s[i] === q[j]) j++;
        return j === q.length;
    };

    function openPalette() {
        lastFocus = document.activeElement;
        palette.hidden = false;
        pInput.value = '';
        filtered = commands;
        sel = 0;
        renderPalette();
        pInput.focus();
    }
    const closePalette = () => {
        palette.hidden = true;
        lastFocus && lastFocus.focus && lastFocus.focus();
    };
    const runCommand = (c) => {
        closePalette();
        c.run();
    };

    document.getElementById('palette-open').addEventListener('click', openPalette);
    pInput.addEventListener('input', () => {
        const q = pInput.value.trim();
        filtered = q ? commands.filter(c => fuzzy(q, c.label + ' ' + c.hint)) : commands;
        sel = 0;
        renderPalette();
    });
    pInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { sel = Math.min(filtered.length - 1, sel + 1); renderPalette(); e.preventDefault(); }
        if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); renderPalette(); e.preventDefault(); }
        if (e.key === 'Enter' && filtered[sel]) { runCommand(filtered[sel]); e.preventDefault(); }
    });
    palette.addEventListener('click', (e) => { if (e.target === palette) closePalette(); });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            palette.hidden ? openPalette() : closePalette();
        }
        if (e.key === 'Escape') {
            if (!palette.hidden) closePalette();
            setDrawer(false);
        }
    });

    // ---- Footer year ----
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();
