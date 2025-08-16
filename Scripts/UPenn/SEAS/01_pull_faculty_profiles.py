#!/usr/bin/env python3
"""
UPenn SEAS Faculty Scraper
Scrapes faculty data from https://directory.seas.upenn.edu/

Output: 01_faculty_profiles.csv
"""

import requests
from bs4 import BeautifulSoup
import csv
import re
import time
import sys
from urllib.parse import urljoin

def clean_text(text):
    """Clean and normalize text"""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text.strip())

def normalize_department_name(dept_name):
    """Normalize department name to match database schema"""
    if not dept_name:
        return ""
    
    # Map website department names to database names
    dept_mapping = {
        'Bioengineering': 'Department of Bioengineering',
        'Chemical and Biomolecular Engineering': 'Department of Chemical and Biomolecular Engineering',
        'Computer and Information Science': 'Department of Computer and Information Science',
        'Electrical and Systems Engineering': 'Department of Electrical and Systems Engineering',
        'Materials Science and Engineering': 'Department of Materials Science and Engineering',
        'Mechanical Engineering and Applied Mechanics': 'Department of Mechanical Engineering and Applied Mechanics'
    }
    
    return dept_mapping.get(dept_name, dept_name)

def is_department_name(text):
    """Check if text is a department name (not a title)"""
    if not text:
        return False
    
    # List of known department names
    known_departments = [
        'Bioengineering',
        'Chemical and Biomolecular Engineering',
        'Computer and Information Science',
        'Electrical and Systems Engineering',
        'Materials Science and Engineering',
        'Mechanical Engineering and Applied Mechanics'
    ]
    
    # Check if text contains any known department name
    return any(dept in text for dept in known_departments)

def extract_email_from_social_links(social_div):
    """Extract email from social links section"""
    if not social_div:
        return ""
    
    email_links = social_div.find_all('a', href=re.compile(r'^mailto:'))
    if email_links:
        email_href = email_links[0].get('href', '')
        return email_href.replace('mailto:', '')
    return ""

def scrape_faculty_data():
    """Scrape faculty data from UPenn SEAS directory"""
    url = "https://directory.seas.upenn.edu/"
    
    print("Fetching UPenn SEAS faculty directory...")
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error fetching page: {e}")
        return
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Find the StaffList container (it's a section tag)
    staff_list = soup.find('section', class_='StaffList')
    if not staff_list:
        print("Could not find StaffList container")
        return
    
    # Find all faculty rows directly within StaffList
    faculty_rows = staff_list.find_all('div', class_='SingleStaffList')
    
    if not faculty_rows:
        print("No faculty rows found")
        return
    
    print(f"Found {len(faculty_rows)} faculty members")
    
    faculty_data = []
    
    for i, row in enumerate(faculty_rows, 1):
        try:
            # Extract name
            name_div = row.find('div', class_='StaffListName')
            if not name_div:
                continue
                
            name_link = name_div.find('a')
            if not name_link:
                continue
                
            # Convert "First Last" to "Last, First" format to match Drexel
            full_name = clean_text(name_link.get_text())
            name_parts = full_name.split()
            if len(name_parts) >= 2:
                # Handle cases like "Lama A. Al-Aswad, MD, MPH"
                if ',' in full_name:
                    name = full_name  # Keep as is if already has comma
                else:
                    last_name = name_parts[-1]
                    first_names = ' '.join(name_parts[:-1])
                    name = f"{last_name}, {first_names}"
            else:
                name = full_name
            profile_url = name_link.get('href', '')
            
            # Extract position and department from StaffListTitles
            titles_div = row.find('div', class_='StaffListTitles')
            position = ""
            department = ""
            additional_info = []
            
            if titles_div:
                title_divs = titles_div.find_all('div')
                if len(title_divs) >= 1:
                    position = clean_text(title_divs[0].get_text())
                
                # Handle multiple departments and additional info
                if len(title_divs) >= 2:
                    # Find the first actual department (skip titles)
                    department = ""
                    for i in range(1, len(title_divs)):
                        text = clean_text(title_divs[i].get_text())
                        if is_department_name(text):
                            department = normalize_department_name(text)
                            break
                    
                    # If no department found, use the first non-empty text
                    if not department and len(title_divs) >= 2:
                        department = clean_text(title_divs[1].get_text())
                    
                    # Collect additional departments and info
                    for i in range(1, len(title_divs)):
                        additional_text = clean_text(title_divs[i].get_text())
                        if additional_text and additional_text != department and not is_department_name(additional_text):
                            additional_info.append(additional_text)
            
            # Extract email from social links
            social_div = row.find('div', class_='StaffListSocial')
            email = extract_email_from_social_links(social_div)
            
            # Extract headshot URL
            photo_div = row.find('div', class_='StaffListPhoto')
            headshot_url = ""
            if photo_div:
                img = photo_div.find('img')
                if img:
                    headshot_url = img.get('src', '')
            
            # Skip if no name
            if not name:
                continue
            
            # Combine additional info into notes
            notes = "; ".join(additional_info) if additional_info else ""
            
            faculty_data.append({
                'Name': name,
                'Position': position,
                'Department': department,
                'Email': email,
                'Phone': '',  # UPenn SEAS doesn't show phone numbers
                'Headshot': headshot_url
            })
            
            if i % 10 == 0:
                print(f"Processed {i} faculty members...")
                
        except Exception as e:
            print(f"Error processing faculty member {i}: {e}")
            continue
    
    # Write to CSV
    output_file = "01_faculty_profiles.csv"
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['Name', 'Position', 'Department', 'Email', 'Phone', 'Headshot']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(faculty_data)
    
    print(f"\nScraping completed!")
    print(f"Total faculty members scraped: {len(faculty_data)}")
    print(f"Output saved to: {output_file}")
    
    # Print sample data
    if faculty_data:
        print("\nSample data:")
        for i, faculty in enumerate(faculty_data[:3]):
            print(f"{i+1}. {faculty['Name']} - {faculty['Position']} - {faculty['Department']}")

if __name__ == "__main__":
    scrape_faculty_data() 