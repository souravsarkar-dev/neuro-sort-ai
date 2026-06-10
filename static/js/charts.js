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
        
        trendsChartInstance = new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
                datasets: [
                    {
                        label: 'Files Processed',
                        data: [12, 19, 15, 25, 22, 30, 28, 35, 40, report.statistics.totalFiles || 12],
                        borderColor: '#34D399',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: 'Memory (MB)',
                        data: [5, 8, 12, 10, 15, 14, 20, 18, 22, 25],
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false, min: 0 }
                }
            }
        });
    }
}
