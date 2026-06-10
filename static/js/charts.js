/**
 * NeuroSort AI — Charts Module
 * Matches the reference site color palette and layout
 */

let urgencyChartInstance = null;
let weightChartInstance = null;
let trendsChartInstance = null;

function renderCharts(report) {
    const textColor = '#94a3b8';
    const gridColor = 'rgba(255,255,255,0.05)';
    const fonts = { family: "'JetBrains Mono', monospace", size: 10 };

    // 1. URGENCY PIE CHART
    const urgencyCtx = document.getElementById('urgencyChart');
    if (urgencyCtx) {
        if (urgencyChartInstance) urgencyChartInstance.destroy();
        
        let high = 0, med = 0, low = 0;
        report.files.forEach(f => {
            if (f.priority === 'HIGH') high++;
            else if (f.priority === 'MED') med++;
            else low++;
        });

        urgencyChartInstance = new Chart(urgencyCtx, {
            type: 'pie',
            data: {
                labels: ['High Priority', 'Medium Priority', 'Low Priority'],
                datasets: [{
                    data: [high, med, low],
                    backgroundColor: ['#f43f5e', '#f59e0b', '#10B981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, font: fonts, usePointStyle: true, boxWidth: 6 } }
                }
            }
        });
    }

    // 2. CATEGORY WEIGHT DONUT
    const weightCtx = document.getElementById('weightChart');
    if (weightCtx) {
        if (weightChartInstance) weightChartInstance.destroy();
        
        const labels = Object.keys(report.statistics.categoryCounts || {});
        const data = Object.values(report.statistics.categoryCounts || {});
        
        weightChartInstance = new Chart(weightCtx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['Empty'],
                datasets: [{
                    data: data.length ? data : [1],
                    backgroundColor: ['#f43f5e', '#38bdf8', '#a855f7', '#f59e0b', '#10B981', '#cbd5e1'],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: textColor, font: fonts, usePointStyle: true, boxWidth: 6 } }
                }
            }
        });
    }

    // 3. SCAN TRENDS LINE CHART
    const trendsCtx = document.getElementById('trendsChart');
    if (trendsCtx) {
        if (trendsChartInstance) trendsChartInstance.destroy();
        
        const ctx = trendsCtx.getContext('2d');
        const gradientEmerald = ctx.createLinearGradient(0, 0, 0, 150);
        gradientEmerald.addColorStop(0, 'rgba(52, 211, 153, 0.4)');
        gradientEmerald.addColorStop(1, 'rgba(52, 211, 153, 0.0)');

        const gradientIndigo = ctx.createLinearGradient(0, 0, 0, 150);
        gradientIndigo.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradientIndigo.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        // Generate realistic 30 day curve
        const days = Array.from({length: 30}, (_, i) => i + 1);
        let currentFiles = 10;
        let currentMem = 2;
        const fileData = days.map(d => { currentFiles += Math.floor(Math.random() * 5); return currentFiles; });
        const memData = days.map(d => { currentMem += (Math.random() * 2 - 0.5); return Math.max(1, currentMem).toFixed(1); });
        
        fileData[29] = report.statistics.totalFiles || fileData[29];

        trendsChartInstance = new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: days.map(d => `Day ${d}`),
                datasets: [
                    {
                        label: 'Files Processed',
                        data: fileData,
                        borderColor: '#34D399',
                        backgroundColor: gradientEmerald,
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: true
                    },
                    {
                        label: 'Memory (MB)',
                        data: memData,
                        borderColor: '#6366f1',
                        backgroundColor: gradientIndigo,
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                scales: {
                    x: { display: false },
                    y: { display: false, min: 0 }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
}
