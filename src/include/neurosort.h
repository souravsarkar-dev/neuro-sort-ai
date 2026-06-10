/*
 * ═══════════════════════════════════════════════════════════════
 *  NeuroSort AI — Intelligent File Organization System
 *  Master Header File: Core Data Structures & Declarations
 * ═══════════════════════════════════════════════════════════════
 *  Course: CS291 (DSA Lab), CS292 (AI Lab), CS202 (Intro to AI)
 *  Regulation: R25 (B.Tech CSE)
 *  College: JIS College of Engineering, Kalyani
 * ═══════════════════════════════════════════════════════════════
 */

#ifndef NEUROSORT_H
#define NEUROSORT_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>

#ifdef _WIN32
    #include <windows.h>
    #include <direct.h>
    #define PATH_SEP '\\'
    #define MKDIR(path) _mkdir(path)
#else
    #include <dirent.h>
    #include <sys/stat.h>
    #include <unistd.h>
    #define PATH_SEP '/'
    #define MKDIR(path) mkdir(path, 0755)
#endif

/* ═══════════════════════════════════════════════════════════════
 * CONSTANTS
 * ═══════════════════════════════════════════════════════════════ */
#define MAX_FILENAME     256
#define MAX_PATH_LEN     1024
#define MAX_EXTENSION    16
#define MAX_CATEGORY     64
#define MAX_KEYWORDS     512
#define MAX_EXPLANATION   256
#define MAX_ACTION        64
#define MAX_FILES        10000
#define HASH_TABLE_SIZE  1009   /* Prime number for better distribution */
#define MAX_RULES         50
#define MAX_RULE_KEYWORDS 10
#define MAX_KEYWORD_LEN   50

/* Priority Levels */
#define PRIORITY_LOW     1
#define PRIORITY_MEDIUM  2
#define PRIORITY_HIGH    3

/* Operation Types (for Undo Stack) */
#define OP_MOVE          1
#define OP_COPY          2
#define OP_DELETE         3
#define OP_RENAME        4
#define OP_CREATE_DIR    5

/* Sorting Algorithm IDs */
#define SORT_BUBBLE      0
#define SORT_INSERTION   1
#define SORT_SELECTION   2
#define SORT_QUICK       3
#define SORT_MERGE       4
#define SORT_RADIX       5
#define NUM_SORT_ALGOS   6

/* Category IDs */
#define CAT_STUDY_HUB    0
#define CAT_DOCUMENTS    1
#define CAT_IMAGES       2
#define CAT_VIDEOS       3
#define CAT_MUSIC        4
#define CAT_CODE         5
#define CAT_ARCHIVES     6
#define CAT_EXECUTABLES  7
#define CAT_DUPLICATES   8
#define CAT_OTHERS       9
#define NUM_CATEGORIES   10

/* ═══════════════════════════════════════════════════════════════
 * MODULE 1: FILE NODE — Doubly Linked List (CS291)
 * ═══════════════════════════════════════════════════════════════ */
typedef struct FileNode {
    int              file_id;
    char             filename[MAX_FILENAME];
    char             filepath[MAX_PATH_LEN];
    char             extension[MAX_EXTENSION];
    long             size;                      /* File size in bytes */
    time_t           created_date;
    time_t           modified_date;
    char             content_keywords[MAX_KEYWORDS];
    unsigned long    hash_value;                /* For duplicate detection */
    int              priority_score;            /* AI-calculated: 0-100 */
    int              priority_level;            /* LOW, MEDIUM, HIGH */
    char             category[MAX_CATEGORY];
    int              category_id;
    char             subcategory[MAX_CATEGORY];
    char             explanation[MAX_EXPLANATION]; /* Expert system explanation */
    int              is_duplicate;              /* 0 = no, 1 = yes */
    int              is_study_material;         /* Study Mode flag */
    struct FileNode *next;                      /* Singly Linked List pointer */
    struct FileNode *prev;                      /* Doubly Linked List pointer */
} FileNode;

/* ═══════════════════════════════════════════════════════════════
 * MODULE 1: DYNAMIC ARRAY for File Metadata (CS291)
 * ═══════════════════════════════════════════════════════════════ */
typedef struct {
    FileNode **files;       /* Array of pointers to FileNodes */
    int        count;       /* Current number of files */
    int        capacity;    /* Allocated capacity */
} FileArray;

/* ═══════════════════════════════════════════════════════════════
 * MODULE 2: STACK — Undo/Redo Operations (CS291)
 * ═══════════════════════════════════════════════════════════════ */
typedef struct OperationNode {
    int                  operation_type;
    char                 source_path[MAX_PATH_LEN];
    char                 dest_path[MAX_PATH_LEN];
    time_t               timestamp;
    char                 description[MAX_EXPLANATION];
    struct OperationNode *next;
} OperationNode;

typedef struct {
    OperationNode *top;
    int            count;
} UndoStack;

/* ═══════════════════════════════════════════════════════════════
 * MODULE 2: QUEUE — File Processing Pipeline (CS291)
 * ═══════════════════════════════════════════════════════════════ */
typedef struct QueueNode {
    char             path[MAX_PATH_LEN];
    int              depth;
    struct QueueNode *next;
} QueueNode;

typedef struct {
    QueueNode *front;
    QueueNode *rear;
    int        count;
} Queue;

/* ═══════════════════════════════════════════════════════════════
 * MODULE 3: BINARY SEARCH TREE — Category Indexing (CS291)
 * ═══════════════════════════════════════════════════════════════ */
typedef struct BSTNode {
    char            key[MAX_FILENAME];     /* Filename or hash key */
    FileNode       *file_ref;              /* Reference to the file */
    int             count;                 /* Duplicate count */
    struct BSTNode *left;
    struct BSTNode *right;
} BSTNode;

/* ═══════════════════════════════════════════════════════════════
 * MODULE 3: AVL TREE — Self-Balancing Index (CS291)
 * ═══════════════════════════════════════════════════════════════ */
typedef struct AVLNode {
    char            key[MAX_FILENAME];
    FileNode       *file_ref;
    int             height;
    struct AVLNode *left;
    struct AVLNode *right;
} AVLNode;

/* ═══════════════════════════════════════════════════════════════
 * MODULE 5: HASH TABLE — Duplicate Detection (CS291)
 * ═══════════════════════════════════════════════════════════════ */
typedef struct HashEntry {
    unsigned long     hash_key;
    FileNode         *file_ref;
    struct HashEntry *next;     /* Chaining for collision resolution */
} HashEntry;

typedef struct {
    HashEntry *buckets[HASH_TABLE_SIZE];
    int        entry_count;
    int        collision_count;
    int        duplicate_count;
    long       wasted_space;    /* Total bytes wasted by duplicates */
} HashTable;

/* ═══════════════════════════════════════════════════════════════
 * AI MODULE: EXPERT SYSTEM RULE (CS202/CS292)
 * ═══════════════════════════════════════════════════════════════ */
typedef struct {
    int    rule_id;
    char   name[MAX_CATEGORY];
    char   keywords[MAX_RULE_KEYWORDS][MAX_KEYWORD_LEN];
    int    keyword_count;
    char   extensions[MAX_RULE_KEYWORDS][MAX_EXTENSION];
    int    extension_count;
    long   min_size;            /* Minimum file size filter (bytes) */
    long   max_size;            /* Maximum file size filter (bytes), 0 = no limit */
    int    max_age_days;        /* Max file age in days, 0 = no limit */
    char   category[MAX_CATEGORY];
    int    category_id;
    char   subcategory[MAX_CATEGORY];
    int    priority;            /* PRIORITY_LOW, MEDIUM, HIGH */
    char   action[MAX_ACTION];
    char   explanation[MAX_EXPLANATION];
    double confidence;          /* 0.0 to 1.0 */
} Rule;

typedef struct {
    Rule rules[MAX_RULES];
    int  rule_count;
} KnowledgeBase;

/* ═══════════════════════════════════════════════════════════════
 * AI MODULE: HEURISTIC SCORING (CS202)
 * ═══════════════════════════════════════════════════════════════ */
typedef struct {
    int keyword_score;     /* 0-40 */
    int recency_score;     /* 0-30 */
    int size_score;        /* 0-20 */
    int extension_score;   /* 0-10 */
    int total_score;       /* 0-100 */
} HeuristicScore;

/* ═══════════════════════════════════════════════════════════════
 * SORTING PERFORMANCE METRICS
 * ═══════════════════════════════════════════════════════════════ */
typedef struct {
    const char *name;
    int         comparisons;
    int         swaps;
    double      time_ms;
    const char *time_complexity;
    const char *space_complexity;
} SortMetrics;

/* ═══════════════════════════════════════════════════════════════
 * ORGANIZATION STATISTICS (for Dashboard)
 * ═══════════════════════════════════════════════════════════════ */
typedef struct {
    int    total_files;
    int    total_folders;
    int    categories_created;
    int    duplicates_found;
    long   total_size;
    long   space_saved;
    int    rules_applied;
    int    study_files;
    int    high_priority_files;
    int    medium_priority_files;
    int    low_priority_files;
    int    files_per_category[NUM_CATEGORIES];
    double processing_time_ms;
    int    sort_algorithm_used;
    SortMetrics sort_metrics[NUM_SORT_ALGOS];
} OrgStats;

/* Category names for display */
static const char *CATEGORY_NAMES[NUM_CATEGORIES] = {
    "Study_Hub", "Documents", "Images", "Videos", "Music",
    "Code", "Archives", "Executables", "Duplicates", "Others"
};

static const char *CATEGORY_ICONS[NUM_CATEGORIES] = {
    "📚", "📄", "🖼️", "🎬", "🎵",
    "💻", "📦", "⚙️", "♻️", "📂"
};

/* ═══════════════════════════════════════════════════════════════
 * FUNCTION DECLARATIONS — File Scanner
 * ═══════════════════════════════════════════════════════════════ */
FileNode *create_file_node(const char *filepath, const char *filename);
FileNode *scan_directory_bfs(const char *root_path, int *file_count);
void      free_file_list(FileNode *head);
void      print_file_list(FileNode *head);

/* ═══════════════════════════════════════════════════════════════
 * FUNCTION DECLARATIONS — Array Manager
 * ═══════════════════════════════════════════════════════════════ */
FileArray *create_file_array(int initial_capacity);
int        array_add(FileArray *arr, FileNode *file);
FileNode  *array_get(FileArray *arr, int index);
void       array_free(FileArray *arr);
FileArray *linked_list_to_array(FileNode *head, int count);

/* ═══════════════════════════════════════════════════════════════
 * FUNCTION DECLARATIONS — Sorting Algorithms
 * ═══════════════════════════════════════════════════════════════ */
void bubble_sort(FileArray *arr, SortMetrics *metrics);
void insertion_sort(FileArray *arr, SortMetrics *metrics);
void selection_sort(FileArray *arr, SortMetrics *metrics);
void quick_sort(FileArray *arr, SortMetrics *metrics);
void merge_sort(FileArray *arr, SortMetrics *metrics);
void radix_sort(FileArray *arr, SortMetrics *metrics);
int  auto_select_sort(int n);
int  compare_files(FileNode *a, FileNode *b);
void run_all_sorts_benchmark(FileArray *arr, SortMetrics metrics[NUM_SORT_ALGOS]);

/* ═══════════════════════════════════════════════════════════════
 * FUNCTION DECLARATIONS — BST Indexer
 * ═══════════════════════════════════════════════════════════════ */
BSTNode *bst_insert(BSTNode *root, const char *key, FileNode *file);
BSTNode *bst_search(BSTNode *root, const char *key);
BSTNode *bst_delete(BSTNode *root, const char *key);
void     bst_inorder(BSTNode *root, FileNode **sorted_list, int *index);
int      bst_height(BSTNode *root);
int      bst_count(BSTNode *root);
void     bst_free(BSTNode *root);

/* ═══════════════════════════════════════════════════════════════
 * FUNCTION DECLARATIONS — AVL Tree Indexer
 * ═══════════════════════════════════════════════════════════════ */
AVLNode *avl_insert(AVLNode *root, const char *key, FileNode *file);
AVLNode *avl_search(AVLNode *root, const char *key);
AVLNode *avl_delete(AVLNode *root, const char *key);
int      avl_height(AVLNode *node);
int      avl_balance_factor(AVLNode *node);
AVLNode *avl_rotate_left(AVLNode *node);
AVLNode *avl_rotate_right(AVLNode *node);
void     avl_free(AVLNode *root);

/* ═══════════════════════════════════════════════════════════════
 * FUNCTION DECLARATIONS — Stack & Queue
 * ═══════════════════════════════════════════════════════════════ */
UndoStack *stack_create(void);
void       stack_push(UndoStack *stack, int op_type, const char *src, const char *dst, const char *desc);
OperationNode *stack_pop(UndoStack *stack);
OperationNode *stack_peek(UndoStack *stack);
int        stack_is_empty(UndoStack *stack);
void       stack_free(UndoStack *stack);

Queue     *queue_create(void);
void       queue_enqueue(Queue *q, const char *path, int depth);
QueueNode *queue_dequeue(Queue *q);
int        queue_is_empty(Queue *q);
void       queue_free(Queue *q);

/* ═══════════════════════════════════════════════════════════════
 * FUNCTION DECLARATIONS — Hash Table
 * ═══════════════════════════════════════════════════════════════ */
HashTable    *hash_table_create(void);
unsigned long hash_division(const unsigned char *data, int len);
unsigned long hash_folding(const unsigned char *data, int len);
unsigned long hash_midsquare(unsigned long value);
void          hash_table_insert(HashTable *ht, FileNode *file);
HashEntry    *hash_table_search(HashTable *ht, unsigned long hash_key);
int           hash_table_detect_duplicates(HashTable *ht, FileArray *duplicates);
void          hash_table_free(HashTable *ht);

/* ═══════════════════════════════════════════════════════════════
 * FUNCTION DECLARATIONS — Search Engine
 * ═══════════════════════════════════════════════════════════════ */
int  linear_search_keyword(FileArray *arr, const char *keyword);
int  binary_search_name(FileArray *arr, const char *name);
int  interpolation_search_size(FileArray *arr, long target_size);

/* ═══════════════════════════════════════════════════════════════
 * FUNCTION DECLARATIONS — AI Rule Engine
 * ═══════════════════════════════════════════════════════════════ */
KnowledgeBase *kb_create(void);
void           kb_initialize_rules(KnowledgeBase *kb);
void           kb_add_rule(KnowledgeBase *kb, Rule rule);
int            ai_classify_file(KnowledgeBase *kb, FileNode *file);
HeuristicScore ai_heuristic_score(FileNode *file);
void           ai_forward_chain(KnowledgeBase *kb, FileArray *files);
const char    *ai_explain_classification(FileNode *file);
int            ai_detect_study_material(FileNode *file);
int            ai_decision_tree_classify(FileNode *file);

/* ═══════════════════════════════════════════════════════════════
 * FUNCTION DECLARATIONS — Organizer
 * ═══════════════════════════════════════════════════════════════ */
int  organize_files(const char *source_path, const char *dest_path, OrgStats *stats);
void create_category_dirs(const char *base_path);
int  move_file(const char *src, const char *dst);
void generate_report_json(OrgStats *stats, FileArray *files, const char *output_path);

/* ═══════════════════════════════════════════════════════════════
 * FUNCTION DECLARATIONS — Utilities
 * ═══════════════════════════════════════════════════════════════ */
void  get_extension(const char *filename, char *ext);
long  get_file_size(const char *filepath);
void  to_lowercase(char *str);
int   string_contains(const char *haystack, const char *needle);
int   days_since_modified(time_t modified);
char *format_size(long bytes, char *buffer);
void  make_path(char *dest, const char *base, const char *sub);
int   ensure_directory(const char *path);
unsigned long compute_file_hash(const char *filepath);

#endif /* NEUROSORT_H */
