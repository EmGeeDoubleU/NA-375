import csv
import os
import math
import time
from pathlib import Path
from typing import Dict, List, Any, Iterable
from supabase import create_client, Client

# --------------- Config ---------------
BASE_DIR = Path(__file__).resolve().parent

# Supabase configuration (using your provided keys)
SUPABASE_URL = "https://ldryyqggdllmvdkcyrst.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkcnl5cWdnZGxsbXZka2N5cnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgxMTkyOSwiZXhwIjoyMDY5Mzg3OTI5fQ.1kcnOnUeYS2mN7YD0ikNdJ0ym0fWsFgtPp-axG39ji4"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_and_add_field_mappings():
    """Check current field mappings and add missing COAS department mappings"""
    print("🔍 Checking current department field mappings...")
    
    # Get all fields of interest
    fields_response = supabase.table("fields_of_interest").select("*").execute()
    fields = fields_response.data
    print(f"✅ Found {len(fields)} fields of interest")
    
    # Create field name to ID mapping
    field_map = {field['name']: field['field_id'] for field in fields}
    
    # Get all departments
    dept_response = supabase.table("departments").select("*").execute()
    departments = dept_response.data
    print(f"✅ Found {len(departments)} departments")
    
    # Get current mappings
    mapping_response = supabase.table("department_field_mappings").select("*").execute()
    current_mappings = mapping_response.data
    print(f"✅ Found {len(current_mappings)} existing mappings")
    
    # Show current mappings
    print("\n📋 Current Department Field Mappings:")
    for mapping in current_mappings:
        dept_name = next((d['name'] for d in departments if d['department_id'] == mapping['department_id']), 'Unknown')
        field_name = next((f['name'] for f in fields if f['field_id'] == mapping['field_id']), 'Unknown')
        print(f"  • {dept_name} → {field_name}")
    
    # Define COAS department to field mappings
    coas_mappings = {
        "Department of Biology": "Biology",
        "Department of Chemistry": "Chemistry",
        "Department of Communication": "Communication",
        "Department of Criminology and Justice Studies": "Criminal Justice",
        "Department of English and Philosophy": "English & Philosophy",
        "Department of Global Studies and Modern Languages": "Global Studies",
        "Department of History": "History",
        "Department of Mathematics": "Mathematics",
        "Department of Physics": "Physics",
        "Department of Politics": "Political Science",
        "Department of Psychological and Brain Sciences": "Psychology",
        "Department of Sociology": "Sociology",
        "Department of Biodiversity, Earth and Environmental Science": "Environmental Science",
        "Center for Public Policy": "Public Policy",
        "Center for Science, Technology and Society": "Public Policy",  # Closest match
        "WELL Center": "Psychology"  # Closest match
    }
    
    # Find COAS departments that need mappings
    coas_departments = [d for d in departments if d['college_id'] == 6]  # COAS college_id is 6
    print(f"\n🏛️ Found {len(coas_departments)} COAS departments")
    
    # Check which COAS departments already have mappings
    mapped_dept_ids = {m['department_id'] for m in current_mappings}
    unmapped_coas = [d for d in coas_departments if d['department_id'] not in mapped_dept_ids]
    
    print(f"📊 COAS departments without mappings: {len(unmapped_coas)}")
    
    if unmapped_coas:
        print("\n📝 Adding missing COAS department field mappings...")
        
        new_mappings = []
        for dept in unmapped_coas:
            dept_name = dept['name']
            field_name = coas_mappings.get(dept_name)
            
            if field_name and field_name in field_map:
                field_id = field_map[field_name]
                new_mappings.append({
                    "department_id": dept['department_id'],
                    "field_id": field_id
                })
                print(f"  ✅ {dept_name} → {field_name}")
            else:
                print(f"  ⚠️ No mapping found for {dept_name}")
        
        if new_mappings:
            # Insert new mappings
            insert_response = supabase.table("department_field_mappings").insert(new_mappings).execute()
            if insert_response.data:
                print(f"\n🎉 Successfully added {len(insert_response.data)} new department field mappings!")
            else:
                print("\n❌ Failed to add mappings")
        else:
            print("\nℹ️ No new mappings to add")
    else:
        print("\n✅ All COAS departments already have field mappings!")
    
    # Final verification
    print("\n🔍 Final verification of all mappings...")
    final_mapping_response = supabase.table("department_field_mappings").select("*").execute()
    final_mappings = final_mapping_response.data
    
    print(f"📊 Total department field mappings: {len(final_mappings)}")
    
    # Show all COAS mappings
    coas_mappings_final = [m for m in final_mappings if m['department_id'] in [d['department_id'] for d in coas_departments]]
    print(f"📊 COAS department mappings: {len(coas_mappings_final)}")
    
    print("\n📋 All COAS Department Field Mappings:")
    for mapping in coas_mappings_final:
        dept_name = next((d['name'] for d in departments if d['department_id'] == mapping['department_id']), 'Unknown')
        field_name = next((f['name'] for f in fields if f['field_id'] == mapping['field_id']), 'Unknown')
        print(f"  • {dept_name} → {field_name}")

if __name__ == "__main__":
    check_and_add_field_mappings() 