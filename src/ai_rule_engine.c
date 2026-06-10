/*
 * NeuroSort AI — AI Rule Engine (Expert System)
 * CS202/CS292: Knowledge Representation, Forward Chaining, Heuristics
 *
 * Components:
 *   1. Knowledge Base: 20+ classification rules
 *   2. Inference Engine: Forward chaining with conflict resolution
 *   3. Heuristic Scoring: Multi-factor priority calculation
 *   4. Decision Tree: Rule-based classification structured as a tree
 *   5. Study Mode Detector: Academic file recognition
 *   6. Explanation Facility: Why was this file classified this way?
 *
 * Agent Architecture (CS202 Module 1):
 *   Percepts:  filename, extension, size, content keywords, dates
 *   Actuators: classify, prioritize, categorize, suggest action
 *   Environment: user's file system (partially observable)
 *   Performance: organization score, accuracy of classification
 */

#include "include/neurosort.h"

/* ═══════════════════════ KNOWLEDGE BASE CREATION ═══════════════════════ */

KnowledgeBase *kb_create(void) {
    KnowledgeBase *kb = (KnowledgeBase *)calloc(1, sizeof(KnowledgeBase));
    if (!kb) return NULL;
    kb->rule_count = 0;
    return kb;
}

void kb_add_rule(KnowledgeBase *kb, Rule rule) {
    if (kb->rule_count >= MAX_RULES) return;
    rule.rule_id = kb->rule_count + 1;
    kb->rules[kb->rule_count++] = rule;
}

/* Helper to build a rule easily */
static Rule make_rule(const char *name, const char *category, int cat_id,
                      int priority, const char *action, const char *explanation,
                      double confidence) {
    Rule r;
    memset(&r, 0, sizeof(Rule));
    strncpy(r.name, name, MAX_CATEGORY - 1);
    strncpy(r.category, category, MAX_CATEGORY - 1);
    r.category_id = cat_id;
    r.priority = priority;
    strncpy(r.action, action, MAX_ACTION - 1);
    strncpy(r.explanation, explanation, MAX_EXPLANATION - 1);
    r.confidence = confidence;
    r.min_size = 0;
    r.max_size = 0;
    r.max_age_days = 0;
    r.keyword_count = 0;
    r.extension_count = 0;
    return r;
}

static void add_keyword(Rule *r, const char *kw) {
    if (r->keyword_count < MAX_RULE_KEYWORDS)
        strncpy(r->keywords[r->keyword_count++], kw, MAX_KEYWORD_LEN - 1);
}

static void add_ext(Rule *r, const char *ext) {
    if (r->extension_count < MAX_RULE_KEYWORDS)
        strncpy(r->extensions[r->extension_count++], ext, MAX_EXTENSION - 1);
}

/* ═══════════════════════ INITIALIZE 25 EXPERT RULES ═══════════════════════ */

void kb_initialize_rules(KnowledgeBase *kb) {
    Rule r;

    /* RULE 1: Exam papers → Study Hub HIGH priority */
    r = make_rule("Exam Detection", "Study_Hub", CAT_STUDY_HUB, PRIORITY_HIGH,
        "MOVE_TO_STUDY_HUB", "Filename contains exam-related keywords", 0.95);
    add_keyword(&r, "exam"); add_keyword(&r, "final"); add_keyword(&r, "midterm");
    add_keyword(&r, "semester"); add_keyword(&r, "test");
    r.subcategory[0] = '\0'; strncpy(r.subcategory, "Exams", MAX_CATEGORY - 1);
    kb_add_rule(kb, r);

    /* RULE 2: Assignments → Study Hub MEDIUM */
    r = make_rule("Assignment Detection", "Study_Hub", CAT_STUDY_HUB, PRIORITY_MEDIUM,
        "MOVE_TO_STUDY_HUB", "Filename contains assignment keywords", 0.90);
    add_keyword(&r, "assignment"); add_keyword(&r, "homework"); add_keyword(&r, "lab");
    add_keyword(&r, "practical"); add_keyword(&r, "project");
    strncpy(r.subcategory, "Assignments", MAX_CATEGORY - 1);
    kb_add_rule(kb, r);

    /* RULE 3: Notes & lectures → Study Hub */
    r = make_rule("Notes Detection", "Study_Hub", CAT_STUDY_HUB, PRIORITY_MEDIUM,
        "MOVE_TO_STUDY_HUB", "Filename contains study material keywords", 0.88);
    add_keyword(&r, "notes"); add_keyword(&r, "lecture"); add_keyword(&r, "syllabus");
    add_keyword(&r, "study"); add_keyword(&r, "chapter"); add_keyword(&r, "tutorial");
    strncpy(r.subcategory, "Notes", MAX_CATEGORY - 1);
    kb_add_rule(kb, r);

    /* RULE 4: PDF documents */
    r = make_rule("PDF Document", "Documents", CAT_DOCUMENTS, PRIORITY_MEDIUM,
        "MOVE_TO_DOCS", "PDF file detected", 0.85);
    add_ext(&r, "pdf");
    kb_add_rule(kb, r);

    /* RULE 5: Word documents */
    r = make_rule("Word Document", "Documents", CAT_DOCUMENTS, PRIORITY_MEDIUM,
        "MOVE_TO_DOCS", "Word document detected", 0.85);
    add_ext(&r, "doc"); add_ext(&r, "docx"); add_ext(&r, "odt"); add_ext(&r, "rtf");
    kb_add_rule(kb, r);

    /* RULE 6: Spreadsheets */
    r = make_rule("Spreadsheet", "Documents", CAT_DOCUMENTS, PRIORITY_MEDIUM,
        "MOVE_TO_DOCS", "Spreadsheet file detected", 0.85);
    add_ext(&r, "xls"); add_ext(&r, "xlsx"); add_ext(&r, "csv"); add_ext(&r, "ods");
    kb_add_rule(kb, r);

    /* RULE 7: Presentations */
    r = make_rule("Presentation", "Documents", CAT_DOCUMENTS, PRIORITY_MEDIUM,
        "MOVE_TO_DOCS", "Presentation file detected", 0.85);
    add_ext(&r, "ppt"); add_ext(&r, "pptx"); add_ext(&r, "odp");
    kb_add_rule(kb, r);

    /* RULE 8: Small images */
    r = make_rule("Image File", "Images", CAT_IMAGES, PRIORITY_LOW,
        "MOVE_TO_IMAGES", "Image file detected", 0.90);
    add_ext(&r, "jpg"); add_ext(&r, "jpeg"); add_ext(&r, "png"); add_ext(&r, "gif");
    add_ext(&r, "bmp"); add_ext(&r, "svg"); add_ext(&r, "webp"); add_ext(&r, "ico");
    kb_add_rule(kb, r);

    /* RULE 9: Large images → Wallpapers */
    r = make_rule("Wallpaper Detection", "Images", CAT_IMAGES, PRIORITY_LOW,
        "MOVE_TO_WALLPAPERS", "Large image file - likely wallpaper", 0.75);
    add_ext(&r, "jpg"); add_ext(&r, "png"); add_ext(&r, "bmp");
    r.min_size = 5 * 1024 * 1024; /* > 5MB */
    strncpy(r.subcategory, "Wallpapers", MAX_CATEGORY - 1);
    kb_add_rule(kb, r);

    /* RULE 10: Videos */
    r = make_rule("Video File", "Videos", CAT_VIDEOS, PRIORITY_LOW,
        "MOVE_TO_VIDEOS", "Video file detected", 0.92);
    add_ext(&r, "mp4"); add_ext(&r, "avi"); add_ext(&r, "mkv"); add_ext(&r, "mov");
    add_ext(&r, "wmv"); add_ext(&r, "flv"); add_ext(&r, "webm");
    kb_add_rule(kb, r);

    /* RULE 11: Music & audio */
    r = make_rule("Audio File", "Music", CAT_MUSIC, PRIORITY_LOW,
        "MOVE_TO_MUSIC", "Audio file detected", 0.92);
    add_ext(&r, "mp3"); add_ext(&r, "wav"); add_ext(&r, "flac"); add_ext(&r, "aac");
    add_ext(&r, "ogg"); add_ext(&r, "wma"); add_ext(&r, "m4a");
    kb_add_rule(kb, r);

    /* RULE 12: Source code files */
    r = make_rule("Source Code", "Code", CAT_CODE, PRIORITY_MEDIUM,
        "MOVE_TO_CODE", "Source code file detected", 0.88);
    add_ext(&r, "c"); add_ext(&r, "h"); add_ext(&r, "cpp"); add_ext(&r, "py");
    add_ext(&r, "java"); add_ext(&r, "js"); add_ext(&r, "html"); add_ext(&r, "css");
    kb_add_rule(kb, r);

    /* RULE 13: Archives */
    r = make_rule("Archive File", "Archives", CAT_ARCHIVES, PRIORITY_LOW,
        "MOVE_TO_ARCHIVES", "Archive/compressed file detected", 0.90);
    add_ext(&r, "zip"); add_ext(&r, "rar"); add_ext(&r, "7z"); add_ext(&r, "tar");
    add_ext(&r, "gz"); add_ext(&r, "bz2");
    kb_add_rule(kb, r);

    /* RULE 14: Executables */
    r = make_rule("Executable", "Executables", CAT_EXECUTABLES, PRIORITY_LOW,
        "MOVE_TO_EXE", "Executable file detected", 0.85);
    add_ext(&r, "exe"); add_ext(&r, "msi"); add_ext(&r, "bat"); add_ext(&r, "sh");
    add_ext(&r, "cmd"); add_ext(&r, "com");
    kb_add_rule(kb, r);

    /* RULE 15: Old files → Archive (>365 days) */
    r = make_rule("Old File Archive", "Archives", CAT_ARCHIVES, PRIORITY_LOW,
        "SUGGEST_ARCHIVE", "File not modified for over 1 year", 0.70);
    r.max_age_days = 365;
    kb_add_rule(kb, r);

    /* RULE 16: Text files */
    r = make_rule("Text File", "Documents", CAT_DOCUMENTS, PRIORITY_LOW,
        "MOVE_TO_DOCS", "Plain text file detected", 0.80);
    add_ext(&r, "txt"); add_ext(&r, "md"); add_ext(&r, "log");
    kb_add_rule(kb, r);

    /* RULE 17: Database files */
    r = make_rule("Database File", "Code", CAT_CODE, PRIORITY_MEDIUM,
        "MOVE_TO_CODE", "Database file detected", 0.82);
    add_ext(&r, "sql"); add_ext(&r, "db"); add_ext(&r, "sqlite"); add_ext(&r, "json");
    add_ext(&r, "xml"); add_ext(&r, "yaml");
    kb_add_rule(kb, r);

    /* RULE 18: Font files */
    r = make_rule("Font File", "Documents", CAT_DOCUMENTS, PRIORITY_LOW,
        "MOVE_TO_DOCS", "Font file detected", 0.80);
    add_ext(&r, "ttf"); add_ext(&r, "otf"); add_ext(&r, "woff"); add_ext(&r, "woff2");
    kb_add_rule(kb, r);

    /* RULE 19: Quiz/Study content */
    r = make_rule("Quiz Detection", "Study_Hub", CAT_STUDY_HUB, PRIORITY_HIGH,
        "MOVE_TO_STUDY_HUB", "Quiz-related file detected", 0.92);
    add_keyword(&r, "quiz"); add_keyword(&r, "question"); add_keyword(&r, "paper");
    add_keyword(&r, "answer"); add_keyword(&r, "solution");
    strncpy(r.subcategory, "Exams", MAX_CATEGORY - 1);
    kb_add_rule(kb, r);

    /* RULE 20: Course material */
    r = make_rule("Course Material", "Study_Hub", CAT_STUDY_HUB, PRIORITY_MEDIUM,
        "MOVE_TO_STUDY_HUB", "Course material keywords detected", 0.85);
    add_keyword(&r, "course"); add_keyword(&r, "module"); add_keyword(&r, "unit");
    add_keyword(&r, "dsa"); add_keyword(&r, "algorithm");
    strncpy(r.subcategory, "Notes", MAX_CATEGORY - 1);
    kb_add_rule(kb, r);

    /* RULE 21: Screenshot detection */
    r = make_rule("Screenshot", "Images", CAT_IMAGES, PRIORITY_LOW,
        "MOVE_TO_SCREENSHOTS", "Screenshot file detected", 0.80);
    add_keyword(&r, "screenshot"); add_keyword(&r, "screen"); add_keyword(&r, "capture");
    add_ext(&r, "png"); add_ext(&r, "jpg");
    strncpy(r.subcategory, "Screenshots", MAX_CATEGORY - 1);
    kb_add_rule(kb, r);

    /* RULE 22: Resume/CV */
    r = make_rule("Resume Detection", "Documents", CAT_DOCUMENTS, PRIORITY_HIGH,
        "MOVE_TO_DOCS", "Resume/CV file detected", 0.88);
    add_keyword(&r, "resume"); add_keyword(&r, "cv"); add_keyword(&r, "curriculum");
    kb_add_rule(kb, r);

    /* RULE 23: Large video files */
    r = make_rule("Large Media", "Videos", CAT_VIDEOS, PRIORITY_LOW,
        "SUGGEST_REVIEW", "Very large media file - review recommended", 0.65);
    add_ext(&r, "mp4"); add_ext(&r, "mkv"); add_ext(&r, "avi");
    r.min_size = 1024L * 1024 * 1024; /* > 1GB */
    kb_add_rule(kb, r);

    /* RULE 24: Duplicate suggestion */
    r = make_rule("Duplicate Handler", "Duplicates", CAT_DUPLICATES, PRIORITY_LOW,
        "SUGGEST_DELETE", "Duplicate file detected by hash matching", 0.95);
    kb_add_rule(kb, r);

    /* RULE 25: Default catchall */
    r = make_rule("Default", "Others", CAT_OTHERS, PRIORITY_LOW,
        "MOVE_TO_OTHERS", "No specific rule matched - default category", 0.50);
    kb_add_rule(kb, r);

    printf("[AI ENGINE] Knowledge Base initialized with %d rules\n", kb->rule_count);
}

/* ═══════════════════════ RULE MATCHING ═══════════════════════ */

/* Check if a rule's keywords match a file */
static int rule_matches_keywords(Rule *rule, FileNode *file) {
    for (int k = 0; k < rule->keyword_count; k++) {
        if (string_contains(file->filename, rule->keywords[k]) ||
            string_contains(file->content_keywords, rule->keywords[k])) {
            return 1;
        }
    }
    return 0;
}

/* Check if a rule's extensions match a file */
static int rule_matches_extension(Rule *rule, FileNode *file) {
    if (rule->extension_count == 0) return 0;
    for (int e = 0; e < rule->extension_count; e++) {
        if (strcmp(file->extension, rule->extensions[e]) == 0)
            return 1;
    }
    return 0;
}

/* Check if a rule's size filter matches */
static int rule_matches_size(Rule *rule, FileNode *file) {
    if (rule->min_size > 0 && file->size < rule->min_size) return 0;
    if (rule->max_size > 0 && file->size > rule->max_size) return 0;
    return 1;
}

/* Check age filter */
static int rule_matches_age(Rule *rule, FileNode *file) {
    if (rule->max_age_days > 0) {
        int age = days_since_modified(file->modified_date);
        return (age > rule->max_age_days);
    }
    return 0;
}

/* ═══════════════════════ CLASSIFY SINGLE FILE ═══════════════════════ */

int ai_classify_file(KnowledgeBase *kb, FileNode *file) {
    int best_rule = -1;
    int best_priority = -1;
    double best_confidence = 0.0;

    /* Forward Chaining: Evaluate ALL rules against this file */
    for (int i = 0; i < kb->rule_count; i++) {
        Rule *rule = &kb->rules[i];
        int matched = 0;

        /* Check keyword match */
        if (rule->keyword_count > 0 && rule_matches_keywords(rule, file))
            matched = 1;

        /* Check extension match */
        if (rule->extension_count > 0 && rule_matches_extension(rule, file)) {
            if (rule->keyword_count == 0) matched = 1;
            else if (matched) matched = 1; /* Both match = stronger */
        }

        /* Check size constraints */
        if (matched && !rule_matches_size(rule, file))
            matched = 0;

        /* Check age constraint (special: only keyword is needed or just age) */
        if (!matched && rule->max_age_days > 0 && rule_matches_age(rule, file))
            matched = 1;

        /* Conflict Resolution: highest priority + confidence wins */
        if (matched) {
            if (rule->priority > best_priority ||
                (rule->priority == best_priority && rule->confidence > best_confidence)) {
                best_rule = i;
                best_priority = rule->priority;
                best_confidence = rule->confidence;
            }
        }
    }

    /* Apply winning rule */
    if (best_rule >= 0) {
        Rule *winner = &kb->rules[best_rule];
        strcpy(file->category, winner->category);
        file->category_id = winner->category_id;
        file->priority_level = winner->priority;

        if (winner->subcategory[0])
            strcpy(file->subcategory, winner->subcategory);

        snprintf(file->explanation, MAX_EXPLANATION,
            "Rule %d (%s): %s [Confidence: %.0f%%]",
            winner->rule_id, winner->name, winner->explanation,
            winner->confidence * 100);

        return best_rule;
    }

    /* Default: no rule matched */
    strcpy(file->category, "Others");
    file->category_id = CAT_OTHERS;
    file->priority_level = PRIORITY_LOW;
    strcpy(file->explanation, "No rule matched - assigned to Others");
    return -1;
}

/* ═══════════════════════ HEURISTIC SCORING (CS202 Module 3) ═══════════════════════ */

HeuristicScore ai_heuristic_score(FileNode *file) {
    HeuristicScore hs = {0, 0, 0, 0, 0};

    /* h1: Keyword match score (0-40) */
    const char *study_kw[] = {"exam","final","notes","assignment","lab",
                              "quiz","study","lecture","semester","project"};
    for (int i = 0; i < 10; i++) {
        if (string_contains(file->filename, study_kw[i])) {
            hs.keyword_score += 8; /* Each keyword adds 8 pts, max ~40 */
            if (hs.keyword_score > 40) hs.keyword_score = 40;
        }
    }

    /* h2: Recency score (0-30) — recent files are more important */
    int age = days_since_modified(file->modified_date);
    hs.recency_score = (age < 30) ? 30 - age : 0;
    if (hs.recency_score < 0) hs.recency_score = 0;

    /* h3: Size importance score (0-20) */
    if (file->size > 100 * 1024 * 1024)      hs.size_score = 5;  /* Very large */
    else if (file->size > 10 * 1024 * 1024)   hs.size_score = 10;
    else if (file->size > 1 * 1024 * 1024)    hs.size_score = 15;
    else if (file->size > 100 * 1024)          hs.size_score = 20; /* Sweet spot */
    else                                        hs.size_score = 8;

    /* h4: Extension importance score (0-10) */
    if (strcmp(file->extension, "pdf") == 0 || strcmp(file->extension, "docx") == 0)
        hs.extension_score = 10;
    else if (strcmp(file->extension, "pptx") == 0 || strcmp(file->extension, "xlsx") == 0)
        hs.extension_score = 8;
    else if (strcmp(file->extension, "c") == 0 || strcmp(file->extension, "py") == 0)
        hs.extension_score = 7;
    else if (strcmp(file->extension, "txt") == 0 || strcmp(file->extension, "md") == 0)
        hs.extension_score = 6;
    else
        hs.extension_score = 3;

    hs.total_score = hs.keyword_score + hs.recency_score + hs.size_score + hs.extension_score;
    return hs;
}

/* ═══════════════════════ STUDY MODE DETECTOR ═══════════════════════ */

int ai_detect_study_material(FileNode *file) {
    const char *study_keywords[] = {
        "notes", "assignment", "lab", "practical", "semester",
        "exam", "final", "quiz", "study", "lecture", "syllabus",
        "tutorial", "chapter", "module", "dsa", "algorithm",
        "question", "paper", "solution", "course"
    };
    int count = sizeof(study_keywords) / sizeof(study_keywords[0]);

    for (int i = 0; i < count; i++) {
        if (string_contains(file->filename, study_keywords[i]) ||
            string_contains(file->content_keywords, study_keywords[i])) {
            file->is_study_material = 1;
            return 1;
        }
    }
    return 0;
}

/* ═══════════════════════ DECISION TREE CLASSIFIER (CS202 Module 5) ═══════════════════════ */

int ai_decision_tree_classify(FileNode *file) {
    /*
     * Decision Tree Structure:
     *                  [Is Study Keyword?]
     *                 /        \
     *              YES          NO
     *              /              \
     *    [Is Exam/Quiz?]    [Check Extension]
     *      /      \           /    |    \
     *    YES      NO      doc  img  vid  other
     *     |        |
     *  HIGH_P   MED_P
     */

    /* Level 1: Study material? */
    if (ai_detect_study_material(file)) {
        /* Level 2: Exam or quiz? */
        if (string_contains(file->filename, "exam") ||
            string_contains(file->filename, "final") ||
            string_contains(file->filename, "quiz") ||
            string_contains(file->filename, "midterm")) {
            file->category_id = CAT_STUDY_HUB;
            strcpy(file->category, "Study_Hub");
            file->priority_level = PRIORITY_HIGH;
            return CAT_STUDY_HUB;
        }
        file->category_id = CAT_STUDY_HUB;
        strcpy(file->category, "Study_Hub");
        file->priority_level = PRIORITY_MEDIUM;
        return CAT_STUDY_HUB;
    }

    /* Level 2: Extension-based classification */
    const char *doc_ext[] = {"pdf","doc","docx","txt","md","ppt","pptx","xls","xlsx","odt","rtf","csv"};
    const char *img_ext[] = {"jpg","jpeg","png","gif","bmp","svg","webp","ico"};
    const char *vid_ext[] = {"mp4","avi","mkv","mov","wmv","flv","webm"};
    const char *aud_ext[] = {"mp3","wav","flac","aac","ogg","wma","m4a"};
    const char *code_ext[] = {"c","h","cpp","py","java","js","html","css","sql","json","xml"};
    const char *arc_ext[] = {"zip","rar","7z","tar","gz","bz2"};

    int i;
    for (i = 0; i < 12; i++) { if (strcmp(file->extension, doc_ext[i]) == 0) { file->category_id = CAT_DOCUMENTS; strcpy(file->category, "Documents"); return CAT_DOCUMENTS; } }
    for (i = 0; i < 8; i++)  { if (strcmp(file->extension, img_ext[i]) == 0) { file->category_id = CAT_IMAGES; strcpy(file->category, "Images"); return CAT_IMAGES; } }
    for (i = 0; i < 7; i++)  { if (strcmp(file->extension, vid_ext[i]) == 0) { file->category_id = CAT_VIDEOS; strcpy(file->category, "Videos"); return CAT_VIDEOS; } }
    for (i = 0; i < 7; i++)  { if (strcmp(file->extension, aud_ext[i]) == 0) { file->category_id = CAT_MUSIC; strcpy(file->category, "Music"); return CAT_MUSIC; } }
    for (i = 0; i < 11; i++) { if (strcmp(file->extension, code_ext[i]) == 0) { file->category_id = CAT_CODE; strcpy(file->category, "Code"); return CAT_CODE; } }
    for (i = 0; i < 6; i++)  { if (strcmp(file->extension, arc_ext[i]) == 0) { file->category_id = CAT_ARCHIVES; strcpy(file->category, "Archives"); return CAT_ARCHIVES; } }

    file->category_id = CAT_OTHERS;
    strcpy(file->category, "Others");
    return CAT_OTHERS;
}

/* ═══════════════════════ FORWARD CHAINING (CS202 Module 2) ═══════════════════════ */

void ai_forward_chain(KnowledgeBase *kb, FileArray *files) {
    printf("[AI ENGINE] Forward Chaining on %d files...\n", files->count);
    int rules_applied = 0;
    int study_count = 0;

    for (int i = 0; i < files->count; i++) {
        FileNode *file = files->files[i];

        /* Step 1: Classify using expert system rules */
        int rule_idx = ai_classify_file(kb, file);
        if (rule_idx >= 0) rules_applied++;

        /* Step 2: Calculate heuristic priority score */
        HeuristicScore hs = ai_heuristic_score(file);
        file->priority_score = hs.total_score;

        /* Step 3: Detect study materials */
        if (ai_detect_study_material(file)) study_count++;
    }

    printf("[AI ENGINE] Forward chaining complete.\n");
    printf("  Rules applied: %d | Study files: %d\n\n", rules_applied, study_count);
}

/* ═══════════════════════ EXPLANATION FACILITY ═══════════════════════ */

const char *ai_explain_classification(FileNode *file) {
    return file->explanation[0] ? file->explanation : "No classification applied yet";
}
