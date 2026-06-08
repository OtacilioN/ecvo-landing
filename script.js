const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
});

// Scroll-reveal: stagger elements into view as they enter the viewport.
const revealEls = document.querySelectorAll("[data-reveal]");
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReduced || !("IntersectionObserver" in window)) {
  revealEls.forEach((el) => el.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // Stagger siblings revealing together for a cascade effect.
        el.style.transitionDelay = `${i * 80}ms`;
        el.classList.add("is-visible");
        obs.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));

  // Safety net: never leave content hidden if something prevents an intersection.
  window.addEventListener("load", () => {
    setTimeout(() => {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }, 2500);
  });
}
