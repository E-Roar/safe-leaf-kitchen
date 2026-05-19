#!/usr/bin/env python3
"""Generate Obsidian vault from graphify graph"""
import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.export import to_obsidian, to_canvas
from graphify.cluster import cluster

# Paths
PROJECT_DIR = Path('/home/glitcher/Codebases/safe-leaf-kitchen')
VAULT_DIR = Path.home() / 'Documents' / 'Obsidian Vault' / 'safe-leaf-kitchen'

print(f"Loading graph from {PROJECT_DIR / 'graphify-out' / 'graph.json'}...")
graph_path = PROJECT_DIR / 'graphify-out' / 'graph.json'
data = json.loads(graph_path.read_text())
print(f"  {len(data.get('nodes', []))} nodes, {len(data.get('links', []))} edges")

G = build_from_json(data)
print("Clustering communities...")
communities = cluster(G)
print(f"  {len(communities)} communities detected")

# Load labels if available
labels = {}
labels_path = PROJECT_DIR / 'graphify-out' / '.graphify_labels.json'
if labels_path.exists():
    labels = {int(k): v for k, v in json.loads(labels_path.read_text()).items()}
    print(f"  Loaded {len(labels)} community labels")

# Generate vault
VAULT_DIR.mkdir(parents=True, exist_ok=True)
print(f"\nGenerating Obsidian vault at {VAULT_DIR}...")
n = to_obsidian(G, communities, str(VAULT_DIR), community_labels=labels or None)
print(f"  Created {n} markdown notes")

to_canvas(G, communities, str(VAULT_DIR / 'graph.canvas'), community_labels=labels or None)
print(f"  Created graph.canvas")

print("\n✓ Second Brain ready!")
print(f"\nOpen in Obsidian:")
print(f"  obsidian \"{VAULT_DIR}\" &")
print(f"\nOr: File → Open Folder → {VAULT_DIR}")
