from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://ldryyqggdllmvdkcyrst.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkcnl5cWdnZGxsbXZka2N5cnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgxMTkyOSwiZXhwIjoyMDY5Mzg3OTI5fQ.1kcnOnUeYS2mN7YD0ikNdJ0ym0fWsFgtPp-axG39ji4"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def setup_drexel_structure():
    """Set up the basic database structure for Drexel"""
    print("🔧 Setting up Drexel database structure...")
    
    try:
        # 1. Add Drexel University (if not exists)
        print("  • Adding Drexel University...")
        univ_result = supabase.table("universities").insert({"name": "Drexel University"}).execute()
        university_id = univ_result.data[0]['university_id']
        print(f"    ✅ University ID: {university_id}")
        
        # 2. Add College of Computing & Informatics
        print("  • Adding College of Computing & Informatics...")
        college_result = supabase.table("colleges").insert({
            "name": "College of Computing & Informatics",
            "university_id": university_id
        }).execute()
        college_id = college_result.data[0]['college_id']
        print(f"    ✅ College ID: {college_id}")
        
        # 3. Add CS and IS departments
        print("  • Adding departments...")
        departments = [
            "Computer Science",
            "Information Science"
        ]
        
        for dept_name in departments:
            dept_result = supabase.table("departments").insert({
                "name": dept_name,
                "college_id": college_id
            }).execute()
            print(f"    ✅ Added: {dept_name}")
        
        print("✅ Drexel database structure set up successfully!")
        
    except Exception as e:
        print(f"❌ Error setting up structure: {e}")
        # Check if it already exists
        try:
            unis = supabase.table("universities").select("*").eq("name", "Drexel University").execute()
            if unis.data:
                print("✅ Drexel University already exists")
                return unis.data[0]['university_id']
        except:
            pass
        raise

def verify_structure():
    """Verify the Drexel structure was set up correctly"""
    print("🔍 Verifying Drexel structure...")
    
    try:
        # Check universities
        unis = supabase.table("universities").select("*").execute()
        print(f"✅ Universities: {len(unis.data)}")
        for uni in unis.data:
            print(f"  - {uni['name']}")
        
        # Check colleges
        cols = supabase.table("colleges").select("*").execute()
        print(f"✅ Colleges: {len(cols.data)}")
        for col in cols.data:
            print(f"  - {col['name']}")
        
        # Check departments
        deps = supabase.table("departments").select("*").execute()
        print(f"✅ Departments: {len(deps.data)}")
        for dep in deps.data:
            print(f"  - {dep['name']}")
        
        print("✅ Drexel structure verified!")
        
    except Exception as e:
        print(f"❌ Error verifying structure: {e}")
        raise

def main():
    print("🚀 Setting up Drexel database structure...")
    
    # Set up the basic structure
    setup_drexel_structure()
    
    # Verify the structure
    verify_structure()
    
    print("🎉 Drexel database structure setup completed!")

if __name__ == "__main__":
    main() 