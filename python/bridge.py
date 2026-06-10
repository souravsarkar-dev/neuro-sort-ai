"""
NeuroSort AI — Python Bridge
Connects C Engine + Prolog Knowledge Base

This module:
1. Calls the compiled C engine (neurosort.exe) with folder paths
2. Optionally bridges SWI-Prolog for symbolic AI reasoning
3. Reads the generated JSON report
4. Can serve the dashboard locally
"""

import os
import sys
import json
import subprocess
import http.server
import socketserver
import webbrowser
from pathlib import Path

# ═══════════════════════ CONFIGURATION ═══════════════════════

PROJECT_ROOT = Path(__file__).parent.parent
C_ENGINE = PROJECT_ROOT / "neurosort.exe"
PROLOG_KB = PROJECT_ROOT / "prolog" / "knowledge_base.pl"
PROLOG_INF = PROJECT_ROOT / "prolog" / "inference.pl"
WEB_DIR = PROJECT_ROOT / "web"
REPORT_PATH = None  # Set after running


def run_c_engine(source_folder, output_folder=None):
    """Execute the C engine binary with the given folder path."""
    if not C_ENGINE.exists():
        print(f"[ERROR] C engine not found at: {C_ENGINE}")
        print("[TIP] Build it first: gcc -o neurosort src/*.c -lm")
        return None

    cmd = [str(C_ENGINE), source_folder]
    if output_folder:
        cmd.append(output_folder)

    print(f"[BRIDGE] Running C engine: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    print(result.stdout)
    if result.stderr:
        print(f"[STDERR] {result.stderr}")

    # Find the report.json
    out_dir = output_folder or os.path.join(source_folder, "Organized")
    report_path = os.path.join(out_dir, "report.json")

    if os.path.exists(report_path):
        global REPORT_PATH
        REPORT_PATH = report_path
        print(f"[BRIDGE] Report generated: {report_path}")
        return report_path
    else:
        print("[WARNING] No report.json found")
        return None


def load_report(report_path):
    """Load and parse the JSON report from the C engine."""
    with open(report_path, 'r') as f:
        return json.load(f)


def try_prolog_classify(filename, extension, size, age_days, keywords):
    """
    Attempt to use SWI-Prolog for classification.
    Falls back gracefully if Prolog is not installed.
    """
    try:
        # Check if SWI-Prolog is available
        result = subprocess.run(['swipl', '--version'],
                                capture_output=True, text=True, timeout=5)
        if result.returncode != 0:
            raise FileNotFoundError
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print("[PROLOG] SWI-Prolog not found, using C engine only")
        return None

    # Build Prolog query
    kw_list = "[" + ",".join(keywords) + "]"
    query = (
        f"consult('{PROLOG_INF}'), "
        f"process_file('{filename}', '{extension}', {size}, {age_days}, {kw_list}, Result), "
        f"write(Result), halt."
    )

    try:
        result = subprocess.run(
            ['swipl', '-g', query],
            capture_output=True, text=True, timeout=10,
            cwd=str(PROJECT_ROOT / "prolog")
        )
        if result.stdout:
            print(f"[PROLOG] Result: {result.stdout}")
            return result.stdout.strip()
    except subprocess.TimeoutExpired:
        print("[PROLOG] Query timed out")

    return None


def serve_dashboard(port=8080):
    """Start a local HTTP server to serve the dashboard."""
    os.chdir(str(PROJECT_ROOT))

    handler = http.server.SimpleHTTPRequestHandler

    with socketserver.TCPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}/web/index.html"
        print(f"\n[DASHBOARD] Serving at: {url}")
        print("[DASHBOARD] Press Ctrl+C to stop\n")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[DASHBOARD] Server stopped.")


def print_report_summary(report):
    """Print a formatted summary of the organization report."""
    stats = report.get('statistics', {})
    print("\n" + "=" * 60)
    print("  NeuroSort AI — Organization Report Summary")
    print("=" * 60)
    print(f"  Total Files:       {stats.get('totalFiles', 0)}")
    print(f"  Categories:        {stats.get('categoriesCreated', 0)}")
    print(f"  Duplicates:        {stats.get('duplicatesFound', 0)}")
    print(f"  Study Files:       {stats.get('studyFiles', 0)}")
    print(f"  High Priority:     {stats.get('highPriority', 0)}")
    print(f"  Rules Applied:     {stats.get('rulesApplied', 0)}")
    print(f"  Sort Algorithm:    {stats.get('sortAlgorithm', 'N/A')}")
    print(f"  Processing Time:   {stats.get('processingTimeMs', 0):.2f} ms")
    print("=" * 60)

    print("\n  Category Distribution:")
    for cat in report.get('categories', []):
        if cat['count'] > 0:
            bar = "█" * min(cat['count'], 30)
            print(f"    {cat['icon']} {cat['name']:15s} {bar} ({cat['count']})")

    print("\n  Sorting Benchmark:")
    for algo in report.get('sortBenchmark', []):
        selected = " ★" if algo.get('selected') else ""
        print(f"    {algo['name']:18s} | {algo['complexity']:12s} | "
              f"{algo['timeMs']:8.3f} ms | "
              f"Comparisons: {algo['comparisons']:6d}{selected}")
    print()


# ═══════════════════════ MAIN ═══════════════════════

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("NeuroSort AI — Python Bridge")
        print(f"Usage: python {sys.argv[0]} <command> [args]")
        print("\nCommands:")
        print("  organize <folder>  — Run the C engine on a folder")
        print("  dashboard          — Start the web dashboard server")
        print("  report <path>      — Display a report summary")
        print("  demo               — Run demo mode")
        sys.exit(0)

    command = sys.argv[1].lower()

    if command == "organize" and len(sys.argv) >= 3:
        source = sys.argv[2]
        output = sys.argv[3] if len(sys.argv) >= 4 else None
        report_path = run_c_engine(source, output)
        if report_path:
            report = load_report(report_path)
            print_report_summary(report)

    elif command == "dashboard":
        port = int(sys.argv[2]) if len(sys.argv) >= 3 else 8080
        serve_dashboard(port)

    elif command == "report" and len(sys.argv) >= 3:
        report = load_report(sys.argv[2])
        print_report_summary(report)

    elif command == "demo":
        report_path = run_c_engine(".", None)
        if report_path:
            report = load_report(report_path)
            print_report_summary(report)

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
