const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  particles: [],
};

function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = state.width * devicePixelRatio;
  canvas.height = state.height * devicePixelRatio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(devicePixelRatio, devicePixelRatio);
}

function spawnParticle() {
  if (state.particles.length >= 60) return;
  state.particles.push({
    x: Math.random() * state.width,
    y: Math.random() * state.height,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
    r: 0.8 + Math.random() * 1.2,
    opacity: 0.1 + Math.random() * 0.3,
  });
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);

  spawnParticle();

  state.particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > state.width) p.vx *= -1;
    if (p.y < 0 || p.y > state.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(212, 168, 83, ${p.opacity})`;
    ctx.fill();
  });

  for (let i = 0; i < state.particles.length; i++) {
    for (let j = i + 1; j < state.particles.length; j++) {
      const a = state.particles[i];
      const b = state.particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.strokeStyle = `rgba(212, 168, 83, ${(1 - dist / 120) * 0.06})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}

function initCounters() {
  document.querySelectorAll(".stat-item").forEach((item) => {
    const valEl = item.querySelector(".stat-value");
    if (!valEl) return;
    const target = parseFloat(valEl.dataset.count || "0");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        let current = 0;
        const step = target / 60;
        const tick = () => {
          current += step;
          if (current >= target) {
            valEl.textContent = target % 1 === 0 ? target.toString() : target.toFixed(2);
            observer.disconnect();
            return;
          }
          valEl.textContent = target % 1 === 0 ? Math.floor(current) : current.toFixed(2);
          requestAnimationFrame(tick);
        };
        tick();
      });
    }, { threshold: 0.4 });

    observer.observe(item);
  });
}

function initFilters() {
  const buttons = document.querySelectorAll(".filter");
  const cards = document.querySelectorAll("#cert-grid .cert-card");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      const filter = button.dataset.filter;
      cards.forEach((card) => {
        const match = filter === "all" || filter === card.dataset.category;
        card.classList.toggle("hide", !match);
      });
    });
  });
}

function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
}

function initSmoothScroll() {
  document.querySelectorAll("a[href^='#']").forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function initScriptViewer() {
  document.querySelectorAll(".copy-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.copyTarget;
      if (!id) return;
      const block = document.getElementById(id);
      if (!block) return;
      const text = block.innerText.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:absolute;left:-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      const orig = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => (button.textContent = orig), 1600);
    });
  });

  document.querySelectorAll(".annotation").forEach((ann) => {
    ann.addEventListener("click", () => {
      const line = ann.dataset.line;
      const viewer = ann.closest(".script-viewer");
      if (!viewer || !line) return;
      viewer.querySelectorAll(".code-line").forEach((el) => el.classList.remove("is-highlight"));
      viewer.querySelectorAll(".annotation").forEach((el) => el.classList.remove("active"));
      const lineEl = viewer.querySelector(`.code-line[data-line='${line}']`);
      if (lineEl) {
        lineEl.classList.add("is-highlight");
        lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      ann.classList.add("active");
    });
  });
}

function showToast(message, level = "INFO") {
  const stack = document.querySelector(".toast-stack");
  if (!stack) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span class="toast-level">[${level}]</span>${message}`;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function initCliOverlay() {
  const overlay = document.querySelector(".cli-overlay");
  const toggle = document.querySelector(".cli-toggle");
  const closeBtn = document.querySelector(".cli-close");
  const form = document.querySelector(".cli-form");
  const input = document.querySelector(".cli-input");
  const log = document.querySelector(".cli-log");

  if (!overlay || !toggle || !closeBtn || !form || !input || !log) return;

  const open = () => {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    input.focus();
  };

  const close = () => {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  };

  toggle.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  const commands = {
    help: "Commands: help, about, research, simulations, publications, awards, contact, clear.",
    about: "#about",
    research: "#research",
    simulations: "#simulations",
    publications: "#publications",
    awards: "#awards",
    contact: "#contact",
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;
    const cmd = raw.toLowerCase();

    const line = document.createElement("span");
    line.className = "log-line";
    line.textContent = `kkgodara@cluster:~$ ${raw}`;
    log.appendChild(line);

    if (cmd === "clear") {
      log.innerHTML = "";
      input.value = "";
      return;
    }

    const resp = document.createElement("span");
    resp.className = "log-line log-response";

    if (commands[cmd]) {
      if (commands[cmd].startsWith("#")) {
        const target = document.querySelector(commands[cmd]);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
          resp.textContent = `→ navigating to /${cmd}`;
          showToast(`Navigated to ${cmd}.`, "INFO");
        } else {
          resp.textContent = "Section unavailable.";
        }
      } else {
        resp.textContent = commands[cmd];
      }
    } else {
      resp.textContent = `Unknown command: ${cmd}. Type 'help'.`;
      showToast(`Unknown command: ${cmd}.`, "WARN");
    }

    log.appendChild(resp);
    log.scrollTop = log.scrollHeight;
    input.value = "";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "`" && !overlay.classList.contains("is-open")) open();
    else if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
  });
}

function initSimPreviews() {
  const videos = document.querySelectorAll(".sim-video");
  if (!videos.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const video = entry.target;
      const card = video.closest(".sim-card");

      video.querySelectorAll("source[data-src]").forEach((s) => {
        s.src = s.dataset.src || "";
        s.removeAttribute("data-src");
      });

      if (video.dataset.src) {
        video.src = video.dataset.src;
        video.removeAttribute("data-src");
      }

      video.load();
      video.play().catch(() => {});

      video.addEventListener("loadeddata", () => {
        if (card) card.classList.add("is-loaded");
        showToast("Simulation loaded.", "INFO");
      }, { once: true });

      obs.unobserve(video);
    });
  }, { threshold: 0.2 });

  videos.forEach((v) => observer.observe(v));
}

resize();
initCounters();
initFilters();
initReveal();
initSmoothScroll();
initScriptViewer();
initCliOverlay();
initSimPreviews();
requestAnimationFrame(draw);

window.addEventListener("resize", resize);
