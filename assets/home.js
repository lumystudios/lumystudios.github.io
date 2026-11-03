// Home page motion: the logo's ribbon loops through the hero on load, then
// keeps drawing down the page as you scroll, threading each app icon.
// Everything is readable without this script; it only adds the ribbon and motion.
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger || !window.DrawSVGPlugin) return;
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var page = document.querySelector('.page');
  var svg = page.querySelector('.ribbon');
  var heroGrad = svg.querySelector('#hero-grad');
  var heroPaths = svg.querySelectorAll('.hero-part path');
  var spinePaths = svg.querySelectorAll('.spine-part path');
  var hero = document.querySelector('.home-hero');
  var icons = Array.prototype.slice.call(document.querySelectorAll('.world-icon'));
  var title = hero.querySelector('h1');

  // Smooth scroll (Lenis), driven by GSAP's ticker so ScrollTrigger stays in sync.
  var lenis = null;
  if (window.Lenis && !reduce.matches) {
    lenis = new Lenis({ autoRaf: false, anchors: { offset: -68 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // Smooth curve through points (Catmull-Rom as cubic Béziers).
  function curve(pts) {
    var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
        ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
        ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d;
  }

  function box(el) {
    var r = el.getBoundingClientRect(), p = page.getBoundingClientRect();
    return { x: r.left - p.left, y: r.top - p.top, w: r.width, h: r.height };
  }

  var lookup = [];     // [{len, y}] along the spine, y increasing
  var iconLens = [];   // spine length at which each icon is reached
  var spineLen = 0;

  function build() {
    var W = page.clientWidth, H = page.scrollHeight;
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    var narrow = W < 760;
    var hb = box(hero);
    var wrapLeft = box(hero.querySelector('.wrap')).x;
    var spineX = wrapLeft >= 44 ? wrapLeft - 24 : 10;

    // Hero: the ribbon enters from the top right and curls once, like the one in the logo.
    var rx = W * 0.58, rw = W - rx, ry = hb.y, rh = hb.h * 0.92;
    var joinY = hb.y + hb.h + 10;
    var heroPts;
    if (narrow) {
      // Phones: the headline fills the width, so stay on the right edge and
      // cross under the app links instead of through the text.
      var under = box(hero.querySelector('.app-jump'));
      var crossY = Math.min(hb.y + hb.h - 14, under.y + under.h + 34);
      heroPts = [[W + 20, hb.y - 10], [W - 10, hb.y + hb.h * 0.25], [W - 8, crossY - 80], [W * 0.6, crossY], [spineX + 40, crossY + 8], [spineX, joinY]];
    } else {
      var uv = [[1.08, -0.08], [0.78, 0.12], [0.5, 0.42], [0.52, 0.74], [0.78, 0.8], [0.84, 0.52], [0.6, 0.4], [0.3, 0.62], [0.05, 0.98]];
      heroPts = uv.map(function (p) { return [rx + p[0] * rw, ry + p[1] * rh]; });
      heroPts.push([spineX, joinY]);
    }
    heroGrad.setAttribute('x1', rx * 0.6);
    heroGrad.setAttribute('x2', W);
    var heroD = curve(heroPts);

    // Spine: down the left gutter, swinging in behind each app icon.
    var pts = [[spineX, joinY]];
    icons.forEach(function (icon) {
      var b = box(icon), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      var reach = Math.max(110, (cx - spineX) * 1.3);
      pts.push([spineX, cy - reach], [cx, cy], [spineX, cy + reach]);
    });
    // End by sweeping in to point at the "at a glance" heading.
    var hd = box(document.querySelector('#glance-title'));
    var endX = Math.max(spineX + 24, hd.x - (narrow ? 4 : 22)), endY = hd.y + hd.h / 2;
    pts.push([spineX, endY - 90], [spineX + (endX - spineX) * 0.35, endY - 6], [endX, endY]);
    var spineD = curve(pts);

    heroPaths.forEach(function (p) { p.setAttribute('d', heroD); });
    spinePaths.forEach(function (p) { p.setAttribute('d', spineD); });

    // Map page y -> spine length, and find where each icon sits on the spine.
    var path = spinePaths[0];
    spineLen = path.getTotalLength();
    lookup = [];
    for (var l = 0; l <= spineLen; l += 6) lookup.push({ len: l, y: path.getPointAtLength(l).y });
    lookup.push({ len: spineLen, y: path.getPointAtLength(spineLen).y });
    iconLens = icons.map(function (icon) {
      var b = box(icon), cx = b.x + b.w / 2, cy = b.y + b.h / 2, best = 0, bestD = Infinity;
      lookup.forEach(function (s) {
        var pt = path.getPointAtLength(s.len), d = Math.hypot(pt.x - cx, pt.y - cy);
        if (d < bestD) { bestD = d; best = s.len; }
      });
      return best;
    });
  }

  function lenAtY(y) {
    var lo = 0, hi = lookup.length - 1;
    if (!lookup.length || y <= lookup[0].y) return 0;
    if (y >= lookup[hi].y) return spineLen;
    while (hi - lo > 1) {
      var mid = (lo + hi) >> 1;
      if (lookup[mid].y < y) lo = mid; else hi = mid;
    }
    return lookup[lo].len;
  }

  var reached = icons.map(function () { return false; });
  var drawn = 0;
  function drawTo(len) {
    drawn = Math.max(0, Math.min(spineLen, len));
    gsap.set(spinePaths, { drawSVG: '0 ' + drawn });
    iconLens.forEach(function (at, i) {
      if (!reached[i] && drawn >= at) {
        reached[i] = true;
        gsap.fromTo(icons[i], { scale: 1 }, { scale: 1.14, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' });
      } else if (reached[i] && drawn < at - 40) {
        reached[i] = false;
      }
    });
  }

  // The ribbon's tip stays a little below the middle of the screen.
  function update() {
    var pageTop = page.getBoundingClientRect().top + window.scrollY;
    drawTo(lenAtY(window.scrollY + window.innerHeight * 0.72 - pageTop));
  }

  build();

  if (reduce.matches) {
    gsap.set(heroPaths, { drawSVG: '100%' });
    gsap.set(spinePaths, { drawSVG: '100%' });
    gsap.set(title, { opacity: 1 });
    window.addEventListener('resize', function () {
      build();
      gsap.set(heroPaths, { drawSVG: '100%' });
      gsap.set(spinePaths, { drawSVG: '100%' });
    });
    return;
  }

  // The one orchestrated moment: headline and ribbon arrive together.
  gsap.set(spinePaths, { drawSVG: '0 0' });
  var intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro.fromTo(heroPaths, { drawSVG: '0 0' }, { drawSVG: '0 100%', duration: 2.1, ease: 'power2.inOut' }, 0);
  document.fonts.ready.then(function () {
    title.style.animation = 'none';
    if (window.SplitText) {
      SplitText.create(title, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          gsap.set(title, { opacity: 1 });
          return gsap.from(self.lines, { yPercent: 105, duration: 1.1, stagger: 0.12, ease: 'power4.out', delay: 0.15 });
        }
      });
    } else {
      gsap.to(title, { opacity: 1, duration: 0.6 });
    }
  });

  ScrollTrigger.create({
    trigger: page, start: 'top top', end: 'bottom bottom',
    onUpdate: update,
    onRefresh: function () { build(); update(); }
  });

  // Images and fonts change the layout; rebuild the ribbon when they settle.
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
