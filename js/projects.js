// projects/: a split view. On wide screens the preview pane is sticky and shows
// whichever repository is in the middle of the viewport (or the one you click);
// on narrow screens each repository shows its own screenshot inline.
(() => {
    const listEl = document.getElementById('repo-list');
    const preview = document.getElementById('preview');
    if (!listEl || !preview) return;

    const repos = [...listEl.querySelectorAll('.repo')];
    const img = document.getElementById('preview-img');
    const title = document.getElementById('preview-title');
    const link = document.getElementById('preview-link');
    const explorerRepos = [...document.querySelectorAll('.tree .file[data-repo]')];
    const hasPreview = () => getComputedStyle(preview).display !== 'none';

    // Inline thumbnails for narrow screens
    repos.forEach(r => {
        const t = document.createElement('img');
        t.className = 'repo-thumb';
        t.src = r.dataset.img;
        t.alt = r.querySelector('h3').textContent + ' screenshot';
        t.loading = 'lazy';
        r.querySelector('.repo-body').prepend(t);
    });

    let active = -1;
    const select = (i) => {
        if (i === active) return;
        active = i;
        const r = repos[i];
        repos.forEach((x, j) => x.classList.toggle('active', j === i));
        explorerRepos.forEach(a => a.classList.toggle('active', Number(a.dataset.repo) === i && document.body.dataset.file === 'projects'));
        title.textContent = r.querySelector('.repo-name').textContent + ' — preview';
        link.href = r.dataset.url;
        img.classList.add('swapping');
        setTimeout(() => {
            img.src = r.dataset.img;
            img.alt = r.querySelector('h3').textContent + ' screenshot';
            img.classList.remove('swapping');
        }, 180);
    };

    repos.forEach((r, i) => {
        r.querySelector('.repo-btn').addEventListener('click', () => {
            if (hasPreview()) select(i);
            else window.open(r.dataset.url, '_blank', 'noopener');
        });
        r.addEventListener('mouseenter', () => { if (hasPreview()) select(i); });
    });

    // Scroll-driven selection: the repo crossing the middle of the viewport
    let ticking = false;
    const onScroll = () => {
        ticking = false;
        if (!hasPreview()) return;
        const mid = window.innerHeight * 0.5;
        let best = 0, bd = Infinity;
        repos.forEach((r, i) => {
            const b = r.getBoundingClientRect();
            const d = Math.abs(b.top + b.height / 2 - mid);
            if (d < bd) { bd = d; best = i; }
        });
        select(best);
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });

    // Explorer entries jump to a specific repository
    explorerRepos.forEach(a => a.addEventListener('click', (e) => {
        e.preventDefault();
        const i = Number(a.dataset.repo);
        const r = repos[i];
        const top = r.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
        window.scrollTo({ top, behavior: 'smooth' });
        select(i);
    }));

    document.addEventListener('ide:file', (e) => {
        document.body.dataset.file = e.detail;
        explorerRepos.forEach(a => a.classList.toggle('active', e.detail === 'projects' && Number(a.dataset.repo) === active));
    });

    const sync = () => {
        document.querySelector('.repos').classList.toggle('has-preview', hasPreview());
        onScroll();
    };
    window.addEventListener('resize', sync);
    select(0);
    sync();
})();
