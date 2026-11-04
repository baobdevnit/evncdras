/**
 * EVN CDR AS - Báo cáo & Thống kê Viễn thông
 * Standardized module based on real telecom schema & Zero CDR Scan architecture
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current application state
    const state = {
        currentRole: 'admin', // 'admin' | 'group'
        reportType: 'general', // 'general' | 'traffic' | 'quality' | 'failure'
        dateRange: 'this_week',
        fromDate: '2026-05-12',
        toDate: '2026-05-18',
        organization: 'all',
        userGroupOrg: '51', // EVNICT Đà Nẵng
        userGroupName: 'EVNICT Đà Nẵng'
    };

    // Chart instances
    let volumeChartInstance = null;
    let branchChartInstance = null;

    // Real EVN units dataset matching database dump voip_cdr_20250817.sql
    const evnUnits = {
        'all': { name: 'Toàn bộ Tập đoàn EVN', prefix: 'EVN' },
        '96': { name: 'Ban Viễn thông & CNTT EVN', prefix: '96xxx' },
        '51': { name: 'EVNICT Đà Nẵng', prefix: '51xxx' },
        '42': { name: 'Khối CNTT Cơ quan Tập đoàn', prefix: '42xxx' },
        '45': { name: 'Điện lực Đà Nẵng', prefix: '45xxx' },
        '62': { name: 'Tổng công ty EVN SPC', prefix: '62xxx' }
    };

    // Pre-aggregated statistics simulating stats_daily records
    const rawDailyData = [
        {
            date: '2026-05-12',
            orgId: '96', groupId: '96',
            orgName: 'Ban Viễn thông & CNTT EVN',
            totalCalls: 3820,
            answered: 3210,
            durationMinutes: 18450,
            asr: 84.0,
            ner: 92.5,
            intraCalls: 2650,
            outboundCalls: 620,
            inboundCalls: 550,
            mosAvg: 4.25,
            mosGoodPercent: 91.2,
            lossAvg: 0.32,
            jitterAvg: 6.2,
            rttAvg: 28.5,
            sip503: 8,
            sip408: 5,
            sip486: 390,
            sip487: 207
        },
        {
            date: '2026-05-13',
            orgId: '51', groupId: '51',
            orgName: 'EVNICT Đà Nẵng',
            totalCalls: 4520,
            answered: 3780,
            durationMinutes: 21900,
            asr: 83.6,
            ner: 91.8,
            intraCalls: 3120,
            outboundCalls: 750,
            inboundCalls: 650,
            mosAvg: 4.18,
            mosGoodPercent: 88.5,
            lossAvg: 0.45,
            jitterAvg: 7.8,
            rttAvg: 31.0,
            sip503: 12,
            sip408: 9,
            sip486: 460,
            sip487: 259
        },
        {
            date: '2026-05-14',
            orgId: '42', groupId: '42',
            orgName: 'Khối CNTT Cơ quan Tập đoàn',
            totalCalls: 5120,
            answered: 4350,
            durationMinutes: 26800,
            asr: 85.0,
            ner: 93.2,
            intraCalls: 3580,
            outboundCalls: 840,
            inboundCalls: 700,
            mosAvg: 4.31,
            mosGoodPercent: 93.4,
            lossAvg: 0.28,
            jitterAvg: 5.5,
            rttAvg: 25.2,
            sip503: 6,
            sip408: 4,
            sip486: 510,
            sip487: 250
        },
        {
            date: '2026-05-15',
            orgId: '45', groupId: '45',
            orgName: 'Điện lực Đà Nẵng',
            totalCalls: 3980,
            answered: 3260,
            durationMinutes: 19100,
            asr: 81.9,
            ner: 90.7,
            intraCalls: 2710,
            outboundCalls: 690,
            inboundCalls: 580,
            mosAvg: 4.12,
            mosGoodPercent: 86.8,
            lossAvg: 0.52,
            jitterAvg: 8.9,
            rttAvg: 34.6,
            sip503: 15,
            sip408: 11,
            sip486: 434,
            sip487: 260
        },
        {
            date: '2026-05-16',
            orgId: '62', groupId: '62',
            orgName: 'Tổng công ty EVN SPC',
            totalCalls: 4890,
            answered: 3990,
            durationMinutes: 24200,
            asr: 81.6,
            ner: 90.1,
            intraCalls: 3340,
            outboundCalls: 830,
            inboundCalls: 720,
            mosAvg: 4.09,
            mosGoodPercent: 85.2,
            lossAvg: 0.61,
            jitterAvg: 9.4,
            rttAvg: 37.1,
            sip503: 19,
            sip408: 14,
            sip486: 527,
            sip487: 340
        },
        {
            date: '2026-05-17',
            orgId: '51', groupId: '51',
            orgName: 'EVNICT Đà Nẵng',
            totalCalls: 1240,
            answered: 1020,
            durationMinutes: 5850,
            asr: 82.3,
            ner: 91.5,
            intraCalls: 880,
            outboundCalls: 190,
            inboundCalls: 170,
            mosAvg: 4.22,
            mosGoodPercent: 90.0,
            lossAvg: 0.38,
            jitterAvg: 6.8,
            rttAvg: 29.8,
            sip503: 2,
            sip408: 2,
            sip486: 126,
            sip487: 90
        },
        {
            date: '2026-05-18',
            orgId: '96', groupId: '96',
            orgName: 'Ban Viễn thông & CNTT EVN',
            totalCalls: 990,
            answered: 820,
            durationMinutes: 4900,
            asr: 82.8,
            ner: 92.0,
            intraCalls: 710,
            outboundCalls: 150,
            inboundCalls: 130,
            mosAvg: 4.26,
            mosGoodPercent: 91.5,
            lossAvg: 0.31,
            jitterAvg: 5.9,
            rttAvg: 27.4,
            sip503: 1,
            sip408: 1,
            sip486: 98,
            sip487: 70
        }
    ];

    // DOM Elements
    const elements = {
        btnRoleAdmin: document.getElementById('btnRoleAdmin'),
        btnRoleGroup: document.getElementById('btnRoleGroup'),
        reportFilterForm: document.getElementById('reportFilterForm'),
        reportTypeSelect: document.getElementById('reportType'),
        dateRangeSelect: document.getElementById('dateRange'),
        customDateContainer: document.getElementById('customDateContainer'),
        fromDateInput: document.getElementById('fromDate'),
        toDateInput: document.getElementById('toDate'),
        organizationSelect: document.getElementById('organization'),
        orgLockNotice: document.getElementById('orgLockNotice'),
        
        // KPI elements
        kpiTotalCalls: document.getElementById('kpiTotalCalls'),
        kpiTotalCallsTrend: document.getElementById('kpiTotalCallsTrend'),
        kpiTotalDuration: document.getElementById('kpiTotalDuration'),
        kpiTotalDurationTrend: document.getElementById('kpiTotalDurationTrend'),
        kpiAsr: document.getElementById('kpiAsr'),
        kpiNer: document.getElementById('kpiNer'),
        kpiDynamicIcon: document.getElementById('kpiDynamicIcon'),
        kpiDynamicTitle: document.getElementById('kpiDynamicTitle'),
        kpiDynamicValue: document.getElementById('kpiDynamicValue'),
        kpiDynamicTrend: document.getElementById('kpiDynamicTrend'),

        // Chart elements
        volumeChartTitle: document.getElementById('volumeChartTitle'),
        branchChartTitle: document.getElementById('branchChartTitle'),
        volumeChartCanvas: document.getElementById('volumeChart'),
        branchChartCanvas: document.getElementById('branchChart'),
        branchLegend: document.getElementById('branchLegend'),

        // Table elements
        tableCardTitle: document.getElementById('tableCardTitle'),
        recordCountBadge: document.getElementById('recordCountBadge'),
        reportTableHeader: document.getElementById('reportTableHeader'),
        reportTableBody: document.getElementById('reportTableBody'),
        paginationSummary: document.getElementById('paginationSummary'),

        // Export & feedback
        btnExportPdf: document.getElementById('btnExportPdf'),
        btnExportExcel: document.getElementById('btnExportExcel'),
        toastContainer: document.getElementById('reportToastContainer')
    };

    // Configure Chart.js global theme defaults
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#64748b';
        Chart.defaults.font.family = "'Inter', sans-serif";
    }

    /**
     * Toast notification utility
     */
    function showToast(message, type = 'success', duration = 3500) {
        if (!elements.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `report-toast ${type === 'error' ? 'error' : ''}`;
        
        const iconSvg = type === 'error'
            ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" class="report-toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
            : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" class="report-toast-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

        toast.innerHTML = `
            ${iconSvg}
            <div style="flex: 1;">${message}</div>
            <button style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0 4px;" onclick="this.parentElement.remove()">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * Filter data based on current state (Group-Based Data Isolation & Range)
     */
    function getFilteredData() {
        let data = [...rawDailyData];

        // Apply group isolation if in group role, or org filter if in admin role
        if (state.currentRole === 'group') {
            data = data.filter(item => item.orgId === state.userGroupOrg);
        } else if (state.organization !== 'all') {
            data = data.filter(item => item.orgId === state.organization);
        }

        return data;
    }

    /**
     * Format number helper
     */
    function formatNum(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    /**
     * Update KPI Cards based on current report type and filtered data
     */
    function updateKPICards(data) {
        if (!data || data.length === 0) return;

        const totalCalls = data.reduce((acc, cur) => acc + cur.totalCalls, 0);
        const totalAnswered = data.reduce((acc, cur) => acc + cur.answered, 0);
        const totalDuration = data.reduce((acc, cur) => acc + cur.durationMinutes, 0);
        const asrAvg = ((totalAnswered / totalCalls) * 100).toFixed(1);

        const totalFailures = data.reduce((acc, cur) => acc + (cur.sip503 + cur.sip408), 0);
        const totalBusyCancel = data.reduce((acc, cur) => acc + (cur.sip486 + cur.sip487), 0);
        const nerAvg = (((totalAnswered + totalBusyCancel) / totalCalls) * 100).toFixed(1);

        const mosWeighted = (data.reduce((acc, cur) => acc + (cur.mosAvg * cur.totalCalls), 0) / totalCalls).toFixed(2);
        const lossWeighted = (data.reduce((acc, cur) => acc + (cur.lossAvg * cur.totalCalls), 0) / totalCalls).toFixed(2);
        const totalIntra = data.reduce((acc, cur) => acc + cur.intraCalls, 0);
        const intraRatio = ((totalIntra / totalCalls) * 100).toFixed(1);

        elements.kpiTotalCalls.textContent = formatNum(totalCalls);
        elements.kpiTotalCallsTrend.textContent = state.currentRole === 'group' ? 'cuộc gọi nội bộ nhóm' : 'toàn mạng PABX EVN';

        elements.kpiTotalDuration.textContent = formatNum(totalDuration);
        elements.kpiTotalDurationTrend.textContent = `~${formatNum(Math.round(totalDuration / 60))} giờ đàm thoại`;

        elements.kpiAsr.textContent = `${asrAvg}%`;
        elements.kpiNer.textContent = `NER: ${nerAvg}% (Hiệu năng mạng)`;

        // Dynamic 4th card based on report type
        switch (state.reportType) {
            case 'general':
                elements.kpiDynamicIcon.style.background = 'rgba(16, 185, 129, 0.12)';
                elements.kpiDynamicIcon.style.color = '#059669';
                elements.kpiDynamicTitle.textContent = 'Chất lượng QoS (MOS TB)';
                elements.kpiDynamicValue.textContent = mosWeighted;
                elements.kpiDynamicTrend.textContent = 'Chuẩn ITU-T G.107 (Tốt)';
                break;
            case 'traffic':
                elements.kpiDynamicIcon.style.background = 'rgba(59, 130, 246, 0.12)';
                elements.kpiDynamicIcon.style.color = '#2563eb';
                elements.kpiDynamicTitle.textContent = 'Tỷ trọng Gọi Nội bộ';
                elements.kpiDynamicValue.textContent = `${intraRatio}%`;
                elements.kpiDynamicTrend.textContent = 'Tiết kiệm chi phí ngoại mạng';
                break;
            case 'quality':
                elements.kpiDynamicIcon.style.background = 'rgba(245, 158, 11, 0.12)';
                elements.kpiDynamicIcon.style.color = '#d97706';
                elements.kpiDynamicTitle.textContent = 'Mất gói TB (Packet Loss)';
                elements.kpiDynamicValue.textContent = `${lossWeighted}%`;
                elements.kpiDynamicTrend.textContent = 'Đạt ngưỡng cho phép (< 1.0%)';
                break;
            case 'failure':
                elements.kpiDynamicIcon.style.background = 'rgba(239, 68, 68, 0.12)';
                elements.kpiDynamicIcon.style.color = '#dc2626';
                elements.kpiDynamicTitle.textContent = 'Sự cố Hạ tầng SIP';
                elements.kpiDynamicValue.textContent = `${totalFailures} lỗi`;
                elements.kpiDynamicTrend.textContent = `Chiếm ${((totalFailures / totalCalls) * 100).toFixed(2)}% (Mã 503 & 408)`;
                break;
        }
    }

    /**
     * Render Charts according to selected report type
     */
    function renderCharts(data) {
        if (typeof Chart === 'undefined') return;

        // Destroy previous instances to prevent canvas flickering
        if (volumeChartInstance) {
            volumeChartInstance.destroy();
        }
        if (branchChartInstance) {
            branchChartInstance.destroy();
        }

        const labels = data.map(d => d.date.split('-').slice(1).join('/'));

        // Chart 1: Volume / Performance Chart
        const ctxVol = elements.volumeChartCanvas.getContext('2d');
        let volChartConfig = null;

        // Chart 2: Distribution Chart
        const ctxBranch = elements.branchChartCanvas.getContext('2d');
        let branchChartConfig = null;

        if (state.reportType === 'general') {
            elements.volumeChartTitle.textContent = 'Biểu đồ Lưu Lượng Cuộc Gọi & Tỷ Lệ Trả Lời ASR';
            elements.branchChartTitle.textContent = state.currentRole === 'group' ? 'Cơ Cấu Kết Nối Nhóm' : 'Tỷ Trọng Lưu Lượng Giữa Các Đơn Vị';

            volChartConfig = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Thành công (200 OK)',
                            data: data.map(d => d.answered),
                            backgroundColor: '#3b82f6',
                            borderRadius: 4
                        },
                        {
                            label: 'Bận / Không trả lời / Lỗi',
                            data: data.map(d => d.totalCalls - d.answered),
                            backgroundColor: '#ef4444',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true, grid: { display: false } },
                        y: { stacked: true, grid: { color: 'rgba(0,0,0,0.05)' } }
                    }
                }
            };

            const branchLabels = ['Ban VT&CNTT (96)', 'EVNICT Đà Nẵng (51)', 'Khối CNTT (42)', 'ĐL Đà Nẵng (45)', 'EVN SPC (62)'];
            const branchData = [32, 28, 20, 12, 8];
            const branchColors = ['#0033a0', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

            branchChartConfig = {
                type: 'doughnut',
                data: {
                    labels: branchLabels,
                    datasets: [{
                        data: branchData,
                        backgroundColor: branchColors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { display: false } }
                }
            };
            buildCustomLegend(branchLabels, branchData, branchColors, '%');

        } else if (state.reportType === 'traffic') {
            elements.volumeChartTitle.textContent = 'Biểu đồ Lưu Lượng 3 Hướng Gọi (Nội bộ / Gọi đi / Gọi đến)';
            elements.branchChartTitle.textContent = 'Cơ Cấu Tỷ Lệ 3 Hướng Cuộc Gọi';

            volChartConfig = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Nội bộ đơn vị (Intra)',
                            data: data.map(d => d.intraCalls),
                            backgroundColor: '#3b82f6',
                            borderRadius: 4
                        },
                        {
                            label: 'Gọi đi ngoại đơn vị',
                            data: data.map(d => d.outboundCalls),
                            backgroundColor: '#8b5cf6',
                            borderRadius: 4
                        },
                        {
                            label: 'Gọi đến từ ngoại đơn vị',
                            data: data.map(d => d.inboundCalls),
                            backgroundColor: '#10b981',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true, grid: { display: false } },
                        y: { stacked: true, grid: { color: 'rgba(0,0,0,0.05)' } }
                    }
                }
            };

            const totalIntra = data.reduce((a, b) => a + b.intraCalls, 0);
            const totalOutbound = data.reduce((a, b) => a + b.outboundCalls, 0);
            const totalInbound = data.reduce((a, b) => a + b.inboundCalls, 0);
            const total = totalIntra + totalOutbound + totalInbound;

            const tLabels = ['Nội bộ đơn vị', 'Gọi đi ngoại đơn vị', 'Gọi đến ngoại đơn vị'];
            const tData = [
                Math.round((totalIntra / total) * 100),
                Math.round((totalOutbound / total) * 100),
                Math.round((totalInbound / total) * 100)
            ];
            const tColors = ['#3b82f6', '#8b5cf6', '#10b981'];

            branchChartConfig = {
                type: 'doughnut',
                data: {
                    labels: tLabels,
                    datasets: [{
                        data: tData,
                        backgroundColor: tColors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { display: false } }
                }
            };
            buildCustomLegend(tLabels, tData, tColors, '%');

        } else if (state.reportType === 'quality') {
            elements.volumeChartTitle.textContent = 'Biểu đồ Xu Hướng Điểm MOS & Tỷ Lệ Mất Gói (Packet Loss)';
            elements.branchChartTitle.textContent = 'Phân Bố Chất Lượng Thoại (Dải Điểm MOS)';

            volChartConfig = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Điểm MOS TB (Thang 1-5)',
                            data: data.map(d => d.mosAvg),
                            borderColor: '#059669',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.3,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Mất gói Packet Loss (%)',
                            data: data.map(d => d.lossAvg),
                            borderColor: '#dc2626',
                            borderDash: [5, 5],
                            tension: 0.3,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            min: 3.0,
                            max: 5.0,
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            min: 0,
                            max: 2.0,
                            grid: { drawOnChartArea: false }
                        }
                    }
                }
            };

            const qLabels = ['Tốt (MOS ≥ 4.0)', 'Trung bình (3.0 - 3.9)', 'Kém (MOS < 3.0)'];
            const qData = [88, 10, 2];
            const qColors = ['#10b981', '#f59e0b', '#ef4444'];

            branchChartConfig = {
                type: 'doughnut',
                data: {
                    labels: qLabels,
                    datasets: [{
                        data: qData,
                        backgroundColor: qColors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { display: false } }
                }
            };
            buildCustomLegend(qLabels, qData, qColors, '%');

        } else if (state.reportType === 'failure') {
            elements.volumeChartTitle.textContent = 'Biểu đồ Phân Bố Sự Cố & Mã Lỗi SIP Theo Ngày';
            elements.branchChartTitle.textContent = 'Tỷ Trọng Nguyên Nhân Sự Cố SIP';

            volChartConfig = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'SIP 503 (Unavailable)',
                            data: data.map(d => d.sip503),
                            backgroundColor: '#dc2626',
                            borderRadius: 4
                        },
                        {
                            label: 'SIP 408 (Timeout)',
                            data: data.map(d => d.sip408),
                            backgroundColor: '#ea580c',
                            borderRadius: 4
                        },
                        {
                            label: 'SIP 486 (Busy)',
                            data: data.map(d => d.sip486),
                            backgroundColor: '#f59e0b',
                            borderRadius: 4
                        },
                        {
                            label: 'SIP 487 (Terminated)',
                            data: data.map(d => d.sip487),
                            backgroundColor: '#64748b',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true, grid: { display: false } },
                        y: { stacked: true, grid: { color: 'rgba(0,0,0,0.05)' } }
                    }
                }
            };

            const total503 = data.reduce((a, b) => a + b.sip503, 0);
            const total408 = data.reduce((a, b) => a + b.sip408, 0);
            const total486 = data.reduce((a, b) => a + b.sip486, 0);
            const total487 = data.reduce((a, b) => a + b.sip487, 0);
            const totalSIP = total503 + total408 + total486 + total487;

            const fLabels = ['Lỗi hạ tầng SIP (503/408)', 'Người dùng máy bận (486)', 'Hủy trước khi nghe (487)'];
            const fData = [
                Math.round(((total503 + total408) / totalSIP) * 100),
                Math.round((total486 / totalSIP) * 100),
                Math.round((total487 / totalSIP) * 100)
            ];
            const fColors = ['#dc2626', '#f59e0b', '#64748b'];

            branchChartConfig = {
                type: 'doughnut',
                data: {
                    labels: fLabels,
                    datasets: [{
                        data: fData,
                        backgroundColor: fColors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { display: false } }
                }
            };
            buildCustomLegend(fLabels, fData, fColors, '%');
        }

        if (volChartConfig) {
            volumeChartInstance = new Chart(ctxVol, volChartConfig);
        }
        if (branchChartConfig) {
            branchChartInstance = new Chart(ctxBranch, branchChartConfig);
        }
    }

    /**
     * Helper to render custom HTML legend for Doughnut chart
     */
    function buildCustomLegend(labels, data, colors, unit = '%') {
        if (!elements.branchLegend) return;
        let html = '';
        labels.forEach((label, idx) => {
            html += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${colors[idx]}"></div>
                    <span>${label} (${data[idx]}${unit})</span>
                </div>
            `;
        });
        elements.branchLegend.innerHTML = html;
    }

    /**
     * Render Table Headers and Body based on selected report type
     */
    function renderTable(data) {
        if (!elements.reportTableHeader || !elements.reportTableBody) return;

        let theadHtml = '';
        let tbodyHtml = '';

        if (state.reportType === 'general') {
            theadHtml = `
                <tr>
                    <th>Ngày / Thời gian</th>
                    <th>Đơn vị thành viên</th>
                    <th class="num">Tổng gọi</th>
                    <th class="num">Thành công (200)</th>
                    <th class="num">Thời lượng (phút)</th>
                    <th class="num">ASR (%)</th>
                    <th class="num">NER (%)</th>
                    <th style="text-align: center;">Điểm MOS TB</th>
                </tr>
            `;

            tbodyHtml = data.map(d => {
                const mosClass = d.mosAvg >= 4.0 ? 'mos-good' : (d.mosAvg >= 3.0 ? 'mos-fair' : 'mos-poor');
                return `
                    <tr>
                        <td><strong>${d.date}</strong></td>
                        <td>${d.orgName}</td>
                        <td class="num">${formatNum(d.totalCalls)}</td>
                        <td class="num" style="color: #059669; font-weight: 600;">${formatNum(d.answered)}</td>
                        <td class="num">${formatNum(d.durationMinutes)}</td>
                        <td class="num"><strong>${d.asr}%</strong></td>
                        <td class="num">${d.ner}%</td>
                        <td style="text-align: center;">
                            <span class="badge-mos ${mosClass}">${d.mosAvg}</span>
                        </td>
                    </tr>
                `;
            }).join('');

        } else if (state.reportType === 'traffic') {
            theadHtml = `
                <tr>
                    <th>Ngày / Thời gian</th>
                    <th>Đơn vị thành viên</th>
                    <th class="num">Tổng gọi</th>
                    <th class="num">Nội bộ (Intra)</th>
                    <th class="num">Đi ngoại đơn vị</th>
                    <th class="num">Đến ngoại đơn vị</th>
                    <th class="num">Thời lượng (phút)</th>
                    <th class="num">Tỷ trọng nội bộ</th>
                </tr>
            `;

            tbodyHtml = data.map(d => {
                const ratio = ((d.intraCalls / d.totalCalls) * 100).toFixed(1);
                return `
                    <tr>
                        <td><strong>${d.date}</strong></td>
                        <td>${d.orgName}</td>
                        <td class="num">${formatNum(d.totalCalls)}</td>
                        <td class="num" style="color: #2563eb; font-weight: 600;">${formatNum(d.intraCalls)}</td>
                        <td class="num" style="color: #7c3aed;">${formatNum(d.outboundCalls)}</td>
                        <td class="num" style="color: #059669;">${formatNum(d.inboundCalls)}</td>
                        <td class="num">${formatNum(d.durationMinutes)}</td>
                        <td class="num"><strong>${ratio}%</strong></td>
                    </tr>
                `;
            }).join('');

        } else if (state.reportType === 'quality') {
            theadHtml = `
                <tr>
                    <th>Ngày / Thời gian</th>
                    <th>Đơn vị thành viên</th>
                    <th class="num">Tổng gọi</th>
                    <th style="text-align: center;">Điểm MOS TB</th>
                    <th class="num">Tỷ lệ Tốt (≥4.0)</th>
                    <th class="num">Mất gói TB (%)</th>
                    <th class="num">Jitter TB (ms)</th>
                    <th class="num">RTT TB (ms)</th>
                </tr>
            `;

            tbodyHtml = data.map(d => {
                const mosClass = d.mosAvg >= 4.0 ? 'mos-good' : (d.mosAvg >= 3.0 ? 'mos-fair' : 'mos-poor');
                const lossClass = d.lossAvg < 0.5 ? 'style="color: #059669;"' : 'style="color: #d97706;"';
                return `
                    <tr>
                        <td><strong>${d.date}</strong></td>
                        <td>${d.orgName}</td>
                        <td class="num">${formatNum(d.totalCalls)}</td>
                        <td style="text-align: center;">
                            <span class="badge-mos ${mosClass}">${d.mosAvg}</span>
                        </td>
                        <td class="num">${d.mosGoodPercent}%</td>
                        <td class="num" ${lossClass}><strong>${d.lossAvg}%</strong></td>
                        <td class="num">${d.jitterAvg} ms</td>
                        <td class="num">${d.rttAvg} ms</td>
                    </tr>
                `;
            }).join('');

        } else if (state.reportType === 'failure') {
            theadHtml = `
                <tr>
                    <th>Ngày / Thời gian</th>
                    <th>Đơn vị thành viên</th>
                    <th class="num">Tổng sự cố</th>
                    <th class="num">SIP 503</th>
                    <th class="num">SIP 408</th>
                    <th class="num">SIP 486</th>
                    <th class="num">SIP 487</th>
                    <th class="num">Tỷ lệ lỗi hạ tầng</th>
                </tr>
            `;

            tbodyHtml = data.map(d => {
                const totalFailures = d.sip503 + d.sip408 + d.sip486 + d.sip487;
                const infraRatio = (((d.sip503 + d.sip408) / totalFailures) * 100).toFixed(1);
                return `
                    <tr>
                        <td><strong>${d.date}</strong></td>
                        <td>${d.orgName}</td>
                        <td class="num"><strong>${formatNum(totalFailures)}</strong></td>
                        <td class="num"><span class="badge-sip badge-sip-503">${d.sip503}</span></td>
                        <td class="num"><span class="badge-sip badge-sip-408">${d.sip408}</span></td>
                        <td class="num"><span class="badge-sip badge-sip-486">${d.sip486}</span></td>
                        <td class="num"><span class="badge-sip badge-sip-487">${d.sip487}</span></td>
                        <td class="num" style="color: #dc2626; font-weight: 600;">${infraRatio}%</td>
                    </tr>
                `;
            }).join('');
        }

        elements.reportTableHeader.innerHTML = theadHtml;
        elements.reportTableBody.innerHTML = tbodyHtml;
        elements.recordCountBadge.textContent = `Hiển thị ${data.length} kỳ thống kê`;
        elements.paginationSummary.textContent = `dòng mỗi trang (Tổng số: ${data.length} dòng thống kê)`;
    }

    /**
     * Master render pipeline
     */
    function refreshView() {
        const filteredData = getFilteredData();
        updateKPICards(filteredData);
        renderCharts(filteredData);
        renderTable(filteredData);
    }

    /**
     * Set Role (Admin vs Group-Based Data Isolation Demo)
     */
    function setRole(role) {
        state.currentRole = role;

        if (role === 'group') {
            elements.btnRoleAdmin.classList.remove('active');
            elements.btnRoleGroup.classList.add('active');

            // Lock organization to user's assigned group
            elements.organizationSelect.value = state.userGroupOrg;
            elements.organizationSelect.disabled = true;
            elements.orgLockNotice.style.display = 'flex';

            showToast(`Đã chuyển vai trò: Quản trị nhóm (${state.userGroupName}). Khóa phạm vi dữ liệu theo Group-Based Data Isolation.`);
        } else {
            elements.btnRoleGroup.classList.remove('active');
            elements.btnRoleAdmin.classList.add('active');

            // Unlock organization dropdown for system admin
            elements.organizationSelect.disabled = false;
            elements.orgLockNotice.style.display = 'none';

            showToast('Đã chuyển vai trò: Quản trị viên Hệ thống (Toàn quyền tra cứu & xuất báo cáo toàn EVN).');
        }

        refreshView();
    }

    /**
     * Setup Event Listeners
     */
    function setupEventListeners() {
        // Report Type changes
        elements.reportTypeSelect?.addEventListener('change', (e) => {
            state.reportType = e.target.value;
            refreshView();
            showToast(`Đã chuyển loại báo cáo: ${e.target.options[e.target.selectedIndex].text}`);
        });

        // Date Range changes (toggle custom date inputs)
        elements.dateRangeSelect?.addEventListener('change', (e) => {
            state.dateRange = e.target.value;
            if (state.dateRange === 'custom') {
                elements.customDateContainer.style.display = 'grid';
            } else {
                elements.customDateContainer.style.display = 'none';
            }
        });

        // Filter Form Submit
        elements.reportFilterForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            state.reportType = elements.reportTypeSelect.value;
            state.dateRange = elements.dateRangeSelect.value;
            if (state.currentRole === 'admin') {
                state.organization = elements.organizationSelect.value;
            }

            refreshView();
            showToast('Đã lọc và cập nhật dữ liệu báo cáo tức thì (Zero CDR Scan).');
        });

        // Export Excel Action
        elements.btnExportExcel?.addEventListener('click', () => {
            handleExport('excel');
        });

        // Export PDF Action
        elements.btnExportPdf?.addEventListener('click', () => {
            handleExport('pdf');
        });
    }

    /**
     * Handle Export Simulation with realistic filename and zero-scan speed
     */
    function handleExport(format) {
        const btn = format === 'excel' ? elements.btnExportExcel : elements.btnExportPdf;
        const orgLabel = state.currentRole === 'group'
            ? 'EVNICT_DaNang'
            : (state.organization === 'all' ? 'ToanTapDoanEVN' : `DonVi_${state.organization}`);
        const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const ext = format === 'excel' ? 'xlsx' : 'pdf';
        const filename = `BaoCao_${state.reportType.toUpperCase()}_${orgLabel}_${dateStamp}.${ext}`;

        // Add loading state
        btn.classList.add('btn-loading');

        setTimeout(() => {
            btn.classList.remove('btn-loading');

            // Generate mock file download
            const blobContent = `BÁO CÁO VIỄN THÔNG EVN CDRAS\nLoại báo cáo: ${state.reportType}\nĐơn vị: ${orgLabel}\nThời gian: ${dateStamp}\nCơ chế: Zero CDR Scan từ stats_daily`;
            const blob = new Blob([blobContent], { type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast(`Xuất file ${format.toUpperCase()} thành công: <strong>${filename}</strong> (Tốc độ: 410ms - Zero CDR Scan)`);
        }, 600);
    }

    // Initialize application
    setupEventListeners();
    refreshView();
});
