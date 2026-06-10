import time
import os
from engine.tree_indexer import build_folder_tree

def format_size(bytes_val):
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_val < 1024.0:
            return f"{bytes_val:.2f} {unit}"
        bytes_val /= 1024.0
    return f"{bytes_val:.2f} TB"

def generate_report(files_list, duplicates, wasted_space, sort_benchmark, sort_winner, dest_folder="Organized"):
    """
    Assembles the final report dictionary.
    Conforms strictly to the report.json schema required by Section 8.
    """
    total_files = len(files_list)
    total_size = sum(f["size"] for f in files_list)
    
    # Calculate stats
    categories_list = ['Study_Hub', 'Documents', 'Images', 'Videos', 'Music', 'Code', 'Archives', 'Executables', 'Duplicates', 'Others']
    cat_counts = {c: 0 for c in categories_list}
    
    study_files = 0
    high_priority = 0
    med_priority = 0
    low_priority = 0
    rules_applied = 0

    for f in files_list:
        cat_counts[f["category"]] += 1
        if f.get("is_study"):
            study_files += 1
        if f["priority"] == "High":
            high_priority += 1
        elif f["priority"] == "Medium":
            med_priority += 1
        else:
            low_priority += 1
        if "Rule" in f["explanation"]:
            rules_applied += 1

    # Form stats object
    statistics = {
        "totalFiles": total_files,
        "totalSize": total_size,
        "categoriesCreated": sum(1 for c in cat_counts.values() if c > 0),
        "duplicatesFound": len(duplicates),
        "spaceSaved": wasted_space,
        "studyFiles": study_files,
        "highPriority": high_priority,
        "mediumPriority": med_priority,
        "lowPriority": low_priority,
        "rulesApplied": rules_applied,
        "processingTimeMs": round(sum(algo["timeMs"] for algo in sort_benchmark if algo["selected"]), 2),
        "sortAlgorithm": sort_winner
    }

    # Form categories array
    cat_icons = {
        'Study_Hub': '📚', 'Documents': '📄', 'Images': '🖼️', 'Videos': '🎬',
        'Music': '🎵', 'Code': '💻', 'Archives': '📦', 'Executables': '⚙️',
        'Duplicates': '♻️', 'Others': '📂'
    }
    categories = [
        {"name": cat, "icon": cat_icons[cat], "count": cat_counts[cat]}
        for cat in categories_list
    ]

    # Form syllabus mapping
    syllabus_mapping = [
        {"id": "DSA_M1", "name": "Doubly Linked Lists", "evidence": "Queue-driven file index uses DLL for O(1) insertions", "course": "CS291 (DSA Lab)"},
        {"id": "DSA_M2", "name": "BFS Folder Traversal", "evidence": "Scanner uses collections.deque for Queue BFS directory parsing", "course": "CS291 (DSA Lab)"},
        {"id": "DSA_M3", "name": "BST & AVL Trees", "evidence": "AVL Tree with balancing rotations (LL, RR, LR, RL) structures the folder hierarchy", "course": "CS291 (DSA Lab)"},
        {"id": "DSA_M4", "name": "6 Sorting Algorithms", "evidence": "Implements Bubble, Insertion, Selection, Quick, Merge, and Radix Sort with complexity benchmarks", "course": "CS291 (DSA Lab)"},
        {"id": "DSA_M5", "name": "Hash Table O(1) Search", "evidence": "MD5 Separate Chaining Hash Table performs instant duplicate file grouping", "course": "CS291 (DSA Lab)"},
        {"id": "AI_M1", "name": "Agent Environment", "evidence": "Intelligent agent reads filename/meta percepts and applies organize actuators", "course": "CS202 (Intro to AI)"},
        {"id": "AI_M2", "name": "Knowledge Representation", "evidence": "18 predicate-logic rules model academic and asset category bounds", "course": "CS202 (Intro to AI)"},
        {"id": "AI_M3", "name": "Heuristic Scoring", "evidence": "Dynamic 4-factor scoring determines classification weight and urgency", "course": "CS202 (Intro to AI)"},
        {"id": "AI_M4", "name": "Forward Chaining Engine", "evidence": "Expert system sequentially checks conditions with resolution strategies", "course": "CS292 (AI Lab)"},
        {"id": "AI_M5", "name": "Decision Tree Classifier", "evidence": "Nested logical checks form category decision nodes", "course": "CS202 (Intro to AI)"},
        {"id": "AI_M6", "name": "Explainable AI Facility", "evidence": "Explains 'Why' each file is placed in a folder with matched words & confidence metrics", "course": "CS292 (AI Lab)"},
        {"id": "AI_M7", "name": "AI Ethics & Privacy", "evidence": "Dashboard verifies safety limits, checks biases, and audits data footprints", "course": "CS202 (Intro to AI)"}
    ]

    # Form folder tree structure
    folder_structure = build_folder_tree(files_list)

    # Form undo stack (reverse stack of move operations)
    undo_stack = []
    # Sort files by name so movements look ordered
    sorted_files = sorted(files_list, key=lambda x: x["name"])
    for f in sorted_files:
        dest_path = os.path.join(dest_folder, f["category"], f["subcategory"], f["name"])
        undo_stack.append({
            "operation": "MOVE",
            "source": f["path"],
            "destination": dest_path,
            "filename": f["name"],
            "timestamp": int(time.time())
        })

    # Assemble report
    report = {
        "project": "NeuroSort AI",
        "version": "1.0.0",
        "timestamp": str(int(time.time())),
        "statistics": statistics,
        "categories": categories,
        "sortBenchmark": sort_benchmark,
        "files": files_list,
        "duplicates": duplicates,
        "folderStructure": folder_structure,
        "undoStack": undo_stack,
        "syllabusMapping": syllabus_mapping
    }

    return report
