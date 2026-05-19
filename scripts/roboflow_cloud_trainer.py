import os
import shutil
import yaml
from roboflow import Roboflow
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

API_KEY = os.getenv("ROBOFLOW_PRIVATE_API_KEY")

if not API_KEY or API_KEY == "your_private_api_key_here":
    print("ERROR: Please set ROBOFLOW_PRIVATE_API_KEY in the .env file.")
    exit(1)
DATASETS_DIR = "datasets"
MERGED_DIR = os.path.join(DATASETS_DIR, "merged_leaves")

PROJECTS = [
    ("grn-ylmws", "onion-cajj1", 1),
    ("leaf-vxgrf", "leaf-vvdqa", 2),
    ("carrot-gomsd", "carrot-leaves", 2),
    ("pancar-sopel", "beet-zycnz", 5),
    ("lion-xlj3t", "radish-m2lim", 4),
    ("agrowizard", "leek-detection", 22),
    ("joshuas-projects", "turnip-import-v2-gdowd", 3),
    ("peruchon", "artichoke", 1)
]

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def download_datasets(rf):
    ensure_dir(DATASETS_DIR)
    downloaded_paths = []
    
    for workspace, project_name, version_num in PROJECTS:
        print(f"Downloading {workspace}/{project_name} version {version_num}...")
        try:
            project = rf.workspace(workspace).project(project_name)
            version = project.version(version_num)
            dataset = version.download("yolov8", location=os.path.join(DATASETS_DIR, project_name))
            downloaded_paths.append((project_name, dataset.location))
            print(f"Successfully downloaded {project_name}")
        except Exception as e:
            print(f"Error downloading {project_name}: {e}")
            
    return downloaded_paths

def merge_datasets(downloaded_paths):
    print("Merging datasets locally before upload...")
    ensure_dir(MERGED_DIR)
    global_classes = []
    
    for split in ['train', 'valid', 'test']:
        ensure_dir(os.path.join(MERGED_DIR, split, 'images'))
        ensure_dir(os.path.join(MERGED_DIR, split, 'labels'))

    for project_name, location in downloaded_paths:
        yaml_path = os.path.join(location, "data.yaml")
        if not os.path.exists(yaml_path):
            continue
            
        with open(yaml_path, 'r') as f:
            data = yaml.safe_load(f)
            
        local_names = data.get('names', [])
        target_map = {
            "onion-cajj1": "onion_leaf",
            "leaf-vvdqa": "fennel_leaf",
            "carrot-leaves": "carrot_leaf",
            "beet-zycnz": "beet_leaf",
            "radish-m2lim": "radish_leaf",
            "leek-detection": "leek_leaf",
            "turnip-import-v2-gdowd": "turnip_leaf",
            "artichoke": "artichoke_leaf"
        }
        target_class = target_map.get(project_name, "leaf")
        if target_class not in global_classes:
            global_classes.append(target_class)
            
        project_class_mapping = {}
        for i, name in enumerate(local_names):
            project_class_mapping[i] = global_classes.index(target_class)
            
        for split in ['train', 'valid', 'test']:
            split_dir = os.path.join(location, split)
            img_dir = os.path.join(split_dir, 'images')
            lbl_dir = os.path.join(split_dir, 'labels')
            
            if not os.path.exists(img_dir) or not os.path.exists(lbl_dir):
                continue
                
            for filename in os.listdir(img_dir):
                if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                    continue
                    
                new_img_name = f"{project_name}_{filename}"
                shutil.copy2(os.path.join(img_dir, filename), os.path.join(MERGED_DIR, split, 'images', new_img_name))
                
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

    merged_yaml = {
        'train': 'train/images',
        'val': 'valid/images',
        'test': 'test/images',
        'nc': len(global_classes),
        'names': global_classes
    }
    with open(os.path.join(MERGED_DIR, 'data.yaml'), 'w') as f:
        yaml.dump(merged_yaml, f, sort_keys=False)
        
    print(f"Merged {len(global_classes)} unique classes: {global_classes}")

def trigger_cloud_training(rf):
    print("Connecting to your workspace to create the new project...")
    workspace = rf.workspace()
    
    new_project_name = "safeleafkitchen01"
    print(f"Creating project: {new_project_name}")
    
    try:
        new_project = workspace.create_project(
            project_name=new_project_name,
            project_type="object-detection",
            project_license="MIT",
            annotation="leaves"
        )
        print("Project created successfully.")
    except Exception as e:
        print(f"Project might already exist or creation failed: {e}")
        # Try to retrieve it if it exists
        new_project = workspace.project(new_project_name.lower().replace(" ", "-"))

    print("Uploading merged dataset to Roboflow. This will take a while...")
    # Roboflow SDK upload directory. We must upload each split.
    for split in ['train', 'valid', 'test']:
        split_dir = os.path.join(MERGED_DIR, split, 'images')
        if os.path.exists(split_dir) and len(os.listdir(split_dir)) > 0:
            print(f"Uploading {split} split...")
            for filename in os.listdir(split_dir):
                img_path = os.path.join(split_dir, filename)
                lbl_path = os.path.join(MERGED_DIR, split, 'labels', os.path.splitext(filename)[0] + ".txt")
                if os.path.exists(lbl_path):
                    try:
                        new_project.upload(image_path=img_path, annotation_path=lbl_path, split=split, num_retry_uploads=3)
                    except Exception as upload_e:
                        print(f"Failed to upload {filename}: {upload_e}")
                        
    print("Generating new version...")
    try:
        version = new_project.generate_version({
            "preprocessing": {
                "auto-orient": True,
                "resize": {"width": 640, "height": 640, "format": "Stretch to"}
            },
            "augmentation": {
                "blur": {"pixels": 1.5},
                "flip": {"horizontal": True}
            }
        })
        print(f"Version {version} generated.")
        
        print("Triggering YOLO training on Roboflow servers...")
        new_project.version(version).train()
        print("Training successfully started! You can monitor it in the Roboflow dashboard.")
    except Exception as e:
        print(f"Error during version generation or training: {e}")

if __name__ == "__main__":
    rf = Roboflow(api_key=API_KEY)
    ensure_dir(DATASETS_DIR)
    
    paths = download_datasets(rf)
    if paths:
        merge_datasets(paths)
        trigger_cloud_training(rf)
    else:
        print("No datasets downloaded. Exiting.")
