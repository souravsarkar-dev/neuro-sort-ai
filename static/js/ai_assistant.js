/**
 * NeuroSort AI — Premium Conversational AI Assistant
 * Context-aware, workspace-integrated, situation-based responses
 * Works with the new sidebar + panel layout
 */

// ── Global API functions used by HTML buttons ──
function toggleAIChat() {
    if (window.aiAssistant) window.aiAssistant.toggleChat();
}
function sendAIMessage() {
    if (window.aiAssistant) window.aiAssistant.sendMessage();
}
function sendAISuggestion(btn) {
    if (window.aiAssistant) window.aiAssistant.sendFromSuggestion(btn.innerText);
}

class NeuroSortAIAssistant {
    constructor() {
        this.isOpen = false;
        this.chatHistory = [];
        this.typingTimeout = null;
        this.init();
    }

    init() {
        // Panel already in HTML – just reference it
        this.panel = document.getElementById('aiChatPanel');
        this.btn = document.getElementById('aiAssistantBtn');
        this.messagesEl = document.getElementById('aiChatMessages');
        this.inputEl = document.getElementById('aiChatInput');
    }

    toggleChat() {
        if (!this.panel || !this.btn) return;
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            this.panel.classList.add('active');
            this.btn.classList.add('active');
            this.btn.innerHTML = '×';
            this.btn.style.fontSize = '1.5rem';
            setTimeout(() => { if (this.inputEl) this.inputEl.focus(); }, 150);
        } else {
            this.panel.classList.remove('active');
            this.btn.classList.remove('active');
            this.btn.innerHTML = '🧠';
            this.btn.style.fontSize = '';
        }
    }

    sendMessage() {
        if (!this.inputEl) return;
        const msg = this.inputEl.value.trim();
        if (!msg) return;
        this.inputEl.value = '';
        this.processUserMessage(msg);
    }

    sendFromSuggestion(text) {
        this.processUserMessage(text);
    }

    processUserMessage(msg) {
        this.addMessage('user', msg);
        this.chatHistory.push({ role: 'user', content: msg });

        const typingId = this.showTyping();
        const delay = 600 + Math.floor(Math.random() * 700);

        setTimeout(() => {
            this.removeTyping(typingId);
            const response = this.getContextualResponse(msg);
            this.addMessage('assistant', response);
            this.chatHistory.push({ role: 'assistant', content: response });
        }, delay);
    }

    getContextualResponse(msg) {
        const q = msg.toLowerCase();
        const report = window.reportData || null;

        // ─── WORKSPACE COMMANDS ───
        if (q.includes('load demo') || q === 'demo') {
            setTimeout(() => {
                if (typeof loadDemoData === 'function') loadDemoData();
            }, 200);
            return '⚡ Loading the demo workspace now! I\'m populating the dashboard with 27 academic files categorized across Study_Hub, Documents, Code, Images and more — using all 18 AI classification rules.';
        }

        if (q.includes('undo') || (q.includes('revert') && q.includes('file'))) {
            if (!report || !report.undoStack || report.undoStack.length === 0) {
                return '↩️ The undo stack is currently empty. Once files are sorted, each move operation is pushed onto a Doubly Linked List stack. Use Ctrl+Z or the Undo button to pop and reverse the last file movement in O(1) time.';
            }
            const top = report.undoStack[report.undoStack.length - 1];
            return `↩️ I can see the undo stack has ${report.undoStack.length} operation(s). The most recent is: moving **${top.filename}**. Click "Undo Last" or press Ctrl+Z to reverse it using the DLL LIFO mechanism.`;
        }

        // ─── DATA STRUCTURE QUESTIONS ───
        if (q.includes('avl') || (q.includes('tree') && q.includes('balanced'))) {
            return this.explainAVL();
        }

        if (q.includes('bfs') || q.includes('breadth first') || (q.includes('folder') && q.includes('scan'))) {
            return this.explainBFS();
        }

        if (q.includes('md5') || q.includes('hash') || q.includes('duplicate')) {
            return this.explainMD5(report);
        }

        if (q.includes('linked list') || q.includes('dll') || q.includes('doubly linked')) {
            return this.explainDLL();
        }

        // ─── SORTING ALGORITHM QUESTIONS ───
        if (q.includes('quick sort') && (q.includes('merge') || q.includes('vs') || q.includes('compare'))) {
            return this.compareQuickMerge();
        }

        if (q.includes('bubble sort')) {
            return '🫧 **Bubble Sort**: O(n²) time, O(1) space. It\'s the slowest algorithm in NeuroSort — repeatedly swapping adjacent elements until sorted. Useful for educational demonstration but impractical for large file sets. In our 27-file benchmark, it\'s ~3-5x slower than Merge Sort.';
        }

        if (q.includes('quick sort') || q.includes('quicksort')) {
            return '⚡ **Quick Sort**: Average O(n log n), worst-case O(n²). NeuroSort uses it as the default algorithm — it\'s in-place (O(log n) space) and fastest in practice. Selects a pivot, partitions, and recurses. Unstable but extremely cache-friendly on file name arrays.';
        }

        if (q.includes('merge sort') || q.includes('mergesort')) {
            return '🔀 **Merge Sort**: Guaranteed O(n log n) time, O(n) space. Stable sort — preserves relative order of equal-priority files. NeuroSort uses this when stability matters (e.g., preserving modification-time order within same category). Divide-and-conquer recursive strategy.';
        }

        if (q.includes('radix sort') || q.includes('radix')) {
            return '🔢 **Radix Sort**: O(nk) — where k is the max key length (filename length). Non-comparison sort, fastest for fixed-length strings! NeuroSort applies it to sort filenames lexicographically. Runs digit-by-digit using counting sort as subroutine.';
        }

        if (q.includes('insertion sort') || q.includes('selection sort')) {
            if (q.includes('insertion')) {
                return '📌 **Insertion Sort**: O(n²) worst, O(n) best (nearly sorted lists). NeuroSort uses it for small subsets (<10 files). Stable, in-place, and outperforms Quick Sort on tiny arrays due to low overhead.';
            }
            return '🎯 **Selection Sort**: O(n²) always, O(1) space. Finds minimum each pass. Useful in memory-constrained systems but slower than Insertion Sort in practice. NeuroSort includes it for algorithmic completeness.';
        }

        if (q.includes('sort') && (q.includes('algorithm') || q.includes('benchmark') || q.includes('complexity'))) {
            return this.explainSorting(report);
        }

        // ─── PRIORITY / FILES ───
        if ((q.includes('high priority') || q.includes('most important')) && q.includes('file')) {
            return this.getHighPriorityFiles(report);
        }

        if (q.includes('how many file') || q.includes('total file') || (q.includes('count') && q.includes('file'))) {
            if (!report) return '📄 No workspace loaded yet. Click ⚡ Load Demo or upload a folder to begin analysis.';
            return `📄 Your current workspace contains **${report.statistics.totalFiles} files** organized across **${report.statistics.categoriesCreated} categories**. The AI assigned priorities: 🔴 High: ${report.statistics.highPriority || 0} | 🟡 Medium: ${report.statistics.mediumPriority || 0} | 🟢 Low: ${report.statistics.lowPriority || 0}.`;
        }

        if (q.includes('categor') || (q.includes('how') && q.includes('classify'))) {
            return '🏷️ NeuroSort classifies files using **18 forward-chaining AI rules** with word-boundary pattern matching. Each rule checks filename keywords (e.g., "exam", "assignment", "lecture") and extension types. The rule with highest heuristic score wins and assigns the file to a category like Study_Hub/Exams, Documents, Code, Images, etc.';
        }

        if (q.includes('heuristic') || q.includes('score') || q.includes('weighting')) {
            return '🧮 **Multi-Factor Heuristic Scoring** (0–100 total):\n\n• 📚 Keyword Relevance (40%) — how strongly filename matches AI rule keywords\n• 🕒 Recency Weight (30%) — newer files get priority\n• 💾 Size Importance (20%) — larger files tend to be more significant\n• 📄 Extension Bonus (10%) — academic formats (PDF, DOCX) score higher\n\nEach file\'s priority tier (High/Medium/Low) is derived from its total score.';
        }

        // ─── EXPERT SYSTEM ───
        if (q.includes('expert system') || q.includes('forward chain') || (q.includes('rule') && q.includes('ai'))) {
            return '🤖 NeuroSort\'s AI core is a **Forward Chaining Expert System** — a classic AI technique from the CS202 syllabus. It works like this:\n\n1. **Percept**: Read the filename into working memory\n2. **Inference Engine**: Fire all 18 rules simultaneously (Pattern Matching)\n3. **Conflict Resolution**: Highest heuristic score wins\n4. **Actuator**: Move file to categorized destination\n\nThis is PEAS architecture applied to file management!';
        }

        // ─── PROJECT INFO ───
        if (q.includes('project') || (q.includes('about') && q.includes('neurosort'))) {
            return '🧠 **NeuroSort AI** is an intelligent academic file organizer developed at JIS College of Engineering (Kalyani). It implements:\n\n• **Expert System** (CS202/CS292): 18 forward-chaining AI rules\n• **Data Structures** (CS291): AVL Trees, Linked Lists, Hash Tables\n• **Algorithms**: BFS folder scanning, 6 sorting benchmarks\n• **Security**: MD5 duplicate detection, local-only processing\n\nBuilt as a B.Tech CSE R25 project demonstrating real-world AI + DSA integration.';
        }

        if (q.includes('who made') || q.includes('who built') || q.includes('developer') || q.includes('author')) {
            return '👨‍💻 NeuroSort AI was developed by a B.Tech CSE student at **JIS College of Engineering, Kalyani** (Regulation R25, 2nd Semester). It integrates CS202 (AI Expert Systems), CS291 (Data Structures) and CS292 (AI Lab) course work into a unified real-world application.';
        }

        if (q.includes('jis') || q.includes('college') || q.includes('syllabus')) {
            return '🎓 NeuroSort AI maps directly to the **JIS College R25 CSE Syllabus**:\n\n• **CS202** — Artificial Intelligence: Expert System, PEAS model\n• **CS291** — Data Structures: AVL Trees, DLL Stack, Hash Tables\n• **CS292** — AI Lab: Forward chaining rule implementation\n\nEvery feature you see is backed by a specific course module!';
        }

        // ─── CONTEXT-AWARE WORKSPACE ───
        if (report) {
            if (q.includes('duplicate') || q.includes('identical')) {
                return this.explainMD5(report);
            }
            if (q.includes('statistics') || q.includes('summary') || q.includes('overview')) {
                const s = report.statistics;
                return `📊 **Current Workspace Summary**:\n• Files: ${s.totalFiles}\n• Categories: ${s.categoriesCreated}\n• Duplicates found: ${s.duplicatesFound}\n• Space saved: ${s.spaceSaved ? (s.spaceSaved / 1024).toFixed(1) + ' KB' : '0'}\n• Best algorithm: ${s.sortAlgorithm}\n• Processing time: ${s.processingTimeMs?.toFixed(3)} ms\n\nAll 18 classification rules executed successfully.`;
            }
        }

        // ─── GENERAL FALLBACK ───
        return this.getGenericResponse(q);
    }

    explainAVL() {
        return `🌳 **AVL Tree — Self-Balancing BST**

NeuroSort uses AVL trees to maintain the category folder structure in O(log n) lookup/insert time.

**Balance Factor** = Height(Left) − Height(Right)
• Must be in {−1, 0, +1} at every node

**4 Rotation Types**:
• LL: Single right rotation
• RR: Single left rotation  
• LR: Left then right rotation
• RL: Right then left rotation

**Why AVL over regular BST?** Without balancing, BST degrades to O(n) on sorted input (skewed tree). AVL guarantees O(log n) always! In NeuroSort, each category node is an AVL leaf, so file lookups stay fast even with 1000+ files.`;
    }

    explainBFS() {
        return `📡 **BFS — Breadth-First Graph Scanning**

NeuroSort crawls your messy folder using a **BFS Queue-based traversal**:

\`\`\`
Queue: [root_folder]
While queue not empty:
  folder = queue.dequeue()
  for each item in folder:
    if directory: queue.enqueue(item)
    if file: classify_with_AI_rules(item)
\`\`\`

**Why BFS over DFS?** BFS processes all files at each folder level before going deeper — this allows early termination (stop after finding all top-level important files) and guarantees we don't miss any nested files. Time complexity: **O(V + E)** where V = folders, E = files.`;
    }

    explainMD5(report) {
        if (report && report.duplicates && report.duplicates.length > 0) {
            const total = report.duplicates.reduce((a, d) => a + d.files.length - 1, 0);
            const wasted = report.duplicates.reduce((a, d) => a + (d.wastedBytes || 0), 0);
            return `♻️ **MD5 Duplicate Detection — Active Results**

Found **${report.duplicates.length} duplicate group(s)** with **${total} redundant file(s)** wasting **${(wasted / 1024).toFixed(1)} KB**.

**How MD5 works in NeuroSort**:
1. Read first 64KB of each file (file header fingerprint)
2. Compute MD5 hash → 128-bit fixed-length string
3. Store in Hash Table with separate chaining
4. O(1) average lookup — collision = duplicate detected!

The hash table bucket collision method ensures even similarly-named but different files are correctly distinguished.`;
        }
        return `♻️ **MD5 Hash Duplicate Detection**

MD5 generates a 128-bit fingerprint from file content. NeuroSort uses this in a **Hash Table with separate chaining** for O(1) duplicate detection:

• Same hash → same content → DUPLICATE
• Different hashes → different files (no false positives)
• 2^128 possible values → practically collision-free

Load the demo workspace to see real duplicate detection in action!`;
    }

    explainDLL() {
        return `🔗 **Doubly Linked List — Undo Stack**

Every file movement is pushed onto a DLL-based stack:

\`\`\`
Node: {filename, src, dst, prev→, next→}
STACK TOP ← most recent operation
\`\`\`

**Operations**:
• Push (move file): O(1) — add to front
• Pop (undo): O(1) — remove from front
• Peek: O(1) — read top without removing

The DLL allows bidirectional traversal (both undo history AND redo if needed). In NeuroSort, this powers the Ctrl+Z undo functionality visible in the Undo Stack section.`;
    }

    compareQuickMerge() {
        return `⚔️ **Quick Sort vs Merge Sort**

| Feature | Quick Sort | Merge Sort |
|---------|-----------|------------|
| Avg Time | O(n log n) | O(n log n) |
| Worst | O(n²) | O(n log n) |
| Space | O(log n) | O(n) |
| Stable | ❌ No | ✅ Yes |
| In-Place | ✅ Yes | ❌ No |

**NeuroSort choice**: Quick Sort for raw speed in practice; Merge Sort when preserving time-based file order matters. For the 27-file demo, Quick Sort wins the benchmark by ~0.05ms.`;
    }

    explainSorting(report) {
        if (report && report.sortBenchmark) {
            const best = report.sortBenchmark.reduce((a, b) => a.timeMs < b.timeMs ? a : b);
            const worst = report.sortBenchmark.reduce((a, b) => a.timeMs > b.timeMs ? a : b);
            return `📊 **Live Benchmark Results** (${report.statistics.totalFiles} files):

🥇 Fastest: **${best.name}** — ${best.timeMs.toFixed(4)}ms (${best.complexity})
🐢 Slowest: **${worst.name}** — ${worst.timeMs.toFixed(4)}ms (${worst.complexity})

NeuroSort selected **${report.statistics.sortAlgorithm}** as the optimal algorithm. The benchmark visually shows the performance gap between O(n²) algorithms (Bubble, Insertion, Selection) and O(n log n) algorithms (Merge, Quick) and O(nk) (Radix). Check the bar chart above for the full comparison!`;
        }
        return `📊 **6 Sorting Algorithms Benchmarked in NeuroSort**:

| Algorithm | Time | Space | Stable |
|-----------|------|-------|--------|
| Bubble | O(n²) | O(1) | ✅ |
| Insertion | O(n²) | O(1) | ✅ |
| Selection | O(n²) | O(1) | ❌ |
| Merge | O(n log n) | O(n) | ✅ |
| Quick | O(n log n) | O(log n) | ❌ |
| Radix | O(nk) | O(n+k) | ✅ |

Load the demo to see live timing comparisons in the bar chart!`;
    }

    getHighPriorityFiles(report) {
        if (!report || !report.files) {
            return '📊 No workspace loaded. Load the demo to see high-priority file analysis.';
        }
        const highFiles = report.files.filter(f => f.priority === 'High');
        if (highFiles.length === 0) {
            return '✅ No high-priority files detected in current workspace.';
        }
        const list = highFiles.slice(0, 5).map(f => `• **${f.name}** (${f.priorityScore}/100) — ${f.category}`).join('\n');
        return `🔴 **High Priority Files** (${highFiles.length} total):\n\n${list}${highFiles.length > 5 ? `\n\n...and ${highFiles.length - 5} more. Click any file in the table to see detailed heuristic breakdown.` : '\n\nClick any file name to view its full AI diagnostic report.'}`;
    }

    getGenericResponse(q) {
        const responses = [
            `That's an interesting question! NeuroSort AI specializes in file organization using Expert Systems (CS202), AVL Trees (CS291), BFS scanning, MD5 hashing, and 6 sorting algorithms. Could you be more specific? Try asking about: AVL rotations, BFS scanning, duplicate detection, or which files are high priority in your workspace.`,
            `I can see you're asking about "${q.substring(0, 40)}...". I'm NeuroSort's context-aware assistant — I work best with questions about: 📊 algorithm performance, 🌳 data structures, 🤖 expert system rules, ♻️ duplicate detection, or 📁 your current workspace files. What specifically would you like to explore?`,
            `Great question! For context — NeuroSort AI processes files through 4 stages: (1) BFS folder scanning, (2) 18-rule AI classification, (3) AVL tree organization, and (4) sorting benchmark. Which stage would you like me to explain in detail?`,
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    addMessage(role, text) {
        if (!this.messagesEl) return;

        const div = document.createElement('div');
        div.className = `ai-chat-message ${role}`;

        // Format text: **bold**, code blocks, etc.
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<div class="chat-code-block">$1</div>')
            .replace(/`([^`]+)`/g, '<span class="chat-inline-code">$1</span>')
            .replace(/\n/g, '<br>');

        div.innerHTML = formatted;
        this.messagesEl.appendChild(div);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    showTyping() {
        if (!this.messagesEl) return null;
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.className = 'ai-chat-message assistant typing';
        div.id = id;
        div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        this.messagesEl.appendChild(div);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        return id;
    }

    removeTyping(id) {
        if (!id) return;
        const el = document.getElementById(id);
        if (el) el.remove();
    }
}

// Init after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new NeuroSortAIAssistant();
});
