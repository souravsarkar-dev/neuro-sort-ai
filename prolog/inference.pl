%% ═══════════════════════════════════════════════════════════════
%%  NeuroSort AI — Prolog Inference Engine
%%  CS292 Lab: Forward Chaining Implementation
%% ═══════════════════════════════════════════════════════════════

:- consult(knowledge_base).

%% ── FORWARD CHAINING ENGINE ──
%% Applies all matching rules to derive new facts

:- dynamic derived/2.
:- dynamic file_ext/2.
:- dynamic file_contains_keyword/2.
:- dynamic file_size/2.
:- dynamic file_age_days/2.
:- dynamic is_duplicate/1.

%% Forward chain: apply rules until no new facts can be derived
forward_chain :-
    (derive_new_fact -> forward_chain ; true).

derive_new_fact :-
    classify_smart(File, Category),
    \+ derived(File, category(Category)),
    assert(derived(File, category(Category))).

derive_new_fact :-
    priority(File, Priority),
    \+ derived(File, priority(Priority)),
    assert(derived(File, priority(Priority))).

derive_new_fact :-
    is_study_material(File),
    \+ derived(File, study_material),
    assert(derived(File, study_material)).

%% ── BATCH CLASSIFICATION ──
%% Classify a list of files and return results

classify_batch([], []).
classify_batch([File|Rest], [Result|Results]) :-
    organize(File, Category, Subcategory, Priority, Action),
    Result = result(File, Category, Subcategory, Priority, Action),
    classify_batch(Rest, Results).

%% ── FILE ASSERTION HELPERS ──
%% Used by the Python bridge to assert file facts

assert_file(Name, Ext, Size, AgeDays, Keywords) :-
    assert(file_ext(Name, Ext)),
    assert(file_size(Name, Size)),
    assert(file_age_days(Name, AgeDays)),
    assert_keywords(Name, Keywords).

assert_keywords(_, []).
assert_keywords(Name, [K|Ks]) :-
    assert(file_contains_keyword(Name, K)),
    assert_keywords(Name, Ks).

mark_duplicate(Name) :-
    assert(is_duplicate(Name)).

%% ── CLEANUP ──

clear_all_facts :-
    retractall(file_ext(_, _)),
    retractall(file_contains_keyword(_, _)),
    retractall(file_size(_, _)),
    retractall(file_age_days(_, _)),
    retractall(is_duplicate(_)),
    retractall(derived(_, _)).

%% ── MAIN ENTRY: Process a single file ──

process_file(Name, Ext, Size, AgeDays, Keywords, Result) :-
    clear_all_facts,
    assert_file(Name, Ext, Size, AgeDays, Keywords),
    forward_chain,
    organize(Name, Category, Subcategory, Priority, Action),
    Result = result(Name, Category, Subcategory, Priority, Action).
