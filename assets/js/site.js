(() => {
  const header = document.querySelector("[data-header]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initTheme();
  syncFavicon(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
  initSiteLoader(reduced);

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  initPlayfulAvatar(reduced);

  if (reduced) {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
  );

  document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
})();

const THEME_STORAGE_KEY = "weastel-theme";

function syncFavicon(theme) {
  const isLight = theme === "light";
  const ico = document.getElementById("site-favicon-ico");
  const svg = document.getElementById("site-favicon-svg");
  if (ico) {
    const href = isLight ? ico.dataset.iconLight : ico.dataset.iconDark;
    if (href) ico.href = href;
  }
  if (svg) {
    const href = isLight ? svg.dataset.iconLight : svg.dataset.iconDark;
    if (href) svg.href = href;
  }
}

function initTheme() {
  const root = document.documentElement;
  const toggle = document.querySelector("[data-theme-toggle]");

  const getTheme = () => (root.getAttribute("data-theme") === "light" ? "light" : "dark");

  const syncToggle = (theme) => {
    const isLight = theme === "light";
    toggle.setAttribute("aria-pressed", isLight ? "true" : "false");
    toggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  };

  const applyTheme = (theme, persist) => {
    if (theme === "light") root.setAttribute("data-theme", "light");
    else root.setAttribute("data-theme", "dark");
    syncToggle(theme);
    syncFavicon(theme);
    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        /* ignore */
      }
    }
  };

  if (toggle) {
    syncToggle(getTheme());
    toggle.addEventListener("click", () => {
      applyTheme(getTheme() === "light" ? "dark" : "light", true);
    });
  }
}

function initSiteLoader(reducedMotion) {
  const loader = document.getElementById("site-loader");
  if (!loader) return;

  const finish = () => {
    document.body.classList.remove("is-loading");
    loader.classList.add("is-done");
    window.setTimeout(() => loader.remove(), reducedMotion ? 0 : 520);
  };

  if (reducedMotion) {
    finish();
    return;
  }

  const LOADER_ANIM_MS = 1200;
  const MIN_MS = LOADER_ANIM_MS;
  const started = performance.now();

  const onReady = () => {
    const elapsed = performance.now() - started;
    const waitForAnim = Math.max(0, MIN_MS - elapsed);
    window.setTimeout(finish, waitForAnim);
  };

  if (document.readyState === "complete") onReady();
  else window.addEventListener("load", onReady, { once: true });
}

function initPlayfulAvatar(reducedMotion) {
  const avatar = document.querySelector("[data-playful-avatar]");
  if (!avatar || reducedMotion) return;

  const LONG_HOVER_MS = 650;
  const TOUCH_HOLD_MS = 650;
  let hoverTimer = null;
  let touchHoldTimer = null;

  const clearHoverTimer = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  };

  const clearTouchHold = () => {
    if (touchHoldTimer) {
      clearTimeout(touchHoldTimer);
      touchHoldTimer = null;
    }
  };

  const celebrate = () => {
    const rect = avatar.getBoundingClientRect();
    burstConfetti({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    avatar.classList.remove("is-celebrating");
    void avatar.offsetWidth;
    avatar.classList.add("is-celebrating");
    window.setTimeout(() => avatar.classList.remove("is-celebrating"), 450);
    if (navigator.vibrate) navigator.vibrate(40);
  };

  avatar.addEventListener("mouseenter", () => {
    clearHoverTimer();
    hoverTimer = window.setTimeout(celebrate, LONG_HOVER_MS);
  });

  avatar.addEventListener("mouseleave", () => {
    clearHoverTimer();
  });

  avatar.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    avatar.classList.add("is-jump");
    clearTouchHold();
    touchHoldTimer = window.setTimeout(celebrate, TOUCH_HOLD_MS);
  });

  const endTouch = () => {
    clearTouchHold();
    avatar.classList.remove("is-jump");
  };

  avatar.addEventListener("pointerup", endTouch);
  avatar.addEventListener("pointercancel", endTouch);
}

function burstConfetti(origin) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const scale = devicePixelRatio;
  ctx.scale(scale, scale);

  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const colors = isLight
    ? ["#d4622a", "#f4a261", "#7c3aed", "#c4b5fd", "#fffaf6", "#fb923c"]
    : ["#6ec8ff", "#9edcff", "#fbb042", "#ffffff", "#4ade80", "#c4b5fd"];
  const particles = Array.from({ length: 90 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 10;
    return {
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      w: 4 + Math.random() * 5,
      h: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      drag: 0.985 + Math.random() * 0.01,
    };
  });

  let frame = 0;
  const maxFrames = 120;

  const tick = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = 0;

    for (const p of particles) {
      if (p.life <= 0) continue;
      alive += 1;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + 0.22;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.012;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    frame += 1;
    if (alive > 0 && frame < maxFrames) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  };

  requestAnimationFrame(tick);
}
