class AVLNode:
    def __init__(self, key, value):
        self.key = key
        self.value = value
        self.height = 1
        self.left = None
        self.right = None

class AVLTree:
    """
    Self-balancing AVL Tree mirroring C bst_avl_indexer.c.
    Tracks height and performs LL, RR, LR, RL rotations on inserts.
    Used to index files in O(log n) time.
    """
    def __init__(self):
        self.root = None

    def get_height(self, node):
        if not node:
            return 0
        return node.height

    def get_balance(self, node):
        if not node:
            return 0
        return self.get_height(node.left) - self.get_height(node.right)

    def rotate_right(self, y):
        x = y.left
        T2 = x.right

        # Perform rotation
        x.right = y
        y.left = T2

        # Update heights
        y.height = 1 + max(self.get_height(y.left), self.get_height(y.right))
        x.height = 1 + max(self.get_height(x.left), self.get_height(x.right))

        return x

    def rotate_left(self, x):
        y = x.right
        T2 = y.left

        # Perform rotation
        y.left = x
        x.right = T2

        # Update heights
        x.height = 1 + max(self.get_height(x.left), self.get_height(x.right))
        y.height = 1 + max(self.get_height(y.left), self.get_height(y.right))

        return y

    def insert(self, root, key, value):
        # 1. Standard BST Insert
        if not root:
            return AVLNode(key, value)

        if key < root.key:
            root.left = self.insert(root.left, key, value)
        elif key > root.key:
            root.right = self.insert(root.right, key, value)
        else:
            return root  # Duplicate keys not allowed in simple BST

        # 2. Update height of ancestor node
        root.height = 1 + max(self.get_height(root.left), self.get_height(root.right))

        # 3. Get balance factor to check if unbalanced
        balance = self.get_balance(root)

        # Left Left Case
        if balance > 1 and key < root.left.key:
            return self.rotate_right(root)

        # Right Right Case
        if balance < -1 and key > root.right.key:
            return self.rotate_left(root)

        # Left Right Case
        if balance > 1 and key > root.left.key:
            root.left = self.rotate_left(root.left)
            return self.rotate_right(root)

        # Right Left Case
        if balance < -1 and key < root.right.key:
            root.right = self.rotate_right(root.right)
            return self.rotate_left(root)

        return root

    def add(self, key, value):
        self.root = self.insert(self.root, key, value)

def build_folder_tree(files_list):
    """
    Builds the nested folder tree representation of organized files.
    Format:
    {
      "name": "Organized",
      "type": "directory",
      "children": [
        {
          "name": "Study_Hub",
          "type": "directory",
          "children": [
             {
               "name": "Exams",
               "type": "directory",
               "children": [ ...files... ]
             }
          ]
        }
      ]
    }
    """
    tree = {"name": "Organized", "type": "directory", "children": []}

    # Helper to find or create a directory in a children list
    def find_or_create_dir(parent_children, name):
        for child in parent_children:
            if child["name"] == name and child["type"] == "directory":
                return child
        new_dir = {"name": name, "type": "directory", "children": []}
        parent_children.append(new_dir)
        return new_dir

    for file_info in files_list:
        category = file_info["category"]
        subfolder = file_info["subcategory"]  # This is subfolder like Exams, Notes, etc.
        
        # Level 1: Category Directory
        cat_node = find_or_create_dir(tree["children"], category)

        # Level 2: Subfolder (if present)
        current_node = cat_node
        if subfolder:
            current_node = find_or_create_dir(cat_node["children"], subfolder)

        # Level 3: File Node
        file_node = {
            "name": file_info["name"],
            "type": "file",
            "size": file_info["size"],
            "sizeFormatted": file_info["sizeFormatted"],
            "ext": file_info["ext"],
            "priority": file_info["priority"],
            "explanation": file_info["explanation"]
        }
        current_node["children"].append(file_node)

    return tree
