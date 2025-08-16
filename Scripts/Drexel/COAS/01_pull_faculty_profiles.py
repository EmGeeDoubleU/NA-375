import requests
from bs4 import BeautifulSoup
import re
import csv
from pathlib import Path
import time

BASE_DIR = Path(__file__).resolve().parent
DIRECTORY_URL = "https://drexel.edu/coas/faculty-research/faculty-directory/"

def extract_email_and_phone(text):
    """Extract email and phone from contact text"""
    email = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    phone = re.search(r"\d{3}\.\d{3}\.\d{4}", text)
    return email.group(0) if email else "N/A", phone.group(0) if phone else "N/A"

def clean_name(name):
    """Clean and format faculty name"""
    if not name or name == "N/A":
        return "N/A"
    
    # Remove extra whitespace
    name = re.sub(r'\s+', ' ', name.strip())
    
    # Convert to "Last, First" format if it's not already
    if ',' not in name:
        parts = name.split()
        if len(parts) >= 2:
            # Assume last name is the last part, first name(s) are the rest
            last_name = parts[-1]
            first_names = ' '.join(parts[:-1])
            name = f"{last_name}, {first_names}"
    
    return name

def is_faculty_member(title):
    """Check if the person is a faculty member"""
    if not title or title == "N/A":
        return False
    
    # Faculty titles to include
    faculty_keywords = [
        "Professor", "Associate Professor", "Assistant Professor", 
        "Teaching Professor", "Associate Teaching Professor", 
        "Assistant Teaching Professor", "Adjunct Professor",
        "Professor Emeritus", "Professor Emerita", "Emeritus Professor",
        "Distinguished Professor", "Research Professor", "Visiting Professor"
    ]
    
    # Check if title contains faculty keywords
    return any(keyword.lower() in title.lower() for keyword in faculty_keywords)

def scrape_coas_faculty():
    """
    Scrape all COAS faculty from the faculty directory
    """
    url = DIRECTORY_URL
    
    # Headers to mimic a browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        print(f"🔍 Fetching COAS faculty directory: {url}")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find the faculty table
        faculty_table = soup.find('table')
        if not faculty_table:
            print("❌ No faculty table found")
            return
        
        # Find all faculty rows
        faculty_rows = faculty_table.find_all('tr', class_='FacultyTableRow')
        if not faculty_rows:
            print("❌ No faculty rows found")
            return
        
        print(f"📊 Found {len(faculty_rows)} faculty rows")
        
        faculty_results = []
        
        for i, row in enumerate(faculty_rows):
            try:
                # Extract data from the row
                cells = row.find_all('td')
                if len(cells) < 3:
                    print(f"⚠️  Row {i+1}: Expected 3 cells, found {len(cells)}")
                    continue
                
                # Cell 1: Name, title, location, email, phone
                contact_cell = cells[0]
                
                # Extract name
                name_link = contact_cell.find('a')
                if name_link:
                    name = name_link.get_text(strip=True)
                    profile_url = "https://drexel.edu" + name_link.get('href') if name_link.get('href') else ""
                else:
                    name = "N/A"
                    profile_url = ""
                
                # Extract title, location, email, and phone
                contact_text = contact_cell.get_text()
                lines = [line.strip() for line in contact_text.split('\n') if line.strip()]
                
                title = ""
                location = ""
                email = ""
                phone = ""
                
                # Search the entire contact cell for phone numbers
                phone_match = re.search(r'\d{3}\.\d{3}\.\d{4}', contact_text)
                if phone_match:
                    phone = phone_match.group(0)
                
                for line in lines:
                    if '@drexel.edu' in line:
                        email = line.strip()
                    elif any(word in line.lower() for word in ['professor', 'assistant', 'associate', 'teaching', 'research', 'emeritus', 'visiting', 'adjunct']):
                        title = line.strip()
                    elif any(word in line.lower() for word in ['hall', 'center', 'room', 'disque', 'macalister', 'korman', 'stratton', 'stratton']):
                        location = line.strip()
                
                # Cell 2: Departments
                dept_cell = cells[1]
                departments = []
                dept_links = dept_cell.find_all('li')
                for dept in dept_links:
                    dept_text = dept.get_text(strip=True)
                    if dept_text and dept_text != "Department" and dept_text.strip():
                        departments.append(dept_text.strip())
                
                # If no departments found in li elements, try to extract from the position/title
                if not departments:
                    # Look for department in the title/position
                    if "Department of" in title:
                        # Extract department from title
                        dept_match = re.search(r'Department of [^;]+', title)
                        if dept_match:
                            departments.append(dept_match.group(0))
                    
                    # If still no department, try to infer from the position
                    if not departments and title:
                        # Common department patterns in titles
                        dept_patterns = [
                            "Department of Chemistry", "Department of Biology", "Department of Physics",
                            "Department of Mathematics", "Department of English", "Department of History",
                            "Department of Psychology", "Department of Sociology", "Department of Politics",
                            "Department of Communication", "Department of Philosophy", "Department of Global Studies"
                        ]
                        for pattern in dept_patterns:
                            if pattern.lower() in title.lower():
                                departments.append(pattern)
                                break
                
                # Cell 3: Research interests
                research_cell = cells[2]
                research_text = research_cell.get_text(strip=True)
                # Clean up research text
                research_text = re.sub(r'Research & Teaching Interests', '', research_text).strip()
                
                # Clean and format the name
                clean_name_val = clean_name(name)
                
                # Check if this is a faculty member
                if not is_faculty_member(title):
                    print(f"⏭️  Skipping {clean_name_val} - not a faculty member (title: {title})")
                    continue
                
                # Choose primary department (first one listed)
                primary_department = departments[0] if departments else "N/A"
                
                # Create faculty record
                faculty_record = {
                    'Name': clean_name_val,
                    'Position': title,
                    'Department': primary_department,
                    'Email': email,
                    'Phone': phone,
                    'Headshot': 'N/A'  # Will be populated by Script 3
                }
                
                faculty_results.append(faculty_record)
                print(f"✅ {i+1}/{len(faculty_rows)}: {clean_name_val} - {title}")
                
            except Exception as e:
                print(f"❌ Error processing row {i+1}: {e}")
                continue
        
        print(f"\n📋 Successfully processed {len(faculty_results)} faculty members")
        
        # Save to CSV
        output_file = BASE_DIR / "01_faculty_profiles.csv"
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['Name', 'Position', 'Department', 'Email', 'Phone', 'Headshot']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for faculty in faculty_results:
                writer.writerow(faculty)
        
        print(f"💾 Saved faculty data to: {output_file}")
        
        # Print summary
        print(f"\n📊 Summary:")
        print(f"   Total faculty processed: {len(faculty_results)}")
        print(f"   Faculty with phone numbers: {sum(1 for f in faculty_results if f['Phone'] != 'N/A')}")
        print(f"   Faculty with emails: {sum(1 for f in faculty_results if f['Email'] != 'N/A')}")
        
        return faculty_results
        
    except requests.RequestException as e:
        print(f"❌ Error fetching the page: {e}")
    except Exception as e:
        print(f"❌ Error processing the page: {e}")

if __name__ == "__main__":
    scrape_coas_faculty()
