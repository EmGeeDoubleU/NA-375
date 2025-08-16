import csv
import os
import math
import time
from pathlib import Path
from typing import Dict, List, Any, Iterable
from supabase import create_client, Client

# --------------- Config ---------------
BASE_DIR = Path(__file__).resolve().parent

# Supabase configuration (using your provided keys)
SUPABASE_URL = "https://ldryyqggdllmvdkcyrst.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkcnl5cWdnZGxsbXZka2N5cnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgxMTkyOSwiZXhwIjoyMDY5Mzg3OTI5fQ.1kcnOnUeYS2mN7YD0ikNdJ0ym0fWsFgtPp-axG39ji4"

# Tune these to taste
BATCH_SIZE_PROFESSORS = 500
BATCH_SIZE_ARTICLES = 1000
MAX_RETRIES = 3
INITIAL_BACKOFF = 0.5  # seconds
MAX_BACKOFF = 2.0      # seconds

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --------------- Helpers ---------------
def read_csv_dict(path: Path) -> List[Dict[str, str]]:
    """Read CSV file into list of dictionaries"""
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def chunked(iterable: Iterable[Any], size: int) -> Iterable[List[Any]]:
    """Split iterable into chunks of specified size"""
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch

def with_retries(fn, *, what: str):
    """Retry wrapper for supabase calls on 429/5xx."""
    backoff = INITIAL_BACKOFF
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fn()
        except Exception as e:
            msg = str(e)
            transient = any(code in msg for code in ["429", "502", "503", "504", "timeout"])
            if attempt >= MAX_RETRIES or not transient:
                print(f"❌ Failed {what} after {attempt} attempts: {e}")
                raise
            print(f"⚠️ Retrying {what} (attempt {attempt}/{MAX_RETRIES}) after {backoff}s...")
            time.sleep(backoff)
            backoff = min(MAX_BACKOFF, backoff * 2)

def load_department_map() -> Dict[str, int]:
    """Load departments into name -> department_id map (case-insensitive)"""
    print("🔄 Loading departments...")
    resp = with_retries(lambda: supabase.table("departments")
                        .select("department_id,name")
                        .execute(), what="departments")
    dep_map: Dict[str, int] = {}
    for row in resp.data or []:
        dep_map[row["name"].strip().lower()] = row["department_id"]
    print(f"✅ Departments loaded: {len(dep_map)}")
    return dep_map

def insert_professors(professors_rows: List[Dict[str, Any]]) -> None:
    """Insert professors in large batches"""
    total = len(professors_rows)
    if total == 0:
        print("ℹ️ No professors to insert.")
        return
    print(f"🧑‍🏫 Inserting {total} professors in batches of {BATCH_SIZE_PROFESSORS}...")
    done = 0
    for batch in chunked(professors_rows, BATCH_SIZE_PROFESSORS):
        def _call():
            return supabase.table("professors").insert(batch).execute()
        with_retries(_call, what="professors insert")
        done += len(batch)
        print(f"  • {done}/{total}")
    print("✅ Professors inserted.")

def load_professor_id_map(names_needed: List[str]) -> Dict[str, int]:
    """Build a name -> professor_id map for the names we actually need"""
    print("🔄 Loading professor IDs...")
    # Normalize and dedupe names
    names_needed_norm = [n.strip() for n in names_needed if n and n.strip()]
    names_needed_norm = list(dict.fromkeys(names_needed_norm))  # dedupe, keep order
    if not names_needed_norm:
        return {}

    # Load all professors (since we have a manageable number)
    prof_map: Dict[str, int] = {}
    def _call():
        return supabase.table("professors").select("professor_id,name").execute()
    resp = with_retries(_call, what="professors select")
    
    for row in resp.data or []:
        prof_map[row["name"].strip()] = row["professor_id"]

    print(f"✅ Loaded IDs for {len(prof_map)} professors (needed {len(names_needed_norm)})")
    return prof_map

def insert_articles(articles_rows: List[Dict[str, Any]]) -> None:
    """Insert articles in large batches"""
    total = len(articles_rows)
    if total == 0:
        print("ℹ️ No articles to insert.")
        return
    print(f"📄 Inserting {total} articles in batches of {BATCH_SIZE_ARTICLES}...")
    done = 0
    for batch in chunked(articles_rows, BATCH_SIZE_ARTICLES):
        def _call():
            return supabase.table("research_articles").insert(batch).execute()
        with_retries(_call, what="articles insert")
        done += len(batch)
        print(f"  • {done}/{total}")
    print("✅ Articles inserted.")

# --------------- Pipeline ---------------
def main():
    print("🚀 Starting optimized database population...")

    # 1) Load raw CSVs
    print("📂 Loading CSV files...")
    faculty_profiles = read_csv_dict(BASE_DIR / "01_faculty_profiles.csv")
    scholar_links_rows = read_csv_dict(BASE_DIR / "02_faculty_with_scholar_links.csv")
    articles_csv = read_csv_dict(BASE_DIR / "03_faculty_articles.csv")
    
    # Load headshots from Google Scholar
    headshots_csv_path = BASE_DIR / "03_faculty_headshots.csv"
    if headshots_csv_path.exists():
        headshots_csv = read_csv_dict(headshots_csv_path)
        print(f"✅ Loaded: {len(faculty_profiles)} faculty, {len(scholar_links_rows)} scholar links, {len(articles_csv)} articles, {len(headshots_csv)} headshots")
    else:
        headshots_csv = []
        print(f"✅ Loaded: {len(faculty_profiles)} faculty, {len(scholar_links_rows)} scholar links, {len(articles_csv)} articles, no headshots file found")

    # Build scholar link map once
    scholar_links = {r["Name"].strip(): (r.get("Google Scholar Link") or "N/A") for r in scholar_links_rows}
    
    # Build headshots map
    headshots_map = {r["Name"].strip(): r.get("Headshot", "N/A") for r in headshots_csv}

    # 2) Cache departments once
    dep_map = load_department_map()

    # 3) Prepare professor inserts (no per-row SELECT)
    prof_payload = []
    names_seen = set()
    skipped_departments = 0
    
    for fac in faculty_profiles:
        name = (fac.get("Name") or "").strip()
        if not name or name in names_seen:
            continue
        names_seen.add(name)

        dep_name = (fac.get("Department") or "").strip().lower()
        dep_id = dep_map.get(dep_name)
        if not dep_id:
            skipped_departments += 1
            print(f"⚠️ Missing department: {fac.get('Department')} for {name}; skipping")
            continue

        # Use Google Scholar headshot if available, otherwise use faculty website headshot
        headshot = headshots_map.get(name, fac.get("Headshot", "N/A"))
        
        prof_payload.append({
            "name": name,
            "position": fac.get("Position"),
            "email": fac.get("Email"),
            "phone": fac.get("Phone"),
            "headshot": headshot,
            "google_scholar_link": scholar_links.get(name, "N/A"),
            "department_id": dep_id,
        })

    print(f"📊 Prepared {len(prof_payload)} professors (skipped {skipped_departments} due to missing departments)")

    # 4) Insert professors in big batches
    insert_professors(prof_payload)

    # 5) Build professor_id map for all names referenced by articles
    article_names_needed = [row.get("Name", "").strip() for row in articles_csv]
    prof_id_map = load_professor_id_map(article_names_needed)

    # 6) Prepare articles in memory (no per-row SELECT)
    articles_payload = []
    skipped_articles = 0
    for row in articles_csv:
        pname = (row.get("Name") or "").strip()
        pid = prof_id_map.get(pname)
        if not pid:
            skipped_articles += 1
            continue
        articles_payload.append({
            "title": row.get("Title"),
            "professor_id": pid,
            "article_link": row.get("Link"),
            "publication_year": row.get("Year"),
        })

    print(f"📊 Prepared {len(articles_payload)} articles (skipped {skipped_articles} due to unknown professor names)")

    # 7) Insert articles in big batches
    insert_articles(articles_payload)

    # 8) Quick verification counts
    print("\n🔍 Verifying data insertion...")
    try:
        unis = with_retries(lambda: supabase.table("universities").select("count", count="exact").execute(), what="verify universities")
        cols = with_retries(lambda: supabase.table("colleges").select("count", count="exact").execute(), what="verify colleges")
        deps = with_retries(lambda: supabase.table("departments").select("count", count="exact").execute(), what="verify departments")
        profs = with_retries(lambda: supabase.table("professors").select("count", count="exact").execute(), what="verify professors")
        arts = with_retries(lambda: supabase.table("research_articles").select("count", count="exact").execute(), what="verify articles")
        print(f"✅ Final counts → Universities: {unis.count}, Colleges: {cols.count}, Departments: {deps.count}, Professors: {profs.count}, Articles: {arts.count}")
    except Exception as e:
        print(f"❌ Verification error: {e}")

    print("\n🎉 Database population completed successfully!")

if __name__ == "__main__":
    main()
