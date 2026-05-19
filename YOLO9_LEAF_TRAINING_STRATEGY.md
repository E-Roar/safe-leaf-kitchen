# YOLOv9 Leaf Training Strategy

## Project Context

SafeLeafKitchen is an educational robotics + AI leaf identification project targeting rural schools in Morocco. Current system uses Roboflow's pre-trained model for basic leaf detection.

**Problem:** 9 distinct leaf types needs detection. Options:
- Train 9 separate models (resource-intensive, slow inference)
- Train 1 model on all 9 leaves (efficient, single model)

**Decision:** Train 1 unified YOLOv9 model for all 9 leaf types.

---

## Current State

### Existing Datasets (found in `datasets/`):

| Dataset Folder | Found? | Notes |
|----------------|--------|-------|
| carrot-leaf-detection-2 | Contains roboflow.zip (~2.4MB) |
| onion-cajj1 | Contains roboflow.zip (~8MB) |
| dataset_S3ItoUsZ7V | YOLO26 format, 3120 images |
| nameki-1ge2a | Empty |

### Expected 9 Leaf Datasets (to be provided by user):

1. Carrot leaf
2. Onion leaf
3. Nameki leaf
4. Leaf 4
5. Leaf 5
6. Leaf 6
7. Leaf 7
8. Leaf 8
9. Leaf 9

---

## Training Strategy: Unified YOLOv9 Model

### Architecture Overview

```
Dataset Downloads (--9 leaves using roboflow CLI)
        ↓
Dataset Consolidation (combine YOLO annotations)
        ↓
YOLOv9 Training (unified 9-class model)
        ↓
Deployment (export ONNX, integrate app)
```

### Roboflow CLI Workflow

```bash
# Login
roboflow login

# Download each dataset
roboflow download --url <DATASET_URL> --project safe-leaf-kitchen --access-token <KEY>

# Consolidate: combine labels, create data.yaml with nc=9
# Train: yolo detect train model=yolov9s.pt data=./combined/data.yaml epochs=100 imgsz=640
```

---

## Next Steps (Waiting on User)

1. **Provide 9 dataset URLs** from Roboflow
2. **Confirm Roboflow API key** for download access
3. **Specify class names** for each leaf type

Once provided, I'll execute:
- Dataset cloning via roboflow CLI
- Consolidation script to merge 9 datasets
- YOLOv9 training pipeline
- ONNX export for mobile deployment
