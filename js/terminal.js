// contact.sh: a small interactive terminal. Type `help` for commands.
// Supports history (↑/↓) and Tab completion. Links only open on an explicit command.
(() => {
    const out = document.getElementById('terminal-out');
    const form = document.getElementById('terminal-form');
    const input = document.getElementById('terminal-input');
    if (!out || !form || !input) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const EMAIL = 'leeboonyew06@gmail.com';
    const LINKS = {
        github: 'https://github.com/boon-boon',
        linkedin: 'https://www.linkedin.com/in/boon-yew-lee-47228836b/',
        whatsapp: 'https://wa.me/60107659969',
        resume: 'resume/Lee_Boon_Yew_Resume.pdf'
    };

    const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const print = (html, cls = '') => {
        const p = document.createElement('div');
        if (cls) p.className = cls;
        p.innerHTML = html;
        out.appendChild(p);
        out.scrollTop = out.scrollHeight;
    };
    const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${esc(text)}</a>`;
    const open = (href) => window.open(href, '_blank', 'noopener');

    const commands = {
        help: () => print(
            `<span class="t-dim">available commands:</span>
  whoami       who is this?
  about        a short introduction
  skills       languages & tools
  projects     things I've built
  journey      experience & education
  email        show my email (and copy it)
  github       open my GitHub
  linkedin     open my LinkedIn
  whatsapp     message me on WhatsApp
  resume       open my resume (PDF)
  hire         you know you want to
  clear        clear the terminal`),
        whoami: () => print('Lee Boon Yew — Computer Science student, aspiring software engineer & mobile app developer. Based in Malaysia.'),
        about: () => print('Diploma in Computer Science @ TAR UMT (CGPA 3.80). I like turning ideas into practical, user-focused apps and I learn fast.'),
        skills: () => print('languages  Kotlin · Java · C++ · Python\nmobile     Android Studio · Firebase · MVVM\ndata       MySQL · Linux · OOP · Algorithms\ntools      Git/GitHub · VS Code · Visual Studio · Figma'),
        projects: () => print(
            [...document.querySelectorAll('.repo')].map(r =>
                `${esc(r.querySelector('.repo-name').textContent.padEnd(16))}${link(r.dataset.url, 'repo ↗')}  <span class="t-dim">${esc(r.querySelector('.repo-lang').textContent.trim())}</span>`
            ).join('\n')),
        journey: () => { print('<span class="t-dim">opening journey.git…</span>'); window.ideGoTo && window.ideGoTo('journey'); },
        email: () => {
            print(`${link('mailto:' + EMAIL, EMAIL)}`);
            navigator.clipboard && navigator.clipboard.writeText(EMAIL).then(() => print('<span class="t-dim">(copied to clipboard)</span>'), () => { });
        },
        github: () => { print(`opening ${link(LINKS.github, 'github.com/boon-boon')}…`); open(LINKS.github); },
        linkedin: () => { print(`opening ${link(LINKS.linkedin, 'linkedin')}…`); open(LINKS.linkedin); },
        whatsapp: () => { print(`opening ${link(LINKS.whatsapp, 'whatsapp')}…`); open(LINKS.whatsapp); },
        resume: () => { print(`opening ${link(LINKS.resume, 'resume.pdf')}…`); open(LINKS.resume); },
        hire: () => {
            print('<span class="accent">✓ excellent choice.</span> compiling offer… done.\n' +
                `send it to ${link('mailto:' + EMAIL + '?subject=Internship%20opportunity', EMAIL)} and I'll reply fast.`);
            confetti();
        },
        clear: () => { out.replaceChildren(); },
        ls: () => print('README.md  about.kt  skills.json  journey.git  projects/  achievements.test  contact.sh  resume.pdf'),
        pwd: () => print('/home/lee/portfolio'),
        date: () => print(new Date().toString()),
        sudo: () => print('<span class="t-err">lee is not in the sudoers file. This incident will be reported. 😉</span>'),
        exit: () => print('<span class="t-dim">nice try — there is no escape from a good portfolio.</span>')
    };
    const aliases = { contact: 'email', cv: 'resume', experience: 'journey', education: 'journey', '?': 'help', cls: 'clear' };

    const history = [];
    let hIdx = 0;

    const run = (raw) => {
        const line = raw.trim();
        print(`<span class="accent">lee@portfolio</span>:<span class="type">~</span>$ <span class="t-cmd">${esc(line)}</span>`);
        if (!line) return;
        history.push(line);
        hIdx = history.length;
        const [cmd, ...args] = line.split(/\s+/);
        const name = aliases[cmd.toLowerCase()] || cmd.toLowerCase();
        if (name === 'echo') return print(esc(args.join(' ')));
        if (name === 'cat') {
            const map = { 'readme.md': 'readme', 'about.kt': 'about', 'skills.json': 'skills', 'journey.git': 'journey', 'achievements.test': 'tests', 'contact.sh': 'contact' };
            const target = map[(args[0] || '').toLowerCase()];
            if (target) { print(`<span class="t-dim">opening ${esc(args[0])}…</span>`); window.ideGoTo && window.ideGoTo(target); }
            else print(`<span class="t-err">cat: ${esc(args[0] || '')}: No such file</span>`);
            return;
        }
        if (commands[name]) commands[name]();
        else print(`<span class="t-err">command not found: ${esc(cmd)}</span> <span class="t-dim">— try <b>help</b></span>`);
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        run(input.value);
        input.value = '';
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' && history.length) {
            hIdx = Math.max(0, hIdx - 1);
            input.value = history[hIdx];
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            hIdx = Math.min(history.length, hIdx + 1);
            input.value = history[hIdx] || '';
            e.preventDefault();
        } else if (e.key === 'Tab') {
            const v = input.value.trim().toLowerCase();
            if (!v) return;
            const match = Object.keys(commands).filter(c => c.startsWith(v));
            if (match.length === 1) input.value = match[0];
            else if (match.length > 1) print('<span class="t-dim">' + match.join('  ') + '</span>');
            e.preventDefault();
        }
    });

    // Clicking anywhere in the terminal focuses the prompt
    document.getElementById('terminal').addEventListener('click', (e) => {
        if (!e.target.closest('a')) input.focus({ preventScroll: true });
    });

    // Welcome message types itself the first time the terminal is seen
    const welcome = [
        '<span class="t-dim">Last login: ' + new Date().toDateString() + ' on ttys001</span>',
        'Welcome to <span class="accent">lee@portfolio</span> 👋',
        'Type <b>help</b> to see what I can do, or <b>hire</b> if you already know. 🙂'
    ];
    const greet = () => {
        welcome.forEach((l, i) => setTimeout(() => print(l), reducedMotion ? 0 : i * 450));
    };
    const obs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { obs.disconnect(); greet(); }
    }, { threshold: 0.3 });
    obs.observe(out);

    // Lazy-loaded confetti for `hire`
    let loading = null;
    function confetti() {
        if (reducedMotion) return;
        if (!loading) {
            loading = new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
                s.onload = () => resolve(window.confetti);
                s.onerror = reject;
                document.head.appendChild(s);
            });
        }
        loading.then(fn => fn({
            particleCount: 110, spread: 80, startVelocity: 40, origin: { y: 0.75 },
            colors: ['#ffb454', '#ff8f70', '#82aaff', '#7fdbca', '#b8e986']
        })).catch(() => { });
    }
})();
