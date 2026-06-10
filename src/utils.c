/*
 * ═══════════════════════════════════════════════════════════════
 *  NeuroSort AI — Utility Functions
 *  File I/O, string parsing, path handling, time utilities
 * ═══════════════════════════════════════════════════════════════
 */

#include "include/neurosort.h"
#include <ctype.h>

/* ───────────────────────────────────────────────────────────────
 * get_extension: Extract file extension from filename
 * Input: "report.pdf" → Output: "pdf"
 * ─────────────────────────────────────────────────────────────── */
void get_extension(const char *filename, char *ext) {
    const char *dot = strrchr(filename, '.');
    if (dot && dot != filename) {
        strncpy(ext, dot + 1, MAX_EXTENSION - 1);
        ext[MAX_EXTENSION - 1] = '\0';
        to_lowercase(ext);
    } else {
        ext[0] = '\0';
    }
}

/* ───────────────────────────────────────────────────────────────
 * get_file_size: Return file size in bytes using fseek
 * ─────────────────────────────────────────────────────────────── */
long get_file_size(const char *filepath) {
#ifdef _WIN32
    WIN32_FILE_ATTRIBUTE_DATA fad;
    if (GetFileAttributesExA(filepath, GetFileExInfoStandard, &fad)) {
        LARGE_INTEGER size;
        size.HighPart = fad.nFileSizeHigh;
        size.LowPart  = fad.nFileSizeLow;
        return (long)size.QuadPart;
    }
    return 0;
#else
    struct stat st;
    if (stat(filepath, &st) == 0) {
        return (long)st.st_size;
    }
    return 0;
#endif
}

/* ───────────────────────────────────────────────────────────────
 * to_lowercase: Convert string in-place to lowercase
 * ─────────────────────────────────────────────────────────────── */
void to_lowercase(char *str) {
    for (int i = 0; str[i]; i++) {
        str[i] = (char)tolower((unsigned char)str[i]);
    }
}

/* ───────────────────────────────────────────────────────────────
 * string_contains: Case-insensitive substring search
 * Returns: 1 if needle found in haystack, 0 otherwise
 * ─────────────────────────────────────────────────────────────── */
int string_contains(const char *haystack, const char *needle) {
    if (!haystack || !needle) return 0;

    char h_lower[MAX_PATH_LEN], n_lower[MAX_KEYWORD_LEN];
    strncpy(h_lower, haystack, MAX_PATH_LEN - 1);
    h_lower[MAX_PATH_LEN - 1] = '\0';
    strncpy(n_lower, needle, MAX_KEYWORD_LEN - 1);
    n_lower[MAX_KEYWORD_LEN - 1] = '\0';

    to_lowercase(h_lower);
    to_lowercase(n_lower);

    return strstr(h_lower, n_lower) != NULL;
}

/* ───────────────────────────────────────────────────────────────
 * days_since_modified: Calculate days since last modification
 * ─────────────────────────────────────────────────────────────── */
int days_since_modified(time_t modified) {
    time_t now = time(NULL);
    double diff = difftime(now, modified);
    return (int)(diff / (60.0 * 60.0 * 24.0));
}

/* ───────────────────────────────────────────────────────────────
 * format_size: Human-readable file size (e.g., "1.23 MB")
 * ─────────────────────────────────────────────────────────────── */
char *format_size(long bytes, char *buffer) {
    const char *units[] = {"B", "KB", "MB", "GB", "TB"};
    int unit_index = 0;
    double size = (double)bytes;

    while (size >= 1024.0 && unit_index < 4) {
        size /= 1024.0;
        unit_index++;
    }

    sprintf(buffer, "%.2f %s", size, units[unit_index]);
    return buffer;
}

/* ───────────────────────────────────────────────────────────────
 * make_path: Concatenate base path and subdirectory
 * ─────────────────────────────────────────────────────────────── */
void make_path(char *dest, const char *base, const char *sub) {
    snprintf(dest, MAX_PATH_LEN, "%s%c%s", base, PATH_SEP, sub);
}

/* ───────────────────────────────────────────────────────────────
 * ensure_directory: Create directory (and parents) if not exists
 * Returns: 0 on success, -1 on failure
 * ─────────────────────────────────────────────────────────────── */
int ensure_directory(const char *path) {
    char tmp[MAX_PATH_LEN];
    char *p = NULL;
    size_t len;

    snprintf(tmp, sizeof(tmp), "%s", path);
    len = strlen(tmp);

    /* Remove trailing separator */
    if (tmp[len - 1] == PATH_SEP)
        tmp[len - 1] = '\0';

    /* Create each directory level */
    for (p = tmp + 1; *p; p++) {
        if (*p == PATH_SEP || *p == '/' || *p == '\\') {
            *p = '\0';
            MKDIR(tmp);
            *p = PATH_SEP;
        }
    }
    return MKDIR(tmp);
}

/* ───────────────────────────────────────────────────────────────
 * compute_file_hash: Simple hash of file contents for duplicate
 * detection. Uses division method (CS291 Hashing Module).
 * Reads first 8KB of file for efficiency.
 * ─────────────────────────────────────────────────────────────── */
unsigned long compute_file_hash(const char *filepath) {
    FILE *fp = fopen(filepath, "rb");
    if (!fp) return 0;

    unsigned long hash = 5381;  /* djb2 initial value */
    unsigned char buffer[8192];
    size_t bytes_read;

    bytes_read = fread(buffer, 1, sizeof(buffer), fp);
    fclose(fp);

    /* Division method hash (CS291 Module 5) */
    for (size_t i = 0; i < bytes_read; i++) {
        hash = ((hash << 5) + hash) + buffer[i]; /* hash * 33 + c */
    }

    return hash;
}
