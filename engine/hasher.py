import hashlib
import os

def calculate_md5(filepath):
    """
    Computes MD5 hash of first 8KB of a file for O(1) duplicate lookup efficiency.
    Handles exceptions if permission is denied.
    """
    if not os.path.exists(filepath):
        return None
    try:
        hash_md5 = hashlib.md5()
        with open(filepath, "rb") as f:
            # Read first 8KB (as in C compute_file_hash)
            chunk = f.read(8192)
            hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except Exception:
        # Fallback to absolute filename string hashing if read fails
        return hashlib.md5(filepath.encode('utf-8')).hexdigest()

def detect_duplicates(files_list):
    """
    Groups files by content MD5 hash.
    Identifies duplicate files and groups them.
    Returns: (duplicates_list, unique_files_list, wasted_space_bytes)
    """
    hash_table = {}
    duplicates = []
    unique_files = []
    wasted_space = 0

    for file_info in files_list:
        filepath = file_info["path"]
        
        # Calculate hash (or use mock hash if it's a simulated scan)
        if os.path.exists(filepath):
            file_hash = calculate_md5(filepath)
        else:
            # Simulated hash based on file content_keywords or filename size
            seed = file_info["name"]
            # To simulate duplicate backup, check if backup exists
            if "backup" in filename_normalized := file_info["name"].lower():
                seed = filename_normalized.replace("_backup", "").replace(" backup", "").replace("-backup", "")
            file_hash = hashlib.md5(seed.encode('utf-8')).hexdigest()

        file_info["hash"] = file_hash

        if file_hash in hash_table:
            # Duplicate found!
            file_info["isDuplicate"] = True
            hash_table[file_hash].append(file_info)
            duplicates.append(file_info)
            wasted_space += file_info["size"]
        else:
            file_info["isDuplicate"] = False
            hash_table[file_hash] = [file_info]
            unique_files.append(file_info)

    # Re-structure duplicate groups for JSON output
    # Format: [ { "hash": "md5", "files": [file1, file2] } ]
    duplicate_groups = []
    for f_hash, group in hash_table.items():
        if len(group) > 1:
            duplicate_groups.append({
                "hash": f_hash,
                "count": len(group),
                "wastedBytes": sum(f["size"] for f in group[1:]),
                "files": group
            })

    return duplicate_groups, unique_files, wasted_space
