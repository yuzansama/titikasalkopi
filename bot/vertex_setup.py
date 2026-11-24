"""One-time Vertex AI Search setup for the bot (run again to re-upload the documents after knowledge.md changes).

  python bot/vertex_setup.py

Creates (if missing) in project titikasalkopi-bot: bucket gs://titikasalkopi-bot-docs, data store "tanya-kopi-docs"
(unstructured, from bot/vertex_docs/*.txt) and search app "tanya-kopi" (Enterprise + LLM add-on, needed for answers).
Auth: the gcloud login (gcloud auth print-access-token).
"""
import json
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT, BUCKET, STORE, ENGINE = "titikasalkopi-bot", "titikasalkopi-bot-docs", "tanya-kopi-docs", "tanya-kopi"
GCLOUD = str(Path.home() / "AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin/gcloud.cmd")
BASE = f"https://discoveryengine.googleapis.com/v1/projects/{PROJECT}/locations/global/collections/default_collection"


def gcloud(*a, check=True):
    return subprocess.run([GCLOUD, *a, f"--project={PROJECT}"], capture_output=True, text=True, check=check)


def api(method, url, body=None):
    token = subprocess.run([GCLOUD, "auth", "print-access-token"], capture_output=True, text=True, check=True).stdout.strip()
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": f"Bearer {token}", "X-Goog-User-Project": PROJECT,
                                          "Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req, timeout=120))
    except urllib.error.HTTPError as e:
        err = json.loads(e.read() or b"{}").get("error", {})
        if e.code == 409:   # already exists
            return {"exists": True}
        raise RuntimeError(f"{method} {url.split('/v1/')[-1]}: {e.code} {err.get('message', '')[:300]}") from None


def wait(op):
    while not op.get("done", op.get("exists", False)):
        time.sleep(5)
        op = api("GET", f"https://discoveryengine.googleapis.com/v1/{op['name']}")
    if op.get("error"):
        raise RuntimeError(op["error"])
    return op


def main():
    if gcloud("storage", "buckets", "describe", f"gs://{BUCKET}", check=False).returncode:
        gcloud("storage", "buckets", "create", f"gs://{BUCKET}", "--location=asia-southeast2", "--uniform-bucket-level-access")
    gcloud("storage", "cp", *map(str, sorted((HERE / "vertex_docs").glob("*.txt"))), f"gs://{BUCKET}/docs/")
    print("docs uploaded")

    wait(api("POST", f"{BASE}/dataStores?dataStoreId={STORE}",
             {"displayName": "Tanya Kopi docs", "industryVertical": "GENERIC",
              "solutionTypes": ["SOLUTION_TYPE_SEARCH"], "contentConfig": "CONTENT_REQUIRED"}))
    print("data store ready")
    op = wait(api("POST", f"{BASE}/dataStores/{STORE}/branches/0/documents:import",
                  {"gcsSource": {"inputUris": [f"gs://{BUCKET}/docs/*"], "dataSchema": "content"},
                   "reconciliationMode": "FULL"}))
    print("import:", json.dumps(op.get("metadata", {}))[:300])

    wait(api("POST", f"{BASE}/engines?engineId={ENGINE}",
             {"displayName": "Tanya Kopi", "dataStoreIds": [STORE], "solutionType": "SOLUTION_TYPE_SEARCH",
              "searchEngineConfig": {"searchTier": "SEARCH_TIER_ENTERPRISE", "searchAddOns": ["SEARCH_ADD_ON_LLM"]}}))
    print("app ready:", ENGINE)


if __name__ == "__main__":
    shutil.copyfile(HERE / "knowledge.md", HERE / "vertex_docs" / "titik-asal-kopi-produk.txt")   # keep docs in sync
    shutil.copyfile(HERE.parent / "marketing" / "FACTS_EDU.md", HERE / "vertex_docs" / "fakta-edukasi-kopi.txt")
    main()
