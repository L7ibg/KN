/* =========================================================
   دعوة خطوبة — عبدالقادر & نور
   Interactive behaviour: loader, particles, cursor, countdown,
   reveals, music, petals, hearts, parallax.
   ========================================================= */
(function () {
  "use strict";

  var EVENT_DATE = new Date(2026, 8, 3, 17, 0, 0); // الخميس 3 سبتمبر 2026 - 5:00 م
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var toArabic = function (n) {
    return String(n).replace(/\d/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; });
  };

  /* ----------------------------------------------------- LOADER */
  function initLoader() {
    var loader = $("#loader"), bar = $("#loaderBar");
    var p = 0;
    var timer = setInterval(function () {
      p = Math.min(100, p + Math.random() * 14 + 6);
      bar.style.width = p + "%";
      if (p >= 100) {
        clearInterval(timer);
        setTimeout(function () {
          loader.classList.add("is-hidden");
          document.body.classList.remove("is-locked");
        }, 620);
      }
    }, 190);
  }

  /* ----------------------------------------------------- PARTICLES */
  function initParticles() {
    var canvas = $("#particles");
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, parts = [];

    function resize() {
      w = canvas.width = Math.floor(innerWidth * dpr);
      h = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      build();
    }
    function build() {
      var count = Math.round(Math.min(110, (innerWidth * innerHeight) / 16000));
      parts = [];
      for (var i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (Math.random() * 1.8 + 0.5) * dpr,
          vy: -(Math.random() * 0.28 + 0.06) * dpr,
          vx: (Math.random() - 0.5) * 0.18 * dpr,
          a: Math.random() * 0.55 + 0.2,
          ph: Math.random() * Math.PI * 2
        });
      }
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        var tw = p.a * (0.6 + 0.4 * Math.sin(t / 900 + p.ph));
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
        g.addColorStop(0, "rgba(255,238,200," + tw + ")");
        g.addColorStop(0.35, "rgba(233,201,141," + tw * 0.5 + ")");
        g.addColorStop(1, "rgba(233,201,141,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    resize();
    addEventListener("resize", resize, { passive: true });
    if (!reduced) requestAnimationFrame(frame);
  }

  /* ----------------------------------------------------- CURSOR / GLOW / RIPPLE */
  function initPointer() {
    var glow = $("#mouseGlow"), cursor = $("#cursor");
    var gx = innerWidth / 2, gy = innerHeight / 2, cx = gx, cy = gy, tx = gx, ty = gy;

    addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });

    (function loop() {
      gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
      cx += (tx - cx) * 0.24; cy += (ty - cy) * 0.24;
      glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0)";
      cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0)" +
        (cursor.classList.contains("is-active") ? " scale(1.55)" : "");
      requestAnimationFrame(loop);
    })();

    if (finePointer) {
      $$("a,button").forEach(function (el) {
        el.addEventListener("pointerenter", function () { cursor.classList.add("is-active"); });
        el.addEventListener("pointerleave", function () { cursor.classList.remove("is-active"); });
      });
    }

    addEventListener("pointerdown", function (e) {
      var r = document.createElement("span");
      r.className = "ripple";
      r.style.left = e.clientX + "px";
      r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      setTimeout(function () { r.remove(); }, 780);
    }, { passive: true });
  }

  /* ----------------------------------------------------- REVEALS */
  function initReveals() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    $$(".reveal, .timeline__item, .note").forEach(function (el, i) {
      if (el.dataset.revealBound) return;
      el.dataset.revealBound = "1";
      el.style.transitionDelay = (i % 4) * 90 + "ms";
      io.observe(el);
      // safety net: never leave content invisible if the observer misses it
      setTimeout(function () { el.classList.add("is-in"); }, 4200 + i * 60);
    });
  }

  /* ----------------------------------------------------- PARALLAX + PROGRESS */
  function initScroll() {
    var bar = $("#progressBar");
    var layers = [
      { el: $(".bg-texture"), k: 0.06 },
      { el: $(".rays"), k: 0.12 },
      { el: $(".orb--1"), k: 0.18 },
      { el: $(".orb--2"), k: -0.14 }
    ];
    var ticking = false;
    function update() {
      var y = window.scrollY;
      var max = document.body.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      if (!reduced) {
        layers.forEach(function (l) {
          if (l.el) l.el.style.transform = "translate3d(0," + (y * l.k) + "px,0)";
        });
      }
      ticking = false;
    }
    addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ----------------------------------------------------- COUNTDOWN */
  function initCountdown() {
    var CIRC = 2 * Math.PI * 52;
    var units = {
      days: { max: 365 }, hours: { max: 24 }, minutes: { max: 60 }, seconds: { max: 60 }
    };
    Object.keys(units).forEach(function (k) {
      var root = document.querySelector('[data-unit="' + k + '"]');
      units[k].num = $(".count__num", root);
      units[k].ring = $(".ring-fg", root);
      units[k].prev = null;
    });
    var done = $("#countDone");

    function tick() {
      var diff = EVENT_DATE - new Date();
      if (diff <= 0) {
        diff = 0;
        done.classList.add("is-on");
      }
      var s = Math.floor(diff / 1000);
      var vals = {
        days: Math.floor(s / 86400),
        hours: Math.floor(s / 3600) % 24,
        minutes: Math.floor(s / 60) % 60,
        seconds: s % 60
      };
      Object.keys(vals).forEach(function (k) {
        var u = units[k], v = vals[k];
        if (u.prev !== v) {
          u.num.textContent = toArabic(v < 10 ? "0" + v : v);
          u.num.classList.remove("tick");
          void u.num.offsetWidth;
          u.num.classList.add("tick");
          var ratio = Math.min(1, v / u.max);
          u.ring.style.strokeDashoffset = CIRC * (1 - ratio);
          u.prev = v;
        }
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ----------------------------------------------------- MUSIC */
  function initMusic() {
    var audio = $("#audio"), btn = $("#musicBtn"), label = $("#musicLabel");
    var fadeTimer = null;

    function fadeTo(target, done) {
      clearInterval(fadeTimer);
      fadeTimer = setInterval(function () {
        var d = target - audio.volume;
        if (Math.abs(d) < 0.03) {
          audio.volume = target; clearInterval(fadeTimer);
          if (done) done();
          return;
        }
        audio.volume = Math.max(0, Math.min(1, audio.volume + d * 0.12));
      }, 60);
    }
    function play() {
      audio.volume = 0;
      var pr = audio.play();
      if (pr && pr.catch) pr.catch(function () { setState(false); });
      setState(true);
      fadeTo(0.42);
    }
    function pause() {
      fadeTo(0, function () { audio.pause(); });
      setState(false);
    }
    function setState(on) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      label.textContent = on ? "إيقاف الموسيقى" : "تشغيل الموسيقى";
    }
    btn.addEventListener("click", function () {
      audio.paused ? play() : pause();
    });
    return { play: play };
  }

  /* ----------------------------------------------------- PETALS + LIGHTS + HEARTS */
  function initDecor() {
    if (reduced) return;
    var petals = $(".invite__petals");
    if (petals) {
      for (var i = 0; i < 14; i++) {
        var p = document.createElement("span");
        p.className = "petal";
        p.style.left = Math.random() * 100 + "%";
        p.style.animationDuration = (9 + Math.random() * 9) + "s";
        p.style.animationDelay = (-Math.random() * 14) + "s";
        p.style.opacity = 0.4 + Math.random() * 0.45;
        p.style.transform = "scale(" + (0.6 + Math.random() * 0.9) + ")";
        petals.appendChild(p);
      }
    }
    var lights = $(".ending__lights");
    if (lights) {
      for (var j = 0; j < 26; j++) {
        var l = document.createElement("span");
        l.className = "light";
        l.style.left = Math.random() * 100 + "%";
        l.style.animationDuration = (10 + Math.random() * 12) + "s";
        l.style.animationDelay = (-Math.random() * 18) + "s";
        l.style.transform = "scale(" + (0.6 + Math.random() * 1.6) + ")";
        lights.appendChild(l);
      }
    }
  }

  function burstHearts(count) {
    if (reduced) return;
    for (var i = 0; i < count; i++) {
      (function (i) {
        setTimeout(function () {
          var h = document.createElement("span");
          h.className = "f-heart";
          h.textContent = Math.random() > 0.5 ? "♥" : "❥";
          h.style.left = (10 + Math.random() * 80) + "vw";
          h.style.top = (70 + Math.random() * 25) + "vh";
          h.style.fontSize = (14 + Math.random() * 20) + "px";
          h.style.animationDuration = (5 + Math.random() * 4) + "s";
          document.body.appendChild(h);
          setTimeout(function () { h.remove(); }, 9500);
        }, i * 220);
      })(i);
    }
  }

  /* ----------------------------------------------------- CARD 3D TILT */
  function initTilt() {
    var card = $("#inviteCard");
    if (!card || !finePointer || reduced) return;
    var inner = $(".invite__inner", card);
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      var rx = ((e.clientY - r.top) / r.height - 0.5) * -9;
      var ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
      inner.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateZ(0)";
    });
    card.addEventListener("pointerleave", function () { inner.style.transform = ""; });
  }

  /* ----------------------------------------------------- GATE TRANSITION */
  function initGate(music) {
    var gate = $("#gate"), btn = $("#openBtn"), main = $("#main"), veil = $("#veil");

    setTimeout(function () { btn.classList.add("is-in"); }, 2600);

    btn.addEventListener("click", function () {
      veil.classList.add("is-on");
      music.play();
      setTimeout(function () {
        gate.classList.add("is-out");
        main.classList.add("is-live");
        main.setAttribute("aria-hidden", "false");
        window.scrollTo(0, 0);
        setTimeout(function () { gate.style.display = "none"; }, 1000);
        veil.classList.remove("is-on");
        burstHearts(9);
        initReveals();
      }, 820);
    });
  }

  /* ----------------------------------------------------- BOOT */
  document.addEventListener("DOMContentLoaded", function () {
    initLoader();
    initParticles();
    initPointer();
    initScroll();
    initCountdown();
    initDecor();
    initTilt();
    var music = initMusic();
    initGate(music);
    initReveals();

    var ending = $("#ending");
    if (ending) {
      new IntersectionObserver(function (en, obs) {
        if (en[0].isIntersecting) { burstHearts(12); obs.disconnect(); }
      }, { threshold: 0.35 }).observe(ending);
    }
  });
})();
