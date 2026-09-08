(() => {
  const icons = Array.from(document.querySelectorAll(".icon"));
  const articleEl = document.getElementById("article");
  const blankEl = document.getElementById("blank");
  const placeholderEl = document.getElementById("placeholder");
  const revealEl = document.getElementById("reveal");
  const caretEl = document.getElementById("caret");

  // Same breakpoint as the CSS layout switch: below it the page is treated
  // as a mobile/tap experience regardless of pointer type.
  const layoutQuery = window.matchMedia("(max-width: 1000px), (max-height: 700px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  function reset() {
    clearInterval(typingTimer);
    articleEl.textContent = DEFAULT_ARTICLE;
    revealEl.textContent = "";
    revealEl.hidden = true;
    placeholderEl.hidden = false;
    blankEl.classList.remove("active");
    caretEl.hidden = true;
  }

  function bindInteractions() {
    icons.forEach((icon) => {
      icon.addEventListener("mouseenter", () => {
        if (isTapMode()) return;
        reveal(icon);
      });

      icon.addEventListener("mouseleave", () => {
        if (isTapMode()) return;
        reset();
        activeIcon = null;
      });

      icon.addEventListener("focus", () => reveal(icon));
      icon.addEventListener("blur", () => {
        reset();
        activeIcon = null;
      });

      icon.addEventListener("click", (event) => {
        if (!isTapMode()) return;
        event.stopPropagation();
        if (activeIcon === icon) {
          reset();
          activeIcon = null;
        } else {
          activeIcon = icon;
          reveal(icon);
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
