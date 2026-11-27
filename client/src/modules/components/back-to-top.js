import { useEffect, useState } from "react";

// Reveal state for the fixed Back to Top control: true once the page is
// scrolled past `threshold` (a short page never shows it). Scroll/resize
// work is coalesced through requestAnimationFrame and the listeners are
// passive, so the pages' heavy WebGL plot rows never wait on this; the
// mount-time update covers restored scroll positions (back/forward
// navigation fires no scroll event).
export function useScrollVisibility(threshold = 100) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let rafId = null;

    const update = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setIsVisible(document.body.scrollHeight > window.innerHeight && window.scrollY > threshold);
        rafId = null;
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [threshold]);

  return isVisible;
}

// The NCI-standard Back to Top quarter-circle, fixed to the viewport's
// bottom-right corner. Stays mounted and fades through the `show` class; the
// label swaps to an up-arrow glyph on narrow screens (both in main.scss).
export default function BackToTop() {
  const isVisible = useScrollVisibility();

  const scrollToTop = () =>
    window.scrollTo({
      top: 0,
      // scrollTo ignores the CSS reduced-motion hooks, so honor the
      // preference here: instant jump instead of the smooth glide
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });

  return (
    <div className={"back-to-top" + (isVisible ? " show" : "")}>
      <button type="button" aria-label="Back to top" onClick={scrollToTop}>
        <span className="back-to-top-text">Back To Top</span>
        <span className="back-to-top-icon" aria-hidden="true">
          <i className="bi bi-arrow-up"></i>
        </span>
      </button>
    </div>
  );
}
