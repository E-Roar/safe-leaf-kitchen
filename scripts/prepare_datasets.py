import os
import shutil
import yaml
from roboflow import Roboflow

API_KEY = "qhQqXopubSFgUgSVLN0C"
DATASETS_DIR = "datasets"
MERGED_DIR = os.path.join(DATASETS_DIR, "merged_leaves")

# List of (workspace, project, version) to download
# Since versions aren't explicitly provided, we will attempt version 1 or the latest
PROJECTS = [
    ("shabishko", "onion-leaves", 1),
    ("dtsproject", "medicinal-herb-recognition", 1),
    ("carrot-gomsd", "carrot-leaf-detection-2", 1),
    ("wowplant", "nameki-1ge2a", 1),
    ("foodanno", "leek", 1),
    ("240034704-stu-vtc-edu-hk", "3905-lfvnd", 1),
    ("stock-qxdzf", "artichoke-73ac4", 1)
]

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def download_datasets():
    rf = Roboflow(api_key=API_KEY)
    ensure_dir(DATASETS_DIR)
    downloaded_paths = []

    for workspace, project_name, version_num in PROJECTS:
        print(f"Downloading {workspace}/{project_name} version {version_num}...")
        try:
            project = rf.workspace(workspace).project(project_name)
            version = project.version(version_num)
            
            # Use yolov8 format which is compatible with yolov11
            dataset = version.download("yolov8", location=os.path.join(DATASETS_DIR, project_name))
            downloaded_paths.append((project_name, dataset.location))
            print(f"Successfully downloaded {project_name}")
        except Exception as e:
            print(f"Error downloading {project_name}: {e}")
            
    return downloaded_paths

def merge_datasets(downloaded_paths):
    print("Merging datasets...")
    ensure_dir(MERGED_DIR)
    
    # We need to unify the class mappings
    global_classes = []
    class_mapping = {} # specific_project_class_id -> global_class_id
    
    # Create merged directories
    for split in ['train', 'valid', 'test']:
        ensure_dir(os.path.join(MERGED_DIR, split, 'images'))
        ensure_dir(os.path.join(MERGED_DIR, split, 'labels'))

    for project_name, location in downloaded_paths:
        yaml_path = os.path.join(location, "data.yaml")
        if not os.path.exists(yaml_path):
            print(f"Skipping {project_name}, no data.yaml found.")
            continue
            
        with open(yaml_path, 'r') as f:
            data = yaml.safe_load(f)
            
        local_names = data.get('names', [])
        # Create a mapping for this specific project
        project_class_mapping = {}
        for i, name in enumerate(local_names):
            if name not in global_classes:
                global_classes.append(name)
            project_class_mapping[i] = global_classes.index(name)
            
        # Move files and update labels
        for split in ['train', 'valid', 'test']:
            split_dir = os.path.join(location, split)
            if not os.path.exists(split_dir):
                continue
                
            img_dir = os.path.join(split_dir, 'images')
            lbl_dir = os.path.join(split_dir, 'labels')
            
            if not os.path.exists(img_dir) or not os.path.exists(lbl_dir):
                continue
                
            for filename in os.listdir(img_dir):
                if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                    continue
                    
                # Copy image with prefix to avoid name collisions
                new_img_name = f"{project_name}_{filename}"
                shutil.copy2(os.path.join(img_dir, filename), os.path.join(MERGED_DIR, split, 'images', new_img_name))
                
                # Update and copy label
                lbl_name = os.path.splitext(filename)[0] + ".txt"
                old_lbl_path = os.path.join(lbl_dir, lbl_name)
                new_lbl_path = os.path.join(MERGED_DIR, split, 'labels', f"{project_name}_{lbl_name}")
                
                if os.path.exists(old_lbl_path):
                    with open(old_lbl_path, 'r') as old_f, open(new_lbl_path, 'w') as new_f:
                        for line in old_f:
                            parts = line.strip().split()
                            if parts:
                                old_cls = int(parts[0])
                                new_cls = project_class_mapping.get(old_cls, old_cls)
                                new_f.write(f"{new_cls} {' '.join(parts[1:])}\n")

    # Create merged data.yaml
    merged_yaml = {
        'train': 'train/images',
        'val': 'valid/images',
        'test': 'test/images',
        'nc': len(global_classes),
        'names': global_classes
    }
    
    with open(os.path.join(MERGED_DIR, 'merged_leaves.yaml'), 'w') as f:
        yaml.dump(merged_yaml, f, sort_keys=False)
        
    print(f"Merged successfully. Found {len(global_classes)} unique classes: {global_classes}")
    print(f"Merged dataset saved to {MERGED_DIR}")

if __name__ == "__main__":
    ensure_dir(DATASETS_DIR)
    paths = download_datasets()
    if paths:
        merge_datasets(paths)
    else:
        print("No datasets downloaded to merge.")
