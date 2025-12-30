// 메뉴 토글 기능
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const menuClose = document.getElementById('menuClose');
const menuOverlay = document.getElementById('menuOverlay');

// 메뉴 열기
menuToggle.addEventListener('click', () => {
    sideMenu.classList.add('active');
    document.body.style.overflow = 'hidden'; // 스크롤 방지
});

// 메뉴 닫기
function closeMenu() {
    sideMenu.classList.remove('active');
    document.body.style.overflow = ''; // 스크롤 복원
}

menuClose.addEventListener('click', closeMenu);
menuOverlay.addEventListener('click', closeMenu);

// ESC 키로 메뉴 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sideMenu.classList.contains('active')) {
        closeMenu();
    }
});

// 메뉴 링크 클릭 시 스크롤 및 메뉴 닫기
const menuLinks = document.querySelectorAll('.menu-list a');
menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        
        // 같은 페이지 내 섹션 이동인 경우 (#으로 시작)
        if (targetId && targetId.startsWith('#')) {
            e.preventDefault();
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                closeMenu();
                setTimeout(() => {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
        } else {
            // 다른 페이지로 이동하는 경우 - 메뉴만 닫고 정상 이동 허용
            closeMenu();
            // preventDefault()를 호출하지 않아서 정상적으로 페이지 이동됨
        }
    });
});


