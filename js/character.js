// Hero character: models/character.glb — the CC0 "Hoodie Character" by Quaternius,
// posed at a desk with glasses and props (built for this site). The head follows the
// pointer, the fingers type, and on scroll the figure turns while the monitor rises
// and lights up — choreographed like the reference site (Redoyanul Haque, MIT; see
// THIRD_PARTY_NOTICES.md).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const wrapper = document.querySelector('.character-model');
const canvas = document.getElementById('character-canvas');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Desktop only (CSS hides it below 1025px); needs GSAP and WebGL.
const enabled = wrapper && canvas && !reducedMotion && window.innerWidth > 1024 && window.gsap;
let renderer = null;
if (enabled) {
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (_) {
        wrapper.remove();
    }
}
if (renderer) init().catch(() => wrapper.remove());

async function init() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    // Soft studio reflections in place of the reference's HDR map
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
    const camBase = { x: 0, y: 1.4, z: 2.6 };
    const lookAt = new THREE.Vector3(0, 1.06, 0.1);

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xfff4ff, 1.6);
    key.position.set(1.8, 3, 3);
    scene.add(key);
    const rim = new THREE.PointLight(0xfb8dff, 18, 12, 1.6);   // purple backlight
    rim.position.set(-1.6, 1.9, -1.4);
    scene.add(rim);
    const rim2 = new THREE.PointLight(0xaa42ff, 10, 12, 1.6);
    rim2.position.set(1.7, 1.4, -1.2);
    scene.add(rim2);

    const gltf = await new GLTFLoader().loadAsync('models/character.glb');
    const character = gltf.scene;
    scene.add(character);

    const get = (name) => character.getObjectByName(name);
    const neck = get('Neck');
    const head = get('Head');
    const chest = get('Chest');
    const monitor = get('Monitor');
    const screen = get('Screen');
    const keyboard = get('Keyboard');

    character.traverse(o => { if (o.isMesh) o.frustumCulled = false; });

    // Monitor starts hidden below the desk and rises in during the About scroll
    const monitorMats = [];
    monitor.traverse(o => {
        if (o.isMesh) {
            o.material = o.material.clone();
            o.material.transparent = true;
            o.material.opacity = 0;
            monitorMats.push(o.material);
        }
    });
    const monitorY = monitor.position.y;
    const screenMat = screen.material;
    screenMat.emissive = new THREE.Color(0xc8bfff);

    const screenLight = new THREE.PointLight(0xc8bfff, 0, 2.2, 2);
    const screenPos = screen.getWorldPosition(new THREE.Vector3());
    screenLight.position.set(screenPos.x, screenPos.y, screenPos.z - 0.25);
    scene.add(screenLight);

    // Finger bones to tap while typing, with their rest poses
    const fingers = [];
    ['Index', 'Middle', 'Ring', 'Pinky'].forEach((f, i) => ['L', 'R'].forEach((s, j) => {
        const b = get(`${f}2${s}`);
        if (b) fingers.push({ b, base: b.quaternion.clone(), phase: i * 1.7 + j * 0.9 });
    }));
    const neckBase = neck.quaternion.clone();
    const headBase = head.quaternion.clone();
    const chestBase = chest.quaternion.clone();
    void keyboard;

    // ---- Sizing ----
    function resize() {
        const w = wrapper.clientWidth || window.innerWidth;
        const h = wrapper.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // ---- Pointer ----
    const mouse = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    window.addEventListener('pointermove', (e) => {
        mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // ---- Scroll choreography (mirrors the reference's setCharTimeline) ----
    const state = { rotY: 0, rotX: 0, lookDown: 0, monitor: 0, screenOn: 0, camZ: camBase.z, camY: camBase.y };
    const flicker = { v: 0 };
    setInterval(() => { flicker.v = Math.random(); }, 200);

    gsap.timeline({
        scrollTrigger: { trigger: '.landing-section', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
    })
        .fromTo(state, { rotY: 0 }, { rotY: 0.7, duration: 1 }, 0)
        .to(state, { camZ: camBase.z + 0.9, duration: 1 }, 0)
        .fromTo(wrapper, { xPercent: 0 }, { xPercent: -30, duration: 1 }, 0)
        .to('.landing-container', { opacity: 0, duration: 0.4 }, 0)
        .to('.landing-container', { y: '40%', duration: 0.8 }, 0)
        .fromTo('.about-me', { y: '-50%' }, { y: '0%' }, 0);

    gsap.timeline({
        scrollTrigger: { trigger: '.about-section', start: 'center 55%', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
    })
        .to(state, { camZ: camBase.z + 2.2, camY: camBase.y + 0.45, duration: 6, delay: 2, ease: 'power3.inOut' }, 0)
        .to('.about-section', { y: '30%', duration: 6 }, 0)
        .to('.about-section', { opacity: 0, delay: 3, duration: 2 }, 0)
        .to(wrapper, { xPercent: -12, delay: 2, duration: 5 }, 0)
        .to(state, { rotY: 0.92, rotX: 0.12, delay: 3, duration: 3 }, 0)
        .to(state, { lookDown: 1, delay: 2, duration: 3 }, 0)
        .to(state, { monitor: 1, duration: 3, delay: 1.5 }, 0)
        .to(state, { screenOn: 1, duration: 0.8, delay: 4.5 }, 0)
        .fromTo('.character-rim', { scaleX: 1.4, scaleY: 1 }, { opacity: 0, scale: 0, y: '-70%', duration: 5, delay: 2 }, 0.3);

    gsap.timeline({
        scrollTrigger: { trigger: '.whatIDO', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
    })
        .fromTo(wrapper, { yPercent: 0 }, { yPercent: -100, duration: 4, ease: 'none', delay: 1 }, 0)
        .fromTo('.whatIDO', { y: 0 }, { y: '15%', duration: 2 }, 0)
        .to(state, { rotX: -0.04, duration: 2, delay: 1 }, 0);

    // ---- Render loop ----
    const clock = new THREE.Clock();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const xAxis = new THREE.Vector3();
    const q = new THREE.Quaternion();
    let running = true;

    function frame() {
        const t = clock.getElapsedTime();
        eased.x += (mouse.x - eased.x) * 0.06;
        eased.y += (mouse.y - eased.y) * 0.06;

        character.rotation.y = state.rotY + eased.x * 0.08;
        character.rotation.x = state.rotX;
        character.updateMatrixWorld(true);
        xAxis.set(1, 0, 0).applyQuaternion(character.quaternion);

        // Breathing
        chest.quaternion.copy(chestBase);
        chest.rotateOnWorldAxis(xAxis, Math.sin(t * 1.3) * 0.025);

        // Head: look at the pointer, and down at the monitor once it's on
        neck.quaternion.copy(neckBase);
        head.quaternion.copy(headBase);
        const lookFree = 1 - state.lookDown * 0.6;
        neck.rotateOnWorldAxis(yAxis, eased.x * 0.35 * lookFree);
        head.rotateOnWorldAxis(yAxis, eased.x * 0.25 * lookFree);
        head.rotateOnWorldAxis(xAxis, (eased.y * 0.22) * lookFree + state.lookDown * 0.18);

        // Typing: each finger taps on its own rhythm
        fingers.forEach(f => {
            f.b.quaternion.copy(f.base);
            const tap = Math.max(0, Math.sin(t * 9 + f.phase)) ** 3;
            q.setFromAxisAngle(xAxis, tap * 0.35);
            f.b.quaternion.premultiply(q);
        });

        // Monitor rise and screen glow
        monitor.position.y = monitorY - (1 - state.monitor) * 0.35;
        monitorMats.forEach(m => { m.opacity = state.monitor; });
        monitor.visible = state.monitor > 0.01;
        screenMat.emissiveIntensity = state.screenOn * (0.8 + flicker.v * 1.4);
        screenLight.intensity = state.screenOn * (1.5 + flicker.v * 4);

        camera.position.set(camBase.x, state.camY, state.camZ);
        camera.lookAt(lookAt);

        renderer.render(scene, camera);
        if (running) requestAnimationFrame(frame);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            running = false;
        } else if (!running) {
            running = true;
            requestAnimationFrame(frame);
        }
    });

    ScrollTrigger.refresh();
    wrapper.classList.add('character-loaded');
    requestAnimationFrame(frame);
}
