#!/bin/bash
# Build Obsidian vault for safe-leaf-kitchen

set -e

VAULT_DIR="$HOME/Documents/Obsidian Vault/safe-leaf-kitchen"
PROJECT_DIR="/home/glitcher/Codebases/safe-leaf-kitchen"

echo "=== Building Second Brain for safe-leaf-kitchen ==="
echo ""

# Ensure vault directory exists
mkdir -p "$VAULT_DIR"

cd "$PROJECT_DIR"

echo "[1/3] Checking graph..."
if [ ! -f "graphify-out/graph.json" ]; then
    echo "No graph found. Building from scratch..."
    # This would require running the full graphify pipeline
    echo "Please run: /graphify . --obsidian --obsidian-dir $VAULT_DIR"
    exit 1
fi

echo "[2/3] Generating Obsidian vault..."
# Use graphify's internal Python to generate the vault
python3 -c "
import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.export import to_obsidian, to_canvas
from graphify.cluster import cluster

graph_path = Path('graphify-out/graph.json')
data = json.loads(graph_path.read_text())
G = build_from_json(data)
communities = cluster(G)

labels = {}
labels_path = Path('graphify-out/.graphify_labels.json')
if labels_path.exists():
    labels = {int(k): v for k, v in json.loads(labels_path.read_text()).items()}

vault_dir = Path('$VAULT_DIR')
n = to_obsidian(G, communities, str(vault_dir), community_labels=labels or None)
print(f'Generated {n} notes')

to_canvas(G, communities, str(vault_dir / 'graph.canvas'), community_labels=labels or None)
print('Canvas generated')
"

echo "[3/3] Complete!"
echo ""
echo "Vault location: $VAULT_DIR"
echo ""
echo "To open in Obsidian:"
echo "  obsidian \"$VAULT_DIR\" &"
echo ""
echo "Or manually: File → Open Folder → $VAULT_DIR"
