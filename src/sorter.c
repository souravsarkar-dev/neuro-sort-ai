/*
 * NeuroSort AI — Sorting Algorithms Module
 * CS291 Module 4: All 6 Sorting Algorithms
 *
 * Implements: Bubble Sort, Insertion Sort, Selection Sort,
 *             Quick Sort, Merge Sort, Radix Sort
 *
 * Each algorithm includes performance metrics tracking for
 * the dashboard's complexity comparison visualization.
 */

#include "include/neurosort.h"

/* === FILE COMPARISON FUNCTION ===
 * Multi-key: Priority (desc) → Category (asc) → Name (asc)
 * Returns: negative if a < b, 0 if equal, positive if a > b */
int compare_files(FileNode *a, FileNode *b) {
    /* Primary: priority descending (HIGH first) */
    if (a->priority_level != b->priority_level)
        return b->priority_level - a->priority_level;
    /* Secondary: category ascending */
    int cat_cmp = strcmp(a->category, b->category);
    if (cat_cmp != 0) return cat_cmp;
    /* Tertiary: filename ascending */
    return strcmp(a->filename, b->filename);
}

/* Auto-select best sorting algorithm based on input size */
int auto_select_sort(int n) {
    if (n < 50) return SORT_INSERTION;
    if (n < 500) return SORT_QUICK;
    if (n < 5000) return SORT_MERGE;
    return SORT_RADIX;
}

/* === SWAP HELPER === */
static void swap_files(FileArray *arr, int i, int j) {
    FileNode *tmp = arr->files[i];
    arr->files[i] = arr->files[j];
    arr->files[j] = tmp;
}

/* ═══════════════════════════════════════════════════════════════
 * BUBBLE SORT — O(n²) Time, O(1) Space
 * Best for: small datasets, visual demonstration
 * Stable: Yes
 * ═══════════════════════════════════════════════════════════════ */
void bubble_sort(FileArray *arr, SortMetrics *m) {
    clock_t start = clock();
    m->comparisons = m->swaps = 0;
    m->name = "Bubble Sort";
    m->time_complexity = "O(n^2)";
    m->space_complexity = "O(1)";

    int n = arr->count;
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - i - 1; j++) {
            m->comparisons++;
            if (compare_files(arr->files[j], arr->files[j + 1]) > 0) {
                swap_files(arr, j, j + 1);
                m->swaps++;
                swapped = 1;
            }
        }
        if (!swapped) break; /* Optimization: early exit */
    }
    m->time_ms = (double)(clock() - start) * 1000.0 / CLOCKS_PER_SEC;
}

/* ═══════════════════════════════════════════════════════════════
 * INSERTION SORT — O(n²) Time, O(1) Space
 * Best for: nearly sorted data, small n
 * Stable: Yes
 * ═══════════════════════════════════════════════════════════════ */
void insertion_sort(FileArray *arr, SortMetrics *m) {
    clock_t start = clock();
    m->comparisons = m->swaps = 0;
    m->name = "Insertion Sort";
    m->time_complexity = "O(n^2)";
    m->space_complexity = "O(1)";

    int n = arr->count;
    for (int i = 1; i < n; i++) {
        FileNode *key = arr->files[i];
        int j = i - 1;
        while (j >= 0) {
            m->comparisons++;
            if (compare_files(arr->files[j], key) > 0) {
                arr->files[j + 1] = arr->files[j];
                m->swaps++;
                j--;
            } else break;
        }
        arr->files[j + 1] = key;
    }
    m->time_ms = (double)(clock() - start) * 1000.0 / CLOCKS_PER_SEC;
}

/* ═══════════════════════════════════════════════════════════════
 * SELECTION SORT — O(n²) Time, O(1) Space
 * Best for: priority ranking (selects minimum each pass)
 * Stable: No
 * ═══════════════════════════════════════════════════════════════ */
void selection_sort(FileArray *arr, SortMetrics *m) {
    clock_t start = clock();
    m->comparisons = m->swaps = 0;
    m->name = "Selection Sort";
    m->time_complexity = "O(n^2)";
    m->space_complexity = "O(1)";

    int n = arr->count;
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++) {
            m->comparisons++;
            if (compare_files(arr->files[j], arr->files[min_idx]) < 0)
                min_idx = j;
        }
        if (min_idx != i) {
            swap_files(arr, i, min_idx);
            m->swaps++;
        }
    }
    m->time_ms = (double)(clock() - start) * 1000.0 / CLOCKS_PER_SEC;
}

/* ═══════════════════════════════════════════════════════════════
 * QUICK SORT — O(n log n) avg, O(n²) worst, O(log n) Space
 * Main sorting engine. Uses Lomuto partition.
 * ═══════════════════════════════════════════════════════════════ */
static int qs_comparisons, qs_swaps;

static int partition(FileArray *arr, int low, int high) {
    FileNode *pivot = arr->files[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        qs_comparisons++;
        if (compare_files(arr->files[j], pivot) <= 0) {
            i++;
            swap_files(arr, i, j);
            qs_swaps++;
        }
    }
    swap_files(arr, i + 1, high);
    qs_swaps++;
    return i + 1;
}

static void quick_sort_recursive(FileArray *arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quick_sort_recursive(arr, low, pi - 1);
        quick_sort_recursive(arr, pi + 1, high);
    }
}

void quick_sort(FileArray *arr, SortMetrics *m) {
    clock_t start = clock();
    qs_comparisons = qs_swaps = 0;
    m->name = "Quick Sort";
    m->time_complexity = "O(n log n)";
    m->space_complexity = "O(log n)";

    if (arr->count > 1)
        quick_sort_recursive(arr, 0, arr->count - 1);

    m->comparisons = qs_comparisons;
    m->swaps = qs_swaps;
    m->time_ms = (double)(clock() - start) * 1000.0 / CLOCKS_PER_SEC;
}

/* ═══════════════════════════════════════════════════════════════
 * MERGE SORT — O(n log n) Time, O(n) Space
 * Stable sort for multi-key sorting
 * ═══════════════════════════════════════════════════════════════ */
static int ms_comparisons, ms_swaps;

static void merge(FileArray *arr, int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;
    FileNode **L = (FileNode **)malloc(n1 * sizeof(FileNode *));
    FileNode **R = (FileNode **)malloc(n2 * sizeof(FileNode *));

    for (int i = 0; i < n1; i++) L[i] = arr->files[left + i];
    for (int j = 0; j < n2; j++) R[j] = arr->files[mid + 1 + j];

    int i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        ms_comparisons++;
        if (compare_files(L[i], R[j]) <= 0) {
            arr->files[k++] = L[i++];
        } else {
            arr->files[k++] = R[j++];
        }
        ms_swaps++;
    }
    while (i < n1) { arr->files[k++] = L[i++]; ms_swaps++; }
    while (j < n2) { arr->files[k++] = R[j++]; ms_swaps++; }

    free(L);
    free(R);
}

static void merge_sort_recursive(FileArray *arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        merge_sort_recursive(arr, left, mid);
        merge_sort_recursive(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

void merge_sort(FileArray *arr, SortMetrics *m) {
    clock_t start = clock();
    ms_comparisons = ms_swaps = 0;
    m->name = "Merge Sort";
    m->time_complexity = "O(n log n)";
    m->space_complexity = "O(n)";

    if (arr->count > 1)
        merge_sort_recursive(arr, 0, arr->count - 1);

    m->comparisons = ms_comparisons;
    m->swaps = ms_swaps;
    m->time_ms = (double)(clock() - start) * 1000.0 / CLOCKS_PER_SEC;
}

/* ═══════════════════════════════════════════════════════════════
 * RADIX SORT — O(nk) Time, O(n+k) Space
 * Sorts by priority_score digits (non-comparison sort)
 * ═══════════════════════════════════════════════════════════════ */
void radix_sort(FileArray *arr, SortMetrics *m) {
    clock_t start = clock();
    m->comparisons = 0;
    m->swaps = 0;
    m->name = "Radix Sort";
    m->time_complexity = "O(nk)";
    m->space_complexity = "O(n+k)";

    int n = arr->count;
    if (n <= 1) { m->time_ms = 0; return; }

    /* Find max priority score to know number of digits */
    int max_val = 0;
    for (int i = 0; i < n; i++) {
        if (arr->files[i]->priority_score > max_val)
            max_val = arr->files[i]->priority_score;
    }

    FileNode **output = (FileNode **)malloc(n * sizeof(FileNode *));
    if (!output) return;

    /* Counting sort for each digit */
    for (int exp = 1; max_val / exp > 0; exp *= 10) {
        int count[10] = {0};

        for (int i = 0; i < n; i++)
            count[(arr->files[i]->priority_score / exp) % 10]++;

        for (int i = 1; i < 10; i++)
            count[i] += count[i - 1];

        for (int i = n - 1; i >= 0; i--) {
            int digit = (arr->files[i]->priority_score / exp) % 10;
            output[count[digit] - 1] = arr->files[i];
            count[digit]--;
            m->swaps++;
        }

        for (int i = 0; i < n; i++)
            arr->files[i] = output[i];
    }

    free(output);
    m->time_ms = (double)(clock() - start) * 1000.0 / CLOCKS_PER_SEC;
}

/* === BENCHMARK: Run all sorting algorithms on copies of data === */
void run_all_sorts_benchmark(FileArray *original, SortMetrics metrics[NUM_SORT_ALGOS]) {
    typedef void (*SortFunc)(FileArray *, SortMetrics *);
    SortFunc sorters[NUM_SORT_ALGOS] = {
        bubble_sort, insertion_sort, selection_sort,
        quick_sort, merge_sort, radix_sort
    };

    printf("\n[BENCHMARK] Running all 6 sorting algorithms...\n");

    for (int s = 0; s < NUM_SORT_ALGOS; s++) {
        /* Create a copy of the array for fair comparison */
        FileArray *copy = create_file_array(original->count);
        for (int i = 0; i < original->count; i++)
            array_add(copy, original->files[i]);

        sorters[s](copy, &metrics[s]);

        printf("  %-16s | Comparisons: %6d | Swaps: %6d | Time: %.3f ms | %s\n",
            metrics[s].name, metrics[s].comparisons, metrics[s].swaps,
            metrics[s].time_ms, metrics[s].time_complexity);

        /* Don't free nodes, just the array wrapper */
        free(copy->files);
        free(copy);
    }
    printf("\n");
}
