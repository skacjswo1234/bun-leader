/**
 * 관리자 화면 JavaScript
 */

const API_BASE = '/api/admin';

let currentSite = 'band-program';
let currentStatus = '';
let currentPage = 1;
const limit = 50;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    updateContentTitle();
    loadInquiries();
    
    // 모바일 메뉴 토글
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebarClose');
    const mobileOverlay = document.getElementById('mobileOverlay');

    // 메뉴 열기
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // 메뉴 닫기
    function closeMenu() {
        sidebar.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeMenu);
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMenu);
    }

    // ESC 키로 메뉴 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // 이벤트 리스너
    document.querySelectorAll('.sidebar-item').forEach(btn => {
        btn.addEventListener('click', () => {
            // 비밀번호 변경 버튼은 별도 처리
            if (btn.id === 'passwordChangeBtn') {
                return;
            }
            
            document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSite = btn.dataset.site;
            currentPage = 1;
            updateContentTitle();
            loadInquiries();
            
            // 문의 목록 표시, 비밀번호 변경 섹션 숨기기
            document.querySelector('.inquiries-table-container').style.display = 'block';
            document.querySelector('.pagination').style.display = 'flex';
            document.querySelector('.content-header').style.display = 'flex';
            document.getElementById('passwordChangeSection').style.display = 'none';
            
            // 모바일에서 메뉴 항목 클릭 시 메뉴 닫기
            if (window.innerWidth <= 768) {
                closeMenu();
            }
        });
    });

    document.getElementById('statusFilter').addEventListener('change', (e) => {
        currentStatus = e.target.value;
        currentPage = 1;
        loadInquiries();
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadStats();
        loadInquiries();
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (!confirm('로그아웃 하시겠습니까?')) return;

        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = '/admin/login.html';
            } else {
                alert('로그아웃에 실패했습니다.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('오류가 발생했습니다.');
        }
    });

    // 비밀번호 변경 섹션 토글
    const passwordChangeBtn = document.getElementById('passwordChangeBtn');
    const passwordChangeSection = document.getElementById('passwordChangeSection');
    const cancelPasswordChange = document.getElementById('cancelPasswordChange');

    passwordChangeBtn.addEventListener('click', () => {
        // 다른 사이드바 항목 비활성화
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        passwordChangeBtn.classList.add('active');
        
        // 문의 목록 숨기기, 비밀번호 변경 섹션 표시
        document.querySelector('.inquiries-table-container').style.display = 'none';
        document.querySelector('.pagination').style.display = 'none';
        document.querySelector('.content-header').style.display = 'none';
        passwordChangeSection.style.display = 'block';
        
        // 모바일에서 메뉴 닫기
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    cancelPasswordChange.addEventListener('click', () => {
        // 문의 목록 표시, 비밀번호 변경 섹션 숨기기
        document.querySelector('.inquiries-table-container').style.display = 'block';
        document.querySelector('.pagination').style.display = 'flex';
        document.querySelector('.content-header').style.display = 'flex';
        passwordChangeSection.style.display = 'none';
        
        // 사이드바 항목 복원
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector('[data-site="band-program"]').classList.add('active');
        
        // 폼 리셋
        document.getElementById('passwordChangeForm').reset();
    });

    // 비밀번호 변경 폼 제출
    document.getElementById('passwordChangeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!oldPassword || !newPassword || !confirmPassword) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '변경 중...';

        try {
            const response = await fetch(`${API_BASE}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    oldPassword: oldPassword,
                    newPassword: newPassword
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('비밀번호가 성공적으로 변경되었습니다.');
                document.getElementById('passwordChangeForm').reset();
                cancelPasswordChange.click(); // 취소 버튼 클릭하여 섹션 닫기
            } else {
                // 401 에러 또는 기타 에러 처리
                const errorMessage = result.error || result.message || '비밀번호 변경에 실패했습니다.';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Password change error:', error);
            alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});

// 통계 로드
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('totalInquiries').textContent = result.data.total.total || 0;
            document.getElementById('pendingInquiries').textContent = result.data.total.pending || 0;
        }
    } catch (error) {
        console.error('Stats load error:', error);
    }
}

// 문의 목록 로드
async function loadInquiries() {
    const tbody = document.getElementById('inquiriesTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">로딩 중...</td></tr>';

    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: limit,
            site_id: currentSite
        });

        if (currentStatus) {
            params.append('status', currentStatus);
        }

        const response = await fetch(`${API_BASE}/inquiries?${params}`);
        const result = await response.json();

        if (result.success) {
            displayInquiries(result.data);
            displayPagination(result.pagination);
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="loading">데이터를 불러올 수 없습니다.</td></tr>';
        }
    } catch (error) {
        console.error('Inquiries load error:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="loading">오류가 발생했습니다.</td></tr>';
    }
}

// 문의 목록 표시
function displayInquiries(inquiries) {
    const tbody = document.getElementById('inquiriesTableBody');
    
    if (inquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">문의가 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = inquiries.map(inquiry => {
        // custom_fields 파싱
        let customFields = {};
        if (inquiry.custom_fields) {
            try {
                customFields = typeof inquiry.custom_fields === 'string' 
                    ? JSON.parse(inquiry.custom_fields) 
                    : inquiry.custom_fields;
            } catch (e) {
                console.error('Failed to parse custom_fields:', e);
            }
        }

        // 문의 타입 추출 (페이지 경로나 다른 방법으로 판단)
        // 현재는 custom_fields에서 추출하거나 기본값 사용
        const inquiryType = getInquiryType(inquiry, customFields);
        const productType = customFields.product_type || customFields.productType || '-';

        return `
        <tr>
            <td>${inquiry.id}</td>
            <td><span class="inquiry-type-badge">${escapeHtml(inquiryType)}</span></td>
            <td>${escapeHtml(inquiry.name)}</td>
            <td>${escapeHtml(inquiry.contact)}</td>
            <td>${escapeHtml(productType)}</td>
            <td><span class="status-badge ${inquiry.status}">${getStatusText(inquiry.status)}</span></td>
            <td>${formatDate(inquiry.created_at)}</td>
            <td>
                <div class="action-buttons">
                    ${inquiry.status === 'pending' ? `
                        <button class="action-btn contact" onclick="updateStatus(${inquiry.id}, 'contacted')">연락완료</button>
                    ` : ''}
                    ${inquiry.status !== 'completed' ? `
                        <button class="action-btn complete" onclick="updateStatus(${inquiry.id}, 'completed')">처리완료</button>
                    ` : ''}
                    <button class="action-btn delete" onclick="deleteInquiry(${inquiry.id})">삭제</button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// 문의 타입 추출 함수
function getInquiryType(inquiry, customFields) {
    // site_id로 먼저 판단
    if (inquiry.site_id === 'marketing') {
        // marketing 사이트의 경우 product_type을 문의 타입으로 사용
        const productType = customFields.product_type || customFields.productType;
        if (productType) {
            return productType;
        }
        // custom_fields에서 inquiry_type 찾기
        if (customFields.inquiry_type) {
            return customFields.inquiry_type;
        }
        return '마케팅광고';
    }
    
    // custom_fields에서 inquiry_type 찾기
    if (customFields.inquiry_type) {
        return customFields.inquiry_type;
    }
    
    // product_type으로 판단 (fallback)
    const productType = customFields.product_type || customFields.productType;
    if (productType) {
        if (productType.includes('밴드홍보대행') || productType.includes('베이직') || productType.includes('프리미엄') || productType.includes('VIP')) {
            return '밴드홍보대행';
        }
        if (productType.includes('프로그램') || productType.includes('일반버전') || productType.includes('프로버전')) {
            return '밴드프로그램판매';
        }
    }
    
    // 기본값
    return '-';
}

// 페이지네이션 표시
function displayPagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    
    if (!pagination || pagination.totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }

    let html = '';
    
    // 이전 버튼
    html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">이전</button>`;
    
    // 페이지 번호
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(pagination.totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    // 다음 버튼
    html += `<button class="pagination-btn" ${currentPage === pagination.totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">다음</button>`;
    
    paginationDiv.innerHTML = html;
}

// 페이지 변경
function changePage(page) {
    currentPage = page;
    loadInquiries();
}

// 상태 업데이트
async function updateStatus(id, status) {
    if (!confirm('상태를 변경하시겠습니까?')) return;

    try {
        const response = await fetch(`${API_BASE}/inquiries/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const result = await response.json();

        if (result.success) {
            loadStats();
            loadInquiries();
        } else {
            alert('상태 변경에 실패했습니다.');
        }
    } catch (error) {
        console.error('Status update error:', error);
        alert('오류가 발생했습니다.');
    }
}

// 문의 삭제
async function deleteInquiry(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
        const response = await fetch(`${API_BASE}/inquiries/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            loadStats();
            loadInquiries();
        } else {
            alert('삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('오류가 발생했습니다.');
    }
}

// 콘텐츠 제목 업데이트
function updateContentTitle() {
    const titleElement = document.getElementById('contentTitle');
    const activeItem = document.querySelector('.sidebar-item.active');
    
        if (activeItem) {
        const siteText = activeItem.querySelector('.sidebar-text').textContent;
        titleElement.textContent = `${siteText} 문의`;
    }
}

// 유틸리티 함수
function getStatusText(status) {
    const statusMap = {
        'pending': '대기 중',
        'contacted': '연락 완료',
        'completed': '처리 완료'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

