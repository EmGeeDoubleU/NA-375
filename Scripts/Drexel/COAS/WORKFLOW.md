# COAS Faculty Data Collection Workflow

This document explains the complete workflow for collecting faculty data from any Drexel department and populating the database.

## Overview

The workflow consists of 4 scripts that work in sequence:
1. **Script 1**: Extract faculty profiles from department directory
2. **Script 2**: Find Google Scholar profiles for each faculty member
3. **Script 3**: Extract articles and headshots from Google Scholar
4. **Script 4**: Populate the database with all collected data

---

## Script 1: `01_pull_faculty_profiles.py`

### Purpose
Extracts basic faculty information from the department's faculty directory page.

### Input
- Department faculty directory URL (e.g., `https://drexel.edu/coas/faculty-research/faculty-directory/`)

### Output: `01_faculty_profiles.csv`
Must have exactly these columns in this order:
```csv
Name,Position,Department,Email,Phone,Headshot
```

### Required Data Format
- **Name**: Full name (e.g., "Addison, Anthony W.")
- **Position**: Academic title (e.g., "Professor Emeritus; Department of Chemistry")
- **Department**: Primary department (e.g., "Department of Chemistry")
- **Email**: Contact email (e.g., "addisona@drexel.edu")
- **Phone**: Phone number in XXX.XXX.XXXX format (e.g., "215.895.2646") or "N/A"
- **Headshot**: Always set to "N/A" (will be populated by Script 3)

### HTML Structure Requirements
**IMPORTANT**: Every department has a different HTML structure! You must analyze each department's page individually.

**Examples of different structures:**
- **CS**: Uses `section.directory-result` with `.directory-result__name`, `.directory-result__title`, etc.
- **COAS**: Uses `table` with `tr.FacultyTableRow` and 3 `td` cells
- **Other departments**: Will have completely different structures

**What you need to do:**
1. **Inspect the HTML** of the target department's faculty directory
2. **Identify the patterns** for extracting:
   - Faculty names
   - Titles/positions  
   - Departments
   - Email addresses
   - Phone numbers
3. **Modify Script 1** to match that specific HTML structure
4. **Test with a single faculty member** first using a test scraper

### Example Output Row
```csv
"Addison, Anthony W.","Professor Emeritus; Department of Chemistry","Department of Chemistry",addisona@drexel.edu,215.895.2646,N/A
```

---

## Script 2: `02_make_gs_links.py`

### Purpose
Finds Google Scholar profiles for each faculty member using DuckDuckGo search.

### Input
- `01_faculty_profiles.csv` from Script 1

### Output: `02_faculty_with_scholar_links.csv`
```csv
Name,Position,Department,Email,Phone,Headshot,Google_Scholar_Link,Is_Verified
```

### What It Does
1. Takes each faculty name from Script 1
2. Searches DuckDuckGo for "[Name] drexel google scholar"
3. Finds Google Scholar profile links in search results
4. Verifies if the profile has a verified Drexel email
5. Outputs the Google Scholar link and verification status

### Example Output Row
```csv
"Addison, Anthony W.","Professor Emeritus; Department of Chemistry","Department of Chemistry",addisona@drexel.edu,215.895.2646,N/A,https://scholar.google.com/citations?user=...,True
```

---

## Script 3: `03_pull_articles.py`

### Purpose
Extracts articles and headshots from Google Scholar profiles.

### Input
- `02_faculty_with_scholar_links.csv` from Script 2

### Output: `03_faculty_articles.csv`
```csv
Name,Position,Department,Email,Phone,Headshot,Google_Scholar_Link,Is_Verified,Articles
```

### What It Does
1. Visits each Google Scholar profile
2. **Extracts headshot** from profile image (`gsc_prf_pup-img`)
3. **Extracts all articles** from the profile
4. Updates the Headshot field with the Google Scholar image URL
5. Adds all articles as a JSON string in the Articles column

### Example Output Row
```csv
"Addison, Anthony W.","Professor Emeritus; Department of Chemistry","Department of Chemistry",addisona@drexel.edu,215.895.2646,https://scholar.googleusercontent.com/...,https://scholar.google.com/citations?user=...,True,"[{'title': 'Article 1', 'citations': 50}, {'title': 'Article 2', 'citations': 30}]"
```

---

## Script 4: `04_populate_db.py`

### Purpose
Populates the database with all collected faculty and article data.

### Input
- `03_faculty_articles.csv` from Script 3
- Database schema from `database_schema.sql`

### Output
- Faculty records in the database
- Article records linked to faculty
- Headshot URLs stored in faculty profiles

### What It Does
1. Reads the CSV file with all faculty data
2. Creates faculty records in the database
3. Parses the articles JSON and creates article records
4. Links articles to faculty members
5. Stores headshot URLs from Google Scholar

---

## Adapting to New Departments

### Step 1: Copy Scripts
```bash
# Copy the 4 scripts to new department folder
cp 01_pull_faculty_profiles.py ../NEW_DEPARTMENT/
cp 02_make_gs_links.py ../NEW_DEPARTMENT/
cp 03_pull_articles.py ../NEW_DEPARTMENT/
cp 04_populate_db.py ../NEW_DEPARTMENT/
```

### Step 2: Modify Script 1
1. **Change the URL** in `01_pull_faculty_profiles.py`:
   ```python
   DIRECTORY_URL = "https://drexel.edu/NEW_DEPARTMENT/faculty-directory/"
   ```

2. **Analyze the HTML structure** of the new department:
   - Right-click → "Inspect Element" on the faculty directory page
   - Look for patterns in how faculty data is structured
   - Identify CSS selectors for names, titles, departments, emails, phones

3. **Modify the scraping logic** to match the new HTML structure:
   - Update CSS selectors for finding faculty rows
   - Update extraction logic for each data field
   - Handle any pagination if present

4. **Test with a single faculty member** first using a test scraper

### Step 3: Run the Workflow
```bash
# Run scripts in order
python 01_pull_faculty_profiles.py
python 02_make_gs_links.py  
python 03_pull_articles.py
python 04_populate_db.py
```

---

## Common Issues & Solutions

### Script 1 Issues
- **No faculty rows found**: HTML structure is different - analyze the page and update selectors
- **Missing phone numbers**: Some faculty don't have phone numbers listed
- **Multiple departments**: Choose the primary department for the Department field
- **Wrong data extracted**: CSS selectors don't match the page structure - inspect and fix
- **Pagination issues**: Some departments use pagination - handle multiple pages

### Script 2 Issues
- **No Google Scholar profiles found**: Faculty might not have public profiles
- **False positives**: Script verifies Drexel email to reduce false matches

### Script 3 Issues
- **Rate limiting**: Script includes delays and random user agents
- **Missing headshots**: Some profiles don't have profile pictures

### Script 4 Issues
- **Database connection**: Check Supabase credentials
- **Duplicate entries**: Script handles existing records

---

## Data Quality Notes

- **Phone numbers**: Not all faculty have phone numbers listed
- **Google Scholar profiles**: Not all faculty have public Google Scholar profiles
- **Headshots**: Only available if faculty have Google Scholar profile pictures
- **Articles**: Only available for faculty with Google Scholar profiles
- **Verification**: Only profiles with verified Drexel emails are considered valid

---

## File Dependencies

```
01_pull_faculty_profiles.py
    ↓ (creates)
01_faculty_profiles.csv
    ↓ (input for)
02_make_gs_links.py
    ↓ (creates)
02_faculty_with_scholar_links.csv
    ↓ (input for)
03_pull_articles.py
    ↓ (creates)
03_faculty_articles.csv
    ↓ (input for)
04_populate_db.py
    ↓ (populates)
Database
``` 