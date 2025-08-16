import csv
from concurrent.futures import ProcessPoolExecutor, as_completed
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
import time
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CHROMEDRIVER_PATH = "/opt/homebrew/bin/chromedriver"  # adjust if needed

def _make_driver():
    """Create a new Chrome driver with anti-detection measures"""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-extensions")
    options.add_argument("--window-size=1366,768")
    
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ]
    options.add_argument(f"--user-agent={random.choice(user_agents)}")
    
    service = Service(CHROMEDRIVER_PATH)
    driver = webdriver.Chrome(service=service, options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    return driver

def clean_google_scholar_url(url):
    """Clean Google Scholar URLs by removing pagination parameters"""
    if not url or "scholar.google.com" not in url:
        return url
    
    # If it's a citation view URL, clean it properly
    if "citation_for_view=" in url:
        try:
            citation_id = url.split("citation_for_view=")[1].split("&")[0]
            user_id = url.split("user=")[1].split("&")[0]
            return f"https://scholar.google.com/citations?view_op=view_citation&hl=en&user={user_id}&citation_for_view={citation_id}"
        except:
            pass
    
    # Remove pagination parameters from any URL
    if "?" in url:
        base_url = url.split("?")[0]
        params = url.split("?")[1].split("&")
        clean_params = [p for p in params if not p.startswith("cstart=") and not p.startswith("pagesize=")]
        if clean_params:
            return f"{base_url}?{'&'.join(clean_params)}"
        else:
            return base_url
    
    return url

def verify_upenn_email_on_profile(driver):
    """Check if the Google Scholar profile has verified UPenn email"""
    try:
        verification_element = driver.find_element(By.CSS_SELECTOR, "#gsc_prf_ivh")
        verification_text = verification_element.text.lower()
        # Check for all UPenn email domains
        upenn_domains = [
            "verified email at upenn.edu",
            "verified email at seas.upenn.edu", 
            "verified email at cis.upenn.edu",
            "verified email at wharton.upenn.edu",
            "verified email at pennmedicine.upenn.edu",
            "verified email at lrsm.upenn.edu",
            "verified email at asc.upenn.edu",
            "verified email at uphs.upenn.edu",
            "verified email at physics.upenn.edu",
            "verified email at ee.upenn.edu",
            "verified email at sas.upenn.edu",
            "verified email at mail.med.upenn.edu"
        ]
        return any(domain in verification_text for domain in upenn_domains)
    except NoSuchElementException:
        return False
    except Exception:
        return False

def get_all_articles_from_scholar(scholar_link, is_verified=False):
    """Extract all articles from a Google Scholar profile"""
    driver = _make_driver()
    try:
        driver.get(scholar_link)
        # shorter stagger; keep a little jitter
        time.sleep(random.uniform(1.0, 2.0))
        
        try:
            WebDriverWait(driver, 12).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "tr.gsc_a_tr"))
            )
        except TimeoutException:
            return [], None

        # For unverified profiles, check if they actually have verified UPenn email
        if not is_verified and not verify_upenn_email_on_profile(driver):
            return [], None

        # Extract headshot first
        headshot = None
        try:
            img_element = driver.find_element(By.ID, "gsc_prf_pup-img")
            img_src = img_element.get_attribute("src")
            if img_src and "scholar.googleusercontent.com" in img_src:
                headshot = img_src
        except NoSuchElementException:
            pass

        articles = []
        seen = set()
        prev_count = -1
        show_more_clicks = 0
        MAX_SHOW_MORE = 9  # Increased from 5 to 9 since we're much faster now
        
        for _ in range(50):  # max iterations
            rows = driver.find_elements(By.CSS_SELECTOR, "tr.gsc_a_tr")
            
            for row in rows:
                try:
                    title_el = row.find_element(By.CSS_SELECTOR, "td.gsc_a_t a")
                    title = title_el.text
                    relative_link = title_el.get_attribute("href")
                    
                    # Convert relative URL to full Google Scholar URL and clean pagination parameters
                    if relative_link and relative_link.startswith("/"):
                        full_link = f"https://scholar.google.com{relative_link}"
                        link = clean_google_scholar_url(full_link)
                    elif relative_link and "scholar.google.com" in relative_link:
                        link = clean_google_scholar_url(relative_link)
                    else:
                        link = relative_link or "No link"
                        
                except NoSuchElementException:
                    title, link = "No title", "No link"
                    
                try:
                    year_el = row.find_element(By.CSS_SELECTOR, "td.gsc_a_y span")
                    year = year_el.text if year_el.text.strip() else "No year"
                except NoSuchElementException:
                    year = "No year"
                    
                if title == "No title" and year == "No year":
                    continue
                    
                key = (title, link, year)
                if key not in seen:
                    seen.add(key)
                    articles.append({"title": title, "link": link, "year": year})

            # pagination
            if len(rows) == prev_count:
                break
            prev_count = len(rows)

            try:
                btn = driver.find_element(By.ID, "gsc_bpf_more")
                if "disabled" in btn.get_attribute("class"):
                    break
                if show_more_clicks >= MAX_SHOW_MORE:
                    break
                btn.click()
                show_more_clicks += 1
                time.sleep(random.uniform(0.9, 1.8))
            except NoSuchElementException:
                break

        return articles, headshot
    except Exception:
        return [], None
    finally:
        driver.quit()

def _process_one_faculty(row):
    """
    Run in a separate process. Returns (name, list_of_article_dicts, headshot, skipped_reason_or_None)
    """
    name = row.get("Name", "N/A")
    scholar_link = row.get("Google Scholar Link", "N/A")
    is_verified = row.get("Verified", "No").lower() == "yes"

    if not scholar_link or scholar_link in ("N/A", "Not Found"):
        return name, [], None, "Invalid or missing Scholar link"

    # polite small jitter so all workers don't slam at once
    time.sleep(random.uniform(0.2, 0.9))

    articles, headshot = get_all_articles_from_scholar(scholar_link, is_verified)
    if not articles:
        return name, [], None, "No articles found or failed to load"
    return name, articles, headshot, None

def fetch_articles_for_all_parallel(input_csv, output_csv, headshots_csv, start_index=0, max_workers=3, checkpoint_every=5):
    """Extract articles for all faculty members using parallel processing"""
    input_csv = Path(input_csv)
    output_csv = Path(output_csv)
    headshots_csv = Path(headshots_csv)

    # Load input
    with open(input_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        faculty = list(reader)

    # Resume support: read already written names
    processed = set()
    existing_rows = []
    if output_csv.exists():
        with open(output_csv, "r", encoding="utf-8") as f:
            r = csv.DictReader(f)
            for row in r:
                existing_rows.append(row)
                processed.add(row.get("Name", "N/A"))

    # Build worklist
    work = []
    for i, row in enumerate(faculty[start_index:], start=start_index):
        name = row.get("Name", "N/A")
        if name in processed:
            continue
        work.append(row)

    print(f"Already processed: {len(processed)}")
    print(f"To process now:   {len(work)} using {max_workers} workers")

    results_buffer = []
    headshots_buffer = []
    skipped_rows = []

    def flush_checkpoint():
        # write output
        if results_buffer:
            out_exists = output_csv.exists()
            with open(output_csv, "a", newline="", encoding="utf-8") as out:
                fieldnames = ["Name", "Title", "Link", "Year"]
                writer = csv.DictWriter(out, fieldnames=fieldnames)
                if not out_exists and not existing_rows:
                    writer.writeheader()
                for row in results_buffer:
                    writer.writerow(row)
            results_buffer.clear()
        
        # write headshots
        if headshots_buffer:
            out_exists = headshots_csv.exists()
            with open(headshots_csv, "a", newline="", encoding="utf-8") as out:
                fieldnames = ["Name", "Headshot"]
                writer = csv.DictWriter(out, fieldnames=fieldnames)
                if not out_exists:
                    writer.writeheader()
                for row in headshots_buffer:
                    writer.writerow(row)
            headshots_buffer.clear()
        
        # write skipped
        skipped_csv = str(output_csv).replace(".csv", "_skipped.csv")
        out_exists = Path(skipped_csv).exists()
        with open(skipped_csv, "a", newline="", encoding="utf-8") as out:
            fieldnames = ["Name", "Reason"]
            writer = csv.DictWriter(out, fieldnames=fieldnames)
            if not out_exists:
                writer.writeheader()
            for s in skipped_rows:
                writer.writerow(s)
        skipped_rows.clear()

    # Pre-write any existing rows if we are starting fresh
    if existing_rows and not output_csv.exists():
        with open(output_csv, "w", newline="", encoding="utf-8") as out:
            fieldnames = ["Name", "Title", "Link", "Year"]
            writer = csv.DictWriter(out, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(existing_rows)

    submitted = 0
    completed = 0
    with ProcessPoolExecutor(max_workers=max_workers) as ex:
        futures = [ex.submit(_process_one_faculty, row) for row in work]
        submitted = len(futures)
        
        for fut in as_completed(futures):
            name, articles, headshot, reason = fut.result()
            if articles:
                for a in articles:
                    results_buffer.append({
                        "Name": name,
                        "Title": a["title"],
                        "Link": a["link"],
                        "Year": a["year"],
                    })
                
                # Add headshot if found
                if headshot:
                    headshots_buffer.append({
                        "Name": name,
                        "Headshot": headshot,
                    })
            else:
                skipped_rows.append({"Name": name, "Reason": reason or "Unknown"})
            completed += 1

            # periodic checkpoint
            if completed % checkpoint_every == 0:
                flush_checkpoint()
                print(f"Checkpoint: {completed}/{submitted} faculty done")

    # final flush
    flush_checkpoint()
    print("All done.")

if __name__ == "__main__":
    input_csv = BASE_DIR / "02_faculty_with_scholar_links.csv"
    output_csv = BASE_DIR / "03_faculty_articles.csv"
    headshots_csv = BASE_DIR / "03_faculty_headshots.csv"
    
    # Use 3 workers for safety (can increase to 4-5 if no CAPTCHAs)
    fetch_articles_for_all_parallel(input_csv, output_csv, headshots_csv, start_index=0, max_workers=3, checkpoint_every=5) 