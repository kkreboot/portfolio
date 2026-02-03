const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  particles: [],
  pointer: { x: 0.5, y: 0.5 },
};

const particleCount = 70;

function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = state.width * window.devicePixelRatio;
  canvas.height = state.height * window.devicePixelRatio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function createParticles() {
  state.particles = Array.from({ length: particleCount }).map(() => ({
    x: Math.random() * state.width,
    y: Math.random() * state.height,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    r: 1.2 + Math.random() * 1.6,
  }));
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.fillStyle = "rgba(8, 12, 18, 0.55)";
  ctx.fillRect(0, 0, state.width, state.height);

  state.particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > state.width) p.vx *= -1;
    if (p.y < 0 || p.y > state.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(122, 167, 255, 0.6)";
    ctx.fill();
  });

  for (let i = 0; i < state.particles.length; i += 1) {
    for (let j = i + 1; j < state.particles.length; j += 1) {
      const a = state.particles[i];
      const b = state.particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140) {
        ctx.strokeStyle = `rgba(56, 217, 169, ${1 - dist / 140})`;
        ctx.lineWidth = 1;
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
createParticles();
initCounters();
initFilters();
initReveal();
initSmoothScroll();
requestAnimationFrame(draw);

window.addEventListener("resize", () => {
  resize();
  createParticles();
});
