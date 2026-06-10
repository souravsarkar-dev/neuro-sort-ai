/*
 * NeuroSort AI — File Scanner Module
 * CS291 Module 1: Arrays & Linked Lists
 * CS291 Module 2: Queue for BFS Folder Traversal
 *
 * DSA Used: Doubly Linked List, Queue (BFS), Dynamic Array
 */

#include "include/neurosort.h"

static int global_file_id = 0;

/* === QUEUE IMPLEMENTATION (CS291 Module 2) === */

Queue *queue_create(void) {
    Queue *q = (Queue *)malloc(sizeof(Queue));
    if (!q) return NULL;
    q->front = q->rear = NULL;
    q->count = 0;
    return q;
}

void queue_enqueue(Queue *q, const char *path, int depth) {
    QueueNode *node = (QueueNode *)malloc(sizeof(QueueNode));
    if (!node) return;
    strncpy(node->path, path, MAX_PATH_LEN - 1);
    node->path[MAX_PATH_LEN - 1] = '\0';
    node->depth = depth;
    node->next = NULL;
    if (q->rear == NULL) { q->front = q->rear = node; }
    else { q->rear->next = node; q->rear = node; }
    q->count++;
}

QueueNode *queue_dequeue(Queue *q) {
    if (!q || !q->front) return NULL;
    QueueNode *node = q->front;
    q->front = q->front->next;
    if (!q->front) q->rear = NULL;
    q->count--;
    return node;
}

int queue_is_empty(Queue *q) { return (!q || !q->front); }

void queue_free(Queue *q) {
    if (!q) return;
    while (!queue_is_empty(q)) { QueueNode *n = queue_dequeue(q); free(n); }
    free(q);
}

/* === FILE NODE CREATION (Doubly Linked List Node) === */

FileNode *create_file_node(const char *filepath, const char *filename) {
    FileNode *node = (FileNode *)calloc(1, sizeof(FileNode));
    if (!node) return NULL;

    node->file_id = global_file_id++;
    strncpy(node->filename, filename, MAX_FILENAME - 1);
    strncpy(node->filepath, filepath, MAX_PATH_LEN - 1);
    get_extension(filename, node->extension);
    node->size = get_file_size(filepath);

#ifdef _WIN32
    WIN32_FILE_ATTRIBUTE_DATA fad;
    if (GetFileAttributesExA(filepath, GetFileExInfoStandard, &fad)) {
        ULARGE_INTEGER ull;
        ull.LowPart = fad.ftLastWriteTime.dwLowDateTime;
        ull.HighPart = fad.ftLastWriteTime.dwHighDateTime;
        node->modified_date = (time_t)((ull.QuadPart - 116444736000000000ULL) / 10000000ULL);
        ull.LowPart = fad.ftCreationTime.dwLowDateTime;
        ull.HighPart = fad.ftCreationTime.dwHighDateTime;
        node->created_date = (time_t)((ull.QuadPart - 116444736000000000ULL) / 10000000ULL);
    }
#else
    struct stat st;
    if (stat(filepath, &st) == 0) {
        node->modified_date = st.st_mtime;
        node->created_date = st.st_ctime;
    }
#endif

    node->hash_value = compute_file_hash(filepath);
    node->content_keywords[0] = '\0';

    /* Read first 1KB of text files for keyword extraction */
    if (strcmp(node->extension, "txt") == 0 || strcmp(node->extension, "md") == 0 ||
        strcmp(node->extension, "csv") == 0 || strcmp(node->extension, "log") == 0) {
        FILE *fp = fopen(filepath, "r");
        if (fp) {
            size_t n = fread(node->content_keywords, 1, MAX_KEYWORDS - 1, fp);
            node->content_keywords[n] = '\0';
            fclose(fp);
        }
    }

    node->priority_score = 0;
    node->priority_level = PRIORITY_MEDIUM;
    node->category_id = CAT_OTHERS;
    strcpy(node->category, "Others");
    node->is_duplicate = 0;
    node->is_study_material = 0;
    node->next = node->prev = NULL;
    return node;
}

/* === BFS DIRECTORY SCANNER === */

FileNode *scan_directory_bfs(const char *root_path, int *file_count) {
    FileNode *head = NULL, *tail = NULL;
    *file_count = 0;

    Queue *dir_queue = queue_create();
    if (!dir_queue) return NULL;
    queue_enqueue(dir_queue, root_path, 0);

    printf("\n[SCANNER] BFS scan: %s\n", root_path);

    while (!queue_is_empty(dir_queue)) {
        QueueNode *cur = queue_dequeue(dir_queue);

#ifdef _WIN32
        WIN32_FIND_DATAA fdata;
        char search[MAX_PATH_LEN];
        snprintf(search, MAX_PATH_LEN, "%s\\*", cur->path);
        HANDLE hFind = FindFirstFileA(search, &fdata);
        if (hFind != INVALID_HANDLE_VALUE) {
            do {
                if (strcmp(fdata.cFileName, ".") == 0 || strcmp(fdata.cFileName, "..") == 0) continue;
                char full[MAX_PATH_LEN];
                snprintf(full, MAX_PATH_LEN, "%s\\%s", cur->path, fdata.cFileName);
                if (fdata.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
                    queue_enqueue(dir_queue, full, cur->depth + 1);
                } else {
                    FileNode *node = create_file_node(full, fdata.cFileName);
                    if (node) {
                        if (!head) { head = tail = node; }
                        else { tail->next = node; node->prev = tail; tail = node; }
                        (*file_count)++;
                    }
                }
            } while (FindNextFileA(hFind, &fdata));
            FindClose(hFind);
        }
#else
        DIR *dir = opendir(cur->path);
        if (dir) {
            struct dirent *entry;
            while ((entry = readdir(dir)) != NULL) {
                if (strcmp(entry->d_name, ".") == 0 || strcmp(entry->d_name, "..") == 0) continue;
                char full[MAX_PATH_LEN];
                snprintf(full, MAX_PATH_LEN, "%s/%s", cur->path, entry->d_name);
                struct stat st;
                if (stat(full, &st) != 0) continue;
                if (S_ISDIR(st.st_mode)) {
                    queue_enqueue(dir_queue, full, cur->depth + 1);
                } else if (S_ISREG(st.st_mode)) {
                    FileNode *node = create_file_node(full, entry->d_name);
                    if (node) {
                        if (!head) { head = tail = node; }
                        else { tail->next = node; node->prev = tail; tail = node; }
                        (*file_count)++;
                    }
                }
            }
            closedir(dir);
        }
#endif
        free(cur);
    }
    queue_free(dir_queue);
    printf("[SCANNER] Complete. Files found: %d\n\n", *file_count);
    return head;
}

/* === DYNAMIC ARRAY MANAGER (CS291 Module 1) === */

FileArray *create_file_array(int initial_capacity) {
    FileArray *arr = (FileArray *)malloc(sizeof(FileArray));
    if (!arr) return NULL;
    arr->files = (FileNode **)calloc(initial_capacity, sizeof(FileNode *));
    if (!arr->files) { free(arr); return NULL; }
    arr->count = 0;
    arr->capacity = initial_capacity;
    return arr;
}

int array_add(FileArray *arr, FileNode *file) {
    if (arr->count >= arr->capacity) {
        int new_cap = arr->capacity * 2;
        FileNode **nf = (FileNode **)realloc(arr->files, new_cap * sizeof(FileNode *));
        if (!nf) return -1;
        arr->files = nf;
        arr->capacity = new_cap;
    }
    arr->files[arr->count++] = file;
    return 0;
}

FileNode *array_get(FileArray *arr, int index) {
    if (index < 0 || index >= arr->count) return NULL;
    return arr->files[index];
}

void array_free(FileArray *arr) {
    if (!arr) return;
    free(arr->files);
    free(arr);
}

FileArray *linked_list_to_array(FileNode *head, int count) {
    FileArray *arr = create_file_array(count > 0 ? count : 16);
    if (!arr) return NULL;
    FileNode *cur = head;
    while (cur) { array_add(arr, cur); cur = cur->next; }
    return arr;
}

void print_file_list(FileNode *head) {
    FileNode *cur = head;
    char buf[32];
    int i = 0;
    printf("\n%-4s | %-30s | %-8s | %-6s | %-10s\n", "ID", "Filename", "Size", "Ext", "Priority");
    printf("─────┼────────────────────────────────┼──────────┼────────┼───────────\n");
    while (cur && i < 50) {
        format_size(cur->size, buf);
        printf("%4d | %-30.30s | %8s | %-6s | %d\n",
            cur->file_id, cur->filename, buf, cur->extension, cur->priority_level);
        cur = cur->next; i++;
    }
}

void free_file_list(FileNode *head) {
    FileNode *cur = head;
    while (cur) { FileNode *next = cur->next; free(cur); cur = next; }
}
