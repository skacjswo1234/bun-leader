/**
 * 분양파트너 BP - 문의 폼(파트너/투자자), 모달, TOP 버튼
 * DB·텔레그램은 기존 /api/inquiries 사용 (site_id: bun-partner)
 */

const SITE_ID = 'bun-partner';
const API_URL = '/api/inquiries';

function showModal(title, message, isError = false) {
    const modal = document.getElementById('inquiryModal');
    if (!modal) return;
    const icon = modal.querySelector('.inquiry-modal-icon');
    const titleEl = modal.querySelector('.inquiry-modal-title');
    const messageEl = modal.querySelector('.inquiry-modal-message');
    icon.className = 'inquiry-modal-icon' + (isError ? ' error' : '');
    icon.innerHTML = isError
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
    const modal = document.getElementById('inquiryModal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
}

function bindModal() {
    const modal = document.getElementById('inquiryModal');
    if (!modal) return;
    modal.querySelector('.inquiry-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.inquiry-modal-overlay').addEventListener('click', closeModal);
    modal.querySelector('.inquiry-modal-button').addEventListener('click', closeModal);
}

async function submitInquiry(formData) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });
    return res.json();
}

function handlePartnerSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('inquiryFormPartner');
    const btn = form.querySelector('.submit-btn');
    const name = form.querySelector('#partner-name').value.trim();
    const contact = form.querySelector('#partner-contact').value.trim();
    const rank = form.querySelector('#partner-rank').value.trim();
    const siteName = form.querySelector('#partner-site').value.trim();
    const adAmount = form.querySelector('#partner-ad').value.trim();

    if (!name || !contact) {
        showModal('입력 오류', '성명과 전화번호를 입력해주세요.', true);
        return;
    }

    const custom_fields = { inquiry_type: '파트너 지원 신청' };
    if (rank) custom_fields.rank = rank;
    if (siteName) custom_fields.site_name = siteName;
    if (adAmount) custom_fields.ad_amount = adAmount;

    const formData = {
        site_id: SITE_ID,
        name,
        contact,
        message: null,
        custom_fields: Object.keys(custom_fields).length > 0 ? custom_fields : null,
    };

    btn.disabled = true;
    btn.textContent = '전송 중...';

    submitInquiry(formData)
        .then((result) => {
            if (result.success) {
                showModal('접수 완료', '파트너 지원 신청이 접수되었습니다.\n내부 검토 후 개별 연락드리겠습니다.');
                form.reset();
            } else {
                showModal('접수 실패', result.error || '다시 시도해주세요.', true);
            }
        })
        .catch(() => {
            showModal('오류', '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', true);
        })
        .finally(() => {
            btn.disabled = false;
            btn.textContent = '파트너 지원 신청';
        });
}

function handleInvestorSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('inquiryFormInvestor');
    const btn = form.querySelector('.submit-btn');
    const name = form.querySelector('#investor-name').value.trim();
    const contact = form.querySelector('#investor-contact').value.trim();
    const investAmount = form.querySelector('#investor-amount').value.trim();

    if (!name || !contact) {
        showModal('입력 오류', '성명과 전화번호를 입력해주세요.', true);
        return;
    }

    const custom_fields = { inquiry_type: '투자자 지원 신청' };
    if (investAmount) custom_fields.invest_amount = investAmount;

    const formData = {
        site_id: SITE_ID,
        name,
        contact,
        message: null,
        custom_fields: Object.keys(custom_fields).length > 0 ? custom_fields : null,
    };

    btn.disabled = true;
    btn.textContent = '전송 중...';

    submitInquiry(formData)
        .then((result) => {
            if (result.success) {
                showModal('접수 완료', '투자자 지원 신청이 접수되었습니다.\n검토 후 개별 연락드리겠습니다.');
                form.reset();
            } else {
                showModal('접수 실패', result.error || '다시 시도해주세요.', true);
            }
        })
        .catch(() => {
            showModal('오류', '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', true);
        })
        .finally(() => {
            btn.disabled = false;
            btn.textContent = '투자자 지원 신청';
        });
}

function initTopButton() {
    const topBtn = document.getElementById('topBtn');
    if (!topBtn) return;
    function onScroll() {
        if (window.scrollY > 400) {
            topBtn.classList.add('visible');
        } else {
            topBtn.classList.remove('visible');
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initSectionReveal() {
    const sections = document.querySelectorAll('.section-reveal');
    if (!sections.length) return;
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        },
        { rootMargin: '0px 0px -80px 0px', threshold: 0.05 }
    );
    sections.forEach((el) => observer.observe(el));
}

function initHeaderNav() {
    const btn = document.getElementById('headerMenuBtn');
    const mobile = document.getElementById('headerNavMobile');
    const overlay = document.getElementById('headerNavOverlay');
    if (!btn || !mobile || !overlay) return;
    function open() {
        mobile.classList.add('open');
        overlay.classList.add('open');
        btn.setAttribute('aria-label', '메뉴 닫기');
    }
    function close() {
        mobile.classList.remove('open');
        overlay.classList.remove('open');
        btn.setAttribute('aria-label', '메뉴 열기');
    }
    btn.addEventListener('click', () => {
        if (mobile.classList.contains('open')) close();
        else open();
    });
    overlay.addEventListener('click', close);
    mobile.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', close);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    bindModal();
    const partnerForm = document.getElementById('inquiryFormPartner');
    const investorForm = document.getElementById('inquiryFormInvestor');
    if (partnerForm) partnerForm.addEventListener('submit', handlePartnerSubmit);
    if (investorForm) investorForm.addEventListener('submit', handleInvestorSubmit);
    initTopButton();
    initSectionReveal();
    initHeaderNav();
});
