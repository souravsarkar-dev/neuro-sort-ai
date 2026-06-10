import re
import time
import os

class Rule:
    def __init__(self, rule_id, name, category, subfolder="", priority="Low", action="", explanation="", confidence=0.0):
        self.rule_id = rule_id
        self.name = name
        self.category = category
        self.subfolder = subfolder
        self.priority = priority  # "High", "Medium", "Low"
        self.action = action
        self.explanation = explanation
        self.confidence = confidence
        self.keywords = []
        self.extensions = []
        self.min_size = 0
        self.max_size = 0
        self.max_age_days = 0

    def add_keyword(self, kw):
        self.keywords.append(kw)

    def add_ext(self, ext):
        self.extensions.append(ext.lower())

def initialize_rules():
    rules = []

    # Rule 1: Exam Detection -> Study_Hub/Exams, High Priority
    r = Rule(1, "Exam Detection", "Study_Hub", "Exams", "High", "MOVE_TO_STUDY_HUB", "Filename contains exam-related keywords", 0.95)
    for kw in ["exam", "final", "midterm", "quiz"]:
        r.add_keyword(kw)
    rules.append(r)

    # Rule 2: Assignment Detection -> Study_Hub/Assignments, Medium
    r = Rule(2, "Assignment Detection", "Study_Hub", "Assignments", "Medium", "MOVE_TO_STUDY_HUB", "Filename contains assignment keywords", 0.90)
    for kw in ["assignment", "homework", "lab", "practical", "project"]:
        r.add_keyword(kw)
    rules.append(r)

    # Rule 3: Notes & Lectures -> Study_Hub/Notes, Medium
    r = Rule(3, "Notes Detection", "Study_Hub", "Notes", "Medium", "MOVE_TO_STUDY_HUB", "Filename contains study material keywords", 0.88)
    for kw in ["notes", "study", "guide", "tutorial", "lecture", "material", "chapter", "semester"]:
        r.add_keyword(kw)
    rules.append(r)

    # Rule 4: PDF Document -> Documents, Medium
    r = Rule(4, "PDF Document", "Documents", "", "Medium", "MOVE_TO_DOCS", "PDF file detected", 0.85)
    r.add_ext("pdf")
    rules.append(r)

    # Rule 5: Word Document -> Documents, Medium
    r = Rule(5, "Word Document", "Documents", "", "Medium", "MOVE_TO_DOCS", "Word document detected", 0.85)
    for ext in ["doc", "docx", "odt", "rtf"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 6: Spreadsheet -> Documents, Medium
    r = Rule(6, "Spreadsheet", "Documents", "", "Medium", "MOVE_TO_DOCS", "Spreadsheet file detected", 0.85)
    for ext in ["xls", "xlsx", "csv", "ods"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 7: Presentation -> Documents, Medium
    r = Rule(7, "Presentation", "Documents", "", "Medium", "MOVE_TO_DOCS", "Presentation file detected", 0.85)
    for ext in ["ppt", "pptx", "odp"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 8: Wallpaper Detection -> Images/Wallpapers, Low
    r = Rule(8, "Wallpaper Detection", "Images", "Wallpapers", "Low", "MOVE_TO_WALLPAPERS", "Large image file or wallpaper filename", 0.75)
    for ext in ["jpg", "jpeg", "png", "bmp", "gif", "webp"]:
        r.add_ext(ext)
    r.add_keyword("wallpaper")
    # Will also trigger if size > 5MB in evaluate
    rules.append(r)

    # Rule 9: Small Image -> Images, Low
    r = Rule(9, "Image File", "Images", "", "Low", "MOVE_TO_IMAGES", "Image file detected", 0.90)
    for ext in ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 10: Videos -> Videos, Low
    r = Rule(11, "Video File", "Videos", "", "Low", "MOVE_TO_VIDEOS", "Video file detected", 0.92)
    for ext in ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 11: Music & Audio -> Music, Low
    r = Rule(12, "Audio File", "Music", "", "Low", "MOVE_TO_MUSIC", "Audio file detected", 0.92)
    for ext in ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 12: Source Code -> Code, Medium
    r = Rule(13, "Source Code", "Code", "", "Medium", "MOVE_TO_CODE", "Source code file detected", 0.88)
    for ext in ["c", "h", "cpp", "py", "java", "js", "html", "css"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 13: Database File -> Code, Medium
    r = Rule(14, "Database File", "Code", "", "Medium", "MOVE_TO_CODE", "Database file detected", 0.82)
    for ext in ["sql", "db", "sqlite", "json", "xml", "yaml"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 14: Archives -> Archives, Low
    r = Rule(15, "Archive File", "Archives", "", "Low", "MOVE_TO_ARCHIVES", "Archive/compressed file detected", 0.90)
    for ext in ["zip", "rar", "7z", "tar", "gz", "bz2"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 15: Executables -> Executables, Low
    r = Rule(16, "Executable", "Executables", "", "Low", "MOVE_TO_EXE", "Executable file detected", 0.85)
    for ext in ["exe", "msi", "bat", "sh", "cmd", "com"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 16: Font Files -> Documents, Low
    r = Rule(17, "Font File", "Documents", "", "Low", "MOVE_TO_DOCS", "Font file detected", 0.80)
    for ext in ["ttf", "otf", "woff", "woff2"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 17: Screenshot detection -> Images/Screenshots, Low
    r = Rule(18, "Screenshot", "Images", "Screenshots", "Low", "MOVE_TO_SCREENSHOTS", "Screenshot file detected", 0.80)
    for kw in ["screenshot", "screen", "capture"]:
        r.add_keyword(kw)
    for ext in ["png", "jpg", "jpeg"]:
        r.add_ext(ext)
    rules.append(r)

    # Rule 18: Default catchall -> Others, Low
    r = Rule(20, "Default", "Others", "", "Low", "MOVE_TO_OTHERS", "No specific rule matched - default category", 0.50)
    rules.append(r)

    return rules

def evaluate_word_boundary(keyword, filename, content_keywords=""):
    """
    Rigorously checks if the keyword exists with exact word boundaries.
    Uses (?<![a-zA-Z0-9])keyword(?![a-zA-Z0-9]) as mandated.
    """
    pattern = rf"(?<![a-zA-Z0-9]){re.escape(keyword)}(?![a-zA-Z0-9])"
    # Search both filename and extracted content keywords (case-insensitive)
    if re.search(pattern, filename, re.IGNORECASE):
        return True
    if content_keywords and re.search(pattern, content_keywords, re.IGNORECASE):
        return True
    return False

def classify_file(rules, file_info):
    """
    Forward chaining classification. Evaluates the 18-rule priority table against a file.
    Rules are evaluated in priority order: High -> Medium -> Low. Lower rule ID wins ties.
    Returns: category, subfolder, priority_str, priority_val (1=Low, 2=Med, 3=High), explanation, confidence
    """
    filename = file_info["name"]
    ext = file_info["ext"]
    size = file_info["size"]
    content = file_info.get("content_keywords", "")
    
    # Priority sorting helper
    def priority_val(p_str):
        return {"High": 3, "Medium": 2, "Low": 1}[p_str]

    matched_rules = []

    for rule in rules:
        matched = False
        keyword_matches = 0

        # Special Case: Default Catchall
        if rule.name == "Default":
            matched = True

        # Special Case: Wallpaper detection can trigger if size > 5MB and extension is image
        elif rule.name == "Wallpaper Detection" and ext in rule.extensions and size > 5 * 1024 * 1024:
            matched = True

        else:
            # Check keyword match
            if rule.keywords:
                matched_kws = [kw for kw in rule.keywords if evaluate_word_boundary(kw, filename, content)]
                if matched_kws:
                    matched = True
                    keyword_matches = len(matched_kws)

            # Check extension match
            if rule.extensions and ext in rule.extensions:
                if not rule.keywords:
                    matched = True
                elif matched:
                    # Both match makes it a solid classification
                    pass

            # For screenshots, both extension and keywords MUST match
            if rule.name == "Screenshot":
                if not (ext in rule.extensions and any(evaluate_word_boundary(kw, filename, content) for kw in rule.keywords)):
                    matched = False

        if matched:
            # Calculate dynamic confidence
            if rule.keywords and keyword_matches > 0:
                # matched_keywords / total_rule_keywords * 100
                confidence = (keyword_matches / len(rule.keywords)) * 100
            else:
                confidence = rule.confidence * 100

            # Clip confidence to reasonable range
            confidence = max(50.0, min(100.0, confidence))

            matched_rules.append((rule, confidence))

    # Media category override: Media files (videos/audio) shouldn't go to Study_Hub unless they are HIGH priority (Exams)
    if ext in ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm", "mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"]:
        matched_rules = [x for x in matched_rules if not (x[0].category == "Study_Hub" and x[0].priority in ["Medium", "Low"])]

    # Conflict Resolution: Sort by priority value DESC, then by rule_id ASC (lower rule number wins)
    matched_rules.sort(key=lambda x: (-priority_val(x[0].priority), x[0].rule_id))

    if matched_rules:
        winning_rule, confidence = matched_rules[0]
        p_val = priority_val(winning_rule.priority)
        
        # Build explanation
        subfolder_desc = f" ({winning_rule.subfolder})" if winning_rule.subfolder else ""
        explanation = f"Rule {winning_rule.rule_id} ({winning_rule.name}): {winning_rule.explanation} [Confidence: {confidence:.0f}%]"
        
        return winning_rule.category, winning_rule.subfolder, winning_rule.priority, p_val, explanation, confidence
    
    # Fallback default
    return "Others", "", "Low", 1, "No rule matched - assigned to Others", 50.0

def calculate_heuristic_score(file_info, matched_category):
    """
    Calculates the 4-factor heuristic score as specified.
    Total score = keyword * 40% + recency * 30% + size * 20% + extension * 10%
    Wait, the spec states:
    "Heuristic score is a 4-factor breakdown (keyword match 40%, recency 30%, size 20%, extension type 10%)"
    Wait! Let's match the exact scoring logic and factor values so they add up to a 0-100 score.
    """
    filename = file_info["name"].lower()
    ext = file_info["ext"]
    size = file_info["size"]
    modified = file_info["modified"]

    # Factor 1: Keyword score (0-40)
    study_keywords = ["exam", "final", "notes", "assignment", "lab", "quiz", "study", "lecture", "semester", "project"]
    matched_study = [kw for kw in study_keywords if evaluate_word_boundary(kw, file_info["name"], "")]
    # Each matched keyword adds 8 points (max 40)
    keyword_score = min(40, len(matched_study) * 8)

    # Factor 2: Recency score (0-30)
    age_days = (time.time() - modified) / (24 * 3600)
    recency_score = max(0, min(30, 30 - age_days))

    # Factor 3: Size score (0-20)
    if size > 100 * 1024 * 1024:  # > 100MB
        size_score = 5
    elif size > 10 * 1024 * 1024:  # > 10MB
        size_score = 10
    elif size > 1 * 1024 * 1024:  # > 1MB
        size_score = 15
    elif size > 100 * 1024:  # > 100KB (Sweet spot)
        size_score = 20
    else:
        size_score = 8

    # Factor 4: Extension score (0-10)
    if ext in ["pdf", "docx"]:
        ext_score = 10
    elif ext in ["pptx", "xlsx"]:
        ext_score = 8
    elif ext in ["c", "py"]:
        ext_score = 7
    elif ext in ["txt", "md"]:
        ext_score = 6
    else:
        ext_score = 3

    total_score = keyword_score + recency_score + size_score + ext_score

    # Determine if it's academic material
    is_study = matched_category == "Study_Hub"

    return {
        "keyword": round(keyword_score, 1),
        "recency": round(recency_score, 1),
        "size": round(size_score, 1),
        "extension": round(ext_score, 1),
        "total": round(total_score, 1),
        "is_study": is_study
    }
