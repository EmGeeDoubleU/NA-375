# UPenn SEAS Faculty Data Collection Workflow

This workflow scrapes faculty data from the University of Pennsylvania's School of Engineering and Applied Science (SEAS) directory and populates the database.

## Overview

The School of Engineering and Applied Science at UPenn has 6 departments:
- Bioengineering (BE)
- Chemical and Biomolecular Engineering (CBE) 
- Computer and Information Science (CIS)
- Electrical and Systems Engineering (ESE)
- Materials Science and Engineering (MSE)
- Mechanical Engineering and Applied Mechanics (MEAM)

## Prerequisites

1. **Database Setup**: Run `database_schema.sql` in Supabase SQL Editor
2. **Python Dependencies**: Install required packages
   ```bash
   pip install requests beautifulsoup4 selenium pandas
   ```
3. **ChromeDriver**: Ensure ChromeDriver is installed for Selenium

## Workflow Steps

### Step 1: Scrape Faculty Profiles
```bash
python 01_pull_faculty_profiles.py
```
**Input**: https://directory.seas.upenn.edu/
**Output**: `01_faculty_profiles.csv`

**Data Extracted**:
- Name
- Position (Professor, Associate Professor, etc.)
- Department (Primary department only)
- Email (from mailto links)
- Profile URL
- Headshot URL
- Notes (Additional departments, titles, administrative roles)

**HTML Structure**:
- Container: `div.StaffList > div.container`
- Faculty rows: `div.col-12.SingleStaffList`
- Name: `div.StaffListName > a`
- Titles: `div.StaffListTitles > div`
- Email: `div.StaffListSocial > a[href^="mailto:"]`
- Photo: `div.StaffListPhoto > img`

### Step 2: Find Google Scholar Links
```bash
python 02_make_gs_links.py
```
**Input**: `01_faculty_profiles.csv`
**Output**: `02_faculty_with_scholar_links.csv`

Searches Google Scholar for each faculty member and finds their profile URLs.

### Step 3: Extract Articles and Headshots
```bash
python 03_pull_articles.py
```
**Input**: `02_faculty_with_scholar_links.csv`
**Outputs**:
- `03_faculty_articles.csv` - Article titles, links, and years
- `03_faculty_headshots.csv` - Headshot URLs from Google Scholar
- `03_faculty_articles_skipped.csv` - Faculty skipped with reasons

### Step 4: Populate Database
```bash
python 04_populate_db.py
```
**Inputs**:
- `01_faculty_profiles.csv`
- `02_faculty_with_scholar_links.csv`
- `03_faculty_articles.csv`
- `03_faculty_headshots.csv`

**Database Operations**:
1. Inserts faculty members into `professors` table
2. Links professors to departments
3. Inserts research articles into `research_articles` table
4. Links articles to professors

## Department Mappings

The script maps UPenn SEAS departments to broader fields of interest:

| Department | Field of Interest |
|------------|-------------------|
| Department of Bioengineering | Bioengineering |
| Department of Chemical and Biomolecular Engineering | Chemical Engineering |
| Department of Computer and Information Science | Computer Science |
| Department of Electrical and Systems Engineering | Electrical Engineering |
| Department of Materials Science and Engineering | Materials Science |
| Department of Mechanical Engineering and Applied Mechanics | Mechanical Engineering |

## Notes

- The UPenn SEAS directory uses a clean, structured HTML format
- Faculty profiles are well-organized with consistent CSS classes
- Email addresses are available via mailto links
- Headshot images are directly accessible
- The site appears to be static, making scraping reliable
- **Primary Department Approach**: For faculty with multiple appointments, only the first department listed is stored as the primary department
- **Additional Info**: Secondary departments, distinguished titles, and administrative roles are stored in the Notes field

## Troubleshooting

1. **No faculty found**: Check if the HTML structure has changed
2. **Missing emails**: Some faculty may not have email links
3. **Rate limiting**: Add delays between requests if needed
4. **ChromeDriver issues**: Ensure ChromeDriver version matches Chrome

## Expected Output

After running all scripts, you should have:
- ~200+ faculty members from 6 departments
- Google Scholar profiles for active researchers
- Research articles with publication years
- Headshot images where available
- Complete database population with proper relationships 