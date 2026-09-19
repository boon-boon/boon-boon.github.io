// journey.git: draws a git graph beside the commits. Education and work are
// branches that start at the initial commit and merge into HEAD; the lines draw
// themselves as you scroll and each commit lights up when the line reaches it.
(() => {
    const wrap = document.getElementById('gitlog');
    const svg = document.getElementById('gitlog-svg');
    if (!wrap || !svg) return;

    const NS = 'http://www.w3.org/2000/svg';
    const commits = [...wrap.querySelectorAll('.commit')];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const css = getComputedStyle(document.documentElement);
    const colors = [css.getPropertyValue('--accent').trim(), css.getPropertyValue('--type').trim(), css.getPropertyValue('--fn').trim()];
    let paths = [];

    const build = () => {
        svg.replaceChildren();
        const small = window.matchMedia('(max-width: 900px)').matches;
        const lanes = small ? [12, 32, 52] : [18, 48, 78];
        const nodeY = (li) => li.offsetTop + 14;
        const head = commits.find(c => c.hasAttribute('data-head'));
        const root = commits.find(c => c.hasAttribute('data-root'));
        const yHead = nodeY(head), yRoot = nodeY(root);
        const bend = 34;

        svg.setAttribute('viewBox', `0 0 ${lanes[2] + 20} ${wrap.offsetHeight}`);
        svg.style.width = (lanes[2] + 20) + 'px';
        svg.style.height = wrap.offsetHeight + 'px';

        // Main line (top → bottom), then each branch: merge curve at HEAD, down its lane, fork curve at root
        const d = [`M ${lanes[0]} ${yHead} L ${lanes[0]} ${yRoot}`];
        [1, 2].forEach(l => {
            const x = lanes[l], x0 = lanes[0];
            d[l] = `M ${x0} ${yHead} C ${x0} ${yHead + bend * 0.6}, ${x} ${yHead + bend * 0.4}, ${x} ${yHead + bend}` +
                ` L ${x} ${yRoot - bend}` +
                ` C ${x} ${yRoot - bend * 0.4}, ${x0} ${yRoot - bend * 0.6}, ${x0} ${yRoot}`;
        });

        paths = d.map((def, i) => {
            const p = document.createElementNS(NS, 'path');
            p.setAttribute('d', def);
            p.setAttribute('class', 'git-path');
            p.setAttribute('stroke', colors[i]);
            svg.appendChild(p);
            const len = p.getTotalLength();
            p.style.strokeDasharray = len;
            p.style.strokeDashoffset = reducedMotion ? 0 : len;
            return { p, len };
        });

        commits.forEach(li => {
            const lane = Number(li.dataset.lane || 0);
            const c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx', lanes[lane]);
            c.setAttribute('cy', nodeY(li));
            c.setAttribute('r', li.hasAttribute('data-head') ? 8 : 6);
            c.setAttribute('fill', colors[lane]);
            c.setAttribute('class', 'git-node');
            svg.appendChild(c);
            li._node = c;
        });
        update();
    };

    const update = () => {
        const r = wrap.getBoundingClientRect();
        const probe = window.innerHeight * 0.62;
        const p = reducedMotion ? 1 : Math.min(1, Math.max(0, (probe - r.top) / r.height));
        paths.forEach(({ p: path, len }) => { path.style.strokeDashoffset = len * (1 - p); });
        commits.forEach(li => {
            const on = reducedMotion || li.getBoundingClientRect().top + 14 <= probe;
            li.classList.toggle('lit', on);
            if (li._node) li._node.style.opacity = on ? 1 : 0.25;
        });
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(() => { ticking = false; update(); });
        }
    }, { passive: true });
    let t = 0;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 150); });
    window.addEventListener('load', build);
    document.fonts && document.fonts.ready.then(build);
    build();
})();
