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

/* ── Smooth scroll ───────────────────────────────── */
function initScroll() {
  document.querySelectorAll("a[href^='#']").forEach(a => {
    a.addEventListener("click", e => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* ── Copy buttons ────────────────────────────────── */
function initCopy() {
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.copyTarget;
      const block = id && document.getElementById(id);
      if (!block) return;
      const text = block.innerText.replace(/^\d+\s/gm, "").trim(); // strip line numbers
      try { await navigator.clipboard.writeText(text); }
      catch {
        const ta = Object.assign(document.createElement("textarea"), {
          value: text, style: "position:fixed;opacity:0"
        });
        document.body.append(ta);
        ta.select(); document.execCommand("copy"); ta.remove();
      }
      const orig = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => btn.textContent = orig, 1800);
    });
  });
}

/* ── Lazy simulation videos ──────────────────────── */
function initSimVideos() {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const video = entry.target;
      const card = video.closest(".sim-card");
      video.querySelectorAll("source[data-src]").forEach(s => {
        s.src = s.dataset.src;
        s.removeAttribute("data-src");
      });
      video.load();
      video.play().catch(() => {});
      video.addEventListener("loadeddata", () => card?.classList.add("loaded"), { once: true });
      obs.unobserve(video);
    });
  }, { threshold: .2 });

  document.querySelectorAll(".sim-video").forEach(v => io.observe(v));
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

/* ── Init ────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initCounters();
  initFilters();
  initReveal();
  initScroll();
  initCopy();
  initSimVideos();
  initActiveNav();
});

/* Active nav style */
const style = document.createElement("style");
style.textContent = ".nav-links a.active-nav { color: #eaedf5; }";
document.head.append(style);
