/* ============================================================
   xingkongJCH 星空小站 — 交互脚本
   1) 鼠标 / 触摸视差
   2) 哈希路由视图切换
   3) 移动端导航菜单
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ==========================================================
     1. 鼠标视差
     ========================================================== */
  var targetX = 0, targetY = 0;   // 目标偏移，归一化 -1 ~ 1
  var currentX = 0, currentY = 0; // 缓动后的当前值
  var rafId = null;
  var EASE = 0.075;               // 缓动系数，越小越柔和
  var THRESHOLD = 0.001;          // 差值阈值，低于此值暂停循环

  function applyVars() {
    root.style.setProperty('--mx', currentX.toFixed(4));
    root.style.setProperty('--my', currentY.toFixed(4));
  }

  function animate() {
    currentX += (targetX - currentX) * EASE;
    currentY += (targetY - currentY) * EASE;
    applyVars();

    if (Math.abs(targetX - currentX) > THRESHOLD ||
        Math.abs(targetY - currentY) > THRESHOLD) {
      rafId = requestAnimationFrame(animate);
    } else {
      currentX = targetX;
      currentY = targetY;
      applyVars();
      rafId = null;
    }
  }

  function kick() {
    if (rafId === null) {
      rafId = requestAnimationFrame(animate);
    }
  }

  function setTargetFromPoint(clientX, clientY) {
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    targetX = (clientX / w - 0.5) * 2;
    targetY = (clientY / h - 0.5) * 2;
    kick();
  }

  window.addEventListener('mousemove', function (e) {
    setTargetFromPoint(e.clientX, e.clientY);
  }, { passive: true });

  // 鼠标移出窗口时缓缓回中
  document.addEventListener('mouseleave', function () {
    targetX = 0;
    targetY = 0;
    kick();
  });

  // 触摸设备
  window.addEventListener('touchmove', function (e) {
    var t = e.touches && e.touches[0];
    if (!t) return;
    setTargetFromPoint(t.clientX, t.clientY);
  }, { passive: true });

  window.addEventListener('touchend', function () {
    targetX = 0;
    targetY = 0;
    kick();
  });

  // 尊重「减少动效」偏好
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    window.removeEventListener('mousemove', setTargetFromPoint);
  }

  /* ==========================================================
     2. 哈希路由：视图切换
     ========================================================== */
  var pages = {
    home: document.getElementById('page-home'),
    windows: document.getElementById('page-windows')
  };

  var navLinks = document.querySelectorAll('.nav-link[data-nav]');

  function getRoute() {
    var hash = location.hash.replace('#', '');
    return pages[hash] ? hash : 'home';
  }

  function render() {
    var route = getRoute();

    // 切换页面
    Object.keys(pages).forEach(function (key) {
      var el = pages[key];
      if (!el) return;
      el.classList.toggle('active', key === route);
    });

    // 高亮导航
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.dataset.nav === route);
    });

    // 回到顶部
    window.scrollTo(0, 0);

    // 切换后关闭移动端菜单
    closeMenu();
  }

  window.addEventListener('hashchange', render);

  /* ==========================================================
     3. 返回按钮
     ========================================================== */
  var backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (location.hash) {
        history.back();
        // 兜底：若无历史记录可回退，则直接重置
        setTimeout(function () {
          if (location.hash) {
            location.hash = 'home';
          }
        }, 80);
      }
    });
  }

  /* ==========================================================
     4. 移动端导航菜单
     ========================================================== */
  var navToggle = document.getElementById('navToggle');
  var navLinksBox = document.getElementById('navLinks');

  function openMenu() {
    if (!navLinksBox || !navToggle) return;
    navLinksBox.classList.add('open');
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    if (!navLinksBox || !navToggle) return;
    navLinksBox.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle) {
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (navLinksBox.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  // 点击菜单内链接后自动收起
  if (navLinksBox) {
    navLinksBox.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }

  // 点击页面其他区域收起菜单
  document.addEventListener('click', function (e) {
    if (!navLinksBox || !navLinksBox.classList.contains('open')) return;
    if (!navLinksBox.contains(e.target) && e.target !== navToggle) {
      closeMenu();
    }
  });

  /* ==========================================================
     5. 初始化
     ========================================================== */
  applyVars();

  // 无 hash 时默认首页，保持 URL 干净
  if (!location.hash) {
    render();
  } else {
    render();
  }

})();