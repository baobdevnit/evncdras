// templates/users.js - Quản lý Nhóm người dùng và Người dùng (EVN CDR AS)

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const groupItems = document.querySelectorAll('.group-item');
    const tableRows = Array.from(document.querySelectorAll('.data-table tbody tr'));
    const noDataMsg = document.getElementById('noDataMsg');
    const currentGroupTitle = document.getElementById('currentGroupTitle');
    const currentGroupCount = document.getElementById('currentGroupCount');
    const currentGroupSubtitle = document.getElementById('currentGroupSubtitle');
    const userGroupSelect = document.getElementById('userGroupSelect');
    const searchUserInput = document.getElementById('searchUserInput');
    const groupSearchInput = document.getElementById('groupSearchInput');
    const dataTable = document.querySelector('.data-table');

    // Group metadata mapping for title and subtitles
    const groupMeta = {
        'all': {
            name: 'Tất cả nhóm người dùng',
            subtitle: 'Danh sách tài khoản người dùng thuộc tất cả các nhóm trong hệ thống'
        },
        '1': {
            name: 'Nhóm Quản trị Vận hành HT',
            subtitle: 'Mã nhóm: UMO-IT-01 • Quản lý máy chủ, hạ tầng và tổng đài CDR'
        },
        '2': {
            name: 'Nhóm Kỹ thuật Phần mềm',
            subtitle: 'Mã nhóm: UMO-IT-02 • Phát triển và tích hợp ứng dụng EVN CDR AS'
        },
        '3': {
            name: 'Nhóm Call Center CSKH',
            subtitle: 'Mã nhóm: UMO-KD-01 • Tiếp nhận cuộc gọi và chăm sóc khách hàng'
        },
        '4': {
            name: 'Tổ Giám sát Kiểm toán Độc lập',
            subtitle: 'Mã nhóm: UMO-AUDIT • Kiểm toán độc lập lưu lượng và chất lượng đàm thoại'
        },
        '5': {
            name: 'Tổ Chuyên gia SOC An toàn TT',
            subtitle: 'Mã nhóm: UMO-SEC-01 • Giám sát an ninh, phòng chống gian lận viễn thông'
        }
    };

    let selectedGroupId = 'all';

    // Initialize Pagination
    const userPagination = window.PaginationManager ? new PaginationManager('.data-table', '.pagination-container') : null;
    if (userPagination) {
        userPagination.render();
    }

    // Inject mobile status dots
    tableRows.forEach(row => {
        const statusBadge = row.querySelector('.badge-status');
        const avatar = row.querySelector('.avatar-sm');
        if (statusBadge && avatar) {
            const classes = Array.from(statusBadge.classList).filter(c => c !== 'badge-status');
            const dot = document.createElement('span');
            dot.className = 'mobile-status-dot ' + classes.join(' ');

            if (!avatar.parentElement.classList.contains('avatar-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'avatar-wrapper';
                wrapper.style.position = 'relative';
                wrapper.style.display = 'inline-block';

                avatar.parentNode.insertBefore(wrapper, avatar);
                wrapper.appendChild(avatar);
                wrapper.appendChild(dot);
            }
        }
    });

    // Master filter function: combines Group filter and Search text
    function applyFilters() {
        const searchText = searchUserInput ? searchUserInput.value.trim().toLowerCase() : '';

        const visibleRows = tableRows.filter(row => {
            const rowGroup = row.getAttribute('data-group');
            const textContent = row.textContent.toLowerCase();

            // 1. Group match
            const matchesGroup = (selectedGroupId === 'all' || rowGroup === selectedGroupId);

            // 2. Search match (searches name, email, account, role, title)
            const matchesSearch = !searchText || textContent.includes(searchText);

            return matchesGroup && matchesSearch;
        });

        // Update pagination or row visibility
        if (userPagination) {
            userPagination.setFilteredRows(visibleRows);
        } else {
            tableRows.forEach(row => row.style.display = 'none');
            visibleRows.forEach(row => row.style.display = '');
        }

        // Update count badge
        if (currentGroupCount) {
            currentGroupCount.innerText = visibleRows.length;
        }

        // Show/hide empty state
        if (visibleRows.length === 0) {
            if (noDataMsg) noDataMsg.style.display = 'block';
            if (dataTable) dataTable.style.display = 'none';
        } else {
            if (noDataMsg) noDataMsg.style.display = 'none';
            if (dataTable) dataTable.style.display = 'table';
        }
    }

    // Group selection event
    groupItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();

            groupItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');

            selectedGroupId = item.getAttribute('data-group') || 'all';

            // Update Header Title and Subtitle
            const meta = groupMeta[selectedGroupId] || {
                name: item.querySelector('.group-name')?.innerText || 'Nhóm người dùng',
                subtitle: 'Danh sách tài khoản người dùng'
            };

            if (currentGroupTitle) {
                currentGroupTitle.innerHTML = `${meta.name} <span class="badge-count" id="currentGroupCount">0</span>`;
            }
            if (currentGroupSubtitle) {
                currentGroupSubtitle.innerText = meta.subtitle;
            }

            // Sync Group Selection in Modal Form
            if (userGroupSelect) {
                if (selectedGroupId !== 'all') {
                    userGroupSelect.value = selectedGroupId;
                } else {
                    userGroupSelect.value = '';
                }
            }

            applyFilters();
        });
    });

    // Search user input listener
    if (searchUserInput) {
        searchUserInput.addEventListener('input', applyFilters);
    }

    // Search group list in sidebar
    if (groupSearchInput) {
        groupSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            groupItems.forEach(item => {
                if (item.getAttribute('data-group') === 'all') {
                    item.style.display = '';
                    return;
                }
                const name = item.querySelector('.group-name')?.textContent.toLowerCase() || '';
                const code = item.querySelector('.badge-code')?.textContent.toLowerCase() || '';
                const meta = item.querySelector('.group-admin-hint')?.textContent.toLowerCase() || '';

                if (name.includes(query) || code.includes(query) || meta.includes(query)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Recalculate badge counts for groups initially
    const groupCounts = {};
    tableRows.forEach(row => {
        const gid = row.getAttribute('data-group');
        groupCounts[gid] = (groupCounts[gid] || 0) + 1;
    });

    groupItems.forEach(item => {
        const gid = item.getAttribute('data-group');
        const badge = item.querySelector('.badge-count');
        if (badge) {
            if (gid === 'all') {
                badge.innerText = tableRows.length;
            } else if (groupCounts[gid] !== undefined) {
                badge.innerText = groupCounts[gid];
            } else {
                badge.innerText = '0';
            }
        }
    });

    // Initial filter apply
    applyFilters();
});

// Modal Actions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Edit User Modal Handler
function editUser(btn) {
    const row = btn.closest('tr');
    if (!row) return;

    const modal = document.getElementById('userModal');
    if (!modal) return;

    const modalTitle = modal.querySelector('.modal-header h2');
    if (modalTitle) modalTitle.innerText = 'Chỉnh sửa Người dùng';

    // Populate fields from row attributes
    const name = row.getAttribute('data-name') || row.querySelector('.fw-600')?.innerText || '';
    const email = row.getAttribute('data-email') || row.querySelector('.text-muted.d-block')?.innerText || '';
    const username = row.getAttribute('data-username') || '';
    const group = row.getAttribute('data-group') || '';
    const role = row.getAttribute('data-role') || 'member';
    const title = row.getAttribute('data-title') || '';
    const status = row.getAttribute('data-status') || 'ACTIVE';

    const inputName = document.getElementById('userNameInput');
    const inputEmail = document.getElementById('userEmailInput');
    const inputUsername = document.getElementById('userUsernameInput');
    const selectGroup = document.getElementById('userGroupSelect');
    const selectRole = document.getElementById('userRoleSelect');
    const inputTitle = document.getElementById('userJobTitle');
    const selectStatus = document.getElementById('userStatusSelect');
    const lockNotice = document.getElementById('userGroupLockNotice');
    const creationNotice = document.getElementById('userGroupCreationNotice');
    const scopeBanner = document.getElementById('creatorScopeBanner');
    const scopeText = document.getElementById('creatorScopeText');

    if (inputName) inputName.value = name;
    if (inputEmail) inputEmail.value = email;
    if (inputUsername) inputUsername.value = username || email.split('@')[0];
    if (selectGroup) {
        selectGroup.value = group;
        // QUY TẮC CỐT LÕI (BR-UG-01 / BR-USER-01): Nhóm người dùng là bất biến, không thể sửa hay chuyển nhóm
        selectGroup.disabled = true;
    }
    if (selectRole) selectRole.value = role;
    if (inputTitle) inputTitle.value = title;
    if (selectStatus) selectStatus.value = status;

    if (scopeBanner) {
        scopeBanner.style.display = 'flex';
        scopeBanner.className = 'creator-scope-banner system-admin';
    }
    if (scopeText) {
        scopeText.innerHTML = `Chế độ chỉnh sửa thông tin người dùng: Thuộc tính nhóm người dùng là <strong>bất biến</strong> (không thể thay đổi hoặc chuyển nhóm).`;
    }

    if (lockNotice) {
        lockNotice.style.display = 'flex';
        lockNotice.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span><strong>Không thể chuyển nhóm:</strong> Người dùng thuộc cố định vào nhóm này ngay từ lúc tạo tài khoản theo quy định kiến trúc hệ thống.</span>
        `;
    }
    if (creationNotice) {
        creationNotice.style.display = 'none';
    }

    openModal('userModal');
}

function openAddUserModal() {
    const modal = document.getElementById('userModal');
    if (!modal) return;

    const modalTitle = modal.querySelector('.modal-header h2');
    if (modalTitle) modalTitle.innerText = 'Thêm mới Người dùng';

    const form = document.getElementById('userForm');
    if (form) form.reset();

    const selectGroup = document.getElementById('userGroupSelect');
    const lockNotice = document.getElementById('userGroupLockNotice');
    const creationNotice = document.getElementById('userGroupCreationNotice');
    const scopeBanner = document.getElementById('creatorScopeBanner');
    const scopeText = document.getElementById('creatorScopeText');

    // System Admin: Có toàn quyền chỉ định nhóm bất kỳ
    if (scopeBanner) {
        scopeBanner.style.display = 'flex';
        scopeBanner.className = 'creator-scope-banner system-admin';
    }
    if (scopeText) {
        scopeText.innerHTML = `Đang thao tác với tư cách <strong>Quản trị viên hệ thống</strong>: Có quyền chỉ định tài khoản vào bất kỳ nhóm người dùng nào trong toàn hệ thống.`;
    }
    if (selectGroup) {
        selectGroup.disabled = false;
        // Giữ nhóm đang được chọn ở thanh danh mục nhóm bên trái (nếu khác 'all')
        const activeGroupItem = document.querySelector('.group-item.active');
        const activeGroupId = activeGroupItem ? activeGroupItem.getAttribute('data-group') : 'all';
        if (activeGroupId && activeGroupId !== 'all') {
            selectGroup.value = activeGroupId;
        } else {
            selectGroup.value = '';
        }
    }
    if (lockNotice) {
        lockNotice.style.display = 'none';
    }
    if (creationNotice) {
        creationNotice.style.display = 'block';
        creationNotice.innerHTML = `<span>ℹ️ Người dùng luôn luôn thuộc cố định vào một nhóm người dùng ngay từ lúc khởi tạo; hệ thống không có khái niệm chuyển người dùng giữa các nhóm.</span>`;
    }

    openModal('userModal');
}

function saveUser() {
    const form = document.getElementById('userForm');
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const btn = document.querySelector('#userModal .btn-primary');
    const originalText = btn.innerText;
    btn.innerText = 'Đang lưu...';
    btn.style.opacity = '0.8';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.opacity = '1';
        btn.disabled = false;
        closeModal('userModal');
        alert('Đã lưu thông tin người dùng thành công! (Nhóm người dùng được bảo toàn cố định theo kiến trúc hệ thống)');
    }, 600);
}

let rowToDelete = null;

function deleteUser(btn) {
    rowToDelete = btn.closest('tr');
    openModal('deleteModal');
}

function confirmDeleteUser() {
    const btn = document.querySelector('#deleteModal .btn-danger');
    const originalText = btn.innerText;
    btn.innerText = 'Đang xóa...';
    btn.style.opacity = '0.8';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.opacity = '1';
        btn.disabled = false;
        closeModal('deleteModal');

        if (rowToDelete) {
            rowToDelete.remove();
            rowToDelete = null;
        }
        alert('Đã xóa người dùng khỏi hệ thống!');
    }, 500);
}

// Global modal backdrop close & escape key listener
window.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(m => closeModal(m.id));
    }
});
