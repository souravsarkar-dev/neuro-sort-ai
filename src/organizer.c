/*
 * NeuroSort AI — Organizer Module
 * Main controller: orchestrates scanning, classification, sorting, organization
 * Generates JSON report for dashboard consumption
 */

#include "include/neurosort.h"

/* ═══════════════════════ CREATE CATEGORY DIRECTORIES ═══════════════════════ */

void create_category_dirs(const char *base_path) {
    char path[MAX_PATH_LEN];

    const char *dirs[] = {
        "Study_Hub", "Study_Hub\\Exams", "Study_Hub\\Assignments", "Study_Hub\\Notes",
        "Documents", "Images", "Images\\Wallpapers", "Images\\Screenshots",
        "Videos", "Music", "Code", "Archives", "Executables", "Duplicates", "Others"
    };
    int count = sizeof(dirs) / sizeof(dirs[0]);

    for (int i = 0; i < count; i++) {
        snprintf(path, MAX_PATH_LEN, "%s%c%s", base_path, PATH_SEP, dirs[i]);
        ensure_directory(path);
    }
    printf("[ORGANIZER] Created %d category directories\n", count);
}

/* ═══════════════════════ MOVE FILE ═══════════════════════ */

int move_file(const char *src, const char *dst) {
    /* Use rename for same-volume moves, fall back to copy+delete */
    if (rename(src, dst) == 0) return 0;

    /* Fallback: copy then delete */
    FILE *fin = fopen(src, "rb");
    if (!fin) return -1;
    FILE *fout = fopen(dst, "wb");
    if (!fout) { fclose(fin); return -1; }

    char buffer[8192];
    size_t n;
    while ((n = fread(buffer, 1, sizeof(buffer), fin)) > 0)
        fwrite(buffer, 1, n, fout);

    fclose(fin);
    fclose(fout);
    remove(src);
    return 0;
}

/* ═══════════════════════ MAIN ORGANIZATION PIPELINE ═══════════════════════ */

int organize_files(const char *source_path, const char *dest_path, OrgStats *stats) {
    clock_t total_start = clock();
    memset(stats, 0, sizeof(OrgStats));

    printf("\n");
    printf("╔═══════════════════════════════════════════════════════════╗\n");
    printf("║        NeuroSort AI — Intelligent File Organizer         ║\n");
    printf("╚═══════════════════════════════════════════════════════════╝\n\n");

    /* ── PHASE 1: Scan directory using BFS (Queue) ── */
    printf("━━━ PHASE 1: BFS Directory Scan ━━━\n");
    int file_count = 0;
    FileNode *file_list = scan_directory_bfs(source_path, &file_count);
    if (!file_list || file_count == 0) {
        printf("[ERROR] No files found in: %s\n", source_path);
        return -1;
    }
    stats->total_files = file_count;

    /* ── PHASE 2: Convert to array for sorting ── */
    printf("━━━ PHASE 2: Building File Array ━━━\n");
    FileArray *file_array = linked_list_to_array(file_list, file_count);
    printf("[ARRAY] Converted %d files to dynamic array\n\n", file_array->count);

    /* ── PHASE 3: AI Classification (Forward Chaining) ── */
    printf("━━━ PHASE 3: AI Classification Engine ━━━\n");
    KnowledgeBase *kb = kb_create();
    kb_initialize_rules(kb);
    ai_forward_chain(kb, file_array);

    /* ── PHASE 4: Hash Table for Duplicate Detection ── */
    printf("━━━ PHASE 4: Duplicate Detection (Hash Table) ━━━\n");
    HashTable *ht = hash_table_create();
    for (int i = 0; i < file_array->count; i++)
        hash_table_insert(ht, file_array->files[i]);

    FileArray *duplicates = create_file_array(64);
    stats->duplicates_found = hash_table_detect_duplicates(ht, duplicates);
    stats->space_saved = ht->wasted_space;
    printf("\n");

    /* ── PHASE 5: BST Indexing ── */
    printf("━━━ PHASE 5: BST Indexing ━━━\n");
    BSTNode *bst_root = NULL;
    AVLNode *avl_root = NULL;
    for (int i = 0; i < file_array->count; i++) {
        bst_root = bst_insert(bst_root, file_array->files[i]->filename, file_array->files[i]);
        avl_root = avl_insert(avl_root, file_array->files[i]->filename, file_array->files[i]);
    }
    printf("[BST] Height: %d | Nodes: %d\n", bst_height(bst_root), bst_count(bst_root));
    printf("[AVL] Height: %d (balanced)\n\n", avl_height(avl_root));

    /* ── PHASE 6: Sorting (Auto-select + Benchmark) ── */
    printf("━━━ PHASE 6: Multi-Algorithm Sorting Engine ━━━\n");
    run_all_sorts_benchmark(file_array, stats->sort_metrics);

    int algo = auto_select_sort(file_count);
    stats->sort_algorithm_used = algo;
    printf("[SORT] Auto-selected: %s for n=%d files\n\n", stats->sort_metrics[algo].name, file_count);

    /* Apply the selected sort to the actual array */
    typedef void (*SortFunc)(FileArray *, SortMetrics *);
    SortFunc sorters[] = { bubble_sort, insertion_sort, selection_sort,
                           quick_sort, merge_sort, radix_sort };
    SortMetrics final_metrics;
    sorters[algo](file_array, &final_metrics);

    /* ── PHASE 7: Create output directories ── */
    printf("━━━ PHASE 7: Creating Organization Structure ━━━\n");
    create_category_dirs(dest_path);

    /* ── PHASE 8: Organize files with undo stack ── */
    printf("\n━━━ PHASE 8: Organizing Files ━━━\n");
    UndoStack *undo = stack_create();

    /* Collect statistics */
    for (int i = 0; i < file_array->count; i++) {
        FileNode *f = file_array->files[i];
        stats->files_per_category[f->category_id]++;
        stats->total_size += f->size;
        if (f->is_study_material) stats->study_files++;
        if (f->priority_level == PRIORITY_HIGH) stats->high_priority_files++;
        else if (f->priority_level == PRIORITY_MEDIUM) stats->medium_priority_files++;
        else stats->low_priority_files++;
    }

    /* Count rules applied */
    for (int i = 0; i < file_array->count; i++) {
        if (file_array->files[i]->explanation[0] &&
            strcmp(file_array->files[i]->explanation, "No classification applied yet") != 0)
            stats->rules_applied++;
    }

    stats->categories_created = 0;
    for (int i = 0; i < NUM_CATEGORIES; i++)
        if (stats->files_per_category[i] > 0) stats->categories_created++;

    /* Log organization plan (don't actually move — simulation mode) */
    for (int i = 0; i < file_array->count; i++) {
        FileNode *f = file_array->files[i];
        char dest[MAX_PATH_LEN];
        if (f->subcategory[0])
            snprintf(dest, MAX_PATH_LEN, "%s%c%s%c%s%c%s", dest_path, PATH_SEP,
                f->category, PATH_SEP, f->subcategory, PATH_SEP, f->filename);
        else
            snprintf(dest, MAX_PATH_LEN, "%s%c%s%c%s", dest_path, PATH_SEP,
                f->category, PATH_SEP, f->filename);

        char desc[MAX_EXPLANATION];
        snprintf(desc, MAX_EXPLANATION, "Move '%s' to %s", f->filename, f->category);
        stack_push(undo, OP_MOVE, f->filepath, dest, desc);
    }

    printf("[ORGANIZER] Organization plan created (%d operations in undo stack)\n", undo->count);

    /* ── FINAL: Calculate timing ── */
    stats->processing_time_ms = (double)(clock() - total_start) * 1000.0 / CLOCKS_PER_SEC;

    /* ── Print summary ── */
    char size_buf[32], saved_buf[32];
    format_size(stats->total_size, size_buf);
    format_size(stats->space_saved, saved_buf);

    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║               ORGANIZATION SUMMARY                       ║\n");
    printf("╠═══════════════════════════════════════════════════════════╣\n");
    printf("║  Total Files:          %6d                             ║\n", stats->total_files);
    printf("║  Total Size:           %10s                         ║\n", size_buf);
    printf("║  Categories:           %6d                             ║\n", stats->categories_created);
    printf("║  Duplicates Found:     %6d                             ║\n", stats->duplicates_found);
    printf("║  Space Recoverable:    %10s                         ║\n", saved_buf);
    printf("║  Study Files:          %6d                             ║\n", stats->study_files);
    printf("║  HIGH Priority:        %6d                             ║\n", stats->high_priority_files);
    printf("║  AI Rules Applied:     %6d                             ║\n", stats->rules_applied);
    printf("║  Sort Algorithm:       %-20s              ║\n", stats->sort_metrics[algo].name);
    printf("║  Processing Time:      %8.2f ms                       ║\n", stats->processing_time_ms);
    printf("╚═══════════════════════════════════════════════════════════╝\n\n");

    /* Cleanup */
    bst_free(bst_root);
    avl_free(avl_root);
    hash_table_free(ht);
    array_free(duplicates);
    stack_free(undo);
    free(kb);

    return 0; /* file_array and file_list still alive for report */
}

/* ═══════════════════════ JSON REPORT GENERATOR ═══════════════════════ */

void generate_report_json(OrgStats *stats, FileArray *files, const char *output_path) {
    char json_path[MAX_PATH_LEN];
    snprintf(json_path, MAX_PATH_LEN, "%s%creport.json", output_path, PATH_SEP);

    FILE *fp = fopen(json_path, "w");
    if (!fp) {
        printf("[ERROR] Cannot create report: %s\n", json_path);
        return;
    }

    fprintf(fp, "{\n");
    fprintf(fp, "  \"project\": \"NeuroSort AI\",\n");
    fprintf(fp, "  \"version\": \"1.0.0\",\n");
    fprintf(fp, "  \"timestamp\": \"%ld\",\n", (long)time(NULL));

    /* Statistics */
    fprintf(fp, "  \"statistics\": {\n");
    fprintf(fp, "    \"totalFiles\": %d,\n", stats->total_files);
    fprintf(fp, "    \"totalSize\": %ld,\n", stats->total_size);
    fprintf(fp, "    \"categoriesCreated\": %d,\n", stats->categories_created);
    fprintf(fp, "    \"duplicatesFound\": %d,\n", stats->duplicates_found);
    fprintf(fp, "    \"spaceSaved\": %ld,\n", stats->space_saved);
    fprintf(fp, "    \"studyFiles\": %d,\n", stats->study_files);
    fprintf(fp, "    \"highPriority\": %d,\n", stats->high_priority_files);
    fprintf(fp, "    \"mediumPriority\": %d,\n", stats->medium_priority_files);
    fprintf(fp, "    \"lowPriority\": %d,\n", stats->low_priority_files);
    fprintf(fp, "    \"rulesApplied\": %d,\n", stats->rules_applied);
    fprintf(fp, "    \"processingTimeMs\": %.2f,\n", stats->processing_time_ms);
    fprintf(fp, "    \"sortAlgorithm\": \"%s\"\n", stats->sort_metrics[stats->sort_algorithm_used].name);
    fprintf(fp, "  },\n");

    /* Category distribution */
    fprintf(fp, "  \"categories\": [\n");
    for (int i = 0; i < NUM_CATEGORIES; i++) {
        fprintf(fp, "    {\"name\": \"%s\", \"icon\": \"%s\", \"count\": %d}%s\n",
            CATEGORY_NAMES[i], CATEGORY_ICONS[i], stats->files_per_category[i],
            i < NUM_CATEGORIES - 1 ? "," : "");
    }
    fprintf(fp, "  ],\n");

    /* Sorting benchmark */
    fprintf(fp, "  \"sortBenchmark\": [\n");
    for (int i = 0; i < NUM_SORT_ALGOS; i++) {
        SortMetrics *m = &stats->sort_metrics[i];
        fprintf(fp, "    {\"name\": \"%s\", \"comparisons\": %d, \"swaps\": %d, "
            "\"timeMs\": %.3f, \"complexity\": \"%s\", \"spaceComplexity\": \"%s\", \"selected\": %s}%s\n",
            m->name ? m->name : "Unknown", m->comparisons, m->swaps, m->time_ms,
            m->time_complexity ? m->time_complexity : "?",
            m->space_complexity ? m->space_complexity : "?",
            i == stats->sort_algorithm_used ? "true" : "false",
            i < NUM_SORT_ALGOS - 1 ? "," : "");
    }
    fprintf(fp, "  ],\n");

    /* File list */
    fprintf(fp, "  \"files\": [\n");
    int max_files = files->count < 500 ? files->count : 500;
    for (int i = 0; i < max_files; i++) {
        FileNode *f = files->files[i];
        char size_buf[32];
        format_size(f->size, size_buf);

        /* Escape backslashes and quotes in paths */
        char escaped_path[MAX_PATH_LEN * 2];
        int ep = 0;
        for (int j = 0; f->filepath[j] && ep < (int)sizeof(escaped_path) - 2; j++) {
            if (f->filepath[j] == '\\' || f->filepath[j] == '"')
                escaped_path[ep++] = '\\';
            escaped_path[ep++] = f->filepath[j];
        }
        escaped_path[ep] = '\0';

        /* Escape explanation */
        char escaped_exp[MAX_EXPLANATION * 2];
        ep = 0;
        for (int j = 0; f->explanation[j] && ep < (int)sizeof(escaped_exp) - 2; j++) {
            if (f->explanation[j] == '\\' || f->explanation[j] == '"')
                escaped_exp[ep++] = '\\';
            escaped_exp[ep++] = f->explanation[j];
        }
        escaped_exp[ep] = '\0';

        fprintf(fp, "    {\"id\": %d, \"name\": \"%s\", \"ext\": \"%s\", "
            "\"size\": %ld, \"sizeFormatted\": \"%s\", \"path\": \"%s\", "
            "\"category\": \"%s\", \"categoryId\": %d, \"subcategory\": \"%s\", "
            "\"priority\": %d, \"priorityScore\": %d, "
            "\"isDuplicate\": %s, \"isStudy\": %s, "
            "\"explanation\": \"%s\"}%s\n",
            f->file_id, f->filename, f->extension,
            f->size, size_buf, escaped_path,
            f->category, f->category_id, f->subcategory,
            f->priority_level, f->priority_score,
            f->is_duplicate ? "true" : "false",
            f->is_study_material ? "true" : "false",
            escaped_exp,
            i < max_files - 1 ? "," : "");
    }
    fprintf(fp, "  ]\n");
    fprintf(fp, "}\n");

    fclose(fp);
    printf("[REPORT] JSON report saved to: %s\n", json_path);
}
