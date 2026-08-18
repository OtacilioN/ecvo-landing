const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
});

// Keep conversion events lightweight and useful across the static pages.
document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;

  const href = link.getAttribute("href") || "";
  const eventName = link.dataset.track
    || (href.includes("wa.me/") ? "whatsapp_click" : "")
    || (href.includes("maps.app.goo.gl") || href.includes("google.com/maps") ? "map_click" : "")
    || (href === "#horarios" || href === "/#horarios" ? "schedule_view" : "");

  if (!eventName || typeof window.gtag !== "function") return;

  window.gtag("event", eventName, {
    modality: document.body.dataset.modality || "ECVO",
    page_path: window.location.pathname,
    cta_position: link.dataset.ctaPosition || "content",
  });
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
