/*
 * NeuroSort AI — Hash Table Module
 * CS291 Module 5: Hashing
 *
 * Implements: Division, Folding, Mid-Square hash methods
 * Collision Resolution: Separate Chaining (linked lists)
 * Purpose: Duplicate file detection & fast lookup
 */

#include "include/neurosort.h"

/* ═══════════════════════ HASH TABLE CREATION ═══════════════════════ */

HashTable *hash_table_create(void) {
    HashTable *ht = (HashTable *)calloc(1, sizeof(HashTable));
    if (!ht) return NULL;
    for (int i = 0; i < HASH_TABLE_SIZE; i++)
        ht->buckets[i] = NULL;
    ht->entry_count = 0;
    ht->collision_count = 0;
    ht->duplicate_count = 0;
    ht->wasted_space = 0;
    return ht;
}

/* ═══════════════════════ HASH FUNCTIONS (CS291 Module 5) ═══════════════════════ */

/* Division Method: h(k) = k mod m (m = table size, prime) */
unsigned long hash_division(const unsigned char *data, int len) {
    unsigned long sum = 0;
    for (int i = 0; i < len; i++)
        sum += data[i];
    return sum % HASH_TABLE_SIZE;
}

/* Folding Method: Split key into parts, sum them */
unsigned long hash_folding(const unsigned char *data, int len) {
    unsigned long hash = 0;
    for (int i = 0; i < len; i += 4) {
        unsigned long part = 0;
        for (int j = 0; j < 4 && (i + j) < len; j++)
            part = (part << 8) | data[i + j];
        hash += part;
    }
    return hash % HASH_TABLE_SIZE;
}

/* Mid-Square Method: Square the key, extract middle digits */
unsigned long hash_midsquare(unsigned long value) {
    unsigned long squared = value * value;
    /* Extract middle bits (shift right by 16, mask lower bits) */
    return ((squared >> 16) & 0xFFFF) % HASH_TABLE_SIZE;
}

/* Combined hash using file hash + size for better distribution */
static unsigned long compute_bucket_index(FileNode *file) {
    /* Combine content hash with file size for uniqueness */
    unsigned long combined = file->hash_value ^ (unsigned long)(file->size * 2654435761UL);
    return combined % HASH_TABLE_SIZE;
}

/* ═══════════════════════ INSERT WITH CHAINING ═══════════════════════ */

void hash_table_insert(HashTable *ht, FileNode *file) {
    unsigned long index = compute_bucket_index(file);

    /* Check for collision / duplicate */
    HashEntry *existing = ht->buckets[index];
    while (existing) {
        if (existing->file_ref->hash_value == file->hash_value &&
            existing->file_ref->size == file->size) {
            /* Potential duplicate found! Verify by comparing more fields */
            if (strcmp(existing->file_ref->extension, file->extension) == 0) {
                file->is_duplicate = 1;
                ht->duplicate_count++;
                ht->wasted_space += file->size;
                snprintf(file->explanation, MAX_EXPLANATION,
                    "DUPLICATE of '%s' (Hash match + same size %ld bytes)",
                    existing->file_ref->filename, file->size);
            }
        }
        existing = existing->next;
    }

    /* Create new entry and chain it */
    HashEntry *entry = (HashEntry *)malloc(sizeof(HashEntry));
    if (!entry) return;
    entry->hash_key = file->hash_value;
    entry->file_ref = file;
    entry->next = ht->buckets[index];

    if (ht->buckets[index] != NULL)
        ht->collision_count++;

    ht->buckets[index] = entry;
    ht->entry_count++;
}

/* ═══════════════════════ SEARCH ═══════════════════════ */

HashEntry *hash_table_search(HashTable *ht, unsigned long hash_key) {
    unsigned long index = hash_key % HASH_TABLE_SIZE;
    HashEntry *entry = ht->buckets[index];
    while (entry) {
        if (entry->hash_key == hash_key)
            return entry;
        entry = entry->next;
    }
    return NULL;
}

/* ═══════════════════════ DUPLICATE DETECTION ═══════════════════════ */

int hash_table_detect_duplicates(HashTable *ht, FileArray *duplicates) {
    int dup_count = 0;

    for (int i = 0; i < HASH_TABLE_SIZE; i++) {
        HashEntry *entry = ht->buckets[i];
        if (!entry) continue;

        /* Check if this bucket has chains (potential duplicates) */
        while (entry) {
            if (entry->file_ref && entry->file_ref->is_duplicate) {
                if (duplicates) array_add(duplicates, entry->file_ref);
                dup_count++;
            }
            entry = entry->next;
        }
    }

    printf("[HASH] Duplicate detection complete:\n");
    printf("  Entries: %d | Collisions: %d | Duplicates: %d\n",
        ht->entry_count, ht->collision_count, dup_count);

    char buf[32];
    format_size(ht->wasted_space, buf);
    printf("  Wasted space by duplicates: %s\n", buf);

    return dup_count;
}

/* ═══════════════════════ CLEANUP ═══════════════════════ */

void hash_table_free(HashTable *ht) {
    if (!ht) return;
    for (int i = 0; i < HASH_TABLE_SIZE; i++) {
        HashEntry *entry = ht->buckets[i];
        while (entry) {
            HashEntry *next = entry->next;
            free(entry);
            entry = next;
        }
    }
    free(ht);
}
