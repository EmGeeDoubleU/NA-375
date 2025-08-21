# Script 1 Output Format Specification

## Overview
This document defines the exact CSV format that Script 1 must produce for Scripts 2-4 to work correctly. Script 1 is always custom per college, but its output must follow this standardized format.

## Required CSV File: `01_faculty_profiles.csv`

### File Location
- Must be in the same directory as Script 1
- Must be named exactly: `01_faculty_profiles.csv`
- Must use UTF-8 encoding

### CSV Headers (Required)
```csv
Name,Position,Department,Email,Phone,Headshot
```

### Column Specifications

#### 1. Name (Required)
- **Format**: "Last, First" or "First Last"
- **Examples**: 
  - `"Smith, John"`
  - `"Johnson, Mary A."`
  - `"Brown, Robert Jr."`
- **Notes**: 
  - Must be unique per faculty member
  - Used for Google Scholar search in Script 2
  - Used for database insertion in Script 4

#### 2. Position (Required)
- **Format**: Full position title as listed on website
- **Examples**:
  - `"Professor of Computer Science"`
  - `"Associate Professor; Department Head"`
  - `"Teaching Professor of Mathematics"`
- **Notes**: 
  - Can include multiple positions separated by semicolons
  - Used for database insertion in Script 4

#### 3. Department (Required)
- **Format**: Exact department name as it appears in the database
- **Examples**:
  - `"Department of Computer Science"`
  - `"Department of Biology"`
  - `"Center for Public Policy"`
- **Critical**: Must match department names in the database exactly
- **Notes**: 
  - Used for department mapping in Script 4
  - Must correspond to entries in `departments` table

#### 4. Email (Optional)
- **Format**: Full email address
- **Examples**:
  - `"john.smith@drexel.edu"`
  - `"m.johnson@drexel.edu"`
- **Notes**: 
  - Can be empty if not available
  - Used for verification in Script 2
  - Used for database insertion in Script 4

#### 5. Phone (Optional)
- **Format**: Phone number as listed on website
- **Examples**:
  - `"215.895.1234"`
  - `"215-895-5678"`
- **Notes**: 
  - Can be empty if not available
  - Used for database insertion in Script 4

#### 6. Headshot (Optional)
- **Format**: URL to profile image or "N/A"
- **Examples**:
  - `"https://example.com/photo.jpg"`
  - `"N/A"`
- **Notes**: 
  - Script 3 will replace with Google Scholar headshot if available
  - Used for database insertion in Script 4

## Example CSV Content
```csv
Name,Position,Department,Email,Phone,Headshot
"Smith, John","Professor of Computer Science","Department of Computer Science","john.smith@drexel.edu","215.895.1234","N/A"
"Johnson, Mary","Associate Professor; Department Head","Department of Biology","m.johnson@drexel.edu","215.895.5678","N/A"
"Brown, Robert","Teaching Professor","Department of Mathematics","","","N/A"
```

## Data Quality Requirements

### Required Fields
- **Name**: Must be present for every faculty member
- **Department**: Must be present and match database exactly
- **Position**: Should be present (can be "N/A" if not available)

### Optional Fields
- **Email**: Can be empty if not available
- **Phone**: Can be empty if not available  
- **Headshot**: Should be "N/A" (Script 3 will handle Google Scholar headshots)

### Data Validation
- No duplicate names
- All department names must exist in database
- Email addresses should be valid format (if present)
- Phone numbers should be consistent format (if present)

## Script 1 Implementation Guidelines

### What Script 1 Should Do
1. **Scrape faculty data** from the college's website
2. **Extract required fields** from HTML structure
3. **Normalize department names** to match database
4. **Handle missing data** gracefully (empty strings for missing optional fields)
5. **Output CSV** in exact format specified above

### What Script 1 Should NOT Do
- Don't scrape Google Scholar data (Script 2 handles this)
- Don't scrape articles (Script 3 handles this)
- Don't insert into database (Script 4 handles this)
- Don't modify department names beyond normalization

## Testing Your Script 1 Output

### Quick Validation
```bash
# Check CSV format
head -5 01_faculty_profiles.csv

# Count faculty members
wc -l 01_faculty_profiles.csv

# Check for required columns
python3 -c "import csv; reader = csv.DictReader(open('01_faculty_profiles.csv')); print('Headers:', reader.fieldnames)"
```

### Common Issues to Avoid
1. **Wrong department names** - Must match database exactly
2. **Missing headers** - All 6 columns required
3. **Encoding issues** - Use UTF-8
4. **Duplicate names** - Each faculty member must be unique
5. **Empty required fields** - Name and Department cannot be empty

## Integration with Universal Scripts

### Script 2 (Google Scholar Links)
- Reads: `01_faculty_profiles.csv`
- Uses: Name, Email columns
- Outputs: `02_faculty_with_scholar_links.csv`

### Script 3 (Articles & Headshots)
- Reads: `02_faculty_with_scholar_links.csv`
- Uses: Name, Google Scholar Link columns
- Outputs: `03_faculty_articles.csv`, `03_faculty_headshots.csv`

### Script 4 (Database Population)
- Reads: All CSV files from previous scripts
- Uses: All columns for database insertion
- Outputs: Database records

## Troubleshooting

### If Script 2 Fails
- Check that Name column is properly formatted
- Verify Email column contains valid addresses (if available)

### If Script 3 Fails
- Check that Script 2 produced valid Google Scholar links
- Verify Name column matches between Script 1 and Script 2 output

### If Script 4 Fails
- Verify department names match database exactly
- Check that all required columns are present
- Ensure CSV encoding is UTF-8

## Example Script 1 Template
```python
import csv
import requests
from bs4 import BeautifulSoup

def scrape_faculty_data():
    # Your custom scraping logic here
    # Extract: name, position, department, email, phone, headshot
    pass

def normalize_department_name(dept_name):
    # Map website department names to database names
    # Example: "Computer Science" -> "Department of Computer Science"
    pass

def output_csv(faculty_data):
    with open('01_faculty_profiles.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'Name', 'Position', 'Department', 'Email', 'Phone', 'Headshot'
        ])
        writer.writeheader()
        for faculty in faculty_data:
            writer.writerow({
                'Name': faculty['name'],
                'Position': faculty['position'],
                'Department': normalize_department_name(faculty['department']),
                'Email': faculty.get('email', ''),
                'Phone': faculty.get('phone', ''),
                'Headshot': 'N/A'
            })

if __name__ == "__main__":
    faculty_data = scrape_faculty_data()
    output_csv(faculty_data)
``` 