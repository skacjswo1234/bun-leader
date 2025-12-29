/**
 * 공통 문의 폼 스크립트
 * 각 사이트의 문의 폼에서 사용
 */

// 사이트 ID 설정 (각 사이트별로 다르게 설정)
const SITE_ID = window.SITE_ID || 'band-program';
// 문의 타입 설정 (각 페이지별로 다르게 설정)
const INQUIRY_TYPE = window.INQUIRY_TYPE || '밴드홍보대행';

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
                alert('이름과 연락처를 입력해주세요.');
                return;
            }
            
            // 커스텀 필드 수집 (productType 등)
            const customFields = {};
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
                    alert('문의가 접수되었습니다.\n빠른 시일 내에 연락드리겠습니다.');
                    inquiryForm.reset();
                } else {
                    alert('문의 접수에 실패했습니다.\n다시 시도해주세요.');
                }
            } catch (error) {
                console.error('Inquiry submission error:', error);
                alert('오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
            } finally {
                // 제출 버튼 복원
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

