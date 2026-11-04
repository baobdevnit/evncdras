/**
 * EVN CDR AS - Bảng điều khiển Thành viên Đơn vị (Member Dashboard)
 * Scope: Group-Based Data Isolation (EVNICT Đà Nẵng - Đầu số 51xxx)
 */

document.addEventListener('DOMContentLoaded', () => {
    let unitTrafficChartInstance = null;
    let unitQualityChartInstance = null;

    /**
     * Khởi tạo các biểu đồ phân tích đơn vị
     */
    const initMemberCharts = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const primaryColor = rootStyles.getPropertyValue('--primary').trim() || '#0056b3';
        const textColor = rootStyles.getPropertyValue('--text-main').trim() || '#333333';
        const textMuted = rootStyles.getPropertyValue('--text-muted').trim() || '#64748b';
        const gridColor = rootStyles.getPropertyValue('--border').trim() || '#e5e7eb';

        if (unitTrafficChartInstance) unitTrafficChartInstance.destroy();
        if (unitQualityChartInstance) unitQualityChartInstance.destroy();

        // 1. Biểu đồ Lưu lượng 3 Hướng Gọi của Đơn vị (Stacked Bar)
        const ctxTraffic = document.getElementById('unitTrafficChart');
        if (ctxTraffic) {
            unitTrafficChartInstance = new Chart(ctxTraffic, {
                type: 'bar',
                data: {
                    labels: ['12/05', '13/05', '14/05', '15/05', '16/05', '17/05', '18/05'],
                    datasets: [
                        {
                            label: 'Nội bộ đơn vị (Intra)',
                            data: [3120, 3280, 3450, 2980, 3340, 880, 910],
                            backgroundColor: '#3b82f6',
                            borderRadius: 4
                        },
                        {
                            label: 'Gọi đi ngoại đơn vị',
                            data: [750, 820, 890, 710, 830, 190, 210],
                            backgroundColor: '#8b5cf6',
                            borderRadius: 4
                        },
                        {
                            label: 'Gọi đến từ ngoại đơn vị',
                            data: [650, 710, 780, 620, 720, 170, 180],
                            backgroundColor: '#10b981',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: textColor }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('vi-VN').format(context.parsed.y) + ' cuộc gọi';
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            grid: { display: false },
                            ticks: { color: textMuted }
                        },
                        y: {
                            stacked: true,
                            grid: { color: gridColor },
                            ticks: { color: textMuted },
                            title: { display: true, text: 'Số Cuộc Gọi', color: textColor }
                        }
                    }
                }
            });
        }

        // 2. Biểu đồ Chất Lượng Cuộc Gọi & Tỷ Lệ ASR Đơn Vị (Dual Line Chart)
        const ctxQuality = document.getElementById('unitQualityChart');
        if (ctxQuality) {
            unitQualityChartInstance = new Chart(ctxQuality, {
                type: 'line',
                data: {
                    labels: ['12/05', '13/05', '14/05', '15/05', '16/05', '17/05', '18/05'],
                    datasets: [
                        {
                            label: 'Tỉ Lệ Trả Lời ASR (%)',
                            data: [83.5, 84.2, 85.0, 83.8, 84.5, 82.3, 83.9],
                            borderColor: '#059669',
                            backgroundColor: 'rgba(5, 150, 105, 0.1)',
                            fill: true,
                            borderWidth: 2.5,
                            tension: 0.3,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Điểm MOS (G.107)',
                            data: [4.15, 4.18, 4.22, 4.14, 4.20, 4.22, 4.25],
                            borderColor: '#3b82f6',
                            borderDash: [4, 4],
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
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: textColor }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: gridColor },
                            ticks: { color: textMuted }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            min: 60,
                            max: 100,
                            grid: { color: gridColor },
                            ticks: { color: textMuted },
                            title: { display: true, text: 'Tỉ Lệ ASR (%)', color: textColor }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            min: 3.0,
                            max: 5.0,
                            grid: { drawOnChartArea: false },
                            ticks: { color: textMuted },
                            title: { display: true, text: 'Điểm MOS', color: textColor }
                        }
                    }
                }
            });
        }
    };

    // Khởi tạo biểu đồ khi trang tải
    initMemberCharts();

    // Lắng nghe sự kiện đổi giao diện Sáng/Tối
    const handleThemeChanged = () => {
        setTimeout(() => {
            initMemberCharts();
        }, 120);
    };

    window.addEventListener('theme-changed', handleThemeChanged);
    document.getElementById('themeToggle')?.addEventListener('click', handleThemeChanged);

    // Xử lý co giãn biểu đồ
    window.addEventListener('resize', () => {
        if (unitTrafficChartInstance) {
            setTimeout(() => unitTrafficChartInstance.resize(), 60);
        }
        if (unitQualityChartInstance) {
            setTimeout(() => unitQualityChartInstance.resize(), 60);
        }
    });

    // Event listener cho Bộ lọc Lưu lượng 3 hướng gọi
    document.getElementById('unitTrafficFilter')?.addEventListener('change', (e) => {
        const val = e.target.value;
        if (!unitTrafficChartInstance) return;

        if (val === 'day') {
            unitTrafficChartInstance.data.labels = ['12/05', '13/05', '14/05', '15/05', '16/05', '17/05', '18/05'];
            unitTrafficChartInstance.data.datasets[0].data = [3120, 3280, 3450, 2980, 3340, 880, 910];
            unitTrafficChartInstance.data.datasets[1].data = [750, 820, 890, 710, 830, 190, 210];
            unitTrafficChartInstance.data.datasets[2].data = [650, 710, 780, 620, 720, 170, 180];
        } else if (val === 'week') {
            unitTrafficChartInstance.data.labels = ['Tuần 18', 'Tuần 19', 'Tuần 20', 'Tuần 21'];
            unitTrafficChartInstance.data.datasets[0].data = [18500, 19200, 20100, 19800];
            unitTrafficChartInstance.data.datasets[1].data = [4200, 4600, 4900, 4750];
            unitTrafficChartInstance.data.datasets[2].data = [3800, 4100, 4300, 4200];
        } else if (val === 'month') {
            unitTrafficChartInstance.data.labels = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5'];
            unitTrafficChartInstance.data.datasets[0].data = [72000, 68000, 76000, 74000, 79000];
            unitTrafficChartInstance.data.datasets[1].data = [16500, 15800, 17900, 17200, 18400];
            unitTrafficChartInstance.data.datasets[2].data = [14800, 14200, 16100, 15600, 16800];
        }
        unitTrafficChartInstance.update();
    });

    // Event listener cho Bộ lọc Chất lượng QoS
    document.getElementById('unitQualityFilter')?.addEventListener('change', (e) => {
        const val = e.target.value;
        if (!unitQualityChartInstance) return;

        if (val === '7days') {
            unitQualityChartInstance.data.labels = ['12/05', '13/05', '14/05', '15/05', '16/05', '17/05', '18/05'];
            unitQualityChartInstance.data.datasets[0].data = [83.5, 84.2, 85.0, 83.8, 84.5, 82.3, 83.9];
            unitQualityChartInstance.data.datasets[1].data = [4.15, 4.18, 4.22, 4.14, 4.20, 4.22, 4.25];
        } else if (val === '30days') {
            unitQualityChartInstance.data.labels = ['20/04', '25/04', '30/04', '05/05', '10/05', '15/05', '18/05'];
            unitQualityChartInstance.data.datasets[0].data = [82.8, 83.5, 84.0, 83.9, 84.6, 84.1, 84.2];
            unitQualityChartInstance.data.datasets[1].data = [4.12, 4.15, 4.18, 4.16, 4.21, 4.19, 4.18];
        }
        unitQualityChartInstance.update();
    });
});
