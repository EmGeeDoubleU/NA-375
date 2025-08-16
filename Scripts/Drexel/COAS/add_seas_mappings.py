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

def add_seas_field_mappings():
    """Add field mappings for UPenn SEAS departments"""
    print("🔍 Adding field mappings for UPenn SEAS departments...")
    
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
    
    # Find SEAS departments (UPenn School of Engineering and Applied Science)
    seas_departments = [d for d in departments if d['college_id'] == 4]  # SEAS college_id is 4
    print(f"\n🏛️ Found {len(seas_departments)} SEAS departments")
    
    # Show SEAS departments
    print("\n📋 SEAS Departments:")
    for dept in seas_departments:
        print(f"  • {dept['name']} (ID: {dept['department_id']})")
    
    # Define SEAS department to field mappings
    seas_mappings = {
        "Department of Bioengineering": "Bioengineering",
        "Department of Chemical and Biomolecular Engineering": "Chemical Engineering",
        "Department of Computer and Information Science": "Computer Science",
        "Department of Electrical and Systems Engineering": "Electrical Engineering",
        "Department of Materials Science and Engineering": "Materials Science",
        "Department of Mechanical Engineering and Applied Mechanics": "Mechanical Engineering"
    }
    
    # Check which SEAS departments already have mappings
    mapped_dept_ids = {m['department_id'] for m in current_mappings}
    unmapped_seas = [d for d in seas_departments if d['department_id'] not in mapped_dept_ids]
    
    print(f"\n📊 SEAS departments without mappings: {len(unmapped_seas)}")
    
    if unmapped_seas:
        print("\n📝 Adding missing SEAS department field mappings...")
        
        new_mappings = []
        for dept in unmapped_seas:
            dept_name = dept['name']
            field_name = seas_mappings.get(dept_name)
            
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
                print(f"\n🎉 Successfully added {len(insert_response.data)} new SEAS department field mappings!")
            else:
                print("\n❌ Failed to add mappings")
        else:
            print("\nℹ️ No new mappings to add")
    else:
        print("\n✅ All SEAS departments already have field mappings!")
    
    # Final verification
    print("\n🔍 Final verification of all mappings...")
    final_mapping_response = supabase.table("department_field_mappings").select("*").execute()
    final_mappings = final_mapping_response.data
    
    print(f"📊 Total department field mappings: {len(final_mappings)}")
    
    # Show all SEAS mappings
    seas_mappings_final = [m for m in final_mappings if m['department_id'] in [d['department_id'] for d in seas_departments]]
    print(f"📊 SEAS department mappings: {len(seas_mappings_final)}")
    
    print("\n📋 All SEAS Department Field Mappings:")
    for mapping in seas_mappings_final:
        dept_name = next((d['name'] for d in departments if d['department_id'] == mapping['department_id']), 'Unknown')
        field_name = next((f['name'] for f in fields if f['field_id'] == mapping['field_id']), 'Unknown')
        print(f"  • {dept_name} → {field_name}")
    
    # Show all mappings by university
    print("\n🏫 All Department Field Mappings by University:")
    
    # Get colleges
    college_response = supabase.table("colleges").select("*").execute()
    colleges = college_response.data
    
    # Group departments by college
    for college in colleges:
        college_depts = [d for d in departments if d['college_id'] == college['college_id']]
        college_mappings = [m for m in final_mappings if m['department_id'] in [d['department_id'] for d in college_depts]]
        
        if college_mappings:
            print(f"\n📚 {college['name']}:")
            for mapping in college_mappings:
                dept_name = next((d['name'] for d in departments if d['department_id'] == mapping['department_id']), 'Unknown')
                field_name = next((f['name'] for f in fields if f['field_id'] == mapping['field_id']), 'Unknown')
                print(f"  • {dept_name} → {field_name}")

if __name__ == "__main__":
    add_seas_field_mappings() 