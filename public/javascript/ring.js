/*----------------------HOME HERO: REEL RING---------------------------------*/
/* A ring of clips revolving around a vertical axis.
 *
 * CSS can't bend a plane, so each panel is cut into vertical strips, each set
 * one step further around a cylinder — the media curves with the ring instead
 * of reading as a flat-sided polygon.
 *
 * Past 90 degrees a strip turns its back to the camera. A backface renders
 * horizontally flipped, and from behind the strips read right-to-left, so the
 * whole panel mirrors on its own — what a real panel does in 3D space. There
 * is nothing to undo.
 *
 * Each strip is a wrapper holding its face canvas plus a top rim rotated flat
 * into the horizontal plane, which gives the panels the thickness of glass.
 * The camera sits above the ring, so the top rim is the only edge ever in
 * view — there is no bottom rim to build.
 *
 * Panels come from data-ring-clips on the stage element (built in
 * src/pages/index.astro so the images go through Astro's optimizer).
 * FALLBACK_CLIPS below is used only if that attribute is missing.
 */

(function () {
  "use strict";

  var FALLBACK_CLIPS = [
    { src: "/assets/photogallery/City.webm", video: true, href: "/work/video/" },
    { src: "/assets/photogallery/cafehh/coffee_5.1.1.jpg", href: "/work/video/cafeshoot" },
    { src: "/assets/photogallery/beach.jpg", href: "/work/video/postcards" },
    { src: "/assets/photogallery/tandonzine.jpg", href: "/work/video/tandonzine" },
    { src: "/assets/photogallery/garden_1.1.2.jpg", href: "/work/video/vismems" },
    { src: "/assets/photogallery/website_code.png", href: "/work/software/portfoliosite" }
  ];

  var S = 5;               // strips per panel
  var GAP = 0.86;          // fraction of each slot the panel fills
  var ASPECT = 16 / 9;
  var SBW = 64, SBH = 180; // strip canvas backing size
  var THICKNESS = 0.024;   // pane thickness, as a fraction of panel width

  var SPIN_SPEED = 8;      // degrees per second
  var ELEVATION = 24;      // camera above the ring plane
  var ROLL = -10;          // ring tipped off the horizontal

  function init() {
    var stage = document.querySelector("[data-ring-stage]");
    if (!stage) return;

    var CLIPS = FALLBACK_CLIPS;
    if (stage.dataset.ringClips) {
      try {
        var parsed = JSON.parse(stage.dataset.ringClips);
        if (parsed && parsed.length) CLIPS = parsed;
      } catch (e) { /* keep the fallback */ }
    }

    var ring = document.createElement("div");
    ring.className = "ring-3d";
    stage.appendChild(ring);

    var reduced = false;
    try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

    var N = CLIPS.length;
    var SLOT = 360 / N;
    var SPAN = SLOT * GAP;
    var DELTA = SPAN / S;

    var tiles = [];
    var radius = 400, sliceW = 40, tileH = 120, edgeH = 4;
    var spin = 0, velocity = 0;

    // ---------- build ----------
    CLIPS.forEach(function (clip, i) {
      var tile = document.createElement("div");
      tile.className = "ring-tile";

      var media;
      if (clip.video) {
        media = document.createElement("video");
        media.muted = true;
        media.loop = true;
        media.autoplay = true;
        media.playsInline = true;
        media.setAttribute("muted", "");
        media.setAttribute("playsinline", "");
        media.preload = "auto";
        media.src = clip.src;
        var p = media.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        media = new Image();
        media.decoding = "async";
        media.src = clip.src;
      }

      var strips = [];
      for (var j = 0; j < S; j++) {
        // The wrapper must stay preserve-3d for the rim to stand up in 3D, so
        // opacity and filter go on the leaves — either one on the wrapper
        // would flatten it and lay the rim back into the face.
        var wrap = document.createElement("div");
        wrap.className = "ring-strip";
        wrap.dataset.tile = String(i);

        var cv = document.createElement("canvas");
        cv.className = "ring-face";
        cv.width = SBW;
        cv.height = SBH;
        if (j === 0) {
          cv.setAttribute("role", "img");
          cv.setAttribute("aria-label", clip.alt || "Featured work");
        } else {
          cv.setAttribute("aria-hidden", "true");
        }

        var edge = document.createElement("i");
        edge.className = "ring-edge";
        edge.setAttribute("aria-hidden", "true");

        wrap.appendChild(cv);
        wrap.appendChild(edge);
        tile.appendChild(wrap);
        strips.push({ wrap: wrap, el: cv, edge: edge, ctx: cv.getContext("2d") });
      }

      ring.appendChild(tile);

      // a fixed per-panel vertical offset, so the ring scatters a little
      var n = Math.sin((i + 1) * 12.9898) * 43758.5453;
      tiles.push({
        strips: strips, media: media, clip: clip,
        dy: ((n - Math.floor(n)) - 0.5) * 46,
        dirty: true, isVideo: !!clip.video
      });
    });

    // ---------- layout ----------
    // Strip placement never changes once sized — only the ring's own rotation
    // does — so these transforms are written here and not touched per frame.
    function layout() {
      var w = stage.clientWidth || 320;
      // the whole ring, far side included, has to land inside the stage
      var tw = Math.max(80, Math.min(230, w / 4.6));
      tileH = Math.round(tw / ASPECT);
      sliceW = tw / S;
      edgeH = Math.max(2, Math.round(tw * THICKNESS));
      radius = sliceW / (2 * Math.tan((DELTA * Math.PI / 180) / 2));

      tiles.forEach(function (t, i) {
        t.dirty = true;
        var deg = i * SLOT;
        t.strips.forEach(function (s, j) {
          var aj = deg + (j + 0.5 - S / 2) * DELTA;
          s.wrap.style.width = (sliceW + 0.8) + "px";   // hairline overlap, no seams
          s.wrap.style.height = tileH + "px";
          s.wrap.style.left = (-(sliceW + 0.8) / 2) + "px";
          s.wrap.style.top = (-tileH / 2) + "px";
          s.wrap.style.transform =
            "rotateY(" + aj.toFixed(3) + "deg) translateZ(" + radius.toFixed(1) +
            "px) translateY(" + t.dy.toFixed(1) + "px)";
          s.edge.style.height = edgeH + "px";
        });
      });
    }

    // ---------- drawing ----------
    function ready(t) {
      var m = t.media;
      if (t.isVideo) return m.readyState >= 2 && m.videoWidth > 0;
      return m.complete && m.naturalWidth > 0;
    }

    function paint(t) {
      var m = t.media;
      var mw = t.isVideo ? m.videoWidth : m.naturalWidth;
      var mh = t.isVideo ? m.videoHeight : m.naturalHeight;

      // centre-crop the source to 16:9
      var cx = 0, cy = 0, cw = mw, ch = mh;
      if (mw / mh > ASPECT) { cw = mh * ASPECT; cx = (mw - cw) / 2; }
      else { ch = mw / ASPECT; cy = (mh - ch) / 2; }

      var stripW = cw / S;
      for (var j = 0; j < S; j++) {
        var ctx = t.strips[j].ctx;
        ctx.clearRect(0, 0, SBW, SBH);
        try {
          ctx.drawImage(m, cx + j * stripW, cy, stripW, ch, 0, 0, SBW, SBH);
        } catch (e) { /* frame not decodable yet */ }

        // A sheen laid across the whole panel, not per strip — the gradient is
        // offset by this strip's position so it runs continuously and doesn't
        // band at the seams.
        var sheen = ctx.createLinearGradient(-j * SBW, 0, (S - j) * SBW, SBH);
        sheen.addColorStop(0, "rgba(255,255,255,0.16)");
        sheen.addColorStop(0.42, "rgba(255,255,255,0.02)");
        sheen.addColorStop(0.72, "rgba(255,255,255,0.05)");
        sheen.addColorStop(1, "rgba(255,255,255,0.13)");
        ctx.fillStyle = sheen;
        ctx.fillRect(0, 0, SBW, SBH);

        // lit top edge, shadowed underside — the face's half of the pane
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillRect(0, 0, SBW, 1.5);
        ctx.fillStyle = "rgba(20,28,36,0.22)";
        ctx.fillRect(0, SBH - 2.5, SBW, 1);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(0, SBH - 1.5, SBW, 1.5);

        // the outer strips carry the panel's own side edges
        if (j === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.fillRect(0, 0, 1.5, SBH);
        } else if (j === S - 1) {
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.fillRect(SBW - 1.5, 0, 1.5, SBH);
        }
      }
    }

    function placeholder(t) {
      for (var j = 0; j < S; j++) {
        var ctx = t.strips[j].ctx;
        ctx.fillStyle = "rgb(230, 230, 230)";
        ctx.fillRect(0, 0, SBW, SBH);
      }
    }
    tiles.forEach(placeholder);

    // ---------- loop ----------
    var last = performance.now();

    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!reduced) spin += SPIN_SPEED * dt;
      spin += velocity;
      velocity *= 0.94;
      if (Math.abs(velocity) < 0.002) velocity = 0;

      ring.style.transform =
        "translateZ(-" + Math.round(radius * 0.36) + "px) rotateZ(" + ROLL +
        "deg) rotateX(" + (-ELEVATION) + "deg) rotateY(" + spin + "deg)";

      for (var i = 0; i < N; i++) {
        var t = tiles[i];
        var phi = ((spin + i * SLOT) % 360) * Math.PI / 180;
        var d01 = (Math.cos(phi) + 1) / 2;   // 1 nearest, 0 far side

        var op = (0.34 + 0.66 * Math.pow(d01, 0.85)).toFixed(3);
        var filt = "blur(" + ((1 - d01) * 1.8).toFixed(2) + "px) brightness(" +
                   (0.68 + 0.32 * d01).toFixed(3) + ") saturate(" +
                   (0.72 + 0.28 * d01).toFixed(2) + ")";
        var edgeOp = (0.3 + 0.7 * d01).toFixed(3);

        for (var j = 0; j < S; j++) {
          var s = t.strips[j];
          s.el.style.opacity = op;
          s.el.style.filter = filt;
          s.edge.style.opacity = edgeOp;
        }

        // stills only repaint when the layout changed; video every frame
        if (ready(t) && (t.isVideo || t.dirty)) {
          paint(t);
          t.dirty = false;
        }
      }

      requestAnimationFrame(frame);
    }

    // ---------- interaction ----------
    // Vertical drags belong to the page — touch-action: pan-y keeps them with
    // the browser. Horizontal drags spin the ring. The axis is locked once per
    // gesture, so a scroll that wanders sideways never hijacks the page.
    var active = false, axis = null, startX = 0, startY = 0, lastX = 0, moved = 0;

    stage.addEventListener("pointerdown", function (e) {
      active = true;
      axis = (e.pointerType === "mouse") ? "x" : null;
      startX = lastX = e.clientX;
      startY = e.clientY;
      moved = 0;
      if (axis === "x") stage.classList.add("is-dragging");
    });

    stage.addEventListener("pointermove", function (e) {
      if (!active) return;

      if (axis === null) {
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) >= Math.abs(dx)) { active = false; return; }  // page scrolls
        axis = "x";
        stage.classList.add("is-dragging");
        lastX = e.clientX;
      }

      var step = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(step);
      velocity = step * 0.16;
    }, { passive: true });

    stage.addEventListener("pointerup", function (e) {
      var wasActive = active;
      active = false;
      stage.classList.remove("is-dragging");

      // a tap, not a drag → open that panel's page
      if (wasActive && moved < 6 && e.target && e.target.closest) {
        var hit = e.target.closest(".ring-strip");
        if (hit) {
          var clip = CLIPS[parseInt(hit.dataset.tile, 10)];
          if (clip && clip.href) window.location.href = clip.href;
        }
      }
    });

    ["pointercancel", "pointerleave"].forEach(function (evt) {
      stage.addEventListener(evt, function () {
        active = false;
        stage.classList.remove("is-dragging");
      });
    });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 120);
    });

    layout();
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
