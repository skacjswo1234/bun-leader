/**
 * 관리자 화면 JavaScript
 */

const API_BASE = '/api/admin';

let currentSite = 'bun-partner';
let currentStatus = '';
let currentPage = 1;
let currentSearch = '';
let currentSearchField = 'all';
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

    // 검색 기능
    const searchInput = document.getElementById('searchInput');
    const searchFieldFilter = document.getElementById('searchFieldFilter');
    const searchBtn = document.getElementById('searchBtn');

    searchBtn.addEventListener('click', () => {
        currentSearch = searchInput.value.trim();
        currentSearchField = searchFieldFilter.value;
        currentPage = 1;
        loadInquiries();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
        currentSearch = '';
        searchInput.value = '';
        currentSearchField = 'all';
        searchFieldFilter.value = 'all';
        currentStatus = '';
        document.getElementById('statusFilter').value = '';
        currentPage = 1;
        loadStats();
        loadInquiries();
    });

    document.getElementById('excelDownloadBtn').addEventListener('click', () => {
        downloadExcel();
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (!confirm('로그아웃 하시겠습니까?')) return;

        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                showNotification('success', '로그아웃', '로그아웃되었습니다.', false);
                setTimeout(() => {
                    window.location.href = '/admin/login.html';
                }, 1500);
            } else {
                showNotification('error', '로그아웃 실패', '로그아웃에 실패했습니다.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('error', '오류 발생', '오류가 발생했습니다.');
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
        document.querySelector('[data-site="bun-partner"]').classList.add('active');
        
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
            showNotification('warning', '입력 필요', '모든 필드를 입력해주세요.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('warning', '비밀번호 불일치', '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
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
                showNotification('success', '변경 완료', '비밀번호가 성공적으로 변경되었습니다.');
                document.getElementById('passwordChangeForm').reset();
                cancelPasswordChange.click(); // 취소 버튼 클릭하여 섹션 닫기
            } else {
                // 401 에러 또는 기타 에러 처리
                const errorMessage = result.error || result.message || '비밀번호 변경에 실패했습니다.';
                showNotification('error', '변경 실패', errorMessage);
            }
        } catch (error) {
            console.error('Password change error:', error);
            showNotification('error', '오류 발생', '오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // 수정 모달 이벤트 리스너
    const editModalOverlay = document.getElementById('editModalOverlay');
    const editModalClose = document.getElementById('editModalClose');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editInquiryForm = document.getElementById('editInquiryForm');

    editModalClose.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModalOverlay.addEventListener('click', (e) => {
        if (e.target === editModalOverlay) {
            closeEditModal();
        }
    });
    editInquiryForm.addEventListener('submit', saveEditInquiry);

    // 메모 모달 이벤트 리스너
    const memoModalOverlay = document.getElementById('memoModalOverlay');
    const memoModalClose = document.getElementById('memoModalClose');
    const cancelMemoBtn = document.getElementById('cancelMemoBtn');
    const memoForm = document.getElementById('memoForm');

    memoModalClose.addEventListener('click', closeMemoModal);
    cancelMemoBtn.addEventListener('click', closeMemoModal);
    memoModalOverlay.addEventListener('click', (e) => {
        if (e.target === memoModalOverlay) {
            closeMemoModal();
        }
    });
    memoForm.addEventListener('submit', saveMemo);

    // 상세보기 모달 이벤트 리스너
    const detailModalOverlay = document.getElementById('detailModalOverlay');
    const detailModalClose = document.getElementById('detailModalClose');
    const closeDetailBtn = document.getElementById('closeDetailBtn');

    detailModalClose.addEventListener('click', closeDetailModal);
    closeDetailBtn.addEventListener('click', closeDetailModal);
    detailModalOverlay.addEventListener('click', (e) => {
        if (e.target === detailModalOverlay) {
            closeDetailModal();
        }
    });

    // 알림 모달 이벤트 리스너
    const notificationOverlay = document.getElementById('notificationOverlay');
    const notificationClose = document.getElementById('notificationClose');

    notificationClose.addEventListener('click', () => {
        hideNotification();
    });

    notificationOverlay.addEventListener('click', (e) => {
        if (e.target === notificationOverlay) {
            hideNotification();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (editModalOverlay.style.display === 'flex') {
                closeEditModal();
            }
            if (memoModalOverlay.style.display === 'flex') {
                closeMemoModal();
            }
            if (detailModalOverlay.style.display === 'flex') {
                closeDetailModal();
            }
            if (notificationOverlay.classList.contains('show')) {
                hideNotification();
            }
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
    tbody.innerHTML = '<tr><td colspan="6" class="loading">로딩 중...</td></tr>';

    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: limit,
            site_id: currentSite
        });

        if (currentStatus) {
            params.append('status', currentStatus);
        }

        if (currentSearch) {
            params.append('search', currentSearch);
            params.append('search_field', currentSearchField);
        }

        const response = await fetch(`${API_BASE}/inquiries?${params}`);
        const result = await response.json();

        if (result.success) {
            displayInquiries(result.data);
            displayPagination(result.pagination);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">데이터를 불러올 수 없습니다.</td></tr>';
        }
    } catch (error) {
        console.error('Inquiries load error:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading">오류가 발생했습니다.</td></tr>';
    }
}

// 문의 목록 표시
function displayInquiries(inquiries) {
    const tbody = document.getElementById('inquiriesTableBody');
    const thead = document.querySelector('.inquiries-table thead tr');
    
    if (inquiries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="loading">문의가 없습니다.</td></tr>`;
        return;
    }

    // 모든 사이트에 대해 간소화된 리스트 표시
    thead.innerHTML = `
        <th>ID</th>
        <th>이름</th>
        <th>연락처</th>
        <th>상태</th>
        <th>등록일시</th>
        <th>작업</th>
    `;
    
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

        return `
        <tr>
            <td>${inquiry.id}</td>
            <td>${escapeHtml(inquiry.name)}</td>
            <td>${escapeHtml(inquiry.contact)}</td>
            <td><span class="status-badge ${inquiry.status}">${getStatusText(inquiry.status)}</span></td>
            <td>${formatDate(inquiry.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="openDetailModal(${inquiry.id})" style="background: rgba(139, 92, 246, 0.2); color: #A78BFA; border: 1px solid rgba(139, 92, 246, 0.3);">상세</button>
                    ${inquiry.status === 'pending' ? `
                        <button class="action-btn contact" onclick="updateStatus(${inquiry.id}, 'contacted')">연락완료</button>
                    ` : ''}
                    ${inquiry.status !== 'completed' ? `
                        <button class="action-btn complete" onclick="updateStatus(${inquiry.id}, 'completed')">처리완료</button>
                    ` : ''}
                    <button class="action-btn" onclick="openEditModal(${inquiry.id})" style="background: rgba(34, 197, 94, 0.2); color: #86EFAC; border: 1px solid rgba(34, 197, 94, 0.3);">수정</button>
                    <button class="action-btn" onclick="openMemoModal(${inquiry.id})" style="background: rgba(59, 130, 246, 0.2); color: #93C5FD; border: 1px solid rgba(59, 130, 246, 0.3);">메모</button>
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
    
    if (inquiry.site_id === 'bun-partner') {
        // bun-partner 사이트의 경우 inquiry_type을 문의 타입으로 사용
        if (customFields.inquiry_type) {
            return customFields.inquiry_type;
        }
        return '분양파트너';
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
            showNotification('success', '변경 완료', '상태가 성공적으로 변경되었습니다.');
            loadStats();
            loadInquiries();
        } else {
            showNotification('error', '변경 실패', '상태 변경에 실패했습니다.');
        }
    } catch (error) {
        console.error('Status update error:', error);
        showNotification('error', '오류 발생', '오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
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
            showNotification('success', '삭제 완료', '문의가 성공적으로 삭제되었습니다.');
            loadStats();
            loadInquiries();
        } else {
            showNotification('error', '삭제 실패', '문의 삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('error', '오류 발생', '오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
}

// 수정 모달 열기
async function openEditModal(id) {
    try {
        const response = await fetch(`${API_BASE}/inquiries/${id}`);
        const result = await response.json();

        if (!result.success || !result.data) {
            showNotification('error', '불러오기 실패', '문의 정보를 불러올 수 없습니다.');
            return;
        }

        const inquiry = result.data;
        document.getElementById('editInquiryId').value = inquiry.id;
        document.getElementById('editInquiryName').value = inquiry.name || '';
        document.getElementById('editInquiryContact').value = inquiry.contact || '';
        document.getElementById('editInquiryMessage').value = inquiry.message || '';

        // custom_fields 처리
        const customFieldsContainer = document.getElementById('editCustomFieldsContainer');
        customFieldsContainer.innerHTML = '';
        
        if (inquiry.custom_fields) {
            let customFields = {};
            try {
                customFields = typeof inquiry.custom_fields === 'string' 
                    ? JSON.parse(inquiry.custom_fields) 
                    : inquiry.custom_fields;
            } catch (e) {
                console.error('Failed to parse custom_fields:', e);
            }

            // admin_notes는 제외하고 표시
            Object.keys(customFields).forEach(key => {
                if (key !== 'admin_notes') {
                    const formGroup = document.createElement('div');
                    formGroup.className = 'form-group';
                    formGroup.innerHTML = `
                        <label>${key}</label>
                        <input type="text" class="form-input" data-field="${key}" value="${escapeHtml(String(customFields[key] || ''))}">
                    `;
                    customFieldsContainer.appendChild(formGroup);
                }
            });
        }

        document.getElementById('editModalOverlay').style.display = 'flex';
    } catch (error) {
        console.error('Load inquiry error:', error);
        showNotification('error', '오류 발생', '문의 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// 수정 모달 닫기
function closeEditModal() {
    document.getElementById('editModalOverlay').style.display = 'none';
    document.getElementById('editInquiryForm').reset();
    document.getElementById('editCustomFieldsContainer').innerHTML = '';
}

// 수정 저장
async function saveEditInquiry(e) {
    e.preventDefault();
    
    const id = document.getElementById('editInquiryId').value;
    const name = document.getElementById('editInquiryName').value;
    const contact = document.getElementById('editInquiryContact').value;
    const message = document.getElementById('editInquiryMessage').value;

    // custom_fields 수집
    const customFieldsInputs = document.querySelectorAll('#editCustomFieldsContainer input[data-field]');
    const customFields = {};
    customFieldsInputs.forEach(input => {
        customFields[input.dataset.field] = input.value;
    });

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';

    try {
        const response = await fetch(`${API_BASE}/inquiries/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                contact,
                message,
                custom_fields: customFields
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('success', '수정 완료', '문의 내용이 성공적으로 수정되었습니다.');
            closeEditModal();
            loadInquiries();
        } else {
            showNotification('error', '수정 실패', result.error || '문의 내용 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('Update error:', error);
        showNotification('error', '오류 발생', '오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// 메모 모달 열기
async function openMemoModal(id) {
    try {
        const response = await fetch(`${API_BASE}/inquiries/${id}`);
        const result = await response.json();

        if (!result.success || !result.data) {
            showNotification('error', '불러오기 실패', '문의 정보를 불러올 수 없습니다.');
            return;
        }

        const inquiry = result.data;
        document.getElementById('memoInquiryId').value = inquiry.id;

        // 기존 메모 불러오기
        let adminNotes = '';
        if (inquiry.custom_fields) {
            try {
                const customFields = typeof inquiry.custom_fields === 'string' 
                    ? JSON.parse(inquiry.custom_fields) 
                    : inquiry.custom_fields;
                adminNotes = customFields.admin_notes || '';
            } catch (e) {
                console.error('Failed to parse custom_fields:', e);
            }
        }

        document.getElementById('memoContent').value = adminNotes;
        document.getElementById('memoModalOverlay').style.display = 'flex';
    } catch (error) {
        console.error('Load inquiry error:', error);
        showNotification('error', '오류 발생', '문의 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// 메모 모달 닫기
function closeMemoModal() {
    document.getElementById('memoModalOverlay').style.display = 'none';
    document.getElementById('memoForm').reset();
}

// 메모 저장
async function saveMemo(e) {
    e.preventDefault();
    
    const id = document.getElementById('memoInquiryId').value;
    const notes = document.getElementById('memoContent').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';

    try {
        const response = await fetch(`${API_BASE}/inquiries/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                notes
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('success', '저장 완료', '메모가 성공적으로 저장되었습니다.');
            closeMemoModal();
        } else {
            showNotification('error', '저장 실패', result.error || '메모 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('Memo save error:', error);
        showNotification('error', '오류 발생', '오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// 상세보기 모달 열기
async function openDetailModal(id) {
    try {
        const response = await fetch(`${API_BASE}/inquiries/${id}`);
        const result = await response.json();

        if (!result.success || !result.data) {
            showNotification('error', '불러오기 실패', '문의 정보를 불러올 수 없습니다.');
            return;
        }

        const inquiry = result.data;
        const detailContent = document.getElementById('detailModalContent');
        
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

        const inquiryType = getInquiryType(inquiry, customFields);
        const adminNotes = customFields.admin_notes || '';

        // 상세 정보 HTML 생성
        let detailHtml = `
            <div class="detail-section">
                <h4 style="color: #A78BFA; margin-bottom: 1rem; border-bottom: 1px solid rgba(139, 92, 246, 0.2); padding-bottom: 0.5rem;">기본 정보</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>ID</label>
                        <div>${inquiry.id}</div>
                    </div>
                    <div class="detail-item">
                        <label>문의타입</label>
                        <div><span class="inquiry-type-badge">${escapeHtml(inquiryType)}</span></div>
                    </div>
                    <div class="detail-item">
                        <label>이름</label>
                        <div>${escapeHtml(inquiry.name || '-')}</div>
                    </div>
                    <div class="detail-item">
                        <label>연락처</label>
                        <div>${escapeHtml(inquiry.contact || '-')}</div>
                    </div>
                    <div class="detail-item">
                        <label>상태</label>
                        <div><span class="status-badge ${inquiry.status}">${getStatusText(inquiry.status)}</span></div>
                    </div>
                    <div class="detail-item">
                        <label>등록일시</label>
                        <div>${formatDate(inquiry.created_at)}</div>
                    </div>
                    ${inquiry.updated_at ? `
                    <div class="detail-item">
                        <label>수정일시</label>
                        <div>${formatDate(inquiry.updated_at)}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // 메시지가 있는 경우
        if (inquiry.message) {
            detailHtml += `
                <div class="detail-section" style="margin-top: 1.5rem;">
                    <h4 style="color: #A78BFA; margin-bottom: 1rem; border-bottom: 1px solid rgba(139, 92, 246, 0.2); padding-bottom: 0.5rem;">메시지</h4>
                    <div style="background: rgba(139, 92, 246, 0.05); padding: 1rem; border-radius: 8px; white-space: pre-wrap; word-break: break-word;">${escapeHtml(inquiry.message)}</div>
                </div>
            `;
        }

        // custom_fields 항목들 표시 (admin_notes 제외)
        const customFieldKeys = Object.keys(customFields).filter(key => key !== 'admin_notes');
        if (customFieldKeys.length > 0) {
            detailHtml += `
                <div class="detail-section" style="margin-top: 1.5rem;">
                    <h4 style="color: #A78BFA; margin-bottom: 1rem; border-bottom: 1px solid rgba(139, 92, 246, 0.2); padding-bottom: 0.5rem;">추가 정보</h4>
                    <div class="detail-grid">
            `;
            customFieldKeys.forEach(key => {
                const value = customFields[key];
                const koreanLabel = getKoreanFieldLabel(key);
                detailHtml += `
                    <div class="detail-item">
                        <label>${escapeHtml(koreanLabel)}</label>
                        <div style="word-break: break-word;">${escapeHtml(String(value || '-'))}</div>
                    </div>
                `;
            });
            detailHtml += `
                    </div>
                </div>
            `;
        }

        // 관리자 메모가 있는 경우
        if (adminNotes) {
            detailHtml += `
                <div class="detail-section" style="margin-top: 1.5rem;">
                    <h4 style="color: #A78BFA; margin-bottom: 1rem; border-bottom: 1px solid rgba(139, 92, 246, 0.2); padding-bottom: 0.5rem;">관리자 메모</h4>
                    <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 8px; white-space: pre-wrap; word-break: break-word; border-left: 3px solid rgba(59, 130, 246, 0.5);">${escapeHtml(adminNotes)}</div>
                </div>
            `;
        }

        detailContent.innerHTML = detailHtml;
        document.getElementById('detailModalOverlay').style.display = 'flex';
    } catch (error) {
        console.error('Load inquiry error:', error);
        showNotification('error', '오류 발생', '문의 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// 상세보기 모달 닫기
function closeDetailModal() {
    document.getElementById('detailModalOverlay').style.display = 'none';
    document.getElementById('detailModalContent').innerHTML = '';
}

// 알림 모달 표시 함수
function showNotification(type, title, message, autoClose = true) {
    const overlay = document.getElementById('notificationOverlay');
    const icon = document.getElementById('notificationIcon');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');

    // 아이콘 설정
    icon.className = 'notification-icon ' + type;
    if (type === 'success') {
        icon.textContent = '✓';
    } else if (type === 'error') {
        icon.textContent = '✕';
    } else if (type === 'warning') {
        icon.textContent = '⚠';
    } else {
        icon.textContent = 'ℹ';
    }

    titleEl.textContent = title;
    messageEl.textContent = message;

    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);

    // 자동 닫기
    if (autoClose) {
        setTimeout(() => {
            hideNotification();
        }, 3000);
    }
}

// 알림 모달 숨기기
function hideNotification() {
    const overlay = document.getElementById('notificationOverlay');
    overlay.classList.remove('show');
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
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
    if (!dateString) return '-';
    
    // UTC 시간을 한국 시간(KST, UTC+9)으로 변환
    const date = new Date(dateString);
    
    // UTC 시간에 9시간 추가 (한국 시간)
    const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    
    // 한국 시간으로 포맷팅
    return kstDate.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 영어 필드명을 한글로 변환
function getKoreanFieldLabel(key) {
    const fieldLabelMap = {
        'product_type': '상품유형',
        'productType': '상품유형',
        'inquiry_type': '문의타입',
        'inquiryType': '문의타입',
        'rank': '직급',
        'position': '직급',
        'site_name': '현장명',
        'siteName': '현장명',
        'ad_amount': '광고지원금액',
        'adAmount': '광고지원금액',
        'referrer': '추천인',
        'referrer_contact': '추천인 전화번호',
        'referrerContact': '추천인 전화번호',
        'invest_amount': '투자금액',
        'investAmount': '투자금액',
        'investment_amount': '투자금액',
        'investmentAmount': '투자금액',
        'company': '회사명',
        'company_name': '회사명',
        'companyName': '회사명',
        'email': '이메일',
        'address': '주소',
        'message': '메시지',
        'memo': '메모',
        'note': '메모',
        'notes': '메모',
        'admin_notes': '관리자 메모',
        'adminNotes': '관리자 메모',
        'created_at': '등록일시',
        'createdAt': '등록일시',
        'updated_at': '수정일시',
        'updatedAt': '수정일시',
        'status': '상태',
        'name': '이름',
        'contact': '연락처',
        'phone': '전화번호',
        'phone_number': '전화번호',
        'phoneNumber': '전화번호',
        'tel': '전화번호',
        'mobile': '휴대폰',
        'mobile_number': '휴대폰번호',
        'mobileNumber': '휴대폰번호'
    };
    
    // 매핑된 한글 레이블이 있으면 반환, 없으면 원본 키 반환
    return fieldLabelMap[key] || key;
}

// 엑셀 다운로드 함수
async function downloadExcel() {
    try {
        // 모든 문의 데이터 가져오기 (페이지네이션 없이)
        const params = new URLSearchParams({
            limit: 10000, // 충분히 큰 수
            site_id: currentSite
        });

        if (currentStatus) {
            params.append('status', currentStatus);
        }

        const response = await fetch(`${API_BASE}/inquiries?${params}`);
        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
            showNotification('warning', '데이터 없음', '다운로드할 데이터가 없습니다.');
            return;
        }

        const inquiries = result.data;
        
        // 분양파트너인 경우 문의타입별로 다른 구조 사용
        let headers = [];
        let rows = [];

        if (currentSite === 'bun-partner') {
            // 첫 번째 문의의 타입으로 구조 결정
            let customFields = {};
            if (inquiries[0].custom_fields) {
                try {
                    customFields = typeof inquiries[0].custom_fields === 'string' 
                        ? JSON.parse(inquiries[0].custom_fields) 
                        : inquiries[0].custom_fields;
                } catch (e) {
                    console.error('Failed to parse custom_fields:', e);
                }
            }
            const inquiryType = getInquiryType(inquiries[0], customFields);

            if (inquiryType === '파트너 지원 신청') {
                headers = ['ID', '문의타입', '성명', '전화번호', '직급', '현장명', '광고지원금액', '추천인', '추천인 전화번호', '상태', '등록일시'];
                
                rows = inquiries.map(inquiry => {
                    let fields = {};
                    if (inquiry.custom_fields) {
                        try {
                            fields = typeof inquiry.custom_fields === 'string' 
                                ? JSON.parse(inquiry.custom_fields) 
                                : inquiry.custom_fields;
                        } catch (e) {
                            console.error('Failed to parse custom_fields:', e);
                        }
                    }
                    const type = getInquiryType(inquiry, fields);
                    
                    return [
                        inquiry.id,
                        type,
                        inquiry.name,
                        inquiry.contact,
                        fields.rank || '',
                        fields.site_name || '',
                        fields.ad_amount || '',
                        fields.referrer || '',
                        fields.referrer_contact || '',
                        getStatusText(inquiry.status),
                        formatDate(inquiry.created_at)
                    ];
                });
            } else if (inquiryType === '투자자 지원 신청') {
                headers = ['ID', '문의타입', '성명', '전화번호', '투자금', '상태', '등록일시'];
                
                rows = inquiries.map(inquiry => {
                    let fields = {};
                    if (inquiry.custom_fields) {
                        try {
                            fields = typeof inquiry.custom_fields === 'string' 
                                ? JSON.parse(inquiry.custom_fields) 
                                : inquiry.custom_fields;
                        } catch (e) {
                            console.error('Failed to parse custom_fields:', e);
                        }
                    }
                    const type = getInquiryType(inquiry, fields);
                    
                    return [
                        inquiry.id,
                        type,
                        inquiry.name,
                        inquiry.contact,
                        fields.invest_amount || '',
                        getStatusText(inquiry.status),
                        formatDate(inquiry.created_at)
                    ];
                });
            } else {
                // 기본 구조
                headers = ['ID', '문의타입', '이름', '연락처', '상품유형', '상태', '등록일시'];
                
                rows = inquiries.map(inquiry => {
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
                    const inquiryType = getInquiryType(inquiry, customFields);
                    const productType = customFields.product_type || customFields.productType || '';
                    
                    return [
                        inquiry.id,
                        inquiryType,
                        inquiry.name,
                        inquiry.contact,
                        productType,
                        getStatusText(inquiry.status),
                        formatDate(inquiry.created_at)
                    ];
                });
            }
        } else {
            // 다른 사이트는 기본 구조
            headers = ['ID', '문의타입', '이름', '연락처', '상품유형', '상태', '등록일시'];
            
            rows = inquiries.map(inquiry => {
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
                const inquiryType = getInquiryType(inquiry, customFields);
                const productType = customFields.product_type || customFields.productType || '';
                
                return [
                    inquiry.id,
                    inquiryType,
                    inquiry.name,
                    inquiry.contact,
                    productType,
                    getStatusText(inquiry.status),
                    formatDate(inquiry.created_at)
                ];
            });
        }

        // SheetJS를 사용하여 워크북 생성
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        
        // 컬럼 너비 자동 조정
        const colWidths = headers.map((_, i) => {
            const maxLength = Math.max(
                headers[i].length,
                ...rows.map(row => String(row[i] || '').length)
            );
            return { wch: Math.min(maxLength + 2, 50) };
        });
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, '문의목록');
        
        // 파일명 생성
        const siteName = currentSite === 'band-program' ? '밴드홍보대행' :
                        currentSite === 'marketing' ? '분양리더마케팅' :
                        currentSite === 'bun-partner' ? '분양파트너' : '문의';
        const statusText = currentStatus ? `_${getStatusText(currentStatus)}` : '';
        const fileName = `${siteName}_문의목록${statusText}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // 엑셀 파일 다운로드
        XLSX.writeFile(wb, fileName);
        
    } catch (error) {
        console.error('Excel download error:', error);
        showNotification('error', '다운로드 실패', '엑셀 다운로드 중 오류가 발생했습니다.');
    }
}

