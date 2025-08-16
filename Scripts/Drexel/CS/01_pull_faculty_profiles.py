import requests
from bs4 import BeautifulSoup
import re
import csv
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

BASE_DIR = Path(__file__).resolve().parent
DIRECTORY_URL = "https://drexel.edu/cci/about/directory/?q&sortBy=relevance&sortOrder=asc&page=1"
TOTAL_PAGES = 15  # Increased to ensure we get all 101 faculty members


def extract_email_and_phone(text):
    email = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    phone = re.search(r"\d{3}\.\d{3}\.\d{4}", text)
    return email.group(0) if email else "N/A", phone.group(0) if phone else "N/A"

def clean_name_and_position(name, title):
    name = name.strip() if name else "N/A"
    title = re.sub(r"Pronouns:.*", "", title).strip() if title else "N/A"
    return name, title

def is_faculty_member(title, department):
    """Check if the person is a faculty member (not a PhD student)"""
    if not title or title == "N/A":
        return False
    
    # Exclude PhD students/advisors
    if "adviser" in title.lower() or "advisers" in title.lower():
        return False
    
    # Faculty titles to include
    faculty_keywords = [
        "Professor", "Associate Professor", "Assistant Professor", 
        "Teaching Professor", "Associate Teaching Professor", 
        "Assistant Teaching Professor", "Adjunct Professor",
        "Professor Emeritus", "Professor Emerita", "Emeritus Professor",
        "Distinguished Professor", "Research Professor"
    ]
    
    # Check if title contains faculty keywords
    is_faculty = any(keyword.lower() in title.lower() for keyword in faculty_keywords)
    
    # Also check department - faculty should be in Computer Science or Information Science
    is_faculty_dept = department in ["Computer Science", "Information Science"]
    
    return is_faculty and is_faculty_dept



def scrape_page_with_selenium(page_num):
    url = f"https://drexel.edu/cci/about/directory/?q&sortBy=relevance&sortOrder=asc&page={page_num}"
    
    # Set up Chrome options for faster scraping
    options = Options()
    options.add_argument("--headless")  # Run in headless mode
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-plugins")
    options.add_argument("--disable-images")  # Don't load images for faster scraping
    options.add_argument("--page-load-strategy=eager")  # Don't wait for all resources
    
    try:
        # Initialize the driver
        driver = webdriver.Chrome(options=options)
        print(f"🔍 Fetching page {page_num} with Selenium...")
        
        # Navigate to the page
        driver.get(url)
        
        # Wait for the directory results to load (reduced wait time)
        wait = WebDriverWait(driver, 5)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "section.directory-result")))
        
        # Give minimal time for content to load
        time.sleep(1)
        
        # Get the page source after JavaScript has loaded
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, "html.parser")
        
        # Look for directory results that are visible (faculty members)
        rows = soup.select("section.directory-result.is-visible")
        print(f"📊 Page {page_num}: Found {len(rows)} faculty members")

        faculty_results = []
        for row in rows:
            try:
                # Extract name
                name_el = row.select_one(".directory-result__name a")
                name = name_el.get_text(strip=True) if name_el else "N/A"
                
                # Extract title/position
                title_el = row.select_one(".directory-result__title")
                title = title_el.get_text(strip=True) if title_el else "N/A"
                
                # Extract contact information
                contact_el = row.select_one(".directory-result__contact-card")
                contact_text = contact_el.get_text(" ", strip=True) if contact_el else ""
                email, phone = extract_email_and_phone(contact_text)
                
                # Skip image URL - we'll get headshots from Google Scholar instead
                img_url = "N/A"
                
                # Extract department
                dept_el = row.select_one(".directory-result__section--department span")
                department = dept_el.get_text(strip=True) if dept_el else "N/A"

                name, title = clean_name_and_position(name, title)
                
                # Only include faculty members (not PhD students)
                if is_faculty_member(title, department) and name != "N/A":
                    print(f"✅ Faculty: {name} - {title} - {department} - {email}")
                    faculty_results.append({
                        "Name": name,
                        "Position": title,
                        "Department": department,
                        "Email": email,
                        "Phone": phone,
                        "Headshot": img_url
                    })
                else:
                    print(f"❌ Skipped (not faculty): {name} - {title} - {department}")
            except Exception as e:
                print(f"⚠️  Error processing row: {e}")
                continue
        
        return faculty_results
        
    except Exception as e:
        print(f"❌ Error with Selenium on page {page_num}: {e}")
        return []
    finally:
        try:
            driver.quit()
        except:
            pass

def scrape_all_pages():
    all_faculty = []
    for page in range(1, TOTAL_PAGES + 1):
        page_faculty = scrape_page_with_selenium(page)
        all_faculty.extend(page_faculty)
        
        print(f"📈 Total faculty collected so far: {len(all_faculty)}")
        
        # Stop if we have 101 faculty members
        if len(all_faculty) >= 101:
            print(f"🎯 Reached target of 101 faculty members!")
            break
            
        if not page_faculty:
            print(f"⚠️  No faculty found on page {page}, stopping...")
            break
    
    return all_faculty[:101]  # Ensure we only return 101 faculty members

def save_to_csv(data, filename=None):
    filename = BASE_DIR / (filename or "01_faculty_profiles.csv")
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=["Name", "Position", "Department", "Email", "Phone", "Headshot"])
        writer.writeheader()
        writer.writerows(data)
    print(f"\n✅ Data saved to {filename}")

if __name__ == "__main__":
    try:
        print("🎯 Starting Drexel CCI Faculty Scraper (Faculty Only)...")
        print("📋 Target: 101 faculty members only")
        all_faculty = scrape_all_pages()
        if all_faculty:
            save_to_csv(all_faculty)
            print(f"\n🎉 Successfully scraped {len(all_faculty)} faculty members!")
        else:
            print("❌ No faculty data found.")
    except Exception as e:
        print(f"❌ Error running scraper: {e}")
        import traceback
        traceback.print_exc()
