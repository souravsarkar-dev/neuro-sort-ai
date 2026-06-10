import os
import uuid
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from engine.scanner import scan_directory_bfs
from engine.classifier import initialize_rules, classify_file, calculate_heuristic_score, format_size
from engine.sorter import run_sorting_benchmark
from engine.hasher import detect_duplicates
from engine.report_generator import generate_report

app = Flask(__name__, static_folder="static")
CORS(app)  # Enable Cross-Origin Resource Sharing

# Global memory to store processed jobs
jobs_db = {}
undo_history = {}

@app.route('/')
def index():
    """Serves the dashboard home page."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    """Serves static assets (CSS, JS, images)."""
    return send_from_directory(app.static_folder, path)

@app.route('/api/organize', methods=['POST'])
def api_organize():
    """
    Accepts {folder_path: string}.
    Scans the folder, runs the classification engine, duplicate checks, sorting,
    and returns a job_id.
    """
    data = request.get_json() or {}
    folder_path = data.get("folder_path", "").strip()

    if not folder_path:
        return jsonify({"error": "Folder path is required"}), 400

    if not os.path.exists(folder_path):
        return jsonify({"error": f"Folder path does not exist: {folder_path}"}), 400

    job_id = str(uuid.uuid4())
    jobs_db[job_id] = {
        "status": "processing",
        "progress": 0,
        "folder_path": folder_path,
        "report": None,
        "created_at": time.time()
    }

    try:
        # Simulate processing step by step
        # Phase 1: BFS Scan
        files_list = scan_directory_bfs(folder_path)
        jobs_db[job_id]["progress"] = 25

        if not files_list:
            jobs_db[job_id] = {
                "status": "completed",
                "progress": 100,
                "report": {
                    "project": "NeuroSort AI",
                    "error": "Empty folder scanned",
                    "files": [],
                    "statistics": {"totalFiles": 0}
                }
            }
            return jsonify({"job_id": job_id}), 200

        # Phase 2: AI Classification
        rules = initialize_rules()
        for f in files_list:
            cat, subf, pri_str, pri_val, expl, conf = classify_file(rules, f)
            f["category"] = cat
            f["subcategory"] = subf
            f["priority"] = pri_str
            f["priority_val"] = pri_val
            f["explanation"] = expl
            f["confidence"] = conf
            f["sizeFormatted"] = format_size(f["size"])
            
            # Dynamic Heuristic calculation
            h_score = calculate_heuristic_score(f, cat)
            f["priorityScore"] = h_score["total"]
            f["heuristic"] = h_score
            f["is_study"] = h_score["is_study"]
            
        jobs_db[job_id]["progress"] = 50

        # Phase 3: Hash table duplicates
        duplicates, uniques, wasted_space = detect_duplicates(files_list)
        jobs_db[job_id]["progress"] = 75

        # Phase 4: Sorting Benchmark & auto-selection
        sort_benchmark, sort_winner, _ = run_sorting_benchmark(files_list)

        # Phase 5: Assembly of report.json
        report = generate_report(files_list, duplicates, wasted_space, sort_benchmark, sort_winner, dest_folder=folder_path)
        
        # Save generated report
        jobs_db[job_id]["report"] = report
        jobs_db[job_id]["status"] = "completed"
        jobs_db[job_id]["progress"] = 100

        # Initialize undo history for this job
        undo_history[job_id] = report.get("undoStack", [])

    except Exception as e:
        import traceback
        traceback.print_exc()
        jobs_db[job_id] = {
            "status": "failed",
            "progress": 100,
            "error": str(e)
        }

    return jsonify({"job_id": job_id}), 200

@app.route('/api/status/<job_id>', methods=['GET'])
def api_status(job_id):
    """Returns the current progress and status of the organization job."""
    job = jobs_db.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "error": job.get("error")
    }), 200

@app.route('/api/report/<job_id>', methods=['GET'])
def api_report(job_id):
    """Returns the full report.json generated for a job."""
    job = jobs_db.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job["status"] != "completed":
        return jsonify({"error": "Job not completed yet"}), 400
    return jsonify(job["report"]), 200

@app.route('/api/undo', methods=['POST'])
def api_undo():
    """
    Simulates popping the last operation from the undo stack.
    Returns the popped move operation as feedback.
    """
    data = request.get_json() or {}
    job_id = data.get("job_id", "")
    
    stack = undo_history.get(job_id)
    if not stack:
        # If no specific job_id, try to use the latest completed job
        if undo_history:
            latest_job_id = list(undo_history.keys())[-1]
            stack = undo_history[latest_job_id]
        else:
            return jsonify({"error": "No operations found on undo stack"}), 400

    if not stack:
        return jsonify({"error": "Undo stack is empty"}), 400

    # Pop last operation
    popped_op = stack.pop()
    return jsonify({
        "success": True,
        "message": f"Successfully reversed movement of {popped_op['filename']}",
        "undone_operation": popped_op,
        "remaining_stack_size": len(stack)
    }), 200

if __name__ == '__main__':
    # Build directories if missing
    os.makedirs("static", exist_ok=True)
    print("NeuroSort AI Backend serving on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
