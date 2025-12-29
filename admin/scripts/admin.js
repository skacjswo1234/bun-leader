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
            document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSite = btn.dataset.site;
            currentPage = 1;
            updateContentTitle();
            loadInquiries();
            
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

    tbody.innerHTML = inquiries.map(inquiry => `
        <tr>
            <td>${inquiry.id}</td>
            <td><span class="inquiry-type-badge">${escapeHtml(inquiry.inquiry_type || '-')}</span></td>
            <td>${escapeHtml(inquiry.name)}</td>
            <td>${escapeHtml(inquiry.contact)}</td>
            <td>${escapeHtml(inquiry.product_type || '-')}</td>
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
    `).join('');
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

