/*----------------------WORK > VIDEO: BACK TO THE CARD YOU CAME FROM---------*/
/* Two halves of one behaviour, both guarded by pathname so this file is inert
 * everywhere else on the site.
 *
 * On the index: remember the scroll offset at the moment a project link is
 * clicked.
 *
 * On a project page: the Back link prefers history.back(), because the browser
 * restores the offset itself and bfcache makes the return instant. It falls
 * back to a plain navigation when there's no history entry to go back to — a
 * link opened cold in a new tab, say — and the index then re-applies the
 * remembered offset on arrival.
 *
 * The link is a real <a href>, so all of this is enhancement: with JS off it
 * still returns to the top of the index.
 */

(function () {
  "use strict";

  var SCROLL_KEY = "video-index-scroll";

  function isVideoIndex(pathname) {
    return pathname === "/work/video" ||
           pathname === "/work/video/" ||
           pathname === "/work/video/index";
  }

  function isVideoProject(pathname) {
    return pathname.indexOf("/work/video/") === 0 && !isVideoIndex(pathname);
  }

  function referrer() {
    try {
      var ref = new URL(document.referrer);
      return ref.origin === window.location.origin ? ref : null;
    } catch (e) {
      return null;
    }
  }

  // ---------- the index ----------
  if (isVideoIndex(window.location.pathname)) {
    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest('a[href^="/work/video/"]');
      if (!link) return;
      try {
        sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
      } catch (err) { /* private window, blocked storage — no restore, no harm */ }
    });

    var from = referrer();
    if (from && isVideoProject(from.pathname)) {
      var saved = null;
      try { saved = sessionStorage.getItem(SCROLL_KEY); } catch (err) {}

      if (saved !== null) {
        var y = parseInt(saved, 10);
        var cancelled = false;

        // The gallery images carry no width/height, so the page keeps growing
        // as they decode and a single scrollTo lands short. Re-apply until the
        // layout settles — but stand down the moment the reader scrolls, so
        // this never fights them for control.
        var stop = function () { cancelled = true; };
        window.addEventListener("wheel", stop, { passive: true, once: true });
        window.addEventListener("touchstart", stop, { passive: true, once: true });
        window.addEventListener("keydown", stop, { once: true });

        var settle = function () {
          if (!cancelled) window.scrollTo(0, y);
        };

        settle();
        window.addEventListener("load", settle);
        setTimeout(settle, 80);
        setTimeout(settle, 300);
        setTimeout(function () { cancelled = true; }, 800);
      }
    }
  }

  // ---------- a project page ----------
  var backLink = document.querySelector("[data-back-link]");
  if (backLink) {
    backLink.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

      var from = referrer();
      if (from && isVideoIndex(from.pathname) && window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
      // otherwise let the href navigate, and the index restores the offset
    });
  }
})();
