import os
import time
from collections import deque

def scan_directory_bfs(root_path, max_files=10000):
    """
    Scans a directory using Breadth-First Search (BFS) with a queue.
    Mirrors the C doubly-linked list & Queue scan logic in file_scanner.c.
    Handles symlink loops, permission errors, empty folders, and large dataset limits.
    """
    root_path = os.path.abspath(root_path)
    if not os.path.exists(root_path) or not os.path.isdir(root_path):
        raise FileNotFoundError(f"Directory not found: {root_path}")

    files_list = []
    queue = deque([(root_path, 0)])  # Queue contains (path, depth)
    visited_dirs = {root_path}      # Track to prevent symlink loops

    while queue:
        current_dir, depth = queue.popleft()

        # Enforce reasonable directory depth to prevent overflow/infinite recursion
        if depth > 50:
            continue

        try:
            entries = os.scandir(current_dir)
        except PermissionError:
            # Handle permission denied gracefully
            print(f"[SCANNER] Permission denied: {current_dir}")
            continue
        except Exception as e:
            print(f"[SCANNER] Error scanning {current_dir}: {e}")
            continue

        for entry in entries:
            try:
                # Stop if max file count exceeded (CS291 Large Dataset limit)
                if len(files_list) >= max_files:
                    print(f"[SCANNER] Large dataset limit reached: {max_files} files")
                    break

                if entry.is_dir(follow_symlinks=False):
                    real_path = os.path.realpath(entry.path)
                    if real_path not in visited_dirs:
                        visited_dirs.add(real_path)
                        queue.append((entry.path, depth + 1))
                elif entry.is_file(follow_symlinks=False):
                    stat = entry.stat()
                    name = entry.name
                    ext = os.path.splitext(name)[1].lstrip('.').lower()
                    
                    # Read content keywords for text-based study files (up to 1KB)
                    content_keywords = ""
                    if ext in ['txt', 'md', 'csv', 'log']:
                        try:
                            with open(entry.path, 'r', encoding='utf-8', errors='ignore') as f:
                                content_keywords = f.read(1024)
                        except Exception:
                            pass

                    files_list.append({
                        "id": len(files_list),
                        "name": name,
                        "ext": ext,
                        "size": stat.st_size,
                        "created": stat.st_ctime,
                        "modified": stat.st_mtime,
                        "path": entry.path,
                        "content_keywords": content_keywords
                    })
            except Exception as e:
                print(f"[SCANNER] Error processing entry {entry.name}: {e}")
                continue
                
    return files_list
