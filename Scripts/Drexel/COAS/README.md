# CS Faculty Data Extraction Workflow

This directory contains scripts to extract faculty profiles and research articles from Drexel University's Computer Science and Information Science departments.

## File Structure

### Scripts (Run in Order)
- `01_pull_faculty_profiles.py` - Extracts faculty profiles from Drexel website
- `02_make_gs_links.py` - Generates Google Scholar search URLs and manual collection workflow
- `03_pull_articles.py` - Extracts articles from Google Scholar profiles
- `04_populate_db.py` - Populates database with faculty and article data

### Data Files
- `01_faculty_profiles.csv` - Raw faculty data from Drexel website
- `02_faculty_with_scholar_links.csv` - Faculty data with Google Scholar links
- `03_faculty_articles.csv` - Extracted research articles
- `manual_gs_collection.csv` - Temporary file for manual Google Scholar link collection

## Workflow

### Step 1: Extract Faculty Profiles
```bash
python 01_pull_faculty_profiles.py
```
- Scrapes faculty profiles from Drexel's website
- Outputs: `01_faculty_profiles.csv`

### Step 2: Generate Google Scholar Search URLs
```bash
python 02_make_gs_links.py
```
- **Option 1 (Automated)**: Uses Selenium to automatically find Google Scholar profiles
- **Option 2 (Manual)**: Creates search URLs for manual collection
- Only includes Google Scholar profiles that mention "drexel" in the search result description
- Outputs: `02_faculty_with_scholar_links.csv`

### Step 3: Extract Research Articles
```bash
python 03_pull_articles.py
```
- Extracts all articles from Google Scholar profiles
- Limits "Show more" clicks to 5 per profile to avoid infinite loops
- Outputs: `03_faculty_articles.csv`

### Step 4: Populate Database
```bash
python 04_populate_db.py
```
- Imports faculty and article data into PostgreSQL database
- Requires database configuration in the script

## Notes

- Scripts are designed to be reusable (no auto-resume functionality)
- Each script can be run independently
- The 5-click limit on "Show more" prevents infinite loops
- Duplicate Google Scholar links have been cleaned up
- All files use consistent naming conventions (01_, 02_, 03_)

## Current Status

- ✅ Faculty profiles extracted: 91 faculty members (with Drexel email verification)
- 🔄 Google Scholar links: Ready to generate
- 🔄 Articles: Ready to extract
- ✅ Database population script ready

## Recent Updates

- ✅ Added Google Scholar Drexel verification (only profiles mentioning "drexel" in description)
- ✅ Optimized Google Scholar link generation with automated Selenium approach
- ✅ Removed all article and scholar link data for fresh start
- ✅ Clean, reusable script structure
- ✅ Faster automated Google Scholar profile detection 