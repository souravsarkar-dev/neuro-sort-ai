/*
 * NeuroSort AI — BST & AVL Tree Indexer
 * CS291 Module 3: Trees
 *
 * BST: Category indexing, fast duplicate detection, in-order traversal
 * AVL: Self-balancing tree for real-time file indexing
 */

#include "include/neurosort.h"

/* ═══════════════════════ BST IMPLEMENTATION ═══════════════════════ */

static BSTNode *bst_create_node(const char *key, FileNode *file) {
    BSTNode *node = (BSTNode *)malloc(sizeof(BSTNode));
    if (!node) return NULL;
    strncpy(node->key, key, MAX_FILENAME - 1);
    node->key[MAX_FILENAME - 1] = '\0';
    node->file_ref = file;
    node->count = 1;
    node->left = node->right = NULL;
    return node;
}

BSTNode *bst_insert(BSTNode *root, const char *key, FileNode *file) {
    if (!root) return bst_create_node(key, file);
    int cmp = strcmp(key, root->key);
    if (cmp < 0) root->left = bst_insert(root->left, key, file);
    else if (cmp > 0) root->right = bst_insert(root->right, key, file);
    else root->count++; /* Duplicate key found */
    return root;
}

BSTNode *bst_search(BSTNode *root, const char *key) {
    if (!root) return NULL;
    int cmp = strcmp(key, root->key);
    if (cmp == 0) return root;
    if (cmp < 0) return bst_search(root->left, key);
    return bst_search(root->right, key);
}

static BSTNode *bst_min_node(BSTNode *root) {
    while (root && root->left) root = root->left;
    return root;
}

BSTNode *bst_delete(BSTNode *root, const char *key) {
    if (!root) return NULL;
    int cmp = strcmp(key, root->key);
    if (cmp < 0) root->left = bst_delete(root->left, key);
    else if (cmp > 0) root->right = bst_delete(root->right, key);
    else {
        if (!root->left) {
            BSTNode *tmp = root->right; free(root); return tmp;
        } else if (!root->right) {
            BSTNode *tmp = root->left; free(root); return tmp;
        }
        BSTNode *succ = bst_min_node(root->right);
        strcpy(root->key, succ->key);
        root->file_ref = succ->file_ref;
        root->right = bst_delete(root->right, succ->key);
    }
    return root;
}

void bst_inorder(BSTNode *root, FileNode **list, int *index) {
    if (!root) return;
    bst_inorder(root->left, list, index);
    list[(*index)++] = root->file_ref;
    bst_inorder(root->right, list, index);
}

int bst_height(BSTNode *root) {
    if (!root) return 0;
    int lh = bst_height(root->left);
    int rh = bst_height(root->right);
    return 1 + (lh > rh ? lh : rh);
}

int bst_count(BSTNode *root) {
    if (!root) return 0;
    return 1 + bst_count(root->left) + bst_count(root->right);
}

void bst_free(BSTNode *root) {
    if (!root) return;
    bst_free(root->left);
    bst_free(root->right);
    free(root);
}

/* ═══════════════════════ AVL TREE IMPLEMENTATION ═══════════════════════ */

static AVLNode *avl_create_node(const char *key, FileNode *file) {
    AVLNode *node = (AVLNode *)malloc(sizeof(AVLNode));
    if (!node) return NULL;
    strncpy(node->key, key, MAX_FILENAME - 1);
    node->key[MAX_FILENAME - 1] = '\0';
    node->file_ref = file;
    node->height = 1;
    node->left = node->right = NULL;
    return node;
}

int avl_height(AVLNode *node) {
    return node ? node->height : 0;
}

static int avl_max(int a, int b) { return (a > b) ? a : b; }

static void avl_update_height(AVLNode *node) {
    if (node) node->height = 1 + avl_max(avl_height(node->left), avl_height(node->right));
}

int avl_balance_factor(AVLNode *node) {
    return node ? avl_height(node->left) - avl_height(node->right) : 0;
}

/* Right rotation (LL case) */
AVLNode *avl_rotate_right(AVLNode *y) {
    AVLNode *x = y->left;
    AVLNode *T2 = x->right;
    x->right = y;
    y->left = T2;
    avl_update_height(y);
    avl_update_height(x);
    return x;
}

/* Left rotation (RR case) */
AVLNode *avl_rotate_left(AVLNode *x) {
    AVLNode *y = x->right;
    AVLNode *T2 = y->left;
    y->left = x;
    x->right = T2;
    avl_update_height(x);
    avl_update_height(y);
    return y;
}

AVLNode *avl_insert(AVLNode *root, const char *key, FileNode *file) {
    if (!root) return avl_create_node(key, file);

    int cmp = strcmp(key, root->key);
    if (cmp < 0) root->left = avl_insert(root->left, key, file);
    else if (cmp > 0) root->right = avl_insert(root->right, key, file);
    else return root; /* Duplicate */

    avl_update_height(root);
    int balance = avl_balance_factor(root);

    /* LL Case */ if (balance > 1 && strcmp(key, root->left->key) < 0) return avl_rotate_right(root);
    /* RR Case */ if (balance < -1 && strcmp(key, root->right->key) > 0) return avl_rotate_left(root);
    /* LR Case */ if (balance > 1 && strcmp(key, root->left->key) > 0) { root->left = avl_rotate_left(root->left); return avl_rotate_right(root); }
    /* RL Case */ if (balance < -1 && strcmp(key, root->right->key) < 0) { root->right = avl_rotate_right(root->right); return avl_rotate_left(root); }

    return root;
}

AVLNode *avl_search(AVLNode *root, const char *key) {
    if (!root) return NULL;
    int cmp = strcmp(key, root->key);
    if (cmp == 0) return root;
    if (cmp < 0) return avl_search(root->left, key);
    return avl_search(root->right, key);
}

static AVLNode *avl_min_node(AVLNode *root) {
    while (root && root->left) root = root->left;
    return root;
}

AVLNode *avl_delete(AVLNode *root, const char *key) {
    if (!root) return NULL;
    int cmp = strcmp(key, root->key);
    if (cmp < 0) root->left = avl_delete(root->left, key);
    else if (cmp > 0) root->right = avl_delete(root->right, key);
    else {
        if (!root->left || !root->right) {
            AVLNode *tmp = root->left ? root->left : root->right;
            if (!tmp) { tmp = root; root = NULL; }
            else *root = *tmp;
            free(tmp);
        } else {
            AVLNode *succ = avl_min_node(root->right);
            strcpy(root->key, succ->key);
            root->file_ref = succ->file_ref;
            root->right = avl_delete(root->right, succ->key);
        }
    }
    if (!root) return NULL;

    avl_update_height(root);
    int balance = avl_balance_factor(root);

    if (balance > 1 && avl_balance_factor(root->left) >= 0) return avl_rotate_right(root);
    if (balance > 1 && avl_balance_factor(root->left) < 0) { root->left = avl_rotate_left(root->left); return avl_rotate_right(root); }
    if (balance < -1 && avl_balance_factor(root->right) <= 0) return avl_rotate_left(root);
    if (balance < -1 && avl_balance_factor(root->right) > 0) { root->right = avl_rotate_right(root->right); return avl_rotate_left(root); }

    return root;
}

void avl_free(AVLNode *root) {
    if (!root) return;
    avl_free(root->left);
    avl_free(root->right);
    free(root);
}
