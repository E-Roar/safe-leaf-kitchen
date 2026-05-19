"""
Robust Roboflow dataset downloader with RESUME support.
Uses the export URLs from Roboflow Universe (https://app.roboflow.com/ds/TOKEN?key=KEY).
Since GCS signed URLs expire in 15 minutes and the download is large,
this script resumes the download using HTTP Range requests.
"""
import os
import sys
import shutil
import zipfile
import requests
import yaml
import time

EXPORT_URLS = [
    ("dataset_S3ItoUsZ7V", "https://app.roboflow.com/ds/S3ItoUsZ7V?key=M83qIdQx7v"),
    ("dataset_a4zdLe1rpS", "https://app.roboflow.com/ds/a4zdLe1rpS?key=AImfAGLDuJ"),
]

DATASETS_DIR = "datasets"
CHUNK_SIZE   = 1024 * 1024  # 1 MB per chunk

def get_real_download_url(export_url: str) -> str:
    """Follow the Roboflow redirect to get a fresh GCS signed URL."""
    r = requests.get(export_url, allow_redirects=False, timeout=30)
    if r.status_code in (301, 302, 303, 307, 308):
        return r.headers["Location"]
    return export_url

def download_with_resume(label: str, export_url: str, zip_path: str):
    """Download with resume support, handling 15-minute GCS URL expirations."""
    downloaded = 0
    if os.path.exists(zip_path):
        downloaded = os.path.getsize(zip_path)
    
    total_size = None
    
    while True:
        try:
            real_url = get_real_download_url(export_url)
        except Exception as e:
            print(f"\n  ✗ Could not resolve redirect: {e}")
            time.sleep(5)
            continue
            
        headers = {}
        if downloaded > 0:
            headers["Range"] = f"bytes={downloaded}-"
            
        try:
            with requests.get(real_url, headers=headers, stream=True, timeout=30) as resp:
                # 416 Requested Range Not Satisfiable means we already downloaded everything
                if resp.status_code == 416:
                    print(f"\n  ✓ Download complete (416).")
                    break
                    
                resp.raise_for_status()
                
                if total_size is None:
                    # Content-Range: bytes 1048576-734003200/734003201
                    if "Content-Range" in resp.headers:
                        total_size = int(resp.headers["Content-Range"].split("/")[-1])
                    else:
                        total_size = downloaded + int(resp.headers.get("content-length", 0))
                
                mode = "ab" if downloaded > 0 else "wb"
                with open(zip_path, mode) as f:
                    for chunk in resp.iter_content(chunk_size=CHUNK_SIZE):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            mb = downloaded / 1_048_576
                            pct = (downloaded / total_size * 100) if total_size else 0
                            print(f"  {mb:.1f} MB  {pct:.0f}%", end="\r")
                
                if total_size and downloaded >= total_size:
                    print(f"\n  ✓ Downloaded {downloaded/1_048_576:.1f} MB")
                    break
                    
        except requests.exceptions.HTTPError as e:
            # 400 Bad Request or 403 Forbidden usually means the GCS link expired
            if e.response.status_code in (400, 403):
                print(f"\n  [URL Expired, getting a fresh one and resuming...]")
                continue
            else:
                print(f"\n  ✗ HTTP Error: {e}")
                time.sleep(5)
        except Exception as e:
            print(f"\n  ✗ Download interrupted: {e}. Resuming in 5s...")
            time.sleep(5)

def download_and_extract(label: str, export_url: str) -> str | None:
    dest_dir = os.path.join(DATASETS_DIR, label)
    zip_path  = os.path.join(dest_dir, "dataset.zip")

    if os.path.isdir(dest_dir) and any(
        fname.endswith(".yaml") for fname in os.listdir(dest_dir)
    ):
        print(f"[SKIP] {label} — already extracted at {dest_dir}")
        return dest_dir

    os.makedirs(dest_dir, exist_ok=True)
    print(f"\n[{label}] Starting resumable download…")
    
    download_with_resume(label, export_url, zip_path)

    if not zipfile.is_zipfile(zip_path):
        print(f"  ✗ File is not a valid ZIP. It might still be incomplete or corrupt. Resetting...")
        os.remove(zip_path)
        return None

    print(f"[{label}] Extracting…")
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(dest_dir)
        os.remove(zip_path)
        print(f"  ✓ Extracted to {dest_dir}")
    except Exception as e:
        print(f"  ✗ Extraction failed: {e}")
        return None

    yaml_path = os.path.join(dest_dir, "data.yaml")
    if os.path.exists(yaml_path):
        with open(yaml_path) as f:
            info = yaml.safe_load(f)
        print(f"  Classes: {info.get('names', 'unknown')}")
    else:
        for root, _, files in os.walk(dest_dir):
            if "data.yaml" in files:
                yp = os.path.join(root, "data.yaml")
                with open(yp) as f:
                    info = yaml.safe_load(f)
                print(f"  Classes: {info.get('names', 'unknown')}")
                break

    return dest_dir

def count_images(base_dir: str) -> int:
    count = 0
    for root, _, files in os.walk(base_dir):
        for f in files:
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                count += 1
    return count

if __name__ == "__main__":
    os.makedirs(DATASETS_DIR, exist_ok=True)

    print("=" * 60)
    print("  Roboflow Resumable Dataset Downloader")
    print("=" * 60)

    success = []
    failed  = []

    for label, url in EXPORT_URLS:
        result = download_and_extract(label, url)
        if result:
            imgs = count_images(result)
            success.append((label, imgs))
        else:
            failed.append(label)

    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    for label, imgs in success:
        print(f"  ✓ {label:<30} {imgs} images")
    for label in failed:
        print(f"  ✗ {label:<30} FAILED")
    print(f"\n  {len(success)}/{len(EXPORT_URLS)} datasets ready")
    print("=" * 60)
