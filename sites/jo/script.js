/**
 * JO 제이오 랜딩 - 메뉴, 스크롤, 헤더 스타일
 */

(function () {
    var header = document.querySelector('.header');
    var menuToggle = document.getElementById('menuToggle');
    var navMobile = document.getElementById('navMobile');
    var topBtn = document.getElementById('topBtn');
    var navLinks = document.querySelectorAll('.nav-pc a, .nav-mobile a');

    // 스크롤 시 헤더 배경 + TOP 버튼
    function onScroll() {
        if (!header) return;
        if (window.scrollY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        if (topBtn) {
            if (window.scrollY > 400) {
                topBtn.classList.add('show');
            } else {
                topBtn.classList.remove('show');
            }
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 모바일 메뉴 (오른쪽에서 왼쪽으로 슬라이드)
    var navOverlay = document.getElementById('navOverlay');
    function openMenu() {
        if (navMobile) navMobile.classList.add('active');
        if (navOverlay) navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
        if (navMobile) navMobile.classList.remove('active');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            if (navMobile && navMobile.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMenu);
    }
    var navMobileClose = document.getElementById('navMobileClose');
    if (navMobileClose) {
        navMobileClose.addEventListener('click', closeMenu);
    }
    navLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            closeMenu();
        });
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
    });

    // TOP 버튼
    if (topBtn) {
        topBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 문의 섹션으로 스무스 스크롤 (앵커 클릭 시)
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        var href = a.getAttribute('href');
        if (href === '#') return;
        var el = document.querySelector(href);
        if (!el) return;
        a.addEventListener('click', function (e) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
})();
