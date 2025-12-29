/**
 * 공통 문의 폼 스크립트
 * 각 사이트의 문의 폼에서 사용
 */

// 사이트 ID 설정 (각 사이트별로 다르게 설정)
const SITE_ID = window.SITE_ID || 'band-program';
// 문의 타입 설정 (각 페이지별로 다르게 설정)
const INQUIRY_TYPE = window.INQUIRY_TYPE || '밴드홍보대행';

// 모달 스타일 및 HTML 생성
function createModal() {
    // 모달이 이미 있으면 생성하지 않음
    if (document.getElementById('inquiryModal')) {
        return;
    }

    const modalHTML = `
        <div id="inquiryModal" class="inquiry-modal" style="display: none;">
            <div class="inquiry-modal-overlay"></div>
            <div class="inquiry-modal-content">
                <button class="inquiry-modal-close" aria-label="닫기">✕</button>
                <div class="inquiry-modal-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                        <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3 class="inquiry-modal-title"></h3>
                <p class="inquiry-modal-message"></p>
                <button class="inquiry-modal-button">확인</button>
            </div>
        </div>
    `;

    const modalStyle = `
        <style>
            .inquiry-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }

            .inquiry-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }

            .inquiry-modal-content {
                position: relative;
                background: #fff;
                border-radius: 16px;
                padding: 2.5rem;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                text-align: center;
                animation: slideUp 0.3s ease;
            }

            .inquiry-modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 24px;
                color: #999;
                cursor: pointer;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }

            .inquiry-modal-close:hover {
                background: #f5f5f5;
                color: #333;
            }

            .inquiry-modal-icon {
                margin: 0 auto 1.5rem;
                width: 80px;
                height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: linear-gradient(135deg, #03C75A 0%, #02B350 100%);
                color: white;
            }

            .inquiry-modal-icon.error {
                background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
            }

            .inquiry-modal-title {
                font-size: 24px;
                font-weight: 700;
                color: #333;
                margin-bottom: 0.75rem;
            }

            .inquiry-modal-message {
                font-size: 16px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 2rem;
                white-space: pre-line;
            }

            .inquiry-modal-button {
                background: linear-gradient(135deg, #03C75A 0%, #02B350 100%);
                color: white;
                border: none;
                padding: 0.875rem 2rem;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                width: 100%;
            }

            .inquiry-modal-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(3, 199, 90, 0.4);
            }

            .inquiry-modal-button:active {
                transform: translateY(0);
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @media (max-width: 480px) {
                .inquiry-modal-content {
                    padding: 2rem 1.5rem;
                }

                .inquiry-modal-title {
                    font-size: 20px;
                }

                .inquiry-modal-message {
                    font-size: 14px;
                }
            }
        </style>
    `;

    // 스타일 추가
    if (!document.getElementById('inquiryModalStyle')) {
        const styleEl = document.createElement('div');
        styleEl.id = 'inquiryModalStyle';
        styleEl.innerHTML = modalStyle;
        document.head.appendChild(styleEl);
    }

    // 모달 HTML 추가
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 모달 닫기 이벤트
    const modal = document.getElementById('inquiryModal');
    const closeBtn = modal.querySelector('.inquiry-modal-close');
    const overlay = modal.querySelector('.inquiry-modal-overlay');
    const confirmBtn = modal.querySelector('.inquiry-modal-button');

    const closeModal = () => {
        modal.style.display = 'none';
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', closeModal);
}

// 모달 표시 함수
function showModal(title, message, isError = false) {
    createModal();
    const modal = document.getElementById('inquiryModal');
    const icon = modal.querySelector('.inquiry-modal-icon');
    const titleEl = modal.querySelector('.inquiry-modal-title');
    const messageEl = modal.querySelector('.inquiry-modal-message');

    if (isError) {
        icon.classList.add('error');
        icon.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    } else {
        icon.classList.remove('error');
        icon.innerHTML = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.style.display = 'flex';
}

// 문의 폼 제출 처리
document.addEventListener('DOMContentLoaded', () => {
    const inquiryForm = document.getElementById('inquiryForm');
    
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = inquiryForm.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            
            // 폼 데이터 수집
            const name = document.getElementById('name').value.trim();
            const contact = document.getElementById('contact').value.trim();
            const message = document.getElementById('message')?.value?.trim() || null;
            
            // 유효성 검사
            if (!name || !contact) {
                showModal('입력 오류', '이름과 연락처를 입력해주세요.', true);
                return;
            }
            
            // 커스텀 필드 수집 (productType 등)
            const customFields = {};
            
            // 문의 타입 추가
            if (INQUIRY_TYPE) {
                customFields.inquiry_type = INQUIRY_TYPE;
            }
            
            const productType = document.getElementById('productType')?.value;
            if (productType) {
                customFields.product_type = productType;
            }
            
            // form 내의 모든 input, select, textarea에서 커스텀 필드 수집
            const formInputs = inquiryForm.querySelectorAll('input, select, textarea');
            formInputs.forEach(input => {
                const fieldName = input.id || input.name;
                // 기본 필드(name, contact, message)는 제외
                if (fieldName && !['name', 'contact', 'message'].includes(fieldName)) {
                    const value = input.value?.trim();
                    if (value) {
                        customFields[fieldName] = value;
                    }
                }
            });
            
            const formData = {
                site_id: SITE_ID,
                name: name,
                contact: contact,
                message: message,
                custom_fields: Object.keys(customFields).length > 0 ? customFields : null
            };
            
            // 제출 버튼 비활성화
            submitBtn.disabled = true;
            submitBtn.textContent = '전송 중...';
            
            try {
                // Cloudflare Pages Functions API 엔드포인트
                const apiUrl = '/api/inquiries';
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showModal('문의 접수 완료', '문의가 접수되었습니다.\n빠른 시일 내에 연락드리겠습니다.');
                    inquiryForm.reset();
                } else {
                    showModal('접수 실패', result.error || '문의 접수에 실패했습니다.\n다시 시도해주세요.', true);
                }
            } catch (error) {
                console.error('Inquiry submission error:', error);
                showModal('오류 발생', '오류가 발생했습니다.\n잠시 후 다시 시도해주세요.', true);
            } finally {
                // 제출 버튼 복원
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

