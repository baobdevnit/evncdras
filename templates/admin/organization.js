document.addEventListener('DOMContentLoaded', () => {

    // Tree Table Toggle Logic
    const toggleIcons = document.querySelectorAll('.tree-table .toggle-icon:not(.empty)');
    
    toggleIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const id = tr.getAttribute('data-id');
            const isExpanded = tr.classList.contains('expanded');
            
            // Toggle expanded class
            tr.classList.toggle('expanded');
            
            // Find all children and toggle their visibility
            const rows = Array.from(document.querySelectorAll('.tree-table tbody tr'));
            const children = findChildren(rows, id);
            
            if (isExpanded) {
                // Collapse all descendants
                hideDescendants(rows, id);
            } else {
                // Expand immediate children
                children.forEach(child => {
                    child.style.display = '';
                });
            }
        });
    });

    function findChildren(rows, parentId) {
        return rows.filter(row => row.getAttribute('data-parent') === parentId);
    }

    function hideDescendants(rows, parentId) {
        const children = findChildren(rows, parentId);
        children.forEach(child => {
            child.style.display = 'none';
            // Also remove expanded class so they start collapsed next time
            child.classList.remove('expanded');
            const childId = child.getAttribute('data-id');
            hideDescendants(rows, childId);
        });
    }

    // Initialize Tree view (hide non-expanded nodes initially if needed)
    const allRows = Array.from(document.querySelectorAll('.tree-table tbody tr'));
    allRows.forEach(row => {
        const parentId = row.getAttribute('data-parent');
        if (parentId !== "0") {
            const parentRow = document.querySelector(`.tree-table tbody tr[data-id="${parentId}"]`);
            if (parentRow && !parentRow.classList.contains('expanded')) {
                row.style.display = 'none';
            }
        }
    });
    
    // Initialize Pagination
    const orgPagination = window.PaginationManager ? new PaginationManager('.tree-table', '.pagination-container') : null;
    if (orgPagination) {
        // Collect currently visible rows as the filter (to respect initial tree state)
        // or just let it paginate all rows. We'll paginate all rows for simplicity.
        orgPagination.render();
    }
});

// Modal Logic
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function saveOrg() {
    // Demo save logic
    const btn = document.querySelector('#orgModal .btn-primary');
    const originalText = btn.innerText;
    btn.innerText = 'Đang lưu...';
    btn.style.opacity = '0.8';
    
    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.opacity = '1';
        closeModal('orgModal');
        alert('Đã lưu thông tin tổ chức thành công!');
    }, 800);
}

// Detail & Edit Modal Logic
let currentDetailOrgId = null;

const orgDetailsData = {
    1: { id: 1, name: "Tổng công ty 71", code: "TC-71", parentId: "", parentName: "Không có (Đơn vị gốc - Root)", sortOrder: 1, desc: "Đơn vị quản lý cấp cao điều hành mạng lưới viễn thông, hạ tầng kỹ thuật và dịch vụ tổng đài nội bộ toàn hệ thống." },
    2: { id: 2, name: "Khối Công nghệ Thông tin", code: "IT-01", parentId: "1", parentName: "Tổng công ty 71", sortOrder: 1, desc: "Quản trị hạ tầng công nghệ thông tin, máy chủ tổng đài PABX, hệ thống phân tích nhật ký cuộc gọi CDR và đảm bảo an toàn thông tin." },
    3: { id: 3, name: "Phòng Phát triển Phần mềm", code: "DEV-01", parentId: "2", parentName: "Khối Công nghệ Thông tin", sortOrder: 1, desc: "Nghiên cứu, thiết kế và phát triển các giải pháp phần mềm nghiệp vụ, ứng dụng phân tích CDR và cổng dịch vụ nội bộ EVN." },
    4: { id: 4, name: "Phòng Vận hành (Ops)", code: "OPS-01", parentId: "2", parentName: "Khối Công nghệ Thông tin", sortOrder: 2, desc: "Theo dõi, vận hành 24/7 hạ tầng mạng thoại VoIP, tổng đài nội bộ PABX, giám sát các chỉ số chất lượng dịch vụ QoS." },
    5: { id: 5, name: "Khối Kinh doanh", code: "KD-01", parentId: "1", parentName: "Tổng công ty 71", sortOrder: 2, desc: "Điều phối hoạt động kinh doanh dịch vụ viễn thông, chăm sóc đối tác, quản lý doanh thu và phát triển khách hàng." },
    6: { id: 6, name: "Phòng Kế toán - Tài chính", code: "KT-01", parentId: "1", parentName: "Tổng công ty 71", sortOrder: 3, desc: "Thực hiện công tác kế toán, quản lý tài chính và đối soát lưu lượng thoại dịch vụ viễn thông toàn đơn vị." },
    7: { id: 7, name: "Phòng Nhân sự", code: "NS-01", parentId: "1", parentName: "Tổng công ty 71", sortOrder: 4, desc: "Quản lý nhân sự, đào tạo cán bộ, tổ chức bộ máy và quản lý phân bổ vị trí đặt máy, đầu số liên lạc cho nhân sự." },
    8: { id: 8, name: "Phòng Marketing", code: "MK-01", parentId: "1", parentName: "Tổng công ty 71", sortOrder: 5, desc: "Xây dựng chiến lược truyền thông, quảng bá hình ảnh doanh nghiệp và khảo sát mức độ hài lòng khách hàng." },
    9: { id: 9, name: "Phòng Chăm sóc Khách hàng", code: "CS-01", parentId: "1", parentName: "Tổng công ty 71", sortOrder: 6, desc: "Tiếp nhận, xử lý phản hồi và hỗ trợ giải quyết sự cố thoại của người dùng, vận hành tổng đài hỗ trợ Call Center." },
    10: { id: 10, name: "Phòng Pháp chế", code: "PC-01", parentId: "1", parentName: "Tổng công ty 71", sortOrder: 7, desc: "Thẩm định tính pháp lý các văn bản, hợp đồng viễn thông và tư vấn tuân thủ quy định pháp luật ngành điện lực." },
    11: { id: 11, name: "Phòng Đầu tư", code: "DT-01", parentId: "1", parentName: "Tổng công ty 71", sortOrder: 8, desc: "Lập kế hoạch, thẩm định hồ sơ và giám sát triển khai các dự án đầu tư mở rộng, nâng cấp hạ tầng mạng tổng đài." }
};

function showOrgDetail(id) {
    const org = orgDetailsData[id];
    if (org) {
        currentDetailOrgId = id;
        const titleElem = document.getElementById('detailOrgTitle');
        const nameElem = document.getElementById('detailOrgName');
        const codeElem = document.getElementById('detailOrgCode');
        const parentElem = document.getElementById('detailParentOrg');
        const sortElem = document.getElementById('detailSortOrder');
        const descElem = document.getElementById('detailOrgDesc');

        if (titleElem) titleElem.innerText = org.name;
        if (nameElem) nameElem.innerText = org.name;
        if (codeElem) codeElem.innerText = org.code;
        if (parentElem) parentElem.innerText = org.parentName;
        if (sortElem) sortElem.innerText = org.sortOrder;
        if (descElem) descElem.innerText = org.desc || '(Chưa có mô tả)';

        openModal('orgDetailModal');
    }
}

function editOrgFromDetail() {
    closeModal('orgDetailModal');
    if (currentDetailOrgId) {
        openEditOrgModal(currentDetailOrgId);
    }
}

function addOrgFromDetail() {
    const parentId = currentDetailOrgId;
    closeModal('orgDetailModal');
    openCreateOrgModal(parentId);
}

function openEditOrgModal(id) {
    const modalTitle = document.querySelector('#orgModal .modal-header h2');
    if (modalTitle) {
        modalTitle.innerText = 'Chỉnh sửa thông tin tổ chức';
    }
    populateOrgForm(id);
    openModal('orgModal');
}

function openCreateOrgModal(parentId = '') {
    const form = document.getElementById('orgForm');
    if (form) form.reset();

    const modalTitle = document.querySelector('#orgModal .modal-header h2');
    if (modalTitle) {
        if (parentId && orgDetailsData[parentId]) {
            modalTitle.innerText = 'Thêm mới tổ chức con - Trực thuộc ' + orgDetailsData[parentId].name;
        } else if (parentId) {
            modalTitle.innerText = 'Thêm mới tổ chức con';
        } else {
            modalTitle.innerText = 'Thêm mới tổ chức';
        }
    }

    if (parentId) {
        const parentSelect = document.getElementById('parentOrg');
        if (parentSelect) parentSelect.value = String(parentId);
    }
    openModal('orgModal');
}

function populateOrgForm(id) {
    const org = orgDetailsData[id];
    if (org) {
        const nameInput = document.getElementById('orgName');
        const codeInput = document.getElementById('orgCode');
        const parentSelect = document.getElementById('parentOrg');
        const sortInput = document.getElementById('sortOrder');
        const descInput = document.getElementById('orgDesc');

        if (nameInput) nameInput.value = org.name;
        if (codeInput) codeInput.value = org.code;
        if (parentSelect) parentSelect.value = org.parentId;
        if (sortInput) sortInput.value = org.sortOrder;
        if (descInput) descInput.value = org.desc || '';
    }
}

function confirmDelete() {
    // Demo delete logic
    const btn = document.querySelector('#deleteModal .btn-danger');
    const originalText = btn.innerText;
    btn.innerText = 'Đang xóa...';
    btn.style.opacity = '0.8';
    
    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.opacity = '1';
        closeModal('deleteModal');
        alert('Đã xóa tổ chức thành công!');
    }, 800);
}
