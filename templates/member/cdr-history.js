// templates/cdr-history.js - EVN CDR AS (Lịch sử cuộc gọi & Kiểm soát phân quyền 2 tầng)

// Mock Data từ bảng cdr_enriched
const mockCdrRecords = [
    {
        id: "5370",
        fullId: "00000000000000005370",
        date: "25/05/2026",
        time: "10:15:32",
        callerId: "45678",
        callerGroup: { id: 1, name: "Khối CNTT", code: "UG-IT-01" },
        calledId: "46001",
        calledGroup: { id: 1, name: "Khối CNTT", code: "UG-IT-01" },
        direction: "Inbound",
        status: "ANSWERED",
        sipStatus: "Answered (200 OK)",
        duration: "02:15",
        durationSec: 135,
        hasAudio: true,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        mos: "4.22 (Tốt)",
        jitter: "12 ms",
        codec: "G.711A (PCMA)"
    },
    {
        id: "5371",
        fullId: "00000000000000005371",
        date: "25/05/2026",
        time: "09:42:10",
        callerId: "42105",
        callerGroup: { id: 1, name: "Khối CNTT", code: "UG-IT-01" },
        calledId: "54321",
        calledGroup: { id: 2, name: "Khối Kinh doanh", code: "UG-KD-02" },
        direction: "Outbound",
        status: "NO ANSWER",
        sipStatus: "No Answer (487 Request Terminated)",
        duration: "00:00",
        durationSec: 0,
        hasAudio: false,
        audioUrl: null,
        mos: "3.80 (Khá)",
        jitter: "18 ms",
        codec: "G.711A (PCMA)"
    },
    {
        id: "5372",
        fullId: "00000000000000005372",
        date: "25/05/2026",
        time: "09:30:05",
        callerId: "46001",
        callerGroup: { id: 1, name: "Khối CNTT", code: "UG-IT-01" },
        calledId: "46002",
        calledGroup: { id: 1, name: "Khối CNTT", code: "UG-IT-01" },
        direction: "Internal",
        status: "ANSWERED",
        sipStatus: "Answered (200 OK)",
        duration: "15:40",
        durationSec: 940,
        hasAudio: true,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        mos: "4.35 (Xuất sắc)",
        jitter: "8 ms",
        codec: "G.711A (PCMA)"
    },
    {
        id: "5373",
        fullId: "00000000000000005373",
        date: "25/05/2026",
        time: "08:15:22",
        callerId: "0912345678",
        callerGroup: null, // Ngoại mạng / Chưa quy hoạch
        calledId: "42100",
        calledGroup: { id: 1, name: "Khối CNTT", code: "UG-IT-01" },
        direction: "Inbound",
        status: "BUSY",
        sipStatus: "User Busy (486 Busy Here)",
        duration: "00:00",
        durationSec: 0,
        hasAudio: false,
        audioUrl: null,
        mos: "3.10 (Trung bình)",
        jitter: "25 ms",
        codec: "G.711A (PCMA)"
    }
];

// Cổng Đơn vị thành viên (Member Portal): Phạm vi nhóm đơn vị, quyền Quản trị viên nhóm
const currentViewMode = 'group_admin_enabled';

document.addEventListener('DOMContentLoaded', () => {
    // Handle form filter submit
    const filterForm = document.getElementById('searchCdrForm');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof window.showToast === 'function') {
                window.showToast('Đang áp dụng bộ lọc dữ liệu CDR đơn vị...', 'info');
            }
            renderCdrTable();
        });
    }

    renderCdrTable();
});

// Render bảng dữ liệu cuộc gọi tương ứng với chế độ phân quyền
function renderCdrTable() {
    const tableEl = document.getElementById('cdrDataTable');
    const tbody = document.getElementById('cdrTableBody');
    const groupFilterWrapper = document.getElementById('filterGroupWrapper');

    if (!tbody || !tableEl) return;

    // 1. Quản lý hiển thị Bộ lọc Nhóm dành cho Admin
    if (groupFilterWrapper) {
        groupFilterWrapper.style.display = currentViewMode === 'admin' ? 'flex' : 'none';
    }

    // 2. Quản lý ẩn/hiện Cột Ghi âm theo Chốt chặn Tầng 1 (BR-UG-05)
    if (currentViewMode === 'group_disabled') {
        tableEl.classList.add('hide-audio-col');
    } else {
        tableEl.classList.remove('hide-audio-col');
    }

    // 3. Render các dòng dữ liệu
    tbody.innerHTML = '';
    mockCdrRecords.forEach(rec => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';

        // Xây dựng Badge Nhóm cho Số gọi đi
        const callerBadgeHtml = rec.callerGroup 
            ? `<span class="badge-group" title="Mã nhóm: ${rec.callerGroup.code}">${rec.callerGroup.name}</span>`
            : `<span class="badge-unassigned">Chưa gán nhóm</span>`;

        // Xây dựng Badge Nhóm cho Số nhận
        const calledBadgeHtml = rec.calledGroup 
            ? `<span class="badge-group" title="Mã nhóm: ${rec.calledGroup.code}">${rec.calledGroup.name}</span>`
            : `<span class="badge-unassigned">Chưa gán nhóm</span>`;

        // Render Hướng gọi
        let directionBadge = '';
        if (rec.direction === 'Inbound') {
            directionBadge = `<span class="badge-inbound"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" class="mr-1"><polyline points="15 3 21 3 21 9"></polyline><line x1="9" y1="21" x2="21" y2="3"></line></svg> Inbound</span>`;
        } else if (rec.direction === 'Outbound') {
            directionBadge = `<span class="badge-outbound"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" class="mr-1"><polyline points="9 21 3 21 3 15"></polyline><line x1="15" y1="3" x2="3" y2="21"></line></svg> Outbound</span>`;
        } else {
            directionBadge = `<span class="badge-internal"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" class="mr-1"><path d="M17 3v18"></path><path d="M7 3v18"></path></svg> Internal</span>`;
        }

        // Render Trạng thái kết nối
        let statusBadge = '';
        if (rec.status === 'ANSWERED') {
            statusBadge = `<span class="status-badge success">Answered</span>`;
        } else if (rec.status === 'NO ANSWER') {
            statusBadge = `<span class="status-badge error">No Answer</span>`;
        } else {
            statusBadge = `<span class="status-badge warning">Busy</span>`;
        }

        // Render Cột Ghi âm theo Phân quyền 2 tầng
        let audioCellContent = '';
        if (!rec.hasAudio) {
            audioCellContent = `<span class="text-muted text-sm italic">Không có ghi âm</span>`;
        } else if (currentViewMode === 'admin' || currentViewMode === 'group_admin_enabled') {
            // Đã mở Tầng 1 & Có quyền Tầng 2: Phát & Tải bình thường
            audioCellContent = `
                <audio controls controlsList="nodownload" class="custom-audio" src="${rec.audioUrl}"></audio>
                <a href="${rec.audioUrl}" download class="btn-download" title="Tải xuống" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </a>
            `;
        } else if (currentViewMode === 'member_locked') {
            // Đã mở Tầng 1 nhưng Thành viên chưa được bật cờ Tầng 2: Hiển thị Khóa
            audioCellContent = `
                <span class="badge-locked" title="Chưa được Quản trị viên nhóm cấp quyền nghe và tải ghi âm">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Chưa cấp quyền
                </span>
            `;
        }

        tr.innerHTML = `
            <td>
                <div class="datetime-cell">
                    <span class="date">${rec.date}</span>
                    <span class="time">${rec.time}</span>
                </div>
            </td>
            <td>
                <div class="phone-cell-wrapper">
                    <span class="text-primary phone-number">${rec.callerId}</span>
                    ${callerBadgeHtml}
                </div>
            </td>
            <td>
                <div class="phone-cell-wrapper">
                    <span class="phone-number">${rec.calledId}</span>
                    ${calledBadgeHtml}
                </div>
            </td>
            <td class="text-center">${directionBadge}</td>
            <td class="text-center">${statusBadge}</td>
            <td class="col-duration">${rec.duration}</td>
            <td class="audio-cell">${audioCellContent}</td>
        `;

        // Click dòng mở Modal Chi tiết (ngoại trừ khi bấm vào thẻ audio hoặc nút tải)
        tr.addEventListener('click', (e) => {
            if (e.target.closest('audio') || e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            openCdrDetailModal(rec.id);
        });

        tbody.appendChild(tr);
    });

    // Pause other audios when one plays
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
        audio.addEventListener('play', function() {
            audios.forEach(otherAudio => {
                if (otherAudio !== this) {
                    otherAudio.pause();
                }
            });
        });
    });
}

// Mở Modal xem chi tiết cuộc gọi
function openCdrDetailModal(cdrId) {
    const rec = mockCdrRecords.find(r => r.id === cdrId) || mockCdrRecords[0];
    const modal = document.getElementById('cdrDetailModal');
    if (!modal) return;

    // Gán dữ liệu vào Modal
    document.getElementById('modalCdrId').innerText = rec.id;
    document.getElementById('detailCreated').innerText = `${rec.date} ${rec.time}`;
    
    // Caller
    const callerGroupText = rec.callerGroup ? rec.callerGroup.name : 'Chưa gán nhóm';
    document.getElementById('detailCaller').innerHTML = `${rec.callerId} <span class="${rec.callerGroup ? 'badge-group' : 'badge-unassigned'}">${callerGroupText}</span>`;
    
    // Called
    const calledGroupText = rec.calledGroup ? rec.calledGroup.name : 'Chưa gán nhóm';
    document.getElementById('detailCalled').innerHTML = `${rec.calledId} <span class="${rec.calledGroup ? 'badge-group' : 'badge-unassigned'}">${calledGroupText}</span>`;
    
    document.getElementById('detailDirection').innerText = rec.direction;
    document.getElementById('detailStatus').innerText = rec.sipStatus;
    document.getElementById('detailDuration').innerText = `${rec.durationSec} giây (${rec.duration})`;
    document.getElementById('detailMos').innerText = rec.mos;
    document.getElementById('detailJitter').innerText = rec.jitter;

    // Xử lý khối Ghi âm trong Modal theo phân quyền 2 tầng
    const activeSection = document.getElementById('modalAudioSectionActive');
    const lockedSection = document.getElementById('modalAudioSectionLocked');
    const disabledSection = document.getElementById('modalAudioSectionDisabled');

    if (currentViewMode === 'group_disabled') {
        // Tầng 1 bị khóa: Hiển thị thông báo chưa kích hoạt
        if (activeSection) activeSection.style.display = 'none';
        if (lockedSection) lockedSection.style.display = 'none';
        if (disabledSection) disabledSection.style.display = 'flex';
    } else if (currentViewMode === 'member_locked') {
        // Tầng 1 mở nhưng Tầng 2 khóa: Hiển thị thông báo chưa được cấp quyền
        if (activeSection) activeSection.style.display = 'none';
        if (lockedSection) lockedSection.style.display = 'flex';
        if (disabledSection) disabledSection.style.display = 'none';
    } else {
        // Đã mở Tầng 1 & Có quyền Tầng 2: Hiển thị trình phát Audio
        if (activeSection) activeSection.style.display = rec.hasAudio ? 'block' : 'none';
        if (lockedSection) lockedSection.style.display = 'none';
        if (disabledSection) disabledSection.style.display = 'none';
        
        const audioEl = document.getElementById('modalDetailAudio');
        const dlBtn = document.getElementById('modalDetailDownload');
        if (audioEl && rec.audioUrl) audioEl.src = rec.audioUrl;
        if (dlBtn && rec.audioUrl) dlBtn.href = rec.audioUrl;
    }

    modal.style.display = 'flex';
}

// Đóng Modal chi tiết
function closeCdrDetailModal() {
    const modal = document.getElementById('cdrDetailModal');
    if (modal) {
        modal.style.display = 'none';
        const audioEl = document.getElementById('modalDetailAudio');
        if (audioEl) audioEl.pause();
    }
}

// Global scope
window.openCdrDetailModal = openCdrDetailModal;
window.closeCdrDetailModal = closeCdrDetailModal;
window.renderCdrTable = renderCdrTable;
