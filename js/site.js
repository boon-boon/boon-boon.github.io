// Page behaviour adapted from Redoyanul Haque's portfolio-website (MIT, see
// THIRD_PARTY_NOTICES.md): Lenis smooth scroll, custom cursor, text reveals,
// the rolling landing titles, the WHAT I DO panel and the contact reveal.
(() => {
    const hasGsap = !!(window.gsap && window.ScrollTrigger);
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const isDesktop = () => window.innerWidth > 1024;

    // ---- Text splitting ----
    // Wraps every character (or word) of an element's text in spans, keeping
    // nested tags such as <span class="do-h2"> intact.
    const splitText = (el, type, { mask = true } = {}) => {
        const makeUnit = (text) => {
            const inner = document.createElement('span');
            inner.className = type === 'chars' ? 'split-char' : 'split-word';
            inner.textContent = text;
            if (!mask) return inner;
            const wrap = document.createElement('span');
            wrap.className = 'split-mask';
            wrap.appendChild(inner);
            return wrap;
        };
        const walk = (node) => {
            [...node.childNodes].forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    walk(child);
                    return;
                }
                if (child.nodeType !== Node.TEXT_NODE) return;
                const text = child.textContent;
                if (!text.trim()) return;
                const frag = document.createDocumentFragment();
                if (type === 'chars') {
                    for (const ch of text) {
                        if (!ch.trim()) {
                            // A real element, so flex containers keep the word gap
                            const gap = document.createElement('span');
                            gap.className = 'split-space';
                            gap.textContent = ' ';
                            frag.appendChild(gap);
                        } else {
                            frag.appendChild(makeUnit(ch));
                        }
                    }
                } else {
                    text.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (!part.trim()) frag.appendChild(document.createTextNode(' '));
                        else frag.appendChild(makeUnit(part));
                    });
                }
                node.replaceChild(frag, child);
            });
        };
        walk(el);
        return [...el.querySelectorAll(type === 'chars' ? '.split-char' : '.split-word')];
    };

    // ---- Lenis smooth scroll (desktop) ----
    let lenis = null;
    if (window.Lenis && hasGsap && !reducedMotion && isDesktop()) {
        lenis = new Lenis({
            duration: 1.7,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1.7,
            touchMultiplier: 2
        });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        window.addEventListener('resize', () => lenis.resize());
    }
    window.lenis = lenis;

    // GSAP pins the Work section inside a .pin-spacer; that wrapper owns the
    // scroll range, so navigate to it rather than the section.
    const rangeOf = (el) =>
        el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const id = link.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            const box = rangeOf(target);
            if (lenis) {
                lenis.scrollTo(box, { offset: 0, duration: 1.5 });
            } else {
                box.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
            }
        });
    });

    // ---- Custom cursor ----
    const cursor = document.querySelector('.cursor-main');
    if (cursor && finePointer && !reducedMotion) {
        let hover = false;
        const mouse = { x: -100, y: -100 };
        const pos = { x: -100, y: -100 };
        document.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        const loop = () => {
            if (!hover) {
                pos.x += (mouse.x - pos.x) / 6;
                pos.y += (mouse.y - pos.y) / 6;
                cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        document.querySelectorAll('[data-cursor]').forEach(item => {
            item.addEventListener('mouseover', (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (item.dataset.cursor === 'icons') {
                    cursor.classList.add('cursor-icons');
                    cursor.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
                    cursor.style.setProperty('--cursorH', `${rect.height}px`);
                    hover = true;
                }
                if (item.dataset.cursor === 'disable') cursor.classList.add('cursor-disable');
            });
            item.addEventListener('mouseout', () => {
                cursor.classList.remove('cursor-disable', 'cursor-icons');
                hover = false;
            });
        });
    }

    // ---- Social icons: each icon leans toward the pointer ----
    const social = document.getElementById('social');
    if (social && finePointer && !reducedMotion) {
        social.querySelectorAll('span').forEach(span => {
            const link = span.querySelector('a');
            let rect = span.getBoundingClientRect();
            let mouseX = rect.width / 2, mouseY = rect.height / 2;
            let curX = mouseX, curY = mouseY;
            window.addEventListener('resize', () => { rect = span.getBoundingClientRect(); });
            document.addEventListener('mousemove', (e) => {
                rect = span.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                if (x < 40 && x > 10 && y < 40 && y > 5) {
                    mouseX = x;
                    mouseY = y;
                } else {
                    mouseX = rect.width / 2;
                    mouseY = rect.height / 2;
                }
            });
            const update = () => {
                curX += (mouseX - curX) * 0.1;
                curY += (mouseY - curY) * 0.1;
                link.style.setProperty('--siLeft', `${curX}px`);
                link.style.setProperty('--siTop', `${curY}px`);
                requestAnimationFrame(update);
            };
            update();
        });
    }

    // ---- WHAT I DO panel ----
    const whatBoxIn = document.querySelector('.what-box-in');
    const whatContents = [...document.querySelectorAll('.what-content')];
    const touch = !finePointer;
    if (touch) {
        whatContents.forEach(c => {
            c.classList.remove('what-noTouch');
            c.addEventListener('click', () => {
                c.classList.toggle('what-content-active');
                c.classList.remove('what-sibling');
                whatContents.forEach(s => {
                    if (s !== c) {
                        s.classList.remove('what-content-active');
                        s.classList.toggle('what-sibling');
                    }
                });
            });
        });
    }

    // ---- Footer year ----
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    if (!hasGsap) {
        // No GSAP: show everything statically.
        whatBoxIn && whatBoxIn.classList.add('in-view');
        return;
    }

    // ---- Landing intro (initialFX) ----
    const introChars = ['.landing-info h3', '.landing-intro h2', '.landing-intro h1']
        .flatMap(sel => [...document.querySelectorAll(sel)])
        .flatMap(el => splitText(el, 'chars'));

    if (!reducedMotion) {
        gsap.fromTo(introChars,
            { opacity: 0, y: 80, filter: 'blur(5px)' },
            { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.inOut', stagger: 0.025, delay: 0.3 });
        gsap.fromTo('.landing-info-h2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power1.inOut', delay: 0.8 });
        gsap.fromTo(['.header', '.icons-section', '.nav-fade'], { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power1.inOut', delay: 0.1 });
    }

    // Rolling role titles: ENGINEER ⇄ DEVELOPER and SOFTWARE ⇄ MOBILE APP
    const roleLine = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return [];
        el.classList.add('split-line');
        return splitText(el, 'chars', { mask: false });
    };
    const text1 = roleLine('.landing-h2-info');
    const text2 = roleLine('.landing-h2-info-1');
    const text3 = roleLine('.landing-h2-1');
    const text4 = roleLine('.landing-h2-2');

    if (!reducedMotion) {
        gsap.fromTo(text1.concat(text3),
            { opacity: 0, y: 80, filter: 'blur(5px)' },
            { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.inOut', stagger: 0.025, delay: 0.3 });

        const loopText = (a, b) => {
            const delay = 4;
            const delay2 = delay * 2 + 1;
            const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
            tl.fromTo(b, { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.inOut', stagger: 0.1, delay }, 0)
                .fromTo(a, { y: 80 }, { y: 0, duration: 1.2, ease: 'power3.inOut', stagger: 0.1, delay: delay2 }, 1)
                .fromTo(a, { y: 0 }, { y: -80, duration: 1.2, ease: 'power3.inOut', stagger: 0.1, delay }, 0)
                .to(b, { y: -80, duration: 1.2, ease: 'power3.inOut', stagger: 0.1, delay: delay2 }, 1);
            return tl;
        };
        loopText(text1, text2);
        loopText(text3, text4);
    } else {
        gsap.set(text2.concat(text4), { opacity: 0 });
    }

    // ---- Scroll reveals for .title / .para (About, WHAT I DO heading) ----
    if (!reducedMotion && window.innerWidth >= 900) {
        const start = window.innerWidth <= 1024 ? 'top 60%' : '20% 60%';
        const toggleActions = 'play pause resume reverse';
        document.querySelectorAll('.para').forEach(para => {
            const words = splitText(para, 'words');
            gsap.fromTo(words, { autoAlpha: 0, y: 80 }, {
                autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.02,
                scrollTrigger: { trigger: para.parentElement.parentElement, start, toggleActions }
            });
        });
        document.querySelectorAll('.title').forEach(title => {
            const chars = splitText(title, 'chars');
            gsap.fromTo(chars, { autoAlpha: 0, y: 80, rotate: 10 }, {
                autoAlpha: 1, y: 0, rotate: 0, duration: 0.8, ease: 'power2.inOut', stagger: 0.03,
                scrollTrigger: { trigger: title.parentElement.parentElement, start, toggleActions }
            });
        });
    }

    // ---- WHAT I DO: reveal the dashed panel once it scrolls into view ----
    if (whatBoxIn) {
        ScrollTrigger.create({
            trigger: whatBoxIn,
            start: 'top 75%',
            once: true,
            onEnter: () => whatBoxIn.classList.add('in-view')
        });
    }

    // ---- Contact reveal ----
    if (!reducedMotion && document.querySelector('.contact-section')) {
        const tl = gsap.timeline({
            scrollTrigger: { trigger: '.contact-section', start: 'top 80%', end: 'bottom center', toggleActions: 'play none none none' }
        });
        tl.fromTo('.contact-section h3', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
            .fromTo('.contact-box', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out' }, '-=0.4');
    }

    window.addEventListener('load', () => ScrollTrigger.refresh());
})();
