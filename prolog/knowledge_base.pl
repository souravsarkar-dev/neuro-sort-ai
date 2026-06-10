%% ═══════════════════════════════════════════════════════════════
%%  NeuroSort AI — Prolog Knowledge Base
%%  CS292 Lab: Symbolic AI / Logic Programming
%%
%%  Knowledge Representation using:
%%   • Propositional Logic: IF extension == X THEN category = Y
%%   • Predicate Logic: file(X) ∧ contains(X, "exam") → study_hub(X)
%%   • Facts + Rules for Expert System
%% ═══════════════════════════════════════════════════════════════

%% ── FACTS: File Extension Categories ──

doc_extension(pdf).
doc_extension(doc).
doc_extension(docx).
doc_extension(odt).
doc_extension(rtf).
doc_extension(txt).
doc_extension(md).

image_extension(jpg).
image_extension(jpeg).
image_extension(png).
image_extension(gif).
image_extension(bmp).
image_extension(svg).
image_extension(webp).

video_extension(mp4).
video_extension(avi).
video_extension(mkv).
video_extension(mov).
video_extension(wmv).
video_extension(flv).

audio_extension(mp3).
audio_extension(wav).
audio_extension(flac).
audio_extension(aac).
audio_extension(ogg).

code_extension(c).
code_extension(h).
code_extension(cpp).
code_extension(py).
code_extension(java).
code_extension(js).
code_extension(html).
code_extension(css).

archive_extension(zip).
archive_extension(rar).
archive_extension('7z').
archive_extension(tar).
archive_extension(gz).

executable_extension(exe).
executable_extension(msi).
executable_extension(bat).
executable_extension(sh).

%% ── FACTS: Study Keywords ──

study_keyword(exam).
study_keyword(final).
study_keyword(midterm).
study_keyword(semester).
study_keyword(assignment).
study_keyword(homework).
study_keyword(lab).
study_keyword(practical).
study_keyword(notes).
study_keyword(lecture).
study_keyword(syllabus).
study_keyword(quiz).
study_keyword(study).
study_keyword(tutorial).
study_keyword(chapter).
study_keyword(course).
study_keyword(module).

%% ── FACTS: Priority Keywords ──

high_priority_keyword(exam).
high_priority_keyword(final).
high_priority_keyword(midterm).
high_priority_keyword(quiz).
high_priority_keyword(deadline).
high_priority_keyword(urgent).

%% ── RULES: Category Classification ──

%% Rule: Classify file by extension
classify(File, documents) :- file_ext(File, Ext), doc_extension(Ext).
classify(File, images)    :- file_ext(File, Ext), image_extension(Ext).
classify(File, videos)    :- file_ext(File, Ext), video_extension(Ext).
classify(File, music)     :- file_ext(File, Ext), audio_extension(Ext).
classify(File, code)      :- file_ext(File, Ext), code_extension(Ext).
classify(File, archives)  :- file_ext(File, Ext), archive_extension(Ext).
classify(File, executables):- file_ext(File, Ext), executable_extension(Ext).
classify(_, others).

%% Rule: Study material detection (Predicate Logic)
%% ∀x (File(x) ∧ contains_keyword(x, K) ∧ study_keyword(K)) → study_material(x)
is_study_material(File) :-
    file_contains_keyword(File, Keyword),
    study_keyword(Keyword).

%% Rule: Priority assignment
priority(File, high) :-
    file_contains_keyword(File, Keyword),
    high_priority_keyword(Keyword), !.
priority(File, medium) :-
    is_study_material(File), !.
priority(_, low).

%% Rule: Study Hub classification (overrides extension-based)
classify_smart(File, study_hub) :-
    is_study_material(File), !.
classify_smart(File, Category) :-
    classify(File, Category).

%% Rule: Subcategory for Study Hub
study_subcategory(File, exams) :-
    file_contains_keyword(File, exam), !.
study_subcategory(File, exams) :-
    file_contains_keyword(File, quiz), !.
study_subcategory(File, exams) :-
    file_contains_keyword(File, midterm), !.
study_subcategory(File, assignments) :-
    file_contains_keyword(File, assignment), !.
study_subcategory(File, assignments) :-
    file_contains_keyword(File, homework), !.
study_subcategory(File, assignments) :-
    file_contains_keyword(File, lab), !.
study_subcategory(_, notes).

%% Rule: Large image = wallpaper
is_wallpaper(File) :-
    file_ext(File, Ext),
    image_extension(Ext),
    file_size(File, Size),
    Size > 5000000.

%% Rule: Old file detection
is_old_file(File) :-
    file_age_days(File, Days),
    Days > 365.

%% Rule: Duplicate suggestion
suggest_action(File, delete) :-
    is_duplicate(File), !.
suggest_action(File, archive) :-
    is_old_file(File), !.
suggest_action(_, organize).

%% ── EXPLANATION FACILITY ──

explain(File, Explanation) :-
    classify_smart(File, Category),
    priority(File, Priority),
    format(atom(Explanation),
           'File ~w classified as ~w with ~w priority',
           [File, Category, Priority]).

%% ── QUERY INTERFACE ──

%% Find all high priority files
find_high_priority(Files) :-
    findall(F, priority(F, high), Files).

%% Find all study materials
find_study_materials(Files) :-
    findall(F, is_study_material(F), Files).

%% Organize file (main entry point)
organize(File, Category, Subcategory, Priority, Action) :-
    classify_smart(File, Category),
    (Category = study_hub ->
        study_subcategory(File, Subcategory)
    ;
        Subcategory = none
    ),
    priority(File, Priority),
    suggest_action(File, Action).
