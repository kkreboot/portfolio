"use strict";

/* ── Particle background ─────────────────────────── */
(function () {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  let W, H, particles = [];
  const MAX = 55;

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
      a: .08 + Math.random() * .2,
    };
  }

  function seed() {
    particles = [];
    for (let i = 0; i < MAX; i++) particles.push(mkParticle());
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(129,140,248,${p.a})`;
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          ctx.strokeStyle = `rgba(129,140,248,${(1 - d / 130) * .055})`;
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
  tick();
  window.addEventListener("resize", () => { resize(); seed(); });
})();

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

/* ── Dark/light theme toggle ─────────────────────── */
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const stored = localStorage.getItem("theme");
  if (stored !== "dark") document.documentElement.classList.add("light");

  btn.addEventListener("click", () => {
    const isLight = document.documentElement.classList.toggle("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
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
});
