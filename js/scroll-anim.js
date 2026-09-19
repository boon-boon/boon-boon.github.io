// Scroll-driven animations for the Work and Career sections, built on GSAP
// ScrollTrigger. The horizontal Work pin and the career timeline are adapted
// from Redoyanul Haque's portfolio-website (MIT) — see THIRD_PARTY_NOTICES.md.
(() => {
    if (!window.gsap || !window.ScrollTrigger) {
        // CDN blocked: CSS falls back to a stacked Work band and a fully drawn timeline.
        document.documentElement.classList.add('no-gsap');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('gsap-ready');

    const mm = gsap.matchMedia();

    // ---- Work: pin the section and slide the band horizontally ----
    mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
        const section = document.querySelector('.work');
        const container = document.querySelector('.work-container');
        const flex = document.querySelector('.work-flex');
        if (!section || !container || !flex) return;

        // How far the band must travel so its last box ends at the container's
        // right edge; the half-padding keeps the final box's text off the edge.
        const distance = () => {
            const boxes = flex.querySelectorAll('.work-box');
            if (!boxes.length) return 0;
            const box = boxes[0].getBoundingClientRect();
            const left = container.getBoundingClientRect().left;
            const parentWidth = container.getBoundingClientRect().width;
            const padding = (parseFloat(getComputedStyle(boxes[0]).paddingLeft) || 0) / 2;
            return Math.max(0, box.width * boxes.length - (left + parentWidth) + padding);
        };

        const tween = gsap.to(flex, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: () => '+=' + distance(),
                scrub: 1,
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                id: 'work'
            }
        });

        return () => tween.kill();
    });

    // ---- Career: the timeline grows and rows fade in as the section scrolls ----
    mm.add('(prefers-reduced-motion: no-preference)', () => {
        const timelines = [];
        document.querySelectorAll('.career-info').forEach(info => {
            const section = info.closest('section');
            const line = info.querySelector('.career-timeline');
            const dot = info.querySelector('.career-dot');
            const boxes = info.querySelectorAll('.career-info-box');
            if (!section || !line || !dot) return;

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top 50%',
                    end: 'bottom 30%',
                    scrub: 1.5,
                    invalidateOnRefresh: true
                }
            });

            tl.fromTo(line, { maxHeight: '0%' }, { maxHeight: '100%', duration: 1, ease: 'none' }, 0)
                .fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
                .fromTo(boxes, { opacity: 0 }, { opacity: 1, stagger: 0.1, duration: 0.5 }, 0)
                // Let the dot flicker while the line is drawing, then settle.
                .fromTo(dot,
                    { animationIterationCount: 'infinite' },
                    { animationIterationCount: '1', delay: 0.3, duration: 0.1 },
                    0);

            timelines.push(tl);
        });

        return () => timelines.forEach(tl => tl.kill());
    });

    // Fonts and images shift layout after the first measure.
    window.addEventListener('load', () => ScrollTrigger.refresh());
})();
