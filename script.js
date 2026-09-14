(() => {
  const icons = Array.from(document.querySelectorAll(".icon"));
  const articleEl = document.getElementById("article");
  const blankEl = document.getElementById("blank");
  const placeholderEl = document.getElementById("placeholder");
  const revealEl = document.getElementById("reveal");
  const caretEl = document.getElementById("caret");
  const cursorTipEl = document.getElementById("cursorTip");
  const detailOverlayEl = document.getElementById("detailOverlay");
  const detailCloseEl = document.getElementById("detailClose");

  // Same breakpoint as the CSS layout switch: below it the page is treated
  // as a mobile/tap experience regardless of pointer type.
  const layoutQuery = window.matchMedia("(max-width: 1000px), (max-height: 700px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // A real mouse, independent of viewport size — used to gate the
  // hover-only "explore more" tip so a touchscreen never triggers it.
  const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const DEFAULT_ARTICLE = "a";
  const TYPE_SPEED = 26;
  const FADE_MS = 200;

  let typingTimer = null;
  let placeholderHideTimer = null;
  let revealHideTimer = null;
  let activeIcon = null;

  function isTapMode() {
    return layoutQuery.matches;
  }

  function getPlaceholderText() {
    return isTapMode()
      ? "tap an icon to fill in the blank"
      : "hover an icon to fill in the blank";
  }

  // Types text into el one character at a time, with a blinking caret —
  // used once, for the placeholder on page load.
  function typeText(el, text) {
    clearInterval(typingTimer);
    if (reducedMotion) {
      el.textContent = text;
      return;
    }
    let i = 0;
    el.textContent = "";
    caretEl.hidden = false;
    typingTimer = setInterval(() => {
      i += 1;
      el.textContent = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(typingTimer);
        caretEl.hidden = true;
      }
    }, TYPE_SPEED);
  }

  // Hovering icons never re-types — the blank just fades between whatever
  // text it's currently showing and the next.
  function reveal(icon) {
    clearTimeout(placeholderHideTimer);
    clearTimeout(revealHideTimer);

    const word = icon.dataset.word;
    const article = icon.dataset.article || DEFAULT_ARTICLE;

    articleEl.textContent = article;
    blankEl.classList.add("active");
    blankEl.style.setProperty("--accent", icon.dataset.color);
    blankEl.style.setProperty("--accent-bg", icon.dataset.bg);

    placeholderEl.classList.remove("visible");
    placeholderHideTimer = setTimeout(() => {
      placeholderEl.hidden = true;
    }, FADE_MS);

    revealEl.textContent = word;
    revealEl.hidden = false;
    requestAnimationFrame(() => revealEl.classList.add("visible"));
  }

  // ---- "explore more" nudge: shown every time a real mouse hovers an
  // icon (never on touch, regardless of screen size) ----
  let tipHideTimer = null;

  function positionTip(x, y) {
    cursorTipEl.style.transform = `translate(${x + 16}px, ${y + 20}px)`;
  }

  function showTipAt(x, y) {
    if (!hasHover) return;
    clearTimeout(tipHideTimer);
    cursorTipEl.hidden = false;
    positionTip(x, y);
    requestAnimationFrame(() => cursorTipEl.classList.add("visible"));
  }

  function hideTip() {
    if (!hasHover) return;
    clearTimeout(tipHideTimer);
    cursorTipEl.classList.remove("visible");
    tipHideTimer = setTimeout(() => {
      cursorTipEl.hidden = true;
    }, 200);
  }

  function reset() {
    clearTimeout(placeholderHideTimer);
    clearTimeout(revealHideTimer);

    articleEl.textContent = DEFAULT_ARTICLE;
    blankEl.classList.remove("active");

    revealEl.classList.remove("visible");
    revealHideTimer = setTimeout(() => {
      revealEl.hidden = true;
      revealEl.textContent = "";
    }, FADE_MS);

    placeholderEl.hidden = false;
    requestAnimationFrame(() => placeholderEl.classList.add("visible"));
  }

  // ---- coffee detail: centered dialog (desktop) / bottom sheet (mobile) ----
  let detailOpen = false;

  function onDetailKeydown(event) {
    if (event.key === "Escape") closeDetail();
  }

  function openDetail() {
    if (detailOpen) return;
    detailOpen = true;
    detailOverlayEl.hidden = false;
    document.body.classList.add("detail-open");
    requestAnimationFrame(() => detailOverlayEl.classList.add("open"));
    document.addEventListener("keydown", onDetailKeydown);
  }

  function closeDetail() {
    if (!detailOpen) return;
    detailOpen = false;
    detailOverlayEl.classList.remove("open");
    document.body.classList.remove("detail-open");
    document.removeEventListener("keydown", onDetailKeydown);
    setTimeout(() => {
      if (!detailOpen) detailOverlayEl.hidden = true;
    }, 320);
  }

  detailCloseEl.addEventListener("click", closeDetail);
  detailOverlayEl.addEventListener("click", (event) => {
    if (event.target === detailOverlayEl) closeDetail();
  });

  function bindInteractions() {
    icons.forEach((icon) => {
      icon.addEventListener("mouseenter", (event) => {
        if (isTapMode()) return;
        reveal(icon);
        showTipAt(event.clientX, event.clientY);
      });

      icon.addEventListener("mousemove", (event) => {
        if (isTapMode()) return;
        positionTip(event.clientX, event.clientY);
      });

      icon.addEventListener("mouseleave", () => {
        if (isTapMode()) return;
        reset();
        activeIcon = null;
        hideTip();
      });

      icon.addEventListener("focus", () => reveal(icon));
      icon.addEventListener("blur", () => {
        reset();
        activeIcon = null;
      });

      icon.addEventListener("click", (event) => {
        if (!isTapMode()) {
          // Desktop: hover already handles the reveal — a click here only
          // opens an icon's detail panel, if it has one.
          if (icon.dataset.detail) openDetail();
          return;
        }
        event.stopPropagation();
        if (activeIcon === icon) {
          reset();
          activeIcon = null;
        } else {
          activeIcon = icon;
          reveal(icon);
          if (icon.dataset.detail) openDetail();
        }
      });
    });

    document.addEventListener("click", () => {
      if (!isTapMode()) return;
      if (activeIcon) {
        reset();
        activeIcon = null;
      }
    });
  }

  // Type the placeholder out once on load; later mode switches (a resize
  // crossing the breakpoint) just swap the text instantly.
  placeholderEl.hidden = false;
  placeholderEl.classList.add("visible");
  typeText(placeholderEl, getPlaceholderText());

  layoutQuery.addEventListener("change", () => {
    placeholderEl.textContent = getPlaceholderText();
    reset();
    activeIcon = null;
  });

  bindInteractions();
})();
