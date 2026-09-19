# Lee Boon Yew — Portfolio

Personal portfolio site for Lee Boon Yew, a Computer Science student at TAR UMT.
Static HTML/CSS/JS, no build step, deployed on GitHub Pages.

The layout, palette and scroll choreography follow Redoyanul Haque's
[portfolio-website](https://github.com/red1-for-hek/portfolio-website) (MIT, see
`THIRD_PARTY_NOTICES.md`), rebuilt without React and with an original 3D character.

## Sections

- **Landing** — name and rolling role titles (Software Engineer ⇄ Mobile App Developer), with a
  3D developer typing at a desk (`models/character.glb`, built from Quaternius' CC0 "Hoodie
  Character"). The head follows the pointer and the fingers type; on scroll he turns, the monitor
  rises and lights up, and he floats away after WHAT I DO. Phones/tablets show a photo instead.
- **About** — word-by-word reveal on scroll.
- **What I Do** — the dashed panel with two expanding boxes (Mobile Apps / Software).
- **Career & Education** — *role + year | description* rows with the glowing timeline that grows
  as you scroll (GSAP ScrollTrigger, scrubbed).
- **My Work** — pinned section that scrolls horizontally through numbered project boxes.
- **Tech Stack** — the draggable, auto-spinning 3D icon globe (pure CSS 3D).
- **Achievements**, call-to-action buttons and the **Contact** footer.

Smooth scrolling is Lenis; the custom cursor, rolling nav links and social-icon magnet follow the reference.
`prefers-reduced-motion` disables the animations, the cursor and the 3D character.

## Structure

```
.
├── index.html            # Page markup
├── styles.css            # All styles (tokens at the top)
├── js/
│   ├── site.js           # Lenis, cursor, text reveals, landing loop, What I Do, contact reveal
│   ├── scroll-anim.js    # GSAP: pinned Work scroll + career timelines
│   ├── character.js      # Loads models/character.glb + scroll choreography (ES module, desktop only)
│   ├── skills-globe.js   # CSS-3D icon sphere
│   ├── tilt.js           # 3D tilt for .tilt elements (achievements)
│   └── fun.js            # Confetti on the logo
├── models/character.glb  # The 3D character scene (CC0 base, ~1 MB)
├── images/               # Profile photo and project screenshots
└── resume/               # Resume PDF
```

## Running locally

The character is an ES module with an import map, so the site must be served over HTTP:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Customising

- **Colours** are the `--accentColor` / `--backgroundColor` tokens at the top of `styles.css`.
- **Role titles** are the four `.landing-h2-*` divs in the landing markup.
- **What I Do** boxes, career rows and projects are plain markup in `index.html`.
- **Skills** are the `<li class="globe-item">` entries; the globe re-layouts automatically.
- **Character** — replace `models/character.glb` with any rigged GLB that has `Neck`, `Head` and
  `Chest` bones and a `Monitor` group containing a `Screen` mesh; `js/character.js` animates those by name.

## Dependencies (CDN only)

- [GSAP](https://gsap.com/) 3.13 + ScrollTrigger
- [Lenis](https://lenis.darkroom.engineering/) 1.3
- [three.js](https://threejs.org/) 0.169
- [canvas-confetti](https://github.com/catdad/canvas-confetti) 1.9.3 (loaded lazily)
- Font Awesome 6, Devicon, Google Fonts (Geist)
