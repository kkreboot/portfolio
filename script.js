const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  grains: [],
  pointer: { x: 0.5, y: 0.5 },
  heroFloor: window.innerHeight * 0.7,
};

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

resize();
createGrains();
initCounters();
initFilters();
initReveal();
initSmoothScroll();
requestAnimationFrame(draw);

window.addEventListener("resize", () => {
  resize();
  createGrains();
});

function initSimPreviews() {
  const videos = document.querySelectorAll(".sim-video");
  if (!videos.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const video = entry.target;
        const sources = video.querySelectorAll("source[data-src]");
        sources.forEach((source) => {
          source.src = source.dataset.src || "";
          source.removeAttribute("data-src");
        });
        if (video.dataset.src) {
          video.src = video.dataset.src;
          video.removeAttribute("data-src");
        }
        video.load();
        video.play().catch(() => {});
        obs.unobserve(video);
      });
    },
    { threshold: 0.2 }
  );

  videos.forEach((video) => observer.observe(video));
}

initSimPreviews();
