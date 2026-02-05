const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  grains: [],
  pointer: { x: 0.5, y: 0.5 },
  heroFloor: window.innerHeight * 0.7,
};

let resizeSandpiles = () => {};

const maxGrains = 260;
const gravity = 0.08;
const jitter = 0.02;
const settleThreshold = 0.6;

function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = state.width * window.devicePixelRatio;
  canvas.height = state.height * window.devicePixelRatio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function createGrains() {
  state.grains = [];
}

function spawnGrain() {
  if (state.grains.length >= maxGrains) return;
  state.grains.push({
    x: state.width * (0.2 + Math.random() * 0.6),
    y: -20 - Math.random() * 40,
    vx: (Math.random() - 0.5) * 0.4,
    vy: 0.2 + Math.random() * 0.4,
    r: 1.2 + Math.random() * 1.4,
    settled: false,
  });
}

function updateHeroFloor() {
  const hero = document.querySelector(".hero");
  if (!hero) {
    state.heroFloor = state.height * 0.7;
    return;
  }
  const rect = hero.getBoundingClientRect();
  state.heroFloor = Math.min(state.height - 80, rect.bottom + 40);
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.fillStyle = "rgba(5, 9, 14, 0.62)";
  ctx.fillRect(0, 0, state.width, state.height);

  updateHeroFloor();
  spawnGrain();

  state.grains.forEach((grain, index) => {
    if (!grain.settled) {
      grain.vy += gravity;
      grain.vx += (Math.random() - 0.5) * jitter;
      grain.x += grain.vx;
      grain.y += grain.vy;

      if (grain.x < grain.r || grain.x > state.width - grain.r) {
        grain.vx *= -0.4;
      }

      if (grain.y + grain.r >= state.heroFloor) {
        grain.y = state.heroFloor - grain.r;
        grain.settled = true;
        grain.vx = 0;
        grain.vy = 0;
      }

      for (let i = 0; i < state.grains.length; i += 1) {
        if (i === index) continue;
        const other = state.grains[i];
        if (!other.settled) continue;
        const dx = grain.x - other.x;
        const dy = grain.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = grain.r + other.r + 0.2;
        if (dist > 0 && dist < minDist) {
          grain.y = other.y - minDist;
          grain.x += (Math.random() - 0.5) * 0.6;
          grain.vx *= 0.2;
          grain.vy *= 0.1;
          if (Math.abs(grain.vy) < settleThreshold) {
            grain.settled = true;
            grain.vx = 0;
            grain.vy = 0;
          }
        }
      }
    }

    ctx.beginPath();
    ctx.arc(grain.x, grain.y, grain.r, 0, Math.PI * 2);
    const glow = grain.settled ? 0.45 : 0.7;
    ctx.fillStyle = `rgba(0, 245, 212, ${glow})`;
    ctx.fill();

    if (grain.settled && Math.random() > 0.98) {
      grain.vy = -0.6 + Math.random() * 0.3;
      grain.vx = (Math.random() - 0.5) * 0.3;
      grain.settled = false;
    }
  });

  state.grains = state.grains.filter(
    (grain) => grain.y <= state.heroFloor + 40 && grain.x >= -50 && grain.x <= state.width + 50
  );

  for (let i = 0; i < state.grains.length; i += 1) {
    const a = state.grains[i];
    for (let j = i + 1; j < state.grains.length; j += 1) {
      const b = state.grains[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 70) {
        ctx.strokeStyle = `rgba(57, 255, 136, ${1 - dist / 70})`;
        ctx.lineWidth = 0.6;
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
  const counters = document.querySelectorAll(".stat");
  counters.forEach((counter) => {
    const target = parseFloat(counter.dataset.count || "0");
    const value = counter.querySelector(".value");
    if (!value) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          let current = 0;
          const step = target / 60;
          const tick = () => {
            current += step;
            if (current >= target) {
              value.textContent = target.toString();
              observer.disconnect();
              return;
            }
            value.textContent = target % 1 === 0 ? Math.floor(current) : current.toFixed(2);
            requestAnimationFrame(tick);
          };
          tick();
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(counter);
  });
}

function initFilters() {
  const buttons = document.querySelectorAll(".filter");
  const cards = document.querySelectorAll("#cert-grid .card");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const filter = button.dataset.filter;
      cards.forEach((card) => {
        const category = card.dataset.category;
        if (filter === "all" || filter === category) {
          card.classList.remove("hide");
        } else {
          card.classList.add("hide");
        }
      });
    });
  });
}

function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.2 }
  );
  items.forEach((item) => observer.observe(item));
}

function initSmoothScroll() {
  document.querySelectorAll("a[href^='#']").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      event.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function initScriptViewer() {
  const copyButtons = document.querySelectorAll(".copy-btn");
  copyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const targetId = button.dataset.copyTarget;
      if (!targetId) return;
      const codeBlock = document.getElementById(targetId);
      if (!codeBlock) return;
      const text = codeBlock.innerText.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      const original = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = original;
      }, 1600);
    });
  });

  const annotations = document.querySelectorAll(".annotation");
  annotations.forEach((annotation) => {
    annotation.addEventListener("click", () => {
      const line = annotation.dataset.line;
      const viewer = annotation.closest(".script-viewer");
      if (!viewer || !line) return;
      viewer.querySelectorAll(".code-line").forEach((codeLine) => {
        codeLine.classList.remove("is-highlight");
      });
      viewer.querySelectorAll(".annotation").forEach((button) => {
        button.classList.remove("active");
      });
      const lineEl = viewer.querySelector(`.code-line[data-line='${line}']`);
      if (lineEl) {
        lineEl.classList.add("is-highlight");
        lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      annotation.classList.add("active");
    });
  });
}

function initSectionSandpiles() {
  const canvases = Array.from(document.querySelectorAll(".sandpile-canvas"));
  if (!canvases.length) return;

  const dpr = window.devicePixelRatio || 1;
  const piles = canvases.map((canvas) => {
    const ctx = canvas.getContext("2d");
    const pile = {
      canvas,
      ctx,
      grains: [],
      width: 0,
      height: 0,
      active: true,
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          pile.active = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);
    return pile;
  });

  const seedGrains = (pile) => {
    pile.grains = [];
    const count = Math.min(90, Math.max(50, Math.floor(pile.width / 10)));
    for (let i = 0; i < count; i += 1) {
      pile.grains.push({
        x: Math.random() * pile.width,
        y: pile.height * 0.2 + Math.random() * pile.height * 0.6,
        vx: (Math.random() - 0.5) * 0.2,
        vy: Math.random() * 0.2,
        r: 0.8 + Math.random() * 1.6,
        settled: Math.random() > 0.3,
      });
    }
  };

  const resizePile = (pile) => {
    const width = pile.canvas.clientWidth;
    const height = pile.canvas.clientHeight;
    if (!width || !height) return;
    pile.width = width;
    pile.height = height;
    pile.canvas.width = width * dpr;
    pile.canvas.height = height * dpr;
    pile.ctx.setTransform(1, 0, 0, 1, 0, 0);
    pile.ctx.scale(dpr, dpr);
    seedGrains(pile);
  };

  const resizeAll = () => {
    piles.forEach(resizePile);
  };

  resizeAll();
  resizeSandpiles = resizeAll;

  const gravityLocal = 0.015;
  const jitterLocal = 0.02;
  const floorPadding = 12;

  const animate = () => {
    piles.forEach((pile) => {
      if (!pile.active || !pile.width || !pile.height) return;
      const { ctx } = pile;
      ctx.clearRect(0, 0, pile.width, pile.height);
      ctx.fillStyle = "rgba(0, 245, 212, 0.4)";
      pile.grains.forEach((grain) => {
        if (!grain.settled) {
          grain.vy += gravityLocal;
          grain.vx += (Math.random() - 0.5) * jitterLocal;
          grain.x += grain.vx;
          grain.y += grain.vy;

          if (grain.x < grain.r || grain.x > pile.width - grain.r) {
            grain.vx *= -0.4;
          }

          if (grain.y >= pile.height - floorPadding) {
            grain.y = pile.height - floorPadding - Math.random() * 6;
            grain.settled = true;
            grain.vx = 0;
            grain.vy = 0;
          }
        } else if (Math.random() > 0.995) {
          grain.settled = false;
          grain.y = Math.random() * pile.height * 0.2;
          grain.vy = Math.random() * 0.4;
        }

        ctx.beginPath();
        ctx.arc(grain.x, grain.y, grain.r, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function showToast(message, level = "INFO") {
  const stack = document.querySelector(".toast-stack");
  if (!stack) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span class="toast-level">[${level}]</span>${message}`;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4200);
}

function initCliOverlay() {
  const overlay = document.querySelector(".cli-overlay");
  const toggle = document.querySelector(".cli-toggle");
  const closeButton = document.querySelector(".cli-close");
  const form = document.querySelector(".cli-form");
  const input = document.querySelector(".cli-input");
  const log = document.querySelector(".cli-log");

  if (!overlay || !toggle || !closeButton || !form || !input || !log) return;

  const openCli = () => {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    input.focus();
  };

  const closeCli = () => {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  };

  toggle.addEventListener("click", openCli);
  closeButton.addEventListener("click", closeCli);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeCli();
  });

  const commandMap = {
    help: "Available commands: help, projects, publications, sandpile, about, contact, clear.",
    projects: "#research",
    publications: "#publications",
    sandpile: "#simulations",
    about: "#about",
    contact: "#contact",
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;
    const command = raw.toLowerCase();
    const line = document.createElement("span");
    line.className = "log-line";
    line.textContent = `user@cluster:~$ ${raw}`;
    log.appendChild(line);

    if (command === "clear") {
      log.innerHTML = "";
      input.value = "";
      showToast("Console cleared.", "INFO");
      return;
    }

    const response = document.createElement("span");
    response.className = "log-line log-response";

    if (commandMap[command]) {
      if (commandMap[command].startsWith("#")) {
        const target = document.querySelector(commandMap[command]);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
          response.textContent = `Routing to ${commandMap[command].replace("#", "/")} ...`;
          showToast(`Navigation command executed: ${command}.`, "INFO");
        } else {
          response.textContent = "Target section unavailable.";
          showToast("Target section unavailable.", "WARN");
        }
      } else {
        response.textContent = commandMap[command];
      }
    } else {
      response.textContent = "Unknown command. Type help for the command list.";
      showToast(`Unknown command: ${command}.`, "WARN");
    }

    log.appendChild(response);
    log.scrollTop = log.scrollHeight;
    input.value = "";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "`" && !overlay.classList.contains("is-open")) {
      openCli();
    } else if (event.key === "Escape" && overlay.classList.contains("is-open")) {
      closeCli();
    }
  });
}

resize();
createGrains();
initCounters();
initFilters();
initReveal();
initSmoothScroll();
initScriptViewer();
initSectionSandpiles();
initCliOverlay();
showToast("Simulation console ready.", "INFO");
requestAnimationFrame(draw);

window.addEventListener("resize", () => {
  resize();
  createGrains();
  resizeSandpiles();
});

function initSimPreviews() {
  const videos = document.querySelectorAll(".sim-video");
  if (!videos.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const video = entry.target;
        const preview = video.closest(".sim-preview");
        const sources = video.querySelectorAll("source[data-src]");
        sources.forEach((source) => {
          source.src = source.dataset.src || "";
          source.removeAttribute("data-src");
        });
        if (video.dataset.src) {
          video.src = video.dataset.src;
          video.removeAttribute("data-src");
        }
        if (preview) {
          preview.classList.remove("is-loaded");
        }
        video.load();
        video.play().catch(() => {});
        video.addEventListener(
          "loadeddata",
          () => {
            if (preview) {
              preview.classList.add("is-loaded");
            }
            showToast("Simulation data loaded.", "INFO");
          },
          { once: true }
        );
        obs.unobserve(video);
      });
    },
    { threshold: 0.2 }
  );

  videos.forEach((video) => observer.observe(video));
}

initSimPreviews();
