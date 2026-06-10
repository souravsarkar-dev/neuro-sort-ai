/**
 * NeuroSort AI — Renderer Module
 * Generates HTML dynamically from the report.json object and attaches event handlers.
 */

function renderDashboard(report) {
    if (!report || !report.statistics) {
        showToast('❌ Invalid report data provided');
        return;
    }

    renderStats(report.statistics);
    renderBeforeAfter(report.files);
    renderCharts(report);
    renderFolderTree(report.folderStructure);
    renderFileTable(report.files);
    renderDuplicates(report.duplicates);
    renderUndoStack(report.undoStack);
    renderSyllabusAccordion(report.syllabusMapping);
    renderEthicsPanel(report.statistics);
}

// 1. RENDER STATISTICS CARDS
function renderStats(stats) {
    const formatBytes = b => {
        if (!b) return '0 B';
        if (b >= 1048576) return (b / 1048576).toFixed(2) + ' MB';
        if (b >= 1024) return (b / 1024).toFixed(2) + ' KB';
        return b + ' B';
    };

    document.getElementById('statTotalFiles').innerText = stats.totalFiles || 0;
    document.getElementById('statCategories').innerText = stats.categoriesCreated || 0;
    document.getElementById('statDuplicates').innerText = stats.duplicatesFound || 0;
    document.getElementById('statSpaceSaved').innerText = formatBytes(stats.spaceSaved || 0);
    document.getElementById('statAlgorithm').innerText = stats.sortAlgorithm || 'None';
    document.getElementById('statTime').innerText = `${(stats.processingTimeMs || 0).toFixed(3)} ms`;
}

// 2. RENDER BEFORE/AFTER COMPARISON
function renderBeforeAfter(files) {
    const beforeContainer = document.getElementById('beforeList');
    const afterContainer = document.getElementById('afterList');

    if (!beforeContainer || !afterContainer) return;

    beforeContainer.innerHTML = '';
    afterContainer.innerHTML = '';

    // Before: messy flat list of files
    files.forEach(f => {
        const item = document.createElement('div');
        item.className = 'tree-item flat';
        item.innerHTML = `<span class="icon">📄</span> <span class="name">${f.name}</span> <span class="size">${f.sizeFormatted}</span>`;
        beforeContainer.appendChild(item);
    });

    // After: categorized mock folders
    const categories = {};
    files.forEach(f => {
        if (!categories[f.category]) {
            categories[f.category] = [];
        }
        categories[f.category].push(f);
    });

    for (const [catName, catFiles] of Object.entries(categories)) {
        const folder = document.createElement('div');
        folder.className = 'tree-folder';
        folder.innerHTML = `
            <div class="folder-header collapsed" onclick="toggleFolder(this)">
                <span class="arrow">▶</span> <span class="icon">📁</span> <span class="name">${catName}</span> <span class="badge">${catFiles.length}</span>
            </div>
            <div class="folder-content hidden"></div>
        `;
        const content = folder.querySelector('.folder-content');

        catFiles.forEach(f => {
            const fileItem = document.createElement('div');
            fileItem.className = `tree-item ${f.priority.toLowerCase()}`;
            fileItem.onclick = () => showFileDetail(f);
            fileItem.innerHTML = `
                <span class="icon">📄</span> <span class="name">${f.name}</span>
                <span class="priority-badge ${f.priority.toLowerCase()}">${f.priority}</span>
            `;
            content.appendChild(fileItem);
        });

        afterContainer.appendChild(folder);
    }
}

// 3. RENDER ORGANIZED FOLDER TREE
function renderFolderTree(structure) {
    const container = document.getElementById('organizedTree');
    if (!container || !structure) return;

    container.innerHTML = '';
    
    const buildTreeHTML = (node) => {
        if (node.type === 'directory') {
            const folder = document.createElement('div');
            folder.className = 'tree-folder';
            folder.innerHTML = `
                <div class="folder-header collapsed" onclick="toggleFolder(this)">
                    <span class="arrow">▶</span> <span class="icon">📁</span> <span class="name">${node.name}</span>
                    <span class="badge">${node.children.length} items</span>
                </div>
                <div class="folder-content hidden"></div>
            `;
            const content = folder.querySelector('.folder-content');
            
            // Recursively add children
            node.children.forEach(child => {
                content.appendChild(buildTreeHTML(child));
            });
            return folder;
        } else {
            const item = document.createElement('div');
            item.className = `tree-item ${node.priority.toLowerCase()}`;
            item.onclick = () => {
                // Find matching file from reportData to show details
                if (reportData && reportData.files) {
                    const match = reportData.files.find(f => f.name === node.name);
                    if (match) showFileDetail(match);
                }
            };
            item.innerHTML = `
                <span class="icon">📄</span> <span class="name">${node.name}</span>
                <span class="priority-badge ${node.priority.toLowerCase()}">${node.priority}</span>
            `;
            return item;
        }
    };

    container.appendChild(buildTreeHTML(structure));
}

function toggleFolder(header) {
    const content = header.nextElementSibling;
    const arrow = header.querySelector('.arrow');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        header.classList.remove('collapsed');
        arrow.innerText = '▼';
    } else {
        content.classList.add('hidden');
        header.classList.add('collapsed');
        arrow.innerText = '▶';
    }
}

// 4. RENDER EXPLAINABLE FILE DETAIL SLIDE-OUT
function showFileDetail(file) {
    // Save reference for full-screen dynamic document preview
    window.selectedFileForPreview = file;

    const detailPanel = document.getElementById('detailPanel');
    if (!detailPanel) return;

    const explainBody = document.getElementById('detailBody');
    const h = file.heuristic || { keyword: 0, recency: 0, size: 0, extension: 0, total: 0 };
    
    explainBody.innerHTML = `
        <h2 style="font-size:1.4rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:8px;">
            📄 <span style="word-break:break-all;">${file.name}</span>
        </h2>
        
        <div class="glass-card" style="padding:1.25rem;margin-bottom:1.5rem;">
            <h3 style="font-size:1rem;color:var(--accent-cyan);margin-bottom:0.75rem;">🧠 Explainable AI Diagnostic</h3>
            <p style="color:var(--text-secondary);font-size:0.95rem;margin-bottom:0.75rem;line-height:1.5;">
                ${file.explanation}
            </p>
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-muted);">
                <span>Primary Category: <strong>${file.category}</strong></span>
                <span>Subfolder: <strong>${file.subcategory || 'None'}</strong></span>
            </div>
        </div>

        <!-- 👁️ REAL-TIME WORKSPACE PREVIEW ACTION CARD -->
        <div class="glass-card" style="padding:1.25rem;margin-bottom:1.5rem;text-align:center;border-color:var(--accent-cyan);background:rgba(6,182,212,0.02);">
            <h3 style="font-size:0.9rem;color:var(--accent-cyan);margin-bottom:0.5rem;font-weight:600;">💻 Real-Time Workspace Preview</h3>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:1rem;line-height:1.4;">
                Open and interact with this file instantly inside the website frame.
            </p>
            <button class="btn btn-primary" style="width:100%;height:44px;font-size:0.9rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;animation:pulseGlow 2s infinite;" onclick="openDocumentPreview()">
                👁️ Open Document in Website
            </button>
        </div>

        <div class="glass-card" style="padding:1.25rem;">
            <h3 style="font-size:1rem;color:var(--accent-purple);margin-bottom:1rem;">📈 Heuristic Multi-Factor Scoring (0-100)</h3>
            
            <div class="heuristic-bar" style="margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.85rem;">
                    <span>📚 Keyword Relevance (40%)</span>
                    <span><strong>${h.keyword}/40</strong></span>
                </div>
                <div style="background:rgba(255,255,255,0.05);height:6px;border-radius:3px;">
                    <div style="background:var(--accent-blue);width:${(h.keyword/40)*100}%;height:100%;border-radius:3px;"></div>
                </div>
            </div>

            <div class="heuristic-bar" style="margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.85rem;">
                    <span>🕒 Recency Weight (30%)</span>
                    <span><strong>${h.recency}/30</strong></span>
                </div>
                <div style="background:rgba(255,255,255,0.05);height:6px;border-radius:3px;">
                    <div style="background:var(--accent-green);width:${(h.recency/30)*100}%;height:100%;border-radius:3px;"></div>
                </div>
            </div>

            <div class="heuristic-bar" style="margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.85rem;">
                    <span>💾 Size Importance (20%)</span>
                    <span><strong>${h.size}/20</strong></span>
                </div>
                <div style="background:rgba(255,255,255,0.05);height:6px;border-radius:3px;">
                    <div style="background:var(--accent-amber);width:${(h.size/20)*100}%;height:100%;border-radius:3px;"></div>
                </div>
            </div>

            <div class="heuristic-bar" style="margin-bottom:1.5rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.85rem;">
                    <span>📄 Extension Type Bonus (10%)</span>
                    <span><strong>${h.extension}/10</strong></span>
                </div>
                <div style="background:rgba(255,255,255,0.05);height:6px;border-radius:3px;">
                    <div style="background:var(--accent-rose);width:${(h.extension/10)*100}%;height:100%;border-radius:3px;"></div>
                </div>
            </div>

            <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:1rem;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:0.95rem;font-weight:600;">Total Priority Score:</span>
                <span style="font-size:1.5rem;font-weight:800;color:var(--accent-cyan);">${h.total}/100</span>
            </div>
        </div>
    `;

    detailPanel.classList.remove('hidden');
}

function closeDetailPanel() {
    const detailPanel = document.getElementById('detailPanel');
    if (detailPanel) detailPanel.classList.add('hidden');
}

// 5. RENDER FILE DATABASE TABLE
function renderFileTable(files) {
    const container = document.getElementById('fileTableBody');
    if (!container) return;

    container.innerHTML = '';
    
    // Sort files by priority high -> medium -> low
    const sorted = [...files].sort((a,b) => b.priority_val - a.priority_val);

    sorted.forEach(f => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => showFileDetail(f);
        tr.innerHTML = `
            <td style="font-family:var(--font-mono);font-size:0.85rem;word-break:break-all;">${f.name}</td>
            <td><span class="priority-badge ${f.priority.toLowerCase()}">${f.priority}</span></td>
            <td style="color:var(--accent-cyan);font-weight:600;">${f.priorityScore}</td>
            <td>📁 ${f.category}${f.subcategory ? ' / ' + f.subcategory : ''}</td>
            <td style="font-size:0.85rem;color:var(--text-secondary);">${f.sizeFormatted}</td>
        `;
        container.appendChild(tr);
    });
}

// 6. RENDER DUPLICATE DETECTION CARDS
function renderDuplicates(duplicates) {
    const container = document.getElementById('duplicatesPanel');
    if (!container) return;

    container.innerHTML = '';

    if (!duplicates || duplicates.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--text-muted);">
                ♻️ O(1) duplicate search completed. No duplicates detected in dataset.
            </div>
        `;
        return;
    }

    duplicates.forEach(dup => {
        const groupCard = document.createElement('div');
        groupCard.className = 'glass-card';
        groupCard.style.padding = '1.25rem';
        groupCard.style.marginBottom = '1rem';
        groupCard.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:0.5rem;">
                <span style="font-size:0.85rem;color:var(--accent-amber);">🔒 Content MD5: <code style="font-family:var(--font-mono);">${dup.hash}</code></span>
                <span class="priority-badge low" style="background:rgba(244,63,94,0.15);color:#f43f5e;">⚠️ Wasted: ${(dup.wastedBytes/1024).toFixed(2)} KB</span>
            </div>
        `;
        
        dup.files.forEach((f, idx) => {
            const fRow = document.createElement('div');
            fRow.style.display = 'flex';
            fRow.style.justify = 'space-between';
            fRow.style.alignItems = 'center';
            fRow.style.padding = '0.5rem 0';
            fRow.style.fontSize = '0.9rem';
            
            fRow.innerHTML = `
                <span style="word-break:break-all;">${idx === 0 ? '⭐ Original' : '📦 Copy'}: <code>${f.name}</code></span>
                <button class="btn btn-sm btn-danger" style="padding:2px 8px;font-size:0.75rem;" onclick="event.stopPropagation(); deleteDuplicate('${f.name}')">
                    ${idx === 0 ? 'Keep' : 'Delete'}
                </button>
            `;
            groupCard.appendChild(fRow);
        });

        container.appendChild(groupCard);
    });
}

function deleteDuplicate(filename) {
    showToast(`🗑️ Simulated removal of duplicate: ${filename}`);
}

// 7. RENDER UNDO STACK LINKED LIST VISUALIZATION
function renderUndoStack(stack) {
    const container = document.getElementById('undoStackPanel');
    if (!container) return;

    container.innerHTML = '';

    if (!stack || stack.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--text-muted);">
                📭 Undo Stack is currently empty.
            </div>
        `;
        return;
    }

    // Display stack top to bottom (linked list visualizer)
    const listContainer = document.createElement('div');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '8px';

    const renderList = [...stack].reverse(); // stack pops from the end (top)

    renderList.forEach((op, idx) => {
        const item = document.createElement('div');
        item.className = 'glass-card';
        item.style.padding = '0.75rem 1.25rem';
        item.style.display = 'flex';
        item.style.justify = 'space-between';
        item.style.alignItems = 'center';
        
        if (idx === 0) {
            item.style.borderColor = 'var(--accent-cyan)';
            item.style.background = 'rgba(6,182,212,0.05)';
        }

        item.innerHTML = `
            <div>
                <span style="font-weight:600;color:${idx === 0 ? 'var(--accent-cyan)' : 'var(--text-primary)'};">
                    ${idx === 0 ? '🔝 [STACK TOP]' : '🔗 [LINKED LIST]'}
                </span>
                <span style="margin-left:8px;font-family:var(--font-mono);font-size:0.85rem;">
                    Moved <code>${op.filename}</code>
                </span>
            </div>
            <button class="btn btn-sm btn-primary" style="padding:4px 10px;font-size:0.75rem;" onclick="triggerUndo('${op.filename}')">
                Undo
            </button>
        `;
        listContainer.appendChild(item);
    });

    container.appendChild(listContainer);
}

// 8. RENDER SYLLABUS ACCORDION
function renderSyllabusAccordion(mapping) {
    const container = document.getElementById('syllabusAccordion');
    if (!container || !mapping) return;

    container.innerHTML = '';

    mapping.forEach((module, idx) => {
        const acc = document.createElement('div');
        acc.className = 'accordion-item';
        acc.innerHTML = `
            <div class="accordion-header" onclick="toggleAccordion(this)">
                <span class="accordion-title">📖 [${module.id}] ${module.name}</span>
                <span class="accordion-icon">+</span>
            </div>
            <div class="accordion-content">
                <p style="margin-bottom:0.5rem;"><strong>Syllabus Evidence:</strong> ${module.evidence}</p>
                <p style="color:var(--accent-cyan);font-size:0.85rem;">Regulation Map: ${module.course}</p>
            </div>
        `;
        container.appendChild(acc);
    });
}

function toggleAccordion(header) {
    const item = header.parentElement;
    const content = header.nextElementSibling;
    const icon = header.querySelector('.accordion-icon');
    
    // Toggle active
    if (item.classList.contains('active')) {
        item.classList.remove('active');
        icon.innerText = '+';
    } else {
        // Close other items
        document.querySelectorAll('.accordion-item').forEach(el => {
            el.classList.remove('active');
            const otherIcon = el.querySelector('.accordion-icon');
            if (otherIcon) otherIcon.innerText = '+';
        });
        item.classList.add('active');
        icon.innerText = '-';
    }
}

// 9. RENDER AI ETHICS PANEL
function renderEthicsPanel(stats) {
    const container = document.getElementById('ethicsPanel');
    if (!container) return;

    // Calculate dynamic values for verification
    const biasCheck = stats.highPriority > stats.mediumPriority * 2 ? "⚠️ Alert: Priority Skew" : "✅ Normal Balanced priority distribution";

    container.innerHTML = `
        <div class="glass-card" style="padding:1.5rem;">
            <h3 style="font-size:1.1rem;color:var(--accent-rose);margin-bottom:1rem;display:flex;align-items:center;gap:8px;">
                ⚖️ AI Ethics & Transparency Framework (CS202/CS292)
            </h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1rem;">
                <div class="glass-card" style="padding:1rem;">
                    <h4 style="color:var(--accent-cyan);font-size:0.95rem;margin-bottom:0.5rem;">🔒 Privacy Compliance</h4>
                    <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.4;">
                        Files processed purely locally in transient buffer space. No remote AI endpoints leveraged, preserving academic code confidentiality.
                    </p>
                </div>
                <div class="glass-card" style="padding:1rem;">
                    <h4 style="color:var(--accent-amber);font-size:0.95rem;margin-bottom:0.5rem;">🤖 Transparency & Fairness</h4>
                    <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.4;">
                        Our Expert system utilizes deterministic word-boundary forward chaining rules. Decisions contain zero hidden weight biases and are fully explainable in plain English.
                    </p>
                </div>
                <div class="glass-card" style="padding:1rem;">
                    <h4 style="color:var(--accent-green);font-size:0.95rem;margin-bottom:0.5rem;">🔍 Bias Footprint Check</h4>
                    <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.4;">
                        Status: <strong>${biasCheck}</strong>.<br>
                        High priority skew checks avoid over-prioritizing generic document extensions over academic coursework files.
            </div>
        </div>
    `;
}

// ==========================================
// 10. PREMIUM DOCUMENT PREVIEWER CONTROLLERS
// ==========================================

function openDocumentPreview() {
    const file = window.selectedFileForPreview;
    if (!file) {
        showToast('⚠️ No file selected for preview', 'danger');
        return;
    }

    const modal = document.getElementById('previewModal');
    const title = document.getElementById('previewTitle');
    const icon = document.getElementById('previewIcon');
    const meta = document.getElementById('previewMeta');
    const content = document.getElementById('previewContent');
    const downloadBtn = document.getElementById('previewDownloadBtn');

    if (!modal || !content) return;

    // Show modal
    modal.classList.remove('hidden');

    // Set title, icon, meta details
    title.innerText = file.name;
    icon.innerText = getFileIcon(file.category);
    meta.innerText = `${file.category} • Size: ${file.sizeFormatted || formatBytesForPreview(file.size)} • 100% Secure Preview`;

    // Set loading indicator
    content.innerHTML = `
        <div style="text-align:center;">
            <div class="spinner"></div>
            <p style="margin-top:15px;color:var(--text-secondary);font-size:0.9rem;">Opening document preview securely...</p>
        </div>
    `;

    // Map download button click
    downloadBtn.onclick = () => {
        downloadFileContent(file);
    };

    let fileLoaded = false;

    // A. Direct browser drag & drop file objects
    if (window.localFilesMap && window.localFilesMap.has(file.name)) {
        const localFile = window.localFilesMap.get(file.name);
        loadFileFromBrowser(localFile, file.ext, content);
        fileLoaded = true;
    }
    // B. Real local folder scans running on port 5000
    else if (window.currentJobId) {
        loadFileFromServer(file, content);
        fileLoaded = true;
    }

    // C. Simulated Demo Data or fallback
    if (!fileLoaded) {
        loadSimulatedPreview(file, content);
    }
}

function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    const content = document.getElementById('previewContent');
    if (modal) modal.classList.add('hidden');
    if (content) content.innerHTML = ''; // clean memory allocations
}

function getFileIcon(category) {
    const icons = {
        'Study_Hub': '📚', 'Documents': '📄', 'Images': '🖼️', 'Videos': '🎬',
        'Music': '🎵', 'Code': '💻', 'Archives': '📦', 'Executables': '⚙️',
        'Duplicates': '♻️', 'Others': '📂'
    };
    return icons[category] || '📄';
}

function formatBytesForPreview(b) {
    if (!b) return '0 B';
    if (b >= 1048576) return (b / 1048576).toFixed(2) + ' MB';
    if (b >= 1024) return (b / 1024).toFixed(2) + ' KB';
    return b + ' B';
}

function escapeHtmlForPreview(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function loadFileFromBrowser(fileObject, ext, container) {
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
    const textExts = ["txt", "md", "c", "cpp", "h", "py", "java", "js", "html", "css", "json", "xml", "yaml", "sql", "log"];
    const mediaExts = ["mp4", "webm", "mp3", "wav", "ogg"];

    try {
        if (imageExts.includes(ext)) {
            const objectUrl = URL.createObjectURL(fileObject);
            container.innerHTML = `<img class="preview-image" src="${objectUrl}" alt="${fileObject.name}">`;
        } else if (ext === "pdf") {
            const objectUrl = URL.createObjectURL(fileObject);
            container.innerHTML = `<iframe class="preview-iframe" src="${objectUrl}"></iframe>`;
        } else if (mediaExts.includes(ext)) {
            const objectUrl = URL.createObjectURL(fileObject);
            if (ext === "mp4" || ext === "webm") {
                container.innerHTML = `<video class="preview-media-player" src="${objectUrl}" controls autoplay></video>`;
            } else {
                container.innerHTML = `
                    <div style="text-align:center;">
                        <span style="font-size:4rem;display:block;margin-bottom:1rem;filter:drop-shadow(0 0 15px rgba(6,182,212,0.3));">🎵</span>
                        <audio src="${objectUrl}" controls autoplay style="width:350px;outline:none;"></audio>
                        <p style="margin-top:1rem;color:var(--text-secondary);font-size:0.9rem;">${fileObject.name}</p>
                    </div>
                `;
            }
        } else if (textExts.includes(ext)) {
            const reader = new FileReader();
            reader.onload = e => {
                const escaped = escapeHtmlForPreview(e.target.result);
                container.innerHTML = `<pre class="preview-text-container"><code>${escaped}</code></pre>`;
            };
            reader.readAsText(fileObject);
        } else {
            container.innerHTML = `
                <div class="preview-placeholder-card">
                    <span style="font-size:3.5rem;display:block;margin-bottom:1rem;">📂</span>
                    <h3 style="margin-bottom:1rem;color:var(--accent-cyan);">${fileObject.name}</h3>
                    <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:1.5rem;line-height:1.5;">
                        This file format (<strong>.${ext.toUpperCase()}</strong>) contains raw binary data. You can download the physical file to open it on your system.
                    </p>
                    <button class="btn btn-primary" onclick="downloadFileContent(window.selectedFileForPreview)">⬇️ Download File (${formatBytesForPreview(fileObject.size)})</button>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = `<p style="color:var(--accent-rose);">Error parsing file buffer: ${err.message}</p>`;
    }
}

async function loadFileFromServer(file, container) {
    const pathQuery = encodeURIComponent(file.path);
    const streamUrl = `http://localhost:5000/api/preview?path=${pathQuery}`;
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
    const textExts = ["txt", "md", "c", "cpp", "h", "py", "java", "js", "html", "css", "json", "xml", "yaml", "sql", "log"];
    const mediaExts = ["mp4", "webm", "mp3", "wav", "ogg"];
    const ext = file.ext;

    try {
        if (imageExts.includes(ext)) {
            container.innerHTML = `<img class="preview-image" src="${streamUrl}" alt="${file.name}">`;
        } else if (ext === "pdf") {
            container.innerHTML = `<iframe class="preview-iframe" src="${streamUrl}"></iframe>`;
        } else if (mediaExts.includes(ext)) {
            if (ext === "mp4" || ext === "webm") {
                container.innerHTML = `<video class="preview-media-player" src="${streamUrl}" controls autoplay></video>`;
            } else {
                container.innerHTML = `
                    <div style="text-align:center;">
                        <span style="font-size:4rem;display:block;margin-bottom:1rem;filter:drop-shadow(0 0 15px rgba(6,182,212,0.3));">🎵</span>
                        <audio src="${streamUrl}" controls autoplay style="width:350px;outline:none;"></audio>
                        <p style="margin-top:1rem;color:var(--text-secondary);font-size:0.9rem;">${file.name}</p>
                    </div>
                `;
            }
        } else if (textExts.includes(ext)) {
            const res = await fetch(streamUrl);
            if (!res.ok) throw new Error("Backend could not read file");
            const text = await res.text();
            const escaped = escapeHtmlForPreview(text);
            container.innerHTML = `<pre class="preview-text-container"><code>${escaped}</code></pre>`;
        } else {
            container.innerHTML = `
                <div class="preview-placeholder-card">
                    <span style="font-size:3.5rem;display:block;margin-bottom:1rem;">📂</span>
                    <h3 style="margin-bottom:1rem;color:var(--accent-cyan);">${file.name}</h3>
                    <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:1.5rem;line-height:1.5;">
                        This file format (<strong>.${ext.toUpperCase()}</strong>) represents a binary disk node located at:<br>
                        <code style="word-break:break-all;color:var(--accent-amber);font-size:0.8rem;">${file.path}</code>
                    </p>
                    <button class="btn btn-primary" onclick="downloadFileContent(window.selectedFileForPreview)">⬇️ Stream Download (${file.sizeFormatted})</button>
                </div>
            `;
        }
    } catch (err) {
        // Fallback to simulated mode if server reading fails
        loadSimulatedPreview(file, container);
    }
}

function loadSimulatedPreview(file, container) {
    const name = file.name;
    const ext = file.ext;
    const category = file.category;

    if (name === "DSA_Final_Exam_2025.pdf" || name === "midterm_solutions.pdf") {
        const isSolutions = name.includes("solutions");
        container.innerHTML = `
            <div style="background:white;color:#1e293b;padding:3rem;border-radius:8px;max-width:800px;width:100%;box-shadow:0 10px 25px rgba(0,0,0,0.15);text-align:left;font-family:Georgia, serif;line-height:1.8;overflow-y:auto;max-height:100%;">
                <div style="text-align:center;border-bottom:2px double #475569;padding-bottom:1.5rem;margin-bottom:2rem;">
                    <h2 style="font-size:1.5rem;text-transform:uppercase;letter-spacing:1px;font-family:'Times New Roman', serif;margin-bottom:5px;color:#0f172a;">JIS College of Engineering</h2>
                    <h3 style="font-size:1.15rem;margin-top:5px;font-family:'Times New Roman', serif;color:#334155;">B.Tech CSE - 2nd Semester (Regulation R25)</h3>
                    <h4 style="font-size:0.95rem;font-weight:normal;margin-top:5px;color:#475569;">Subject: CS291 - Design & Analysis of Algorithms / Data Structures</h4>
                    <p style="margin-top:10px;font-weight:bold;font-size:0.9rem;color:#1e293b;">${isSolutions ? 'MODEL ANSWER KEY & DETAILED SOLUTIONS' : 'FINAL TERM ASSESSMENT EXAMINATION'} (MAY 2026)</p>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:2rem;font-size:0.9rem;border-bottom:1px solid #cbd5e1;padding-bottom:0.75rem;color:#475569;">
                    <span>Time: 3 Hours</span>
                    <span>Full Marks: 70</span>
                </div>
                <div style="color:#334155;">
                    <p style="font-style:italic;font-size:0.95rem;margin-bottom:1.5rem;">Answer Question No. 1 (Compulsory) and any FIVE from the remaining questions.</p>
                    
                    <h4 style="font-size:1.1rem;border-bottom:1px solid #64748b;padding-bottom:4px;margin-bottom:1rem;font-family:'Times New Roman', serif;color:#0f172a;">GROUP A (Compulsory - Multiple Choice Questions)</h4>
                    <ol style="margin-left:1.5rem;margin-bottom:2rem;">
                        <li style="margin-bottom:1.2rem;">
                            What is the tightest upper bound complexity for searching an element in a height-balanced AVL Tree of <i>n</i> nodes?
                            <br><b>(a)</b> O(1) &nbsp;&nbsp;&nbsp;&nbsp; <b>(b)</b> O(log n) &nbsp;&nbsp;&nbsp;&nbsp; <b>(c)</b> O(n) &nbsp;&nbsp;&nbsp;&nbsp; <b>(d)</b> O(n log n)
                            ${isSolutions ? '<br><span style="color:#0f766e;font-weight:600;font-size:0.85rem;display:inline-block;margin-top:5px;">💡 Correct Answer: (b) O(log n). Explanation: The height of an AVL tree with n nodes is strictly bounded by 1.44 log n. Hence, search, insertion, and deletion operate in O(log n) time.</span>' : ''}
                        </li>
                        <li style="margin-bottom:1.2rem;">
                            Which of the following sorting algorithms is stable and executes in guaranteed O(n log n) worst-case time complexity?
                            <br><b>(a)</b> Quick Sort &nbsp;&nbsp;&nbsp;&nbsp; <b>(b)</b> Bubble Sort &nbsp;&nbsp;&nbsp;&nbsp; <b>(c)</b> Merge Sort &nbsp;&nbsp;&nbsp;&nbsp; <b>(d)</b> Selection Sort
                            ${isSolutions ? '<br><span style="color:#0f766e;font-weight:600;font-size:0.85rem;display:inline-block;margin-top:5px;">💡 Correct Answer: (c) Merge Sort. Explanation: Merge Sort uses divide-and-conquer to guarantee O(n log n) comparisons in all cases while preserving relative order of duplicate elements.</span>' : ''}
                        </li>
                    </ol>

                    <h4 style="font-size:1.1rem;border-bottom:1px solid #64748b;padding-bottom:4px;margin-bottom:1rem;font-family:'Times New Roman', serif;color:#0f172a;">GROUP B (Short Answer Type Questions)</h4>
                    <ol start="3" style="margin-left:1.5rem;margin-bottom:2rem;">
                        <li style="margin-bottom:1.5rem;">
                            Explain with a neat schematic the RR rotation balancing mechanism in an AVL Tree. Detail the self-balancing balance factor properties.
                            ${isSolutions ? '<br><div style="background:#f8fafc;border:1px solid #e2e8f0;padding:1rem;border-radius:6px;font-family:monospace;font-size:0.85rem;margin-top:10px;line-height:1.4;color:#475569;">[A] (BF=+2)                     [B] (BF=0)<br> \\                             /  \\<br>  [B] (BF=+1)    == rotate ==> [A]  [C]<br>   \\<br>    [C] (BF=0)</div>' : ''}
                        </li>
                    </ol>
                </div>
            </div>
        `;
    }
    else if (name.endsWith(".c") || name.endsWith(".py") || name.endsWith(".js") || name.endsWith(".sql") || name.endsWith(".json")) {
        const code = getMockContentText(file);
        container.innerHTML = `<pre class="preview-text-container"><code>${escapeHtmlForPreview(code)}</code></pre>`;
    }
    else if (ext === "txt" || ext === "md") {
        const notes = getMockContentText(file);
        container.innerHTML = `<pre class="preview-text-container" style="color:var(--text-primary);font-family:var(--font-sans);font-size:0.95rem;white-space:pre-wrap;">${escapeHtmlForPreview(notes)}</pre>`;
    }
    else if (category === "Images" || ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp" || ext === "gif") {
        container.innerHTML = `
            <div style="text-align:center;">
                <svg width="600" height="400" viewBox="0 0 600 400" style="background:#0b0f19;border-radius:12px;border:1px solid rgba(255,255,255,0.08);box-shadow:0 8px 32px rgba(0,0,0,0.6);">
                    <defs>
                        <linearGradient id="orbGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.8" />
                            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.2" />
                        </linearGradient>
                        <linearGradient id="orbGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.8" />
                            <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.2" />
                        </linearGradient>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1"/>
                        </pattern>
                    </defs>
                    
                    <rect width="600" height="400" fill="url(#grid)" />
                    
                    <circle cx="150" cy="150" r="120" fill="url(#orbGrad1)" filter="blur(20px)" />
                    <circle cx="450" cy="250" r="100" fill="url(#orbGrad2)" filter="blur(25px)" />
                    
                    <g stroke="rgba(255,255,255,0.2)" stroke-width="2">
                        <line x1="300" y1="80" x2="200" y2="180" />
                        <line x1="300" y1="80" x2="400" y2="180" />
                        <line x1="200" y1="180" x2="130" y2="280" />
                        <line x1="200" y1="180" x2="270" y2="280" />
                    </g>
                    
                    <circle cx="300" cy="80" r="24" fill="#6366f1" stroke="rgba(255,255,255,0.8)" stroke-width="2" />
                    <text x="300" y="86" fill="white" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">AVL</text>
                    
                    <circle cx="200" cy="180" r="20" fill="#06b6d4" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
                    <text x="200" y="185" fill="white" font-family="sans-serif" font-size="12" text-anchor="middle">L</text>
                    
                    <circle cx="400" cy="180" r="20" fill="#8b5cf6" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
                    <text x="400" y="185" fill="white" font-family="sans-serif" font-size="12" text-anchor="middle">R</text>

                    <circle cx="130" cy="280" r="16" fill="#10b981" />
                    <circle cx="270" cy="280" r="16" fill="#f59e0b" />
                    
                    <text x="300" y="360" fill="#94a3b8" font-family="sans-serif" font-size="13" text-anchor="middle" font-weight="500">
                        ${name} (Image Preview Canvas)
                    </text>
                </svg>
            </div>
        `;
    }
    else if (category === "Videos" || category === "Music" || ext === "mp4" || ext === "webm" || ext === "mp3" || ext === "wav") {
        const isVideo = category === "Videos" || ext === "mp4" || ext === "webm";
        container.innerHTML = `
            <div style="background:#0b0f19;border-radius:12px;border:1px solid rgba(255,255,255,0.08);box-shadow:0 8px 32px rgba(0,0,0,0.6);width:100%;max-width:600px;padding:3rem 2rem;text-align:center;">
                <span style="font-size:5rem;display:block;margin-bottom:1.5rem;filter:drop-shadow(0 0 15px rgba(6,182,212,0.4));">
                    ${isVideo ? '🎬' : '🎵'}
                </span>
                <h3 style="color:var(--text-primary);margin-bottom:0.75rem;font-size:1.25rem;">${name}</h3>
                <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:2rem;font-family:var(--font-mono);">
                    SIMULATED AUDIO-VIDEO DECODER ACTIVE (JIS CS292 Module 2)
                </p>
                <div style="background:rgba(255,255,255,0.05);height:6px;border-radius:3px;margin:1rem auto;width:80%;position:relative;overflow:hidden;">
                    <div style="background:var(--accent-cyan);width:45%;height:100%;border-radius:3px;animation:pulseGlow 2s infinite;"></div>
                </div>
                <div style="display:flex;justify-content:center;gap:1.5rem;margin-top:1.5rem;">
                    <button class="btn btn-sm" style="background:rgba(255,255,255,0.05);border:none;padding:5px 15px;color:var(--text-primary);">◀◀ Rewind</button>
                    <button class="btn btn-sm btn-primary" style="padding:5px 20px;">⏸️ Play / Pause</button>
                    <button class="btn btn-sm" style="background:rgba(255,255,255,0.05);border:none;padding:5px 15px;color:var(--text-primary);">Fast-Fwd ▶▶</button>
                </div>
            </div>
        `;
    }
    else if (ext === "xlsx" || ext === "xls" || ext === "csv") {
        container.innerHTML = `
            <div style="background:rgba(16, 21, 36, 0.7);backdrop-filter:blur(15px);border:1px solid var(--border-glass);border-radius:12px;padding:2rem;width:100%;max-width:800px;box-shadow:0 8px 32px rgba(0,0,0,0.5);overflow-y:auto;max-height:100%;">
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-glass);padding-bottom:1rem;margin-bottom:1rem;">
                    <span style="font-weight:700;color:var(--accent-green);font-size:1.1rem;display:flex;align-items:center;gap:8px;">📊 SpreadSheet Mock: ${name}</span>
                    <span class="priority-badge low" style="text-transform:none;background:rgba(16,185,129,0.15);color:#34d399;">Excel Tabbed Format</span>
                </div>
                <table class="data-table" style="color:var(--text-primary);width:100%;text-align:left;">
                    <thead>
                        <tr>
                            <th style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.1);">Roll No</th>
                            <th style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.1);">Student Name</th>
                            <th style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.1);">CS202 Marks</th>
                            <th style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.1);">CS291 Marks</th>
                            <th style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.1);">Grade</th>
                            <th style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.1);">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">12000925001</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">Sourav Mukherjee</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-cyan);">94</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-cyan);">96</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-green);">O (Outstanding)</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">Class Representative</td></tr>
                        <tr><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">12000925002</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">Aniket Roy</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-cyan);">88</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-cyan);">90</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-green);">E (Excellent)</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">Top Performer</td></tr>
                        <tr><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">12000925003</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">Subham Sen</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-cyan);">75</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-cyan);">82</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-amber);">A (Very Good)</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">Regular attendee</td></tr>
                        <tr><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">12000925004</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">Priyanka Dey</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-cyan);">92</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-cyan);">95</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-green);">O (Outstanding)</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">Exceptional coder</td></tr>
                        <tr><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">12000925005</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">Rahul Das</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-cyan);">62</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-cyan);">70</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--accent-rose);">B (Average)</td><td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);">Needs code practice</td></tr>
                    </tbody>
                </table>
                <div style="margin-top:1.5rem;font-size:0.8rem;color:var(--text-muted);text-align:right;">
                    Sheet size: 5 Rows × 6 Columns | Formulas Computed: <code>SUM, AVERAGE</code>
                </div>
            </div>
        `;
    }
    else {
        container.innerHTML = `
            <div class="preview-placeholder-card">
                <span style="font-size:3.5rem;display:block;margin-bottom:1rem;">📂</span>
                <h3 style="margin-bottom:1rem;color:var(--accent-cyan);">${name}</h3>
                <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:1.5rem;line-height:1.5;">
                    This file format (<strong>.${ext.toUpperCase()}</strong>) represents a simulated data segment. 
                    No raw viewer is mapped for binary category Node blocks.
                </p>
                <button class="btn btn-primary" onclick="downloadFileContent(window.selectedFileForPreview)">⬇️ Download Simulated File</button>
            </div>
        `;
    }
}

function downloadFileContent(file) {
    if (window.localFilesMap && window.localFilesMap.has(file.name)) {
        const localFile = window.localFilesMap.get(file.name);
        const url = URL.createObjectURL(localFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`⬇️ Downloading raw file: ${file.name}`);
    } else if (window.currentJobId) {
        const url = `http://localhost:5000/api/preview?path=${encodeURIComponent(file.path)}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`⬇️ Initiated server download: ${file.name}`);
    } else {
        const mockText = getMockContentText(file);
        const blob = new Blob([mockText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`⬇️ Downloaded simulated file: ${file.name}`);
    }
}

function getMockContentText(file) {
    const name = file.name;
    const ext = file.ext;
    const category = file.category;

    if (name.endsWith(".c")) {
        return `/**
 * JIS College of Engineering (Kalyani)
 * Department of Computer Science & Engineering
 * Course: CS291 - Data Structures & Algorithms Lab (2nd Sem R25)
 * Assignment: Lab 5 - Doubly Linked List Stack Implementation
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Doubly Linked List Node Definition
typedef struct Node {
    char filename[256];
    long size;
    struct Node* prev;
    struct Node* next;
} Node;

// Stack Structure representing the Undo Stack
typedef struct Stack {
    Node* top;
    int size;
} Stack;

// Function to push a file operation onto the stack
void push(Stack* s, const char* name, long fileSize) {
    Node* newNode = (Node*)malloc(sizeof(Node));
    strcpy(newNode->filename, name);
    newNode->size = fileSize;
    newNode->prev = NULL;
    newNode->next = s->top;
    
    if (s->top != NULL) {
        s->top->prev = newNode;
    }
    s->top = newNode;
    s->size++;
    printf("[STACK TOP] Pushed file operation: %s (%ld Bytes)\\n", name, fileSize);
}

// Function to pop a file operation (Undo operation)
Node* pop(Stack* s) {
    if (s->top == NULL) {
        printf("Stack Underflow! No operation to reverse.\\n");
        return NULL;
    }
    Node* popped = s->top;
    s->top = s->top->next;
    if (s->top != NULL) {
        s->top->prev = NULL;
    }
    s->size--;
    return popped;
}

int main() {
    Stack undoStack = { .top = NULL, .size = 0 };
    printf("=========================================\\n");
    printf("🧠 NEUROSORT AI UNDO DLL STACK BENCHMARK\\n");
    printf("=========================================\\n");
    
    push(&undoStack, "midterm_solutions.pdf", 31257);
    push(&undoStack, "lecture_recording.mkv", 55057);
    
    Node* undone = pop(&undoStack);
    if (undone) {
        printf("🔄 reversed movement of %s successfully!\\n", undone->filename);
        free(undone);
    }
    
    return 0;
}`;
    }
    if (name.endsWith(".py")) {
        return `# =========================================================================
# Department of Computer Science & Engineering, JIS College of Engineering
# Course Code: CS202 / CS292 (Artificial Intelligence Lab)
# Task: AI Forward Chaining Expert Rule System for File Sorting
# =========================================================================

import re
import os

class Rule:
    def __init__(self, rule_id, name, category, subfolder, priority, keywords=None, extensions=None):
        self.rule_id = rule_id
        self.name = name
        self.category = category
        self.subfolder = subfolder
        self.priority = priority
        self.keywords = keywords or []
        self.extensions = extensions or []

# Build 18 Forward Chaining Rules
rules_database = [
    Rule(1, "Exam Detection", "Study_Hub", "Exams", "High", keywords=["exam", "final", "midterm", "quiz"]),
    Rule(2, "Assignment Detection", "Study_Hub", "Assignments", "Medium", keywords=["assignment", "homework", "lab", "project"]),
    Rule(3, "Notes Detection", "Study_Hub", "Notes", "Medium", keywords=["notes", "study", "lecture", "chapter"]),
    Rule(4, "PDF Document", "Documents", "", "Medium", extensions=["pdf"]),
    Rule(13, "Source Code", "Code", "", "Medium", extensions=["c", "py", "java", "js"])
]

def classify_file(filename):
    print(f"🤖 Percept Reading: '{filename}'")
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    
    # Forward chaining matching
    for rule in rules_database:
        # Check extensions
        if rule.extensions and ext in rule.extensions:
            return rule.category, rule.subfolder, rule.priority
        
        # Check keywords (Word Boundaries)
        if rule.keywords:
            for kw in rule.keywords:
                pattern = re.compile(rf'(?<![a-zA-Z0-9]){kw}(?![a-zA-Z0-9])', re.IGNORECASE)
                if pattern.search(filename):
                    return rule.category, rule.subfolder, rule.priority
                    
    return "Others", "", "Low"

if __name__ == '__main__':
    cat, sub, pri = classify_file("DSA_Final_Exam_2025.pdf")
    print(f"🎯 Actuator Trigger: Organized into Organized/{cat}/{sub} (Priority: {pri})")
`;
    }
    if (name.endsWith(".sql")) {
        return `-- =========================================================================
-- JIS College of Engineering (CSE R25 Regulation)
-- Course: CS291 - Database Management Systems Lab
-- Schema: NeuroSort AI Academic Audit Log Database
-- =========================================================================

CREATE TABLE IF NOT EXISTS classified_files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_extension VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    category_assigned VARCHAR(100) NOT NULL,
    subcategory_assigned VARCHAR(100),
    heuristic_score INT NOT NULL,
    ai_explanation TEXT,
    md5_hash VARCHAR(32) NOT NULL,
    organized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS undo_stack (
    op_id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT,
    source_path VARCHAR(512) NOT NULL,
    destination_path VARCHAR(512) NOT NULL,
    operation_status VARCHAR(50) DEFAULT 'MOVED',
    FOREIGN KEY (file_id) REFERENCES classified_files(file_id) ON DELETE CASCADE
);

-- Insert seed data matching BFS scans
INSERT INTO classified_files (filename, file_extension, file_size, category_assigned, subcategory_assigned, heuristic_score, md5_hash)
VALUES ('DSA_Final_Exam_2025.pdf', 'pdf', 3961, 'Study_Hub', 'Exams', 92, 'ae457cd3b94a11f237890cc3287dbca9');
`;
    }
    if (name.endsWith(".json")) {
        return `{
  "project": "NeuroSort AI",
  "version": "2.0.0",
  "environment": "JIS College of Engineering CSE B.Tech R25",
  "ai_heuristics": {
    "keyword_weight": 0.40,
    "recency_weight": 0.30,
    "size_weight": 0.20,
    "extension_weight": 0.10
  },
  "rules_count": 18,
  "supported_algorithms": [
    "Bubble Sort",
    "Insertion Sort",
    "Selection Sort",
    "Quick Sort",
    "Merge Sort",
    "Radix Sort"
  ],
  "server_config": {
    "port": 5000,
    "allow_cors": true,
    "default_folder": ".\\\\demo_messy_folder"
  }
}`;
    }
    if (name === "notes_chapter1.txt" || name === "notes_chapter2.txt" || name === "notes_chapter1_backup.txt") {
        return `========================================================================
📚 SUBJECT NOTES: DATA STRUCTURES & ALGORITHMS (CS291 MODULE 2)
========================================================================
TOPIC: HEAP STRUCTURES AND BINARY SEARCH TREES
SEMESTER: 2ND SEMESTER B.TECH CSE
REGULATION: JIS CSE R25 REGULATION

I. Introduction to Binary Search Tree (BST)
   - A Binary Search Tree is a node-based binary tree data structure which has the following properties:
     1. The left subtree of a node contains only nodes with keys lesser than the node's key.
     2. The right subtree of a node contains only nodes with keys greater than the node's key.
     3. The left and right subtree must each also be a binary search tree.
   - Search Time Complexity: O(log n) average, O(n) worst case (skewed tree).

II. The Self-Balancing AVL Tree Concept
   - Named after inventors Adelson-Velsky and Landis (1962).
   - Definition: A BST where the height difference (balance factor) between left and right subtrees of ANY node is at most 1.
   - Balance Factor (BF) = Height(Left_Subtree) - Height(Right_Subtree)
   - Permissible Balance Factors: {-1, 0, +1}
   - If balance factor is violated, one of four balancing rotations is executed:
     * LL Rotation (Single Right Rotation)
     * RR Rotation (Single Left Rotation)
     * LR Rotation (Double Rotation: Left then Right)
     * RL Rotation (Double Rotation: Right then Left)

III. Practical Applications
   - File directory system scanning and hierarchical node indexing.
   - Quick database indexing and balanced memory indexing allocations.
   - NeuroSort AI folder tree uses height-balanced tree structures to catalog your files in O(log n) time!

----------------------- END OF CHAPTER NOTES -----------------------`;
    }
    if (name === "quiz_answers.txt") {
        return `========================================================================
📝 ASSESSMENT ANSWER KEY: DATA STRUCTURES & ALGORITHMS QUIZ
========================================================================
DEPARTMENT OF CSE, JIS COLLEGE OF ENGINEERING
COURSE CODE: CS291 / CS292 (AI & DSA LABS)

[QUESTION 1]
What is the space complexity of Merge Sort?
Answer: O(n).
Explanation: Merge Sort requires an auxiliary array of size n to store merged halves during divide-and-conquer processing.

[QUESTION 2]
Explain the difference between Bubble Sort and Quick Sort.
Answer:
- Bubble Sort: Simple O(n^2) comparisons, highly stable, in-place, swaps adjacent elements repeatedly.
- Quick Sort: Highly efficient O(n log n) average complexity, unstable, in-place partition-based swap.

[QUESTION 3]
Define MD5 content hashing separate chaining duplicate detection.
Answer: MD5 produces a unique 128-bit hash key from file headers (O(1) time). By mapping these keys inside a Hash Table separate chain buckets, duplicate documents are detected instantly (within 1 ms)!

----------------------- END OF ANSWER KEY -----------------------`;
    }
    if (name === "study_guide_algorithms.pdf" || name === "tutorial_sorting.pdf" || name === "course_material_dsa.pdf" || name === "AI_Notes_Module3.pdf") {
        return `========================================================================
📘 COURSE SYLLABUS REFERENCE & TUTORIAL GUIDE
========================================================================
JIS COLLEGE OF ENGINEERING (DEPARTMENT OF CSE)
ACADEMIC REGULATION: JIS R25 2ND SEMESTER B.TECH BATCH

1. CS291 Module 3: BST & Balanced AVL Trees
   - Balance criteria check: Height-based trees.
   - AVL tree rotations detailed: Double rotation RL & LR balancing.
   
2. CS291 Module 4: 6 Sorting Benchmarks
   - Stability of sorting algorithms: Stable (Merge, Insertion, Bubble) vs Unstable (Quick, Selection).
   - Time & Space complexities comparison.

3. CS202 Module 3: Expert Forward Chaining Logic Systems
   - Formulating rules using logical predicates.
   - Keyword boundaries conflict-resolution heuristic matching.

This PDF study guide contains complete lectures, programming examples, and revision worksheets for exams.
------------------------------------------------------------------------`;
    }
    if (name === "semester_project_report.docx" || name === "lecture_slides.pptx" || name === "resume_2025.pdf") {
        return `========================================================================
🎓 ACADEMIC PROJECT REPORT & RESUME FILE
========================================================================
DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
JIS COLLEGE OF ENGINEERING (KALYANI)

REPORT TITLE: INTELLIGENT EXPERT SYSTEM FILE ORGANIZER (NEUROSORT AI)
SUBMITTED BY: B.Tech CSE (2nd Semester Student)
ACADEMIC YEAR: 2026

EXECUTIVE SUMMARY:
This academic project presents "NeuroSort AI", a robust full-stack desktop dashboard that parses raw messy directories, categorizes documents using an 18-rule AI expert inference engine, and catalogs them inside balanced AVL node trees. Benchmark graphs compare 6 sorting algorithms, while MD5 chains identify redundant files in O(1) time.

KEY FEATURES COMPLETED:
- BFS Queue local directory crawler.
- 18 forward chaining AI rules with HSL urgency scores.
- AVL self-balanced category hierarchy builder.
- DLL Stack visual undo system.
- O(1) duplicate chain inspector.
- In-browser glassmorphism fullscreen document previewer!

------------------------ END OF DOCUMENT SUMMARY ------------------------`;
    }
    return `========================================================================
📁 GENERIC FILE CONTENT AUDIT PREVIEW: ${name}
========================================================================
File Extension: .${ext ? ext.toUpperCase() : 'UNKNOWN'}
File Size: ${file.sizeFormatted || formatBytesForPreview(file.size)}
Category: ${category}

This file contains transient binary data. Open the raw file locally on your machine or click "Download File" to view the complete content.
------------------------------------------------------------------------`;
}
