"use strict";

const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const HAS_HOVER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ── Molecular-network particle background ──────────
   Mouse-reactive: nearby particles are gently pushed away,
   connections tint blue→cyan→purple by link distance.        */
(function () {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H, particles = [];
  const MAX = REDUCE_MOTION ? 0 : 60;
  const mouse = { x: -9999, y: -9999, active: false };

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function mkParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - .5) * .12,
      vy: (Math.random() - .5) * .12,
      r: .6 + Math.random() * 1.2,
      a: .1 + Math.random() * .22,
    };
  }

  function seed() {
    particles = [];
    for (let i = 0; i < MAX; i++) particles.push(mkParticle());
  }

  function linkColor(t) {
    /* t: 0 (far) -> 1 (close). Blend blue -> cyan. */
    const r = Math.round(59 + (34 - 59) * t);
    const g = Math.round(130 + (211 - 130) * t);
    const b = Math.round(246 + (238 - 246) * t);
    return `${r},${g},${b}`;
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      if (mouse.active) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14400) { // 120px repulsion radius
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / 120) * .6;
          p.vx += (dx / d) * f * .06;
          p.vy += (dy / d) * f * .06;
        }
      }
      p.vx *= .98; p.vy *= .98;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59,130,246,${p.a})`;
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          const t = 1 - d / 130;
          ctx.strokeStyle = `rgba(${linkColor(t)},${t * .09})`;
          ctx.lineWidth = .5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(tick);
  }

  resize();
  seed();
  if (!REDUCE_MOTION) {
    tick();
    window.addEventListener("pointermove", e => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    }, { passive: true });
    window.addEventListener("pointerleave", () => { mouse.active = false; });
  }
  window.addEventListener("resize", () => { resize(); seed(); });
})();

/* ── Cursor glow (desktop, motion-safe only) ─────── */
function initCursorGlow() {
  if (!HAS_HOVER || REDUCE_MOTION) return;
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  document.body.appendChild(glow);
  let raf = null, tx = 0, ty = 0;

  window.addEventListener("pointermove", e => {
    tx = e.clientX; ty = e.clientY;
    glow.classList.add("active");
    if (!raf) raf = requestAnimationFrame(() => {
      glow.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      raf = null;
    });
  }, { passive: true });

  document.addEventListener("mouseleave", () => glow.classList.remove("active"));
}

/* ── Magnetic buttons ─────────────────────────────── */
function initMagnetic() {
  if (!HAS_HOVER || REDUCE_MOTION) return;
  document.querySelectorAll(".btn, .nav-cta, .cmdk-trigger").forEach(el => {
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * .18}px, ${y * .35}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
}

/* ── 3D tilt on cards ─────────────────────────────── */
function initTilt() {
  if (!HAS_HOVER || REDUCE_MOTION) return;
  document.querySelectorAll(".r-card, .repo-card, .cw-card").forEach(el => {
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(700px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-4px) scale(1.015)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
}

/* ── Stat counters ───────────────────────────────── */
function initCounters() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.target || "0");
      const dec = parseInt(el.dataset.decimal || "0");
      let cur = 0;
      const step = target / 60;
      const tick = () => {
        cur = Math.min(cur + step, target);
        el.textContent = dec ? cur.toFixed(dec) : Math.floor(cur);
        if (cur < target) requestAnimationFrame(tick);
        else el.textContent = dec ? target.toFixed(dec) : String(target);
      };
      tick();
      io.unobserve(el);
    });
  }, { threshold: .4 });

  document.querySelectorAll(".stat-num[data-target]").forEach(el => io.observe(el));
}

/* ── Certificate filters ─────────────────────────── */
function initFilters() {
  const btns = document.querySelectorAll(".cf");
  const cards = document.querySelectorAll("#cert-grid .cert-card");

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      cards.forEach(c => c.classList.toggle("hide", f !== "all" && c.dataset.cat !== f));
    });
  });
}

/* ── Scroll reveal ───────────────────────────────── */
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
  }, { threshold: .12 });
  document.querySelectorAll("[data-reveal]").forEach(el => io.observe(el));
}

/* ── Smooth scroll (accounts for sticky nav) ────── */
function initScroll() {
  const NAV_H = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 62;
  document.querySelectorAll("a[href^='#']").forEach(a => {
    a.addEventListener("click", e => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_H;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
}


/* ── Active nav highlight on scroll ─────────────── */
function initActiveNav() {
  const sections = document.querySelectorAll("section[id]");
  const links = document.querySelectorAll(".nav-links a");
  if (!links.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(l => l.classList.remove("active-nav"));
      const match = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (match) match.classList.add("active-nav");
    });
  }, { rootMargin: "-40% 0px -55% 0px" });

  sections.forEach(s => io.observe(s));
}

/* ── Toast helper ────────────────────────────────── */
function toast(msg) {
  const stack = document.querySelector(".toast-stack");
  if (!stack) return;
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  stack.append(t);
  setTimeout(() => t.remove(), 3600);
}

/* ── Reading progress bar ────────────────────────── */
function initProgressBar() {
  const bar = document.getElementById("progress-bar");
  if (!bar) return;
  const update = () => {
    const scrollTop = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = docH > 0 ? (scrollTop / docH * 100) + "%" : "0%";
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/* ── Back to top ─────────────────────────────────── */
function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ── Hamburger menu ──────────────────────────────── */
function initHamburger() {
  const btn = document.getElementById("hamburger");
  const nav = document.getElementById("nav-links");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("open", !open);
  });

  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      btn.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
    });
  });

  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !nav.contains(e.target)) {
      btn.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
    }
  });
}

/* ── Dark/light theme toggle (dark is default) ──── */
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const stored = localStorage.getItem("theme");
  if (stored === "light") document.documentElement.classList.add("light");

  btn.addEventListener("click", () => {
    const html = document.documentElement;
    html.classList.add("theme-transitioning");
    const isLight = html.classList.toggle("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    setTimeout(() => html.classList.remove("theme-transitioning"), 400);
  });
}

/* ── Konami code easter egg ──────────────────────── */
function initKonami() {
  const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let pos = 0;
  document.addEventListener("keydown", e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = key === seq[pos] ? pos + 1 : 0;
    if (pos === seq.length) {
      pos = 0;
      document.documentElement.classList.add("egg-active");
      const el = document.createElement("div");
      el.className = "egg-toast";
      el.textContent = "⚛ Phase transition unlocked. Active matter mode engaged.";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3200);
      setTimeout(() => document.documentElement.classList.remove("egg-active"), 8000);
    }
  });
}

/* ── Command palette (⌘K / Ctrl+K) ───────────────── */
function initCommandPalette() {
  const trigger = document.getElementById("cmdk-trigger");
  if (!trigger) return;

  const items = [
    { label: "About", href: "#about" },
    { label: "Research", href: "#research" },
    { label: "Awards & Achievements", href: "#awards" },
    { label: "Conferences & Workshops", href: "#conferences" },
    { label: "Certificates", href: "#certificates" },
    { label: "Projects", href: "#projects" },
    { label: "Publications", href: "#publications" },
    { label: "Contact", href: "#contact" },
    { label: "Download CV", action: () => document.querySelector('a[download]')?.click() },
    { label: "Toggle theme", action: () => document.getElementById("theme-toggle")?.click() },
    { label: "Open GitHub profile", action: () => window.open("https://github.com/kkreboot", "_blank", "noopener") },
    { label: "Copy email address", action: () => {
        navigator.clipboard?.writeText("kkgodara2000@gmail.com");
        toast("Email copied to clipboard");
      } },
  ];

  const overlay = document.createElement("div");
  overlay.className = "cmdk-overlay";
  overlay.innerHTML = `
    <div class="cmdk-panel" role="dialog" aria-modal="true" aria-label="Command palette">
      <input class="cmdk-input" type="text" placeholder="Jump to a section or run a command…" autocomplete="off" />
      <div class="cmdk-list"></div>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector(".cmdk-input");
  const list = overlay.querySelector(".cmdk-list");
  let active = 0;

  function render(filter) {
    const q = (filter || "").toLowerCase();
    const matches = items.filter(i => i.label.toLowerCase().includes(q));
    list.innerHTML = matches.length
      ? matches.map((i, idx) => `<div class="cmdk-item${idx === active ? " active" : ""}" data-idx="${idx}">${i.label}</div>`).join("")
      : `<div class="cmdk-empty">No matches</div>`;
    list.querySelectorAll(".cmdk-item").forEach(el => {
      el.addEventListener("click", () => run(matches[Number(el.dataset.idx)]));
    });
    render.current = matches;
  }

  function run(item) {
    if (!item) return;
    close();
    if (item.href) {
      const target = document.querySelector(item.href);
      if (target) target.scrollIntoView({ behavior: REDUCE_MOTION ? "auto" : "smooth", block: "start" });
    } else if (item.action) {
      item.action();
    }
  }

  function open() {
    overlay.classList.add("open");
    input.value = "";
    active = 0;
    render("");
    setTimeout(() => input.focus(), 30);
  }

  function close() {
    overlay.classList.remove("open");
  }

  trigger.addEventListener("click", open);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  input.addEventListener("input", () => { active = 0; render(input.value); });
  input.addEventListener("keydown", e => {
    const matches = render.current || [];
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, matches.length - 1); render(input.value); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); render(input.value); }
    else if (e.key === "Enter") { e.preventDefault(); run(matches[active]); }
    else if (e.key === "Escape") { close(); }
  });

  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      overlay.classList.contains("open") ? close() : open();
    } else if (e.key === "Escape" && overlay.classList.contains("open")) {
      close();
    }
  });
}

/* ── Init ────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  /* Active nav highlight style */
  const style = document.createElement("style");
  style.textContent = ".nav-links a.active-nav { color: var(--txt); font-weight: 500; text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--accent); }";
  document.head.appendChild(style);

  initCounters();
  initFilters();
  initReveal();
  initScroll();
  initActiveNav();
  initProgressBar();
  initBackToTop();
  initHamburger();
  initThemeToggle();
  initCursorGlow();
  initMagnetic();
  initTilt();
  initKonami();
  initCommandPalette();
});
