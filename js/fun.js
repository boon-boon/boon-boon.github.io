// Easter egg: confetti when the logo is clicked.
(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const logo = document.getElementById('logo');
    if (!logo || reducedMotion) return;

    let loading = null;
    const loadConfetti = () => {
        if (window.confetti) return Promise.resolve(window.confetti);
        if (loading) return loading;
        loading = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
            s.onload = () => resolve(window.confetti);
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return loading;
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => loadConfetti().catch(() => { }));
    }

    logo.addEventListener('click', () => {
        const r = logo.getBoundingClientRect();
        const origin = {
            x: (r.left + r.width / 2) / window.innerWidth,
            y: (r.top + r.height / 2) / window.innerHeight
        };
        loadConfetti().then(confetti => {
            confetti({
                particleCount: 90,
                spread: 75,
                startVelocity: 38,
                origin,
                colors: ['#c2a4ff', '#aa42ff', '#fb8dff', '#ffffff'],
                disableForReducedMotion: true
            });
        }).catch(() => { });
    });
})();
