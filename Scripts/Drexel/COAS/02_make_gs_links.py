import csv
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import random
import requests
from bs4 import BeautifulSoup

BASE_DIR = Path(__file__).resolve().parent

def convert_name_format(name):
    """Convert 'Last, First' format to 'First Last' format for Google Scholar search"""
    if ',' in name:
        parts = name.split(',')
        if len(parts) == 2:
            last_name = parts[0].strip()
            first_name = parts[1].strip()
            return f"{first_name} {last_name}"
    return name

def generate_search_urls(name):
    """Generate different search URLs for a faculty member"""
    search_name = convert_name_format(name)
    
    # Search strategy: "FirstName LastName drexel google scholar" on DuckDuckGo
    strategy = f'{search_name} drexel google scholar'
    
    encoded = strategy.replace(' ', '+')
    url = f"https://duckduckgo.com/?q={encoded}"
    
    return [url]

def chrome_options():
    """Create optimized Chrome options"""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-plugins")
    options.add_argument("--disable-images")
    options.add_argument("--page-load-strategy=eager")
    
    # Block images and other content for speed
    options.add_experimental_option("prefs", {
        "profile.managed_default_content_settings.images": 2,
        "profile.default_content_setting_values.cookies": 1,
        "profile.default_content_setting_values.javascript": 1
    })
    
    # Random user agent to avoid detection
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ]
    options.add_argument(f"--user-agent={random.choice(user_agents)}")
    
    return options

def find_via_ddg_http(name):
    """Try to find Google Scholar profile using HTTP requests first (faster)"""
    search_name = convert_name_format(name)
    q = f"{search_name} drexel google scholar"
    
    try:
        # Use DuckDuckGo HTML endpoint for faster requests
        url = "https://duckduckgo.com/html/"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        response = requests.get(url, params={"q": q}, headers=headers, timeout=8)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Look for search results
        results = soup.select(".result, .result__body, .web-result, [data-testid='result']")
        
        target = search_name.lower().split()
        verified_links = []
        unverified_links = []
        
        for result in results:
            result_text = result.get_text(" ", strip=True).lower()
            
            # Check if this result contains "drexel"
            if "drexel" not in result_text:
                continue
                
            # Look for Google Scholar links
            links = result.select("a")
            for link in links:
                href = link.get("href") or ""
                if "scholar.google.com/citations?user=" in href:
                    link_text = link.get_text(" ", strip=True).lower()
                    
                    # Check if name parts match
                    if any(part in link_text for part in target):
                        if "verified" in result_text:
                            verified_links.append(href)
                        else:
                            unverified_links.append(href)
                        break
        
        # Return first verified link, or first unverified link
        if verified_links:
            return verified_links[0], True
        elif unverified_links:
            return unverified_links[0], False
            
        return None, False
        
    except Exception as e:
        # If HTTP fails, return None to fall back to Selenium
        return None, False

def find_google_scholar_profile_automated(name, email, driver):
    """Automatically find Google Scholar profile using Selenium (fallback)"""
    
    # Get the search URL
    search_urls = generate_search_urls(name)
    url = search_urls[0]
    
    try:
        print(f"  🔍 Searching DuckDuckGo: '{convert_name_format(name)} drexel google scholar' for {name}...")
        driver.get(url)
        
        # Wait for results to load (shorter timeout)
        wait = WebDriverWait(driver, 6)
        try:
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='result']")))
        except:
            try:
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".result")))
            except:
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "article")))
        
        # Look for Google Scholar profile links in DuckDuckGo results
        author_links = []
        
        # Find all search results (try different selectors)
        search_results = []
        try:
            search_results = driver.find_elements(By.CSS_SELECTOR, "[data-testid='result']")
        except:
            try:
                search_results = driver.find_elements(By.CSS_SELECTOR, ".result")
            except:
                search_results = driver.find_elements(By.CSS_SELECTOR, "article")
        
        print(f"    Found {len(search_results)} search results")
        
        verified_links = []
        unverified_links = []
        
        for result in search_results:
            try:
                # Get the result text
                result_text = result.text.lower()
                
                # Check if this result contains "drexel"
                if "drexel" in result_text:
                    # Look for Google Scholar links in this result
                    links = result.find_elements(By.TAG_NAME, "a")
                    for link in links:
                        href = link.get_attribute("href")
                        if href and "scholar.google.com/citations?user=" in href:
                            # Check if the name matches (approximately)
                            link_text = link.text.lower()
                            search_name_lower = convert_name_format(name).lower()
                            
                            # Simple name matching - check if parts of the name appear
                            name_parts = search_name_lower.split()
                            if any(part in link_text for part in name_parts):
                                # Check if verified
                                if "verified" in result_text:
                                    verified_links.append(link)
                                    print(f"    ✅ Found verified Drexel profile")
                                else:
                                    unverified_links.append(link)
                                    print(f"    ⚠️  Found unverified Drexel profile")
                                break
            except Exception as e:
                continue
        
        # Prioritize verified links, then unverified
        author_links = verified_links + unverified_links
        
        # Remove duplicates while preserving order
        seen_urls = set()
        unique_author_links = []
        for link in author_links:
            href = link.get_attribute("href")
            if href not in seen_urls:
                seen_urls.add(href)
                unique_author_links.append(link)
        author_links = unique_author_links
        
        print(f"    Found {len(author_links)} potential author profile links")
        
        for i, link in enumerate(author_links):
            href = link.get_attribute("href")
            if href and "scholar.google.com/citations?user=" in href:
                # Check if this was a verified link
                is_verified = link in verified_links
                status = "verified" if is_verified else "unverified"
                print(f"  ✅ Found {status} Drexel Google Scholar profile: {href}")
                return href, is_verified
        
        time.sleep(random.uniform(0.5, 1.0))  # Shorter random delay
        
    except TimeoutException:
        print(f"  ⚠️  Timeout on search")
    except Exception as e:
        print(f"  ⚠️  Error on search: {e}")
    
    print(f"  ❌ No Drexel profile found for {name}")
    return None, False

def create_automated_gs_links():
    """Automatically find Google Scholar links for all faculty using optimized approach"""
    
    # Read faculty data
    input_csv = BASE_DIR / "01_faculty_profiles.csv"
    output_csv = BASE_DIR / "02_faculty_with_scholar_links.csv"
    
    with open(input_csv, mode='r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        faculty_data = list(reader)
    
    # Process all faculty (we'll check Google Scholar verification later)
    faculty_to_process = []
    for faculty in faculty_data:
        name = faculty.get('Name', 'N/A')
        if name == 'N/A':
            continue
        faculty_to_process.append(faculty)
    
    print(f"🔍 Starting optimized Google Scholar link search for {len(faculty_to_process)} faculty...")
    print("📧 Will only include profiles with verified @drexel.edu emails on Google Scholar")
    print("⚡ Using HTTP requests first, Selenium as fallback")
    
    # Create a single browser instance to reuse
    options = chrome_options()
    driver = webdriver.Chrome(options=options)
    
    try:
        # Find Google Scholar links
        results = []
        http_success = 0
        selenium_success = 0
        
        for i, faculty in enumerate(faculty_to_process, 1):
            name = faculty.get('Name', 'N/A')
            email = faculty.get('Email', 'N/A')
            
            print(f"\n[{i}/{len(faculty_to_process)}] Processing: {name}")
            
            # Try HTTP first (faster)
            scholar_link, is_verified = find_via_ddg_http(name)
            if scholar_link:
                print(f"  ✅ Found via HTTP: {scholar_link}")
                http_success += 1
            else:
                # Fall back to Selenium
                scholar_link, is_verified = find_google_scholar_profile_automated(name, email, driver)
                if scholar_link:
                    selenium_success += 1
            
            results.append({
                'Name': name,
                'Position': faculty.get('Position', ''),
                'Department': faculty.get('Department', ''),
                'Email': email,
                'Google Scholar Link': scholar_link or '',
                'Found': 'Yes' if scholar_link else 'No',
                'Verified': 'Yes' if is_verified else 'No'
            })
            
            # Shorter delay since we're reusing the browser
            time.sleep(random.uniform(0.6, 1.4))
        
        # Save results
        with open(output_csv, mode='w', newline='', encoding='utf-8') as outfile:
            fieldnames = ['Name', 'Position', 'Department', 'Email', 'Google Scholar Link', 'Found', 'Verified']
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        
        # Print summary
        found_count = sum(1 for r in results if r['Found'] == 'Yes')
        verified_count = sum(1 for r in results if r['Verified'] == 'Yes')
        unverified_count = found_count - verified_count
        
        print(f"\n🎉 Optimized search complete!")
        print(f"📊 Found {found_count}/{len(results)} Google Scholar profiles")
        print(f"✅ Verified: {verified_count}")
        print(f"⚠️  Unverified: {unverified_count}")
        print(f"🌐 HTTP requests successful: {http_success}")
        print(f"🤖 Selenium fallbacks used: {selenium_success}")
        print(f"💾 Results saved to: {output_csv}")
        
        return results
        
    finally:
        # Always close the browser
        driver.quit()



def create_manual_work_csv():
    """Create a CSV optimized for manual Google Scholar link collection"""
    
    # Read faculty data
    input_csv = BASE_DIR / "01_faculty_profiles.csv"
    output_csv = BASE_DIR / "manual_gs_collection.csv"
    
    with open(input_csv, mode='r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        faculty_data = list(reader)
    
    # Create optimized output for manual work
    manual_data = []
    for faculty in faculty_data:
        name = faculty.get('Name', 'N/A')
        email = faculty.get('Email', 'N/A')
        
        if name == 'N/A':
            continue
            
        search_urls = generate_search_urls(name)
        
        # Create a row optimized for manual work
        manual_data.append({
            'Name': name,
            'Position': faculty.get('Position', ''),
            'Department': faculty.get('Department', ''),
            'Email': faculty.get('Email', ''),
            'Search URL 1': search_urls[0] if len(search_urls) > 0 else '',
            'Search URL 2': search_urls[1] if len(search_urls) > 1 else '',
            'Search URL 3': search_urls[2] if len(search_urls) > 2 else '',
            'Search URL 4': search_urls[3] if len(search_urls) > 3 else '',
            'Google Scholar Profile URL': '',  # Empty column for manual filling
            'Notes': ''  # For any notes during manual collection
        })
    
    # Write to output file
    with open(output_csv, mode='w', newline='', encoding='utf-8') as outfile:
        fieldnames = [
            'Name', 'Position', 'Department', 'Email',
            'Search URL 1', 'Search URL 2', 'Search URL 3', 'Search URL 4',
            'Google Scholar Profile URL', 'Notes'
        ]
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manual_data)
    
    print(f"Created manual work CSV with {len(manual_data)} faculty members")
    print(f"File saved as: {output_csv}")
    print("\nManual Collection Instructions:")
    print("1. Open the CSV file in Excel, Google Sheets, or Numbers")
    print("2. For each faculty member:")
    print("   - Click on Search URL 1, 2, 3, or 4 to search Google Scholar")
    print("   - Look for their Google Scholar profile (usually shows 'Author' or their name)")
    print("   - Copy the profile URL (starts with https://scholar.google.com/citations?user=)")
    print("   - Paste it in the 'Google Scholar Profile URL' column")
    print("   - Add any notes in the 'Notes' column")
    print("3. Save the file when done")
    print("4. Run 03_pull_articles.py to extract articles")

def convert_manual_results_to_links():
    """Convert manually filled search URLs to the format needed for article extraction"""
    
    # Input file with manual search results
    input_file = BASE_DIR / "manual_gs_collection.csv"
    
    # Output file for article extraction
    output_file = BASE_DIR / "02_faculty_with_scholar_links.csv"
    
    # Read the manual search results
    with open(input_file, mode='r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        faculty_data = list(reader)
    
    # Create output data with just the essential fields
    output_data = []
    for faculty in faculty_data:
        name = faculty.get('Name', 'N/A')
        position = faculty.get('Position', '')
        department = faculty.get('Department', '')
        email = faculty.get('Email', '')
        scholar_link = faculty.get('Google Scholar Profile URL', '')
        
        # Only include if there's a scholar link
        if scholar_link and scholar_link.strip():
            output_data.append({
                'Name': name,
                'Position': position,
                'Department': department,
                'Email': email,
                'Google Scholar Link': scholar_link
            })
        else:
            print(f"Skipping {name} - no Google Scholar link provided")
    
    # Write the output file
    with open(output_file, mode='w', newline='', encoding='utf-8') as outfile:
        fieldnames = ['Name', 'Position', 'Department', 'Email', 'Google Scholar Link']
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_data)
    
    print(f"Converted {len(output_data)} faculty members with Google Scholar links")
    print(f"Results saved to {output_file}")
    print(f"\nNext step: Run 03_pull_articles.py to extract articles")

if __name__ == "__main__":
    print("🚀 Starting Google Scholar link generation...")
    print("Choose your approach:")
    print("1. Automated (faster, uses Selenium)")
    print("2. Manual (slower, but more accurate)")
    
    choice = input("Enter your choice (1 or 2): ").strip()
    
    if choice == "1":
        print("\n🔍 Starting automated Google Scholar link search...")
        create_automated_gs_links()
    elif choice == "2":
        print("\n📝 Starting manual collection workflow...")
        create_manual_work_csv()
        
        # Check if manual collection has been done
        manual_file = BASE_DIR / "manual_gs_collection.csv"
        if manual_file.exists():
            # Check if any Google Scholar Profile URLs have been filled
            with open(manual_file, mode='r', encoding='utf-8') as infile:
                reader = csv.DictReader(infile)
                has_links = any(row.get('Google Scholar Profile URL', '').strip() for row in reader)
            
            if has_links:
                print("\nManual collection detected! Converting to article extraction format...")
                convert_manual_results_to_links()
            else:
                print("\nNo Google Scholar links found in manual collection.")
                print("Please fill in the Google Scholar Profile URLs in manual_gs_collection.csv first.")
        else:
            print("Manual collection file not found.")
    else:
        print("Invalid choice. Please run the script again and choose 1 or 2.") 