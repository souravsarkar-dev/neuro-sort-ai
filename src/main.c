/*
 * NeuroSort AI — Main Entry Point
 * Connects all modules: Scanner, Sorter, AI Engine, Hash Table, Organizer
 *
 * Usage: neurosort.exe <source_folder> [output_folder]
 * If output_folder not specified, creates "Organized" next to source
 */

#include "include/neurosort.h"

/* Forward declarations for demo mode */
static void run_demo_mode(void);
static void create_demo_files(const char *path);

int main(int argc, char *argv[]) {
    printf("\n");
    printf("  ╔════════════════════════════════════════════════════════╗\n");
    printf("  ║   _   _                      ____             _      ║\n");
    printf("  ║  | \\ | | ___ _   _ _ __ ___ / ___|  ___  _ __| |_    ║\n");
    printf("  ║  |  \\| |/ _ \\ | | | '__/ _ \\\\___ \\ / _ \\| '__| __|   ║\n");
    printf("  ║  | |\\  |  __/ |_| | | | (_) |___) | (_) | |  | |_    ║\n");
    printf("  ║  |_| \\_|\\___|\\__,_|_|  \\___/|____/ \\___/|_|   \\__|   ║\n");
    printf("  ║                                                      ║\n");
    printf("  ║        AI-Powered Intelligent File Organizer          ║\n");
    printf("  ║        DSA Engine + Expert System + Dashboard         ║\n");
    printf("  ║                                                      ║\n");
    printf("  ║  Course: CS291 (DSA) + CS202/CS292 (AI)              ║\n");
    printf("  ║  College: JIS College of Engineering, Kalyani        ║\n");
    printf("  ╚════════════════════════════════════════════════════════╝\n\n");

    char source_path[MAX_PATH_LEN];
    char dest_path[MAX_PATH_LEN];

    if (argc < 2) {
        /* Demo mode: create test files and organize them */
        printf("[MODE] No folder specified. Running DEMO MODE...\n\n");
        printf("Usage: %s <source_folder> [output_folder]\n\n", argv[0]);
        run_demo_mode();
        return 0;
    }

    strncpy(source_path, argv[1], MAX_PATH_LEN - 1);
    source_path[MAX_PATH_LEN - 1] = '\0';

    if (argc >= 3) {
        strncpy(dest_path, argv[2], MAX_PATH_LEN - 1);
    } else {
        snprintf(dest_path, MAX_PATH_LEN, "%s%cOrganized", source_path, PATH_SEP);
    }
    dest_path[MAX_PATH_LEN - 1] = '\0';

    printf("[INPUT]  Source: %s\n", source_path);
    printf("[OUTPUT] Destination: %s\n\n", dest_path);

    /* Ensure output directory exists */
    ensure_directory(dest_path);

    /* Run the organization pipeline */
    OrgStats stats;
    int file_count = 0;

    /* Phase 1: Scan */
    FileNode *file_list = scan_directory_bfs(source_path, &file_count);
    if (!file_list || file_count == 0) {
        printf("[ERROR] No files found. Exiting.\n");
        return 1;
    }

    /* Phase 2: Convert to array */
    FileArray *file_array = linked_list_to_array(file_list, file_count);

    /* Phase 3: AI Classification */
    KnowledgeBase *kb = kb_create();
    kb_initialize_rules(kb);
    ai_forward_chain(kb, file_array);

    /* Phase 4: Hash table for duplicates */
    HashTable *ht = hash_table_create();
    for (int i = 0; i < file_array->count; i++)
        hash_table_insert(ht, file_array->files[i]);

    FileArray *dups = create_file_array(64);
    hash_table_detect_duplicates(ht, dups);

    /* Phase 5: BST + AVL indexing */
    BSTNode *bst = NULL;
    AVLNode *avl = NULL;
    for (int i = 0; i < file_array->count; i++) {
        bst = bst_insert(bst, file_array->files[i]->filename, file_array->files[i]);
        avl = avl_insert(avl, file_array->files[i]->filename, file_array->files[i]);
    }
    printf("[BST] Height: %d | [AVL] Height: %d\n", bst_height(bst), avl_height(avl));

    /* Phase 6: Sort */
    SortMetrics bench[NUM_SORT_ALGOS];
    run_all_sorts_benchmark(file_array, bench);
    int algo = auto_select_sort(file_count);

    typedef void (*SortFunc)(FileArray *, SortMetrics *);
    SortFunc sorters[] = { bubble_sort, insertion_sort, selection_sort,
                           quick_sort, merge_sort, radix_sort };
    SortMetrics final_m;
    sorters[algo](file_array, &final_m);

    /* Phase 7: Create directories */
    create_category_dirs(dest_path);

    /* Phase 8: Build stats and undo stack */
    memset(&stats, 0, sizeof(OrgStats));
    stats.total_files = file_count;
    for (int i = 0; i < NUM_SORT_ALGOS; i++) stats.sort_metrics[i] = bench[i];
    stats.sort_algorithm_used = algo;
    stats.duplicates_found = ht->duplicate_count;
    stats.space_saved = ht->wasted_space;

    UndoStack *undo = stack_create();
    for (int i = 0; i < file_array->count; i++) {
        FileNode *f = file_array->files[i];
        stats.files_per_category[f->category_id]++;
        stats.total_size += f->size;
        if (f->is_study_material) stats.study_files++;
        if (f->priority_level == PRIORITY_HIGH) stats.high_priority_files++;
        else if (f->priority_level == PRIORITY_MEDIUM) stats.medium_priority_files++;
        else stats.low_priority_files++;
        if (f->explanation[0]) stats.rules_applied++;

        char dest[MAX_PATH_LEN];
        snprintf(dest, MAX_PATH_LEN, "%s%c%s%c%s", dest_path, PATH_SEP,
            f->category, PATH_SEP, f->filename);
        stack_push(undo, OP_MOVE, f->filepath, dest, f->filename);
    }

    stats.categories_created = 0;
    for (int i = 0; i < NUM_CATEGORIES; i++)
        if (stats.files_per_category[i] > 0) stats.categories_created++;

    stats.processing_time_ms = final_m.time_ms;

    /* Print summary */
    char sb[32], sv[32];
    format_size(stats.total_size, sb);
    format_size(stats.space_saved, sv);
    printf("\n══════════════ SUMMARY ══════════════\n");
    printf("  Files: %d | Size: %s | Categories: %d\n", stats.total_files, sb, stats.categories_created);
    printf("  Duplicates: %d | Saveable: %s\n", stats.duplicates_found, sv);
    printf("  Study files: %d | HIGH priority: %d\n", stats.study_files, stats.high_priority_files);
    printf("  Algorithm: %s | Time: %.2f ms\n", bench[algo].name, final_m.time_ms);
    printf("════════════════════════════════════\n\n");

    /* Generate JSON report for dashboard */
    generate_report_json(&stats, file_array, dest_path);

    /* Cleanup */
    bst_free(bst);
    avl_free(avl);
    hash_table_free(ht);
    array_free(dups);
    stack_free(undo);
    free(kb);
    array_free(file_array);
    free_file_list(file_list);

    printf("\n[DONE] NeuroSort AI organization complete!\n");
    printf("[TIP]  Open web/index.html to view the dashboard.\n\n");
    return 0;
}

/* ═══════════════════════ DEMO MODE ═══════════════════════ */

static void create_demo_files(const char *path) {
    ensure_directory(path);

    const char *demo_files[] = {
        "DSA_Final_Exam_2025.pdf", "AI_Notes_Module3.pdf", "Assignment_Lab5.c",
        "semester_project_report.docx", "quiz_answers.txt", "lecture_slides.pptx",
        "study_guide_algorithms.pdf", "midterm_solutions.pdf", "practical_file.c",
        "vacation_photo.jpg", "wallpaper_4k.png", "screenshot_error.png",
        "birthday_video.mp4", "lecture_recording.mkv", "favorite_song.mp3",
        "project_code.py", "database_schema.sql", "config.json",
        "old_backup.zip", "installer.exe", "random_file.dat",
        "notes_chapter1.txt", "notes_chapter2.txt", "resume_2025.pdf",
        "tutorial_sorting.pdf", "course_material_dsa.pdf"
    };
    int count = sizeof(demo_files) / sizeof(demo_files[0]);

    for (int i = 0; i < count; i++) {
        char filepath[MAX_PATH_LEN];
        snprintf(filepath, MAX_PATH_LEN, "%s%c%s", path, PATH_SEP, demo_files[i]);
        FILE *fp = fopen(filepath, "w");
        if (fp) {
            fprintf(fp, "Demo file: %s\nCreated by NeuroSort AI Demo Mode\n"
                "This simulates a real file for testing the organization engine.\n"
                "Keywords: %s\n", demo_files[i], demo_files[i]);
            /* Write varying sizes */
            for (int j = 0; j < (i + 1) * 100; j++)
                fprintf(fp, "Content block %d for size variation.\n", j);
            fclose(fp);
        }
    }
    printf("[DEMO] Created %d demo files in: %s\n\n", count, path);
}

static void run_demo_mode(void) {
    char demo_src[MAX_PATH_LEN];
    char demo_dst[MAX_PATH_LEN];

    snprintf(demo_src, MAX_PATH_LEN, ".%cdemo_messy_folder", PATH_SEP);
    snprintf(demo_dst, MAX_PATH_LEN, ".%cdemo_organized", PATH_SEP);

    /* Create demo files */
    create_demo_files(demo_src);

    /* Run full pipeline */
    OrgStats stats;
    int fc = 0;
    FileNode *fl = scan_directory_bfs(demo_src, &fc);
    if (!fl) { printf("[ERROR] Demo scan failed.\n"); return; }

    FileArray *fa = linked_list_to_array(fl, fc);
    KnowledgeBase *kb = kb_create();
    kb_initialize_rules(kb);
    ai_forward_chain(kb, fa);

    HashTable *ht = hash_table_create();
    for (int i = 0; i < fa->count; i++) hash_table_insert(ht, fa->files[i]);

    SortMetrics bench[NUM_SORT_ALGOS];
    run_all_sorts_benchmark(fa, bench);

    int algo = auto_select_sort(fc);
    typedef void (*SF)(FileArray *, SortMetrics *);
    SF srt[] = { bubble_sort, insertion_sort, selection_sort, quick_sort, merge_sort, radix_sort };
    SortMetrics fm;
    srt[algo](fa, &fm);

    /* Build stats */
    memset(&stats, 0, sizeof(OrgStats));
    stats.total_files = fc;
    for (int i = 0; i < NUM_SORT_ALGOS; i++) stats.sort_metrics[i] = bench[i];
    stats.sort_algorithm_used = algo;
    stats.duplicates_found = ht->duplicate_count;
    stats.space_saved = ht->wasted_space;
    for (int i = 0; i < fa->count; i++) {
        FileNode *f = fa->files[i];
        stats.files_per_category[f->category_id]++;
        stats.total_size += f->size;
        if (f->is_study_material) stats.study_files++;
        if (f->priority_level == PRIORITY_HIGH) stats.high_priority_files++;
        else if (f->priority_level == PRIORITY_MEDIUM) stats.medium_priority_files++;
        else stats.low_priority_files++;
        if (f->explanation[0]) stats.rules_applied++;
    }
    stats.categories_created = 0;
    for (int i = 0; i < NUM_CATEGORIES; i++)
        if (stats.files_per_category[i] > 0) stats.categories_created++;
    stats.processing_time_ms = fm.time_ms;

    /* Print classified files */
    printf("\n══════ CLASSIFIED FILES ══════\n");
    for (int i = 0; i < fa->count; i++) {
        FileNode *f = fa->files[i];
        printf("  %s%-30s%s → %-12s [P:%d] %s%s%s\n",
            f->priority_level == PRIORITY_HIGH ? "\033[31m" : (f->priority_level == PRIORITY_MEDIUM ? "\033[33m" : "\033[32m"),
            f->filename, "\033[0m",
            f->category, f->priority_level,
            f->is_study_material ? "[STUDY] " : "",
            f->is_duplicate ? "[DUP] " : "",
            f->explanation);
    }

    /* Generate report */
    ensure_directory(demo_dst);
    generate_report_json(&stats, fa, demo_dst);

    /* Cleanup */
    hash_table_free(ht);
    free(kb);
    array_free(fa);
    free_file_list(fl);

    printf("\n[DEMO] Complete! Open web/index.html and load demo_organized/report.json\n\n");
}
