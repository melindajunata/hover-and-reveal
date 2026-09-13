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

  let typingTimer = null;
  let activeIcon = null;

  function isTapMode() {
    return layoutQuery.matches;
  }

  function setPlaceholderCopy() {
    placeholderEl.textContent = isTapMode()
      ? "tap an icon to fill in the blank"
      : "hover an icon to fill in the blank";
  }

  function reveal(icon) {
    clearInterval(typingTimer);

    const word = icon.dataset.word;
    const article = icon.dataset.article || DEFAULT_ARTICLE;

    articleEl.textContent = article;
    placeholderEl.hidden = true;
    revealEl.hidden = false;
    blankEl.classList.add("active");
    blankEl.style.setProperty("--accent", icon.dataset.color);
    blankEl.style.setProperty("--accent-bg", icon.dataset.bg);
    caretEl.hidden = false;

    if (reducedMotion) {
      revealEl.textContent = word;
      caretEl.hidden = true;
      return;
    }

    let i = 0;
    revealEl.textContent = "";
    typingTimer = setInterval(() => {
      i += 1;
      revealEl.textContent = word.slice(0, i);
      if (i >= word.length) {
        clearInterval(typingTimer);
        caretEl.hidden = true;
      }
    }, TYPE_SPEED);
  }

  // ---- one-time "explore more" nudge, shown on the first real mouse
  // hover only — touch devices never trigger this ----
  const EXPLORE_TIP_KEY = "hoverAndReveal.exploreTipShown";
  let tipDismissed = !hasHover;
  let tipHideTimer = null;

  if (hasHover) {
    try {
      tipDismissed = localStorage.getItem(EXPLORE_TIP_KEY) === "1";
    } catch {
      tipDismissed = false;
    }
  }

  function positionTip(x, y) {
    cursorTipEl.style.transform = `translate(${x + 16}px, ${y + 20}px)`;
  }

  function showTipAt(x, y) {
    if (tipDismissed) return;
    cursorTipEl.hidden = false;
    positionTip(x, y);
    requestAnimationFrame(() => cursorTipEl.classList.add("visible"));
  }

  function hideTip() {
    clearTimeout(tipHideTimer);
    cursorTipEl.classList.remove("visible");
    tipHideTimer = setTimeout(() => {
      cursorTipEl.hidden = true;
    }, 200);
  }

  function dismissTipForever() {
    if (tipDismissed) return;
    tipDismissed = true;
    try {
      localStorage.setItem(EXPLORE_TIP_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function reset() {
    clearInterval(typingTimer);
    articleEl.textContent = DEFAULT_ARTICLE;
    revealEl.textContent = "";
    revealEl.hidden = true;
    placeholderEl.hidden = false;
    blankEl.classList.remove("active");
    caretEl.hidden = true;
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
        if (isTapMode() || tipDismissed) return;
        positionTip(event.clientX, event.clientY);
      });

      icon.addEventListener("mouseleave", () => {
        if (isTapMode()) return;
        reset();
        activeIcon = null;
        if (!tipDismissed) {
          hideTip();
          dismissTipForever();
        }
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

  setPlaceholderCopy();
  layoutQuery.addEventListener("change", () => {
    setPlaceholderCopy();
    reset();
    activeIcon = null;
  });

  bindInteractions();
})();
