/*
 * NeuroSort AI — Stack & Queue Module
 * CS291 Module 2: Stacks & Queues
 *
 * Stack: Undo/redo operation history (linked list based)
 * Note: Queue is implemented in file_scanner.c
 */

#include "include/neurosort.h"

/* ═══════════════════════ UNDO STACK ═══════════════════════ */

UndoStack *stack_create(void) {
    UndoStack *s = (UndoStack *)malloc(sizeof(UndoStack));
    if (!s) return NULL;
    s->top = NULL;
    s->count = 0;
    return s;
}

void stack_push(UndoStack *stack, int op_type, const char *src, const char *dst, const char *desc) {
    OperationNode *node = (OperationNode *)malloc(sizeof(OperationNode));
    if (!node) return;
    node->operation_type = op_type;
    strncpy(node->source_path, src ? src : "", MAX_PATH_LEN - 1);
    node->source_path[MAX_PATH_LEN - 1] = '\0';
    strncpy(node->dest_path, dst ? dst : "", MAX_PATH_LEN - 1);
    node->dest_path[MAX_PATH_LEN - 1] = '\0';
    strncpy(node->description, desc ? desc : "", MAX_EXPLANATION - 1);
    node->description[MAX_EXPLANATION - 1] = '\0';
    node->timestamp = time(NULL);
    node->next = stack->top;
    stack->top = node;
    stack->count++;
}

OperationNode *stack_pop(UndoStack *stack) {
    if (!stack || !stack->top) return NULL;
    OperationNode *node = stack->top;
    stack->top = stack->top->next;
    stack->count--;
    return node;
}

OperationNode *stack_peek(UndoStack *stack) {
    return (stack && stack->top) ? stack->top : NULL;
}

int stack_is_empty(UndoStack *stack) {
    return (!stack || !stack->top);
}

void stack_free(UndoStack *stack) {
    if (!stack) return;
    while (!stack_is_empty(stack)) {
        OperationNode *n = stack_pop(stack);
        free(n);
    }
    free(stack);
}
