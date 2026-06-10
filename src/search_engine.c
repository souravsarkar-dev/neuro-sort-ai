/*
 * NeuroSort AI — Search Engine Module
 * CS291 Module 5: Searching Algorithms
 *
 * Implements: Linear Search, Binary Search, Interpolation Search
 */

#include "include/neurosort.h"

/* Linear Search: Scan filenames for keyword match — O(n) */
int linear_search_keyword(FileArray *arr, const char *keyword) {
    for (int i = 0; i < arr->count; i++) {
        if (string_contains(arr->files[i]->filename, keyword) ||
            string_contains(arr->files[i]->content_keywords, keyword)) {
            return i;
        }
    }
    return -1;
}

/* Binary Search: Find file by name in sorted array — O(log n)
 * PRECONDITION: Array must be sorted by filename */
int binary_search_name(FileArray *arr, const char *name) {
    int low = 0, high = arr->count - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        int cmp = strcmp(arr->files[mid]->filename, name);
        if (cmp == 0) return mid;
        if (cmp < 0) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

/* Interpolation Search: Find file by size — O(log log n) avg
 * PRECONDITION: Array must be sorted by file size */
int interpolation_search_size(FileArray *arr, long target_size) {
    int low = 0, high = arr->count - 1;
    while (low <= high && target_size >= arr->files[low]->size &&
           target_size <= arr->files[high]->size) {
        if (low == high) {
            if (arr->files[low]->size == target_size) return low;
            return -1;
        }
        long range = arr->files[high]->size - arr->files[low]->size;
        if (range == 0) return (arr->files[low]->size == target_size) ? low : -1;

        int pos = low + (int)(((double)(target_size - arr->files[low]->size) /
                   (double)range) * (high - low));
        if (pos < low || pos > high) break;

        if (arr->files[pos]->size == target_size) return pos;
        if (arr->files[pos]->size < target_size) low = pos + 1;
        else high = pos - 1;
    }
    return -1;
}
