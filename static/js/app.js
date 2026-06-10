/**
 * NeuroSort AI — App Controller
 * Orchestrates page lifecycle, tab switching, drag & drop, API integration, and toasts.
 */

document.addEventListener('DOMContentLoaded', () => {
    setupCommonListeners();
    // Default: load demo data automatically to populate the dashboard immediately
    loadDemoData();
    
    // Bind file inputs
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', e => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                handleDirectFilesUpload(files);
            }
        });
    }
});

function setupCommonListeners() {
    const dropZone = document.getElementById('dropZone');
    const reportFile = document.getElementById('reportFile');

    // Drag & drop handlers
    if (dropZone) {
        dropZone.addEventListener('dragover', e => {
            e.preventDefault();
            dropZone.classList.add('active');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('active');
        });
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('active');
            const files = Array.from(e.dataTransfer.files);
            if (files.length === 1 && files[0].name.endsWith('.json')) {
                handleJsonUpload(files[0]);
            } else if (files.length > 0) {
                handleDirectFilesUpload(files);
            }
        });
    }

    if (reportFile) {
        reportFile.addEventListener('change', e => {
            const files = Array.from(e.target.files);
            if (files.length === 1 && files[0].name.endsWith('.json')) {
                handleJsonUpload(files[0]);
            } else if (files.length > 0) {
                handleDirectFilesUpload(files);
            }
        });
    }

    // Keyboard shortcut (Ctrl + Z for Undo)
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            triggerUndo();
        }
    });
}

function triggerFileInput() {
    const input = document.getElementById('fileInput');
    if (input) {
        input.removeAttribute('webkitdirectory');
        input.removeAttribute('directory');
        input.click();
    }
}

function triggerFolderInput() {
    const input = document.getElementById('fileInput');
    if (input) {
        input.setAttribute('webkitdirectory', '');
        input.setAttribute('directory', '');
        input.click();
    }
}

// TOAST NOTIFICATIONS
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.innerText = message;
    toast.className = `toast visible ${type}`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 4000);
}

// 1. LAUNCH DEMO MODE
function loadDemoData() {
    try {
        const report = generateDemoReport();
        window.reportData = report;
        renderDashboard(report);
        showToast('⚡ Demo mode successfully loaded with 27 files!');
    } catch (e) {
        showToast('❌ Error generating demo data', 'danger');
        console.error(e);
    }
}

// 2. FILE READER DRAG-AND-DROP REPORT UPLOAD (OFFLINE)
function handleJsonUpload(file) {
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const report = JSON.parse(e.target.result);
            if (report.statistics && report.files) {
                window.reportData = report;
                renderDashboard(report);
                showToast(`📄 Loaded "${file.name}" successfully!`);
            } else {
                showToast('❌ Invalid report format: Missing statistics or file lists', 'danger');
            }
        } catch (err) {
            showToast('❌ Failed to parse report JSON', 'danger');
        }
    };
    reader.readAsText(file);
}

// 2b. BROWSER-SIDE DIRECT FILE/FOLDER UPLOAD SCAN & AI CLASSIFICATION
function handleDirectFilesUpload(filesList) {
    // Save raw File objects globally for offline dynamic in-browser previewing
    window.localFilesMap = new Map();
    Array.from(filesList).forEach(file => {
        window.localFilesMap.set(file.name, file);
        if (file.webkitRelativePath) {
            window.localFilesMap.set(file.webkitRelativePath, file);
        }
    });

    const spinner = document.getElementById('loadingOverlay');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');

    if (spinner) spinner.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '20%';
    if (progressText) progressText.innerText = 'Scanning uploaded folder tree...';

    setTimeout(() => {
        try {
            if (progressBar) progressBar.style.width = '60%';
            if (progressText) progressText.innerText = 'Applying 18 word-boundary AI classification rules...';

            setTimeout(() => {
                try {
                    if (progressBar) progressBar.style.width = '90%';
                    if (progressText) progressText.innerText = 'Benchmarking 6 sorting algorithms & compiling AVL category trees...';

                    setTimeout(() => {
                        try {
                            const report = processFileListDirectly(filesList);
                            window.reportData = report;
                            window.currentJobId = null; // No backend job for client scan
                            renderDashboard(report);
                            
                            if (spinner) spinner.classList.add('hidden');
                            showToast(`🚀 Client-side AI analyzed and organized ${filesList.length} files successfully!`);
                        } catch (err) {
                            if (spinner) spinner.classList.add('hidden');
                            showToast(`❌ Error: ${err.message}`, 'danger');
                        }
                    }, 500);
                } catch (err) {
                    if (spinner) spinner.classList.add('hidden');
                }
            }, 600);
        } catch (err) {
            if (spinner) spinner.classList.add('hidden');
        }
    }, 500);
}

// 3. FLASK FOLDER SCAN INTEGRATION
async function handleFolderScan() {
    const pathInput = document.getElementById('folderPath');
    const folderPath = pathInput ? pathInput.value.trim() : '';

    if (!folderPath) {
        showToast('⚠️ Please enter a folder path', 'danger');
        return;
    }

    const spinner = document.getElementById('loadingOverlay');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');

    if (spinner) spinner.classList.remove('hidden');
    if (progressText) progressText.innerText = 'Initializing BFS scanner...';
    if (progressBar) progressBar.style.width = '10%';

    try {
        // Send request to Flask API
        const response = await fetch('http://localhost:5000/api/organize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder_path: folderPath })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Server error occurred during organization');
        }

        const data = await response.json();
        const jobId = data.job_id;

        // Start polling status
        pollJobStatus(jobId);

    } catch (error) {
        if (spinner) spinner.classList.add('hidden');
        showToast(`❌ Error: ${error.message}`, 'danger');
    }
}

async function pollJobStatus(jobId) {
    const spinner = document.getElementById('loadingOverlay');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');

    const interval = setInterval(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/status/${jobId}`);
            if (!res.ok) throw new Error('Failed to query job status');

            const statusData = await res.json();
            const progress = statusData.progress;

            if (progressBar) progressBar.style.width = `${progress}%`;

            if (progress < 40) {
                if (progressText) progressText.innerText = 'Queueing folder nodes...';
            } else if (progress < 70) {
                if (progressText) progressText.innerText = 'Running 18 forward chaining AI rules...';
            } else if (progress < 90) {
                if (progressText) progressText.innerText = 'Building AVL category trees & MD5 hashes...';
            } else {
                if (progressText) progressText.innerText = 'Benchmarking 6 sorting algorithms...';
            }

            if (statusData.status === 'completed') {
                clearInterval(interval);
                
                // Fetch final report
                const reportRes = await fetch(`http://localhost:5000/api/report/${jobId}`);
                if (!reportRes.ok) throw new Error('Failed to fetch finished report');

                const report = await reportRes.json();
                window.reportData = report;
                window.currentJobId = jobId; // Store for undo route

                // If empty folder returned
                if (report.error) {
                    if (spinner) spinner.classList.add('hidden');
                    showToast(`⚠️ Folder scan finished: ${report.error}`, 'danger');
                    renderDashboard(report);
                    return;
                }

                renderDashboard(report);
                if (spinner) spinner.classList.add('hidden');
                showToast('🚀 Folder organized and indexed successfully!');
            } else if (statusData.status === 'failed') {
                clearInterval(interval);
                if (spinner) spinner.classList.add('hidden');
                showToast(`❌ Scan failed: ${statusData.error}`, 'danger');
            }

        } catch (e) {
            clearInterval(interval);
            if (spinner) spinner.classList.add('hidden');
            showToast(`❌ Connection error: ${e.message}`, 'danger');
        }
    }, 800);
}

// 4. API UNDO INTEGRATION (CTRL+Z / UNDO CLICK)
async function triggerUndo(filename = "") {
    try {
        const jobId = window.currentJobId || "";
        
        // If offline / demo mode
        if (!jobId || !window.currentJobId) {
            if (window.reportData && window.reportData.undoStack && window.reportData.undoStack.length > 0) {
                const popped = window.reportData.undoStack.pop();
                renderUndoStack(window.reportData.undoStack);
                showToast(`🔄 Offline Undo: Reverted movement of ${popped.filename}`);
            } else {
                showToast('⚠️ Undo stack is empty', 'danger');
            }
            return;
        }

        const response = await fetch('http://localhost:5000/api/undo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_id: jobId })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Server rejected undo request');
        }

        const resData = await response.json();
        
        // Modify local state
        if (window.reportData && window.reportData.undoStack) {
            window.reportData.undoStack.pop();
            renderUndoStack(window.reportData.undoStack);
        }

        showToast(`🔄 Undo: ${resData.message}`);

    } catch (e) {
        showToast(`❌ Undo failed: ${e.message}`, 'danger');
    }
}

// 5. QUICK ACTIONS & DATA EXPORT
function resetWorkspace() {
    if (confirm("Are you sure you want to clear all data and reset the dashboard?")) {
        window.reportData = null;
        document.getElementById('fileTableBody').innerHTML = '';
        document.getElementById('flatTree').innerHTML = '';
        document.getElementById('organizedTree').innerHTML = '';
        document.getElementById('undoStackPanel').innerHTML = '<div class="empty-state">History empty</div>';
        document.getElementById('categoryDistributionBars').innerHTML = '<div class="empty-state">No data</div>';
        document.getElementById('storageBreakdownList').innerHTML = '<div class="empty-state">No data</div>';
        showToast("🗑️ Workspace has been fully cleared.", "success");
    }
}

function toggleAutoSort(btn) {
    const badge = btn.querySelector('.badge-slate');
    if (badge.innerText === 'OFF') {
        badge.innerText = 'ON';
        badge.style.background = 'var(--emerald)';
        badge.style.color = '#000';
        showToast("⚡ Auto-Sort is now ON", "success");
    } else {
        badge.innerText = 'OFF';
        badge.style.background = 'rgba(255,255,255,0.1)';
        badge.style.color = 'var(--text-faint)';
        showToast("⏸️ Auto-Sort is now OFF", "success");
    }
}

function exportData(format) {
    if (!window.reportData) {
        showToast("⚠️ No data available to export.", "danger");
        return;
    }
    
    let dataStr = "";
    let filename = `neurosort_export.${format}`;
    let mimeType = "";

    if (format === 'json') {
        dataStr = JSON.stringify(window.reportData, null, 2);
        mimeType = "application/json";
    } else if (format === 'csv') {
        const files = window.reportData.files || [];
        const headers = ["ID,Filename,Size,Category,Priority,Hash\n"];
        const rows = files.map(f => `${f.id},"${f.name}",${f.size},"${f.category}","${f.priority}","${f.hash}"\n`);
        dataStr = headers.concat(rows).join("");
        mimeType = "text/csv";
    }

    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`📥 Successfully exported ${filename}`, "success");
}
