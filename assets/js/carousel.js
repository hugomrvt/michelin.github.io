/**
 * Swipeable carousel — first-party, dependency-free (CSP-safe).
 *
 * Touch swiping is handled natively by CSS scroll-snap; this script only adds:
 *   - prev / next buttons (with disabled + hidden states)
 *   - click-and-drag scrolling for desktop mice
 * Markup contract:
 *   <div class="ds-carousel" data-carousel>
 *     <button data-carousel-prev>…</button>
 *     <ul class="ds-carousel__track" data-carousel-track>…</ul>
 *     <button data-carousel-next>…</button>
 *   </div>
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setupCarousel(root) {
    var track = root.querySelector("[data-carousel-track]");
    var prev = root.querySelector("[data-carousel-prev]");
    var next = root.querySelector("[data-carousel-next]");
    if (!track) return;

    function step() {
      var item = track.querySelector(".ds-carousel__item");
      var gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      return item ? item.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    }

    function scrollByStep(direction) {
      track.scrollBy({
        left: direction * step(),
        behavior: reduceMotion ? "auto" : "smooth"
      });
    }

    function update() {
      var scrollable = track.scrollWidth - track.clientWidth > 1;
      [prev, next].forEach(function (btn) {
        if (btn) btn.hidden = !scrollable;
      });
      if (!scrollable) return;
      var maxScroll = track.scrollWidth - track.clientWidth;
      if (prev) prev.disabled = track.scrollLeft <= 1;
      if (next) next.disabled = track.scrollLeft >= maxScroll - 1;
    }

    if (prev) prev.addEventListener("click", function () { scrollByStep(-1); });
    if (next) next.addEventListener("click", function () { scrollByStep(1); });

    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", debounce(update, 150));

    enableDrag(track);
    update();
  }

  /* Click-and-drag horizontal scrolling (pointer events; ignored on touch). */
  function enableDrag(track) {
    var isDown = false, startX = 0, startScroll = 0, moved = 0;

    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return; /* native touch swipe already works */
      isDown = true;
      moved = 0;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add("is-dragging");
    });

    track.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      var delta = e.clientX - startX;
      moved = Math.abs(delta);
      track.scrollLeft = startScroll - delta;
    });

    function end() {
      if (!isDown) return;
      isDown = false;
      track.classList.remove("is-dragging");
    }
    track.addEventListener("pointerup", end);
    track.addEventListener("pointerleave", end);
    track.addEventListener("pointercancel", end);

    /* Prevent the drag from triggering a card navigation. */
    track.addEventListener("click", function (e) {
      if (moved > 5) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  document.querySelectorAll("[data-carousel]").forEach(setupCarousel);
})();
