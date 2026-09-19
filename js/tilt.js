// 3D tilt + glare for any element with the .tilt class.
// Sets CSS custom properties that styles.css turns into a transform.
(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    const MAX_TILT = 8; // degrees

    document.querySelectorAll('.tilt').forEach(card => {
        let rect = null;

        card.addEventListener('pointerenter', () => {
            rect = card.getBoundingClientRect();
            card.classList.remove('settling');
            card.style.setProperty('--glare', '1');
        });

        card.addEventListener('pointermove', (e) => {
            if (!rect) rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;   // 0..1
            const py = (e.clientY - rect.top) / rect.height;   // 0..1
            const ry = (px - 0.5) * 2 * MAX_TILT;   // left/right tilts around Y
            const rx = (0.5 - py) * 2 * MAX_TILT;   // up/down tilts around X
            card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
            card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
            card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        });

        card.addEventListener('pointerleave', () => {
            rect = null;
            card.classList.add('settling');
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
            card.style.setProperty('--glare', '0');
        });
    });
})();
