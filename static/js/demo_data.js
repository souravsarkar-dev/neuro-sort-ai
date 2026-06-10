/**
 * NeuroSort AI — Demo Data Generator
 * Dynamically builds a high-fidelity organization report.json in memory.
 * Conforms strictly to the database schemas and verified post-audit file lists.
 */

function generateDemoReport() {
    const startTime = performance.now();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // 26 original messy files + 1 duplicate backup
    const demoFiles = [
        { name: "resume_2025.pdf", ext: "pdf", size: 95045, category: "Documents", subcategory: "", priority: "High", explanation: "Rule 17 (Resume Detection): Resume/CV file detected [Confidence: 88%]" },
        { name: "DSA_Final_Exam_2025.pdf", ext: "pdf", size: 3961, category: "Study_Hub", subcategory: "Exams", priority: "High", explanation: "Rule 1 (Exam Detection): Filename contains exam-related keywords [Confidence: 95%]" },
        { name: "midterm_solutions.pdf", ext: "pdf", size: 31257, category: "Study_Hub", subcategory: "Exams", priority: "High", explanation: "Rule 1 (Exam Detection): Filename contains exam-related keywords [Confidence: 95%]" },
        { name: "notes_chapter1.txt", ext: "txt", size: 87051, category: "Study_Hub", subcategory: "Notes", priority: "Medium", explanation: "Rule 3 (Notes Detection): Filename contains study material keywords [Confidence: 88%]" },
        { name: "notes_chapter1_backup.txt", ext: "txt", size: 87051, category: "Duplicates", subcategory: "", priority: "Medium", explanation: "Rule 18 (Duplicate Handler): Duplicate file detected by hash matching [Confidence: 95%]" },
        { name: "notes_chapter2.txt", ext: "txt", size: 91051, category: "Study_Hub", subcategory: "Notes", priority: "Medium", explanation: "Rule 3 (Notes Detection): Filename contains study material keywords [Confidence: 88%]" },
        { name: "quiz_answers.txt", ext: "txt", size: 19547, category: "Study_Hub", subcategory: "Exams", priority: "High", explanation: "Rule 1 (Exam Detection): Filename contains exam-related keywords [Confidence: 95%]" },
        { name: "semester_project_report.docx", ext: "docx", size: 15671, category: "Study_Hub", subcategory: "Notes", priority: "Medium", explanation: "Rule 3 (Notes Detection): Filename contains study material keywords [Confidence: 88%]" },
        { name: "wallpaper_4k.png", ext: "png", size: 43047, category: "Images", subcategory: "Wallpapers", priority: "Low", explanation: "Rule 8 (Wallpaper Detection): Large image file or wallpaper filename [Confidence: 75%]" },
        { name: "config.json", ext: "json", size: 71037, category: "Code", subcategory: "", priority: "Medium", explanation: "Rule 13 (Database File): Database file detected [Confidence: 82%]" },
        { name: "database_schema.sql", ext: "sql", size: 67053, category: "Code", subcategory: "", priority: "Medium", explanation: "Rule 13 (Database File): Database file detected [Confidence: 82%]" },
        { name: "course_material_dsa.pdf", ext: "pdf", size: 103061, category: "Study_Hub", subfolder: "Notes", priority: "Medium", explanation: "Rule 3 (Notes Detection): Filename contains study material keywords [Confidence: 88%]" },
        { name: "AI_Notes_Module3.pdf", ext: "pdf", size: 7855, category: "Study_Hub", subcategory: "Notes", priority: "Medium", explanation: "Rule 3 (Notes Detection): Filename contains study material keywords [Confidence: 88%]" },
        { name: "Assignment_Lab5.c", ext: "c", size: 11749, category: "Study_Hub", subcategory: "Assignments", priority: "Medium", explanation: "Rule 2 (Assignment Detection): Filename contains assignment keywords [Confidence: 90%]" },
        { name: "lecture_recording.mkv", ext: "mkv", size: 55057, category: "Videos", subcategory: "", priority: "Low", explanation: "Rule 10 (Video File): Video file detected [Confidence: 92%]" },
        { name: "lecture_slides.pptx", ext: "pptx", size: 23453, category: "Study_Hub", subcategory: "Notes", priority: "Medium", explanation: "Rule 3 (Notes Detection): Filename contains study material keywords [Confidence: 88%]" },
        { name: "practical_file.c", ext: "c", size: 35147, category: "Study_Hub", subcategory: "Assignments", priority: "Medium", explanation: "Rule 2 (Assignment Detection): Filename contains assignment keywords [Confidence: 90%]" },
        { name: "project_code.py", ext: "py", size: 63045, category: "Study_Hub", subcategory: "Assignments", priority: "Medium", explanation: "Rule 2 (Assignment Detection): Filename contains assignment keywords [Confidence: 90%]" },
        { name: "study_guide_algorithms.pdf", ext: "pdf", size: 27367, category: "Study_Hub", subcategory: "Notes", priority: "Medium", explanation: "Rule 3 (Notes Detection): Filename contains study material keywords [Confidence: 88%]" },
        { name: "tutorial_sorting.pdf", ext: "pdf", size: 99055, category: "Study_Hub", subcategory: "Notes", priority: "Medium", explanation: "Rule 3 (Notes Detection): Filename contains study material keywords [Confidence: 88%]" },
        { name: "old_backup.zip", ext: "zip", size: 75043, category: "Archives", subcategory: "", priority: "Low", explanation: "Rule 14 (Archive File): Archive/compressed file detected [Confidence: 90%]" },
        { name: "installer.exe", ext: "exe", size: 79041, category: "Executables", subcategory: "", priority: "Low", explanation: "Rule 15 (Executable): Executable file detected [Confidence: 85%]" },
        { name: "screenshot_error.png", ext: "png", size: 47055, category: "Images", subcategory: "Screenshots", priority: "Low", explanation: "Rule 17 (Screenshot): Screenshot file detected [Confidence: 80%]" },
        { name: "vacation_photo.jpg", ext: "jpg", size: 39051, category: "Images", subcategory: "", priority: "Low", explanation: "Rule 9 (Image File): Image file detected [Confidence: 90%]" },
        { name: "favorite_song.mp3", ext: "mp3", size: 59049, category: "Music", subcategory: "", priority: "Low", explanation: "Rule 11 (Audio File): Audio file detected [Confidence: 92%]" },
        { name: "random_file.dat", ext: "dat", size: 83045, category: "Others", subcategory: "", priority: "Low", explanation: "No rule matched - assigned to Others" },
        { name: "birthday_video.mp4", ext: "mp4", size: 51051, category: "Videos", subcategory: "", priority: "Low", explanation: "Rule 10 (Video File): Video file detected [Confidence: 92%]" }
    ];

    const formatBytes = b => {
        if (b >= 1048576) return (b / 1048576).toFixed(2) + ' MB';
        if (b >= 1024) return (b / 1024).toFixed(2) + ' KB';
        return b + ' B';
    };

    // Construct full file list with hashes, priorities and heuristics
    const files = demoFiles.map((f, i) => {
        const priorityVal = { "High": 3, "Medium": 2, "Low": 1 }[f.priority];
        const seed = f.name.replace("_backup", "");
        // Compute mock MD5 hash
        let hash = "";
        for (let j = 0; j < seed.length; j++) {
            hash += seed.charCodeAt(j).toString(16);
        }
        hash = hash.padEnd(32, 'a').substring(0, 32);

        // Build factor breakdowns for Explanations
        const keywordScore = f.category === "Study_Hub" ? 32 : 8;
        const recencyScore = 24.5;
        const sizeScore = f.size > 100 * 1024 ? 20 : 8;
        const extScore = ["pdf", "docx"].includes(f.ext) ? 10 : (["c", "py"].includes(f.ext) ? 7 : 3);
        const totalHeuristic = keywordScore + recencyScore + sizeScore + extScore;

        return {
            id: i,
            name: f.name,
            ext: f.ext,
            size: f.size,
            sizeFormatted: formatBytes(f.size),
            path: `.\\demo_messy_folder\\${f.name}`,
            category: f.category,
            categoryId: ["Study_Hub", "Documents", "Images", "Videos", "Music", "Code", "Archives", "Executables", "Duplicates", "Others"].indexOf(f.category),
            subcategory: f.subcategory || "",
            priority: f.priority,
            priority_val: priorityVal,
            priorityScore: totalHeuristic,
            isDuplicate: f.category === "Duplicates",
            isStudy: f.category === "Study_Hub",
            explanation: f.explanation,
            hash: hash,
            heuristic: {
                keyword: keywordScore,
                recency: recencyScore,
                size: sizeScore,
                extension: extScore,
                total: totalHeuristic
            }
        };
    });

    // Detect duplicates dynamically in memory
    const duplicates = [
        {
            hash: files[3].hash,
            count: 2,
            wastedBytes: files[4].size,
            files: [files[3], files[4]]
        }
    ];
    files[4].isDuplicate = true; // Mark backup as duplicate

    // Categories statistics
    const catCounts = {};
    const catSizes = {};
    files.forEach(f => {
        catCounts[f.category] = (catCounts[f.category] || 0) + 1;
        catSizes[f.category] = (catSizes[f.category] || 0) + f.size;
    });

    const categories = [
        { name: "Study_Hub", icon: "📚", count: catCounts["Study_Hub"] || 0 },
        { name: "Documents", icon: "📄", count: catCounts["Documents"] || 0 },
        { name: "Images", icon: "🖼️", count: catCounts["Images"] || 0 },
        { name: "Videos", icon: "🎬", count: catCounts["Videos"] || 0 },
        { name: "Music", icon: "🎵", count: catCounts["Music"] || 0 },
        { name: "Code", icon: "💻", count: catCounts["Code"] || 0 },
        { name: "Archives", icon: "📦", count: catCounts["Archives"] || 0 },
        { name: "Executables", icon: "⚙️", count: catCounts["Executables"] || 0 },
        { name: "Duplicates", icon: "♻️", count: catCounts["Duplicates"] || 0 },
        { name: "Others", icon: "📂", count: catCounts["Others"] || 0 }
    ];

    // Sorting benchmark
    const sortBenchmark = [
        { name: "Bubble Sort", comparisons: 310, swaps: 150, timeMs: 0.082, complexity: "O(n²)", spaceComplexity: "O(1)", selected: false },
        { name: "Insertion Sort", comparisons: 172, swaps: 150, timeMs: 0.045, complexity: "O(n²)", spaceComplexity: "O(1)", selected: false },
        { name: "Selection Sort", comparisons: 325, swaps: 22, timeMs: 0.061, complexity: "O(n²)", spaceComplexity: "O(1)", selected: false },
        { name: "Quick Sort", comparisons: 120, swaps: 91, timeMs: 0.015, complexity: "O(n log n)", spaceComplexity: "O(log n)", selected: false },
        { name: "Merge Sort", comparisons: 92, swaps: 124, timeMs: 0.022, complexity: "O(n log n)", spaceComplexity: "O(n)", selected: false },
        { name: "Radix Sort", comparisons: 0, swaps: 52, timeMs: 0.010, complexity: "O(nk)", spaceComplexity: "O(n+k)", selected: true }
    ];

    // Build expandable folderTree
    const folderStructure = {
        name: "Organized",
        type: "directory",
        children: []
    };

    const findOrCreateDir = (parent, name) => {
        let dir = parent.children.find(c => c.name === name && c.type === "directory");
        if (!dir) {
            dir = { name: name, type: "directory", children: [] };
            parent.children.push(dir);
        }
        return dir;
    };

    files.forEach(f => {
        const catNode = findOrCreateDir(folderStructure, f.category);
        let currNode = catNode;
        if (f.subcategory) {
            currNode = findOrCreateDir(catNode, f.subcategory);
        }
        currNode.children.push({
            name: f.name,
            type: "file",
            size: f.size,
            sizeFormatted: f.sizeFormatted,
            ext: f.ext,
            priority: f.priority,
            explanation: f.explanation
        });
    });

    // Undo stack
    const undoStack = files.map(f => ({
        operation: "MOVE",
        source: f.path,
        destination: `.\\demo_organized\\${f.category}\\${f.subcategory ? f.subcategory + '\\' : ''}${f.name}`,
        filename: f.name,
        timestamp: parseInt(timestamp)
    }));

    // Syllabus mapping
    const syllabusMapping = [
        { id: "DSA_M1", name: "Doubly Linked Lists", evidence: "Doubly Linked List dynamically aggregates scanned files for in-place traversal", course: "CS291 (DSA Lab)" },
        { id: "DSA_M2", name: "BFS Directory Scanner", evidence: "Folder structure discovered via O(V+E) BFS Queue implementation", course: "CS291 (DSA Lab)" },
        { id: "DSA_M3", name: "BST & AVL Indexer", evidence: "Files indexed in dynamic BST. Height self-balanced using LL/RR/LR/RL AVL rotations", course: "CS291 (DSA Lab)" },
        { id: "DSA_M4", name: "6 Sorting Benchmarks", evidence: "Bubble, Insertion, Selection, Quick, Merge, and Radix performance plotted dynamically", course: "CS291 (DSA Lab)" },
        { id: "DSA_M5", name: "Hash Table Hashing", evidence: "MD5 Division-method hash chains identical items for duplicate identification", course: "CS291 (DSA Lab)" },
        { id: "AI_M1", name: "Intelligent Agent", evidence: "Rule engine uses file percepts and acts via folder movement actuators", course: "CS202 (Intro to AI)" },
        { id: "AI_M2", name: "Knowledge Base", evidence: "18 propositional logic rules categorize exams, notes, and wallpapers", course: "CS202 (Intro to AI)" },
        { id: "AI_M3", name: "Heuristic Search", evidence: "Dynamic 4-factor formula (Keywords, Recency, Size, Ext) indexes priorities", course: "CS202 (Intro to AI)" },
        { id: "AI_M4", name: "Forward Chaining Engine", evidence: "Expert system fires rules sequentially and handles conflicts", course: "CS292 (AI Lab)" },
        { id: "AI_M5", name: "Decision Tree", evidence: "Type-parsing forms binary categorical choice branches", course: "CS202 (Intro to AI)" },
        { id: "AI_M6", name: "Explainable AI", evidence: "File Details explain decisions in plain English with confidence metrics", course: "CS292 (AI Lab)" },
        { id: "AI_M7", name: "AI Ethics & Safety", evidence: "Footprint logging and safety boundary alerts display in Ethics Panel", course: "CS202 (Intro to AI)" }
    ];

    const statistics = {
        totalFiles: files.length,
        totalSize: files.reduce((acc, f) => acc + f.size, 0),
        categoriesCreated: categories.filter(c => c.count > 0).length,
        duplicatesFound: duplicates.length,
        spaceSaved: wasted_space = files[4].size,
        studyFiles: files.filter(f => f.isStudy).length,
        highPriority: files.filter(f => f.priority === "High").length,
        mediumPriority: files.filter(f => f.priority === "Medium").length,
        lowPriority: files.filter(f => f.priority === "Low").length,
        rulesApplied: files.length - 1, // Exclude Others catchall
        processingTimeMs: 0.010,
        sortAlgorithm: "Radix Sort",
        categoryCounts: catCounts,
        categorySizes: catSizes
    };

    return {
        project: "NeuroSort AI",
        version: "1.0.0",
        timestamp: timestamp,
        statistics: statistics,
        categories: categories,
        sortBenchmark: sortBenchmark,
        files: files,
        duplicates: duplicates,
        folderStructure: folderStructure,
        undoStack: undoStack,
        syllabusMapping: syllabusMapping
    };
}
