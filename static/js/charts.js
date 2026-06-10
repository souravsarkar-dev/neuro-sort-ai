/**
 * NeuroSort AI — Charts Module
 * Matches the reference site color palette and layout
 */

let algoChartInstance = null;
let categoryChartInstance = null;
let priorityChartInstance = null;

function renderCharts(report) {
    const textColor = '#64748b';  // slate-500
    const gridColor = 'rgba(255, 255, 255, 0.04)';

    // 1. ALGORITHM COMPARISON BAR CHART
    const benchmark = report.sortBenchmark || [];
    if (benchmark.length > 0) {
        const labels = benchmark.map(b => b.name);
        const timings = benchmark.map(b => b.timeMs);
        const colors = benchmark.map(b => b.selected
            ? 'rgba(52, 211, 153, 0.85)'
            : 'rgba(99, 102, 241, 0.35)');
        const borderColors = benchmark.map(b => b.selected
            ? '#34D399'
            : '#6366f1');

        const ctx = document.getElementById('algoChart').getContext('2d');
        if (algoChartInstance) algoChartInstance.destroy();

        algoChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Time (ms)',
                    data: timings,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 1.5,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#161a29',
                        borderColor: '#1e2332',
                        borderWidth: 1,
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        padding: 10,
                        callbacks: {
                            footer: (tooltipItems) => {
                                const idx = tooltipItems[0].dataIndex;
                                return `Complexity: ${benchmark[idx].complexity}\nSpace: ${benchmark[idx].spaceComplexity}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: textColor, font: { size: 11 } },
                        grid: { color: gridColor },
                        border: { color: gridColor }
                    },
                    y: {
                        ticks: { color: textColor, font: { size: 11 } },
                        grid: { color: gridColor },
                        border: { color: gridColor },
                        title: { display: true, text: 'milliseconds', color: textColor, font: { size: 10 } }
                    }
                }
            }
        });
    }

    // 2. CATEGORY DONUT CHART
    const categories = report.categories || [];
    const activeCats = categories.filter(c => c.count > 0);
    if (activeCats.length > 0) {
        const catLabels = activeCats.map(c => `${c.icon} ${c.name}`);
        const catCounts = activeCats.map(c => c.count);
        const catColors = [
            '#34D399', '#6366f1', '#f59e0b', '#f43f5e',
            '#22d3ee', '#a855f7', '#fb7185', '#38bdf8',
            '#10b981', '#64748b'
        ];

        const ctx = document.getElementById('categoryDonut').getContext('2d');
        if (categoryChartInstance) categoryChartInstance.destroy();

        categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catCounts,
                    backgroundColor: catColors.slice(0, activeCats.length),
                    borderWidth: 2,
                    borderColor: '#161a29'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: textColor,
                            font: { family: 'Inter', size: 10 },
                            boxWidth: 10, padding: 8,
                            generateLabels: (chart) => {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: label.length > 12 ? label.slice(0, 12) + '…' : label,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#161a29', borderColor: '#1e2332',
                        borderWidth: 1, titleColor: '#f1f5f9', bodyColor: '#94a3b8'
                    }
                },
                cutout: '68%'
            }
        });
    }

    // 3. PRIORITY POLAR CHART
    const stats = report.statistics || {};
    const priorityData = [stats.highPriority || 0, stats.mediumPriority || 0, stats.lowPriority || 0];

    const ctx = document.getElementById('priorityChart').getContext('2d');
    if (priorityChartInstance) priorityChartInstance.destroy();

    priorityChartInstance = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['🔴 High Priority', '🟡 Medium Priority', '🟢 Low Priority'],
            datasets: [{
                data: priorityData,
                backgroundColor: [
                    'rgba(244, 63, 94, 0.4)',
                    'rgba(245, 158, 11, 0.4)',
                    'rgba(52, 211, 153, 0.4)'
                ],
                borderColor: ['#f43f5e', '#f59e0b', '#34D399'],
                borderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor, font: { family: 'Inter', size: 10 },
                        boxWidth: 10, padding: 6
                    }
                },
                tooltip: {
                    backgroundColor: '#161a29', borderColor: '#1e2332',
                    borderWidth: 1, titleColor: '#f1f5f9', bodyColor: '#94a3b8'
                }
            },
            scales: {
                r: {
                    grid: { color: gridColor },
                    angleLines: { color: gridColor },
                    ticks: { backdropColor: 'transparent', color: textColor, font: { size: 9 } }
                }
            }
        }
    });
}
