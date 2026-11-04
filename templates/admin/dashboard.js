document.addEventListener('DOMContentLoaded', () => {
    // Initialize Charts
    let quantityChartInstance = null;
    let qualityChartInstance = null;

    const initCharts = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const primaryColor = rootStyles.getPropertyValue('--primary').trim() || '#0056b3';
        const secondaryColor = rootStyles.getPropertyValue('--secondary').trim() || '#dc3545';
        const accentColor = rootStyles.getPropertyValue('--accent').trim() || '#ffc107';
        const textColor = rootStyles.getPropertyValue('--text-main').trim() || '#333333';
        const gridColor = rootStyles.getPropertyValue('--border').trim() || '#e5e7eb';

        if (quantityChartInstance) quantityChartInstance.destroy();
        if (qualityChartInstance) qualityChartInstance.destroy();

        // 1. Quantity Chart (Tổng số cuộc gọi & Thời lượng)
        const ctxQuantity = document.getElementById('quantityChart');
        if (ctxQuantity) {
            quantityChartInstance = new Chart(ctxQuantity, {
                type: 'bar',
                data: {
                    labels: ['01/05', '02/05', '03/05', '04/05', '05/05', '06/05', '07/05'],
                    datasets: [
                        {
                            label: 'Tổng Cuộc Gọi',
                            data: [1200, 1900, 1500, 2200, 1800, 2500, 2100],
                            backgroundColor: primaryColor,
                            yAxisID: 'y',
                            borderRadius: 4
                        },
                        {
                            label: 'Thời Lượng (Phút)',
                            data: [3500, 5200, 4100, 6800, 5500, 7800, 6200],
                            type: 'line',
                            borderColor: accentColor,
                            backgroundColor: accentColor,
                            borderWidth: 2,
                            tension: 0.3,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            labels: { color: textColor }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: gridColor },
                            ticks: { color: textColor }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: { color: gridColor },
                            ticks: { color: textColor },
                            title: { display: true, text: 'Số Cuộc Gọi', color: textColor }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: { color: textColor },
                            title: { display: true, text: 'Thời Lượng', color: textColor }
                        }
                    }
                }
            });
        }

        // 2. Quality Chart (ASR & MOS)
        const ctxQuality = document.getElementById('qualityChart');
        if (ctxQuality) {
            qualityChartInstance = new Chart(ctxQuality, {
                type: 'line',
                data: {
                    labels: ['01/05', '02/05', '03/05', '04/05', '05/05', '06/05', '07/05'],
                    datasets: [
                        {
                            label: 'Tỉ lệ ASR (%)',
                            data: [65, 68, 64, 70, 72, 69, 75],
                            borderColor: secondaryColor,
                            backgroundColor: secondaryColor,
                            borderWidth: 2,
                            tension: 0.3,
                            yAxisID: 'y',
                            fill: false
                        },
                        {
                            label: 'Điểm MOS (x10)',
                            data: [41, 42, 40, 43, 44, 42, 45],
                            borderColor: '#10b981',
                            backgroundColor: '#10b981',
                            borderWidth: 2,
                            tension: 0.3,
                            yAxisID: 'y1',
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            labels: { color: textColor }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: gridColor },
                            ticks: { color: textColor }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: { color: gridColor },
                            ticks: { color: textColor },
                            title: { display: true, text: 'Tỉ Lệ %', color: textColor }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: { color: textColor },
                            title: { display: true, text: 'MOS', color: textColor }
                        }
                    }
                }
            });
        }
    };

    // Initialize charts on load
    initCharts();

    // Listen for theme changes to re-render charts with new colors
    const handleThemeChanged = () => {
        setTimeout(() => {
            initCharts();
        }, 120);
    };

    window.addEventListener('theme-changed', handleThemeChanged);
    document.getElementById('themeToggle')?.addEventListener('click', handleThemeChanged);

    // Resize charts on window resize or sidebar toggle
    window.addEventListener('resize', () => {
        if (quantityChartInstance) {
            setTimeout(() => quantityChartInstance.resize(), 60);
        }
        if (qualityChartInstance) {
            setTimeout(() => qualityChartInstance.resize(), 60);
        }
    });

    // Đồng bộ số liệu Kho số PABX EVN từ LocalStorage
    const updateDashboardPrefixKPI = () => {
        const totalCapacity = 90000;
        let activeNumbers = 9300;
        let suspendedNumbers = 900;

        try {
            const stored = localStorage.getItem('evn_cdr_prefix_groups');
            if (stored) {
                const groups = JSON.parse(stored);
                activeNumbers = 0;
                suspendedNumbers = 0;
                groups.forEach(g => {
                    const count = (g.ranges || []).reduce((sum, r) => sum + r.count, 0);
                    if (g.status === 'Đang dùng') activeNumbers += count;
                    else if (g.status === 'Tạm ngưng') suspendedNumbers += count;
                });
            }
        } catch (e) {}

        const freeNumbers = totalCapacity - activeNumbers - suspendedNumbers;
        const activePct = ((activeNumbers / totalCapacity) * 100).toFixed(1);
        const suspendedPct = ((suspendedNumbers / totalCapacity) * 100).toFixed(1);
        const freePct = ((freeNumbers / totalCapacity) * 100).toFixed(1);

        const elTotal = document.getElementById('kpiTotal');
        const elActive = document.getElementById('kpiActive');
        const elSuspended = document.getElementById('kpiSuspended');
        const elFree = document.getElementById('kpiFree');

        if (elTotal) elTotal.innerText = totalCapacity.toLocaleString('vi-VN');
        if (elActive) elActive.innerText = activeNumbers.toLocaleString('vi-VN');
        if (elSuspended) elSuspended.innerText = suspendedNumbers.toLocaleString('vi-VN');
        if (elFree) elFree.innerText = freeNumbers.toLocaleString('vi-VN');

        const elActPct = document.getElementById('kpiActivePercent');
        const elSuspPct = document.getElementById('kpiSuspendedPercent');
        if (elActPct) elActPct.innerText = `${activePct}% tổng kho`;
        if (elSuspPct) elSuspPct.innerText = `${suspendedPct}% tổng kho`;

        const barActive = document.getElementById('poolBarActive');
        const barSuspended = document.getElementById('poolBarSuspended');
        const barFree = document.getElementById('poolBarFree');
        if (barActive) barActive.style.width = `${activePct}%`;
        if (barSuspended) barSuspended.style.width = `${suspendedPct}%`;
        if (barFree) barFree.style.width = `${freePct}%`;

        const txtAct = document.getElementById('barActiveText');
        const txtSusp = document.getElementById('barSuspendedText');
        const txtFree = document.getElementById('barFreeText');
        if (txtAct) txtAct.innerText = `${activePct}%`;
        if (txtSusp) txtSusp.innerText = `${suspendedPct}%`;
        if (txtFree) txtFree.innerText = `${freePct}%`;
    };

    updateDashboardPrefixKPI();

    // Event listeners cho các bộ lọc biểu đồ
    document.getElementById('quantityFilter')?.addEventListener('change', (e) => {
        const val = e.target.value;
        if (!quantityChartInstance) return;

        if (val === 'day') {
            quantityChartInstance.data.labels = ['12/05', '13/05', '14/05', '15/05', '16/05', '17/05', '18/05'];
            quantityChartInstance.data.datasets[0].data = [3820, 4520, 5120, 3980, 4890, 1240, 990];
            quantityChartInstance.data.datasets[1].data = [18450, 21900, 26800, 19100, 24200, 5850, 4900];
        } else if (val === 'month') {
            quantityChartInstance.data.labels = ['T1', 'T2', 'T3', 'T4', 'T5'];
            quantityChartInstance.data.datasets[0].data = [98000, 105000, 112000, 108000, 124500];
            quantityChartInstance.data.datasets[1].data = [480000, 520000, 560000, 530000, 610000];
        } else if (val === 'year') {
            quantityChartInstance.data.labels = ['2024', '2025', '2026 (YTD)'];
            quantityChartInstance.data.datasets[0].data = [1150000, 1280000, 547500];
            quantityChartInstance.data.datasets[1].data = [5600000, 6200000, 2700000];
        } else if (val === 'subscriber') {
            quantityChartInstance.data.labels = ['Khối CNTT', 'Ban VT&CNTT', 'EVNICT ĐN', 'ĐL Đà Nẵng', 'EVN SPC'];
            quantityChartInstance.data.datasets[0].data = [5120, 3820, 4520, 3980, 4890];
            quantityChartInstance.data.datasets[1].data = [26800, 18450, 21900, 19100, 24200];
        }
        quantityChartInstance.update();
    });

    document.getElementById('qualityFilter')?.addEventListener('change', (e) => {
        const val = e.target.value;
        if (!qualityChartInstance) return;

        if (val === 'system') {
            qualityChartInstance.data.labels = ['12/05', '13/05', '14/05', '15/05', '16/05', '17/05', '18/05'];
            qualityChartInstance.data.datasets[0].data = [84.0, 83.6, 85.0, 81.9, 81.6, 82.3, 82.8];
            qualityChartInstance.data.datasets[1].data = [42.5, 41.8, 43.1, 41.2, 40.9, 42.2, 42.6];
        } else if (val === 'prefix') {
            qualityChartInstance.data.labels = ['42xxx (CNTT)', '96xxx (Ban VT)', '51xxx (EVNICT)', '45xxx (ĐL ĐN)', '62xxx (SPC)'];
            qualityChartInstance.data.datasets[0].data = [85.0, 84.0, 83.6, 81.9, 81.6];
            qualityChartInstance.data.datasets[1].data = [43.1, 42.5, 41.8, 41.2, 40.9];
        }
        qualityChartInstance.update();
    });
});

