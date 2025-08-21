# Universal Faculty Data Collection Scripts

## Overview
This directory contains the universal scripts (2-4) that work with any college's Script 1 output. These scripts are standardized and reusable across all colleges and universities.

## Files

### Core Scripts
- **`02_make_gs_links.py`** - Discovers Google Scholar profiles for faculty
- **`03_pull_articles.py`** - Extracts articles and headshots from Google Scholar
- **`04_populate_db.py`** - Populates the database with all collected data

### Documentation
- **`SCRIPT1_OUTPUT_FORMAT.md`** - Exact CSV format requirements for Script 1
- **`UNIVERSAL_WORKFLOW.md`** - Complete workflow guide for using these scripts
- **`README.md`** - This file

## Usage

### Quick Start
1. **Write custom Script 1** for your college (see `SCRIPT1_OUTPUT_FORMAT.md`)
2. **Copy universal scripts** to your college directory:
   ```bash
   cp ../../Universal/02_make_gs_links.py .
   cp ../../Universal/03_pull_articles.py .
   cp ../../Universal/04_populate_db.py .
   ```
3. **Run the pipeline**:
   ```bash
   python 01_pull_faculty_profiles.py  # Your custom script
   python 02_make_gs_links.py         # Universal script
   python 03_pull_articles.py         # Universal script
   python 04_populate_db.py           # Universal script
   ```

### Prerequisites
- Python 3.8+
- Chrome/Chromedriver for Selenium
- Required packages: `requests`, `beautifulsoup4`, `selenium`, `supabase`
- Database setup (colleges, departments, field mappings)

## Script Details

### Script 2: Google Scholar Link Discovery
- **Input**: `01_faculty_profiles.csv`
- **Output**: `02_faculty_with_scholar_links.csv`
- **Features**:
  - HTTP-first approach for speed
  - Selenium fallback for complex cases
  - Email verification for accuracy
  - Rate limiting and anti-detection

### Script 3: Article & Headshot Extraction
- **Input**: `02_faculty_with_scholar_links.csv`
- **Output**: `03_faculty_articles.csv`, `03_faculty_headshots.csv`
- **Features**:
  - Parallel processing for speed
  - URL cleaning and validation
  - Proper CSV formatting
  - Progress tracking and resumption

### Script 4: Database Population
- **Input**: All CSV files from previous scripts
- **Output**: Database records
- **Features**:
  - Batch processing for efficiency
  - Error handling and retries
  - Department mapping validation
  - Progress reporting

## Key Features

### Universal Compatibility
- Works with any college's Script 1 output
- Handles different faculty name formats
- Adapts to various department structures
- Scales to any number of faculty

### Robust Error Handling
- Graceful handling of missing data
- Retry logic for network issues
- Fallback mechanisms for failures
- Detailed error reporting

### Performance Optimized
- Parallel processing where possible
- Efficient database operations
- Minimal API calls
- Progress tracking and resumption

### Database Integration
- Automatic department mapping
- Field of interest categorization
- Proper foreign key relationships
- Data validation and cleanup

## Maintenance

### Updating Scripts
- Scripts are versioned and tested
- Updates are backward compatible
- Always copy fresh scripts for new colleges
- Don't modify universal scripts in college directories

### Troubleshooting
- Check `UNIVERSAL_WORKFLOW.md` for common issues
- Validate Script 1 output format
- Ensure database setup is complete
- Monitor script output for errors

## Support
For issues or questions:
1. Check the documentation files
2. Verify Script 1 output format
3. Ensure all prerequisites are met
4. Review error messages and logs

This universal approach makes faculty data collection scalable and maintainable! 🎯 