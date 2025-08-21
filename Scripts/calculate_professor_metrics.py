import csv
from supabase import create_client, Client
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://ldryyqggdllmvdkcyrst.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkcnl5cWdnZGxsbXZka2N5cnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgxMTkyOSwiZXhwIjoyMDY5Mzg3OTI5fQ.1kcnOnUeYS2mN7YD0ikNdJ0ym0fWsFgtPp-axG39ji4"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def calculate_professor_metrics():
    """Calculate and update metrics for all professors"""
    print("🚀 Starting professor metrics calculation...")
    
    # Get all professors
    prof_response = supabase.table("professors").select("professor_id,name").execute()
    professors = prof_response.data
    print(f"✅ Found {len(professors)} professors")
    
    # Get all articles with pagination to handle 1000 row limit
    all_articles = []
    has_more = True
    from_idx = 0
    page_size = 1000
    
    print("📚 Loading all articles...")
    while has_more:
        articles_response = supabase.table("research_articles").select(
            "professor_id,publication_year,title"
        ).range(from_idx, from_idx + page_size - 1).execute()
        
        if articles_response.data:
            all_articles.extend(articles_response.data)
            from_idx += page_size
            print(f"  📄 Loaded {len(articles_response.data)} articles (total: {len(all_articles)})")
            
            if len(articles_response.data) < page_size:
                has_more = False
        else:
            has_more = False
    
    print(f"✅ Loaded {len(all_articles)} total articles")
    
    # Calculate metrics for each professor
    current_year = datetime.now().year
    last_year = current_year - 1
    
    updates = []
    processed = 0
    
    print("🧮 Calculating metrics for each professor...")
    
    for professor in professors:
        prof_id = professor['professor_id']
        prof_articles = [a for a in all_articles if a['professor_id'] == prof_id]
        
        # Deduplicate by title
        unique_articles = []
        seen_titles = set()
        for article in prof_articles:
            if article['title'] not in seen_titles:
                unique_articles.append(article)
                seen_titles.add(article['title'])
        
        total_publications = len(unique_articles)
        
        # Check this year and last year
        published_this_year = any(
            a['publication_year'] and str(a['publication_year']) == str(current_year)
            for a in unique_articles
        )
        
        published_last_year = any(
            a['publication_year'] and str(a['publication_year']) == str(last_year)
            for a in unique_articles
        )
        
        # Calculate average papers per year
        valid_years = [
            a['publication_year'] for a in unique_articles
            if a['publication_year'] and a['publication_year'] not in ['No year', 'N/A']
        ]
        unique_years = list(set(valid_years))
        
        if unique_years and total_publications > 0:
            avg_papers_per_year = round(total_publications / len(unique_years), 2)
        else:
            avg_papers_per_year = 0
        
        updates.append({
            "professor_id": prof_id,
            "total_publications": total_publications,
            "published_this_year": published_this_year,
            "published_last_year": published_last_year,
            "avg_papers_per_year": avg_papers_per_year,
            "last_metrics_update": datetime.now().isoformat()
        })
        
        processed += 1
        if processed % 50 == 0:
            print(f"  📊 Processed {processed}/{len(professors)} professors")
    
    # Bulk update all professors
    print(f"📤 Updating {len(updates)} professors in database...")
    
    batch_size = 100
    for i in range(0, len(updates), batch_size):
        batch = updates[i:i+batch_size]
        print(f"  📦 Batch {i//batch_size + 1}/{(len(updates) + batch_size - 1)//batch_size}")
        
        for update in batch:
            try:
                supabase.table("professors").update(update).eq(
                    "professor_id", update["professor_id"]
                ).execute()
            except Exception as e:
                print(f"    ❌ Error updating professor {update['professor_id']}: {e}")
    
    print("🎉 Professor metrics calculation completed!")
    
    # Show some sample results
    print("\n📊 Sample Results:")
    sample_professors = updates[:5]
    for prof in sample_professors:
        print(f"  • Professor ID {prof['professor_id']}: {prof['total_publications']} papers, "
              f"avg {prof['avg_papers_per_year']}/year, "
              f"this year: {prof['published_this_year']}, "
              f"last year: {prof['published_last_year']}")

def verify_metrics():
    """Verify that the metrics were calculated correctly"""
    print("\n🔍 Verifying metrics calculation...")
    
    try:
        # Check a few professors
        test_professors = ["Cai, Yuanfang", "Agarwal, Ritesh", "Allen, Mark G."]
        
        for prof_name in test_professors:
            prof_response = supabase.table("professors").select(
                "name,total_publications,published_this_year,published_last_year,avg_papers_per_year"
            ).eq("name", prof_name).execute()
            
            if prof_response.data:
                prof = prof_response.data[0]
                print(f"✅ {prof['name']}: {prof['total_publications']} papers, "
                      f"avg {prof['avg_papers_per_year']}/year, "
                      f"this year: {prof['published_this_year']}, "
                      f"last year: {prof['published_last_year']}")
            else:
                print(f"❌ Professor {prof_name} not found")
        
        # Check overall stats
        stats_response = supabase.table("professors").select("total_publications").execute()
        total_papers = sum(p['total_publications'] for p in stats_response.data)
        avg_papers = sum(p['total_publications'] for p in stats_response.data) / len(stats_response.data)
        
        print(f"\n📈 Overall Stats:")
        print(f"  • Total professors: {len(stats_response.data)}")
        print(f"  • Total papers across all professors: {total_papers}")
        print(f"  • Average papers per professor: {avg_papers:.1f}")
        
    except Exception as e:
        print(f"❌ Error verifying metrics: {e}")

def main():
    print("🚀 Starting Professor Metrics Calculation System")
    print("=" * 50)
    
    # Calculate metrics
    calculate_professor_metrics()
    
    # Verify results
    verify_metrics()
    
    print("\n🎉 All done! The professors API should now be much faster.")

if __name__ == "__main__":
    main() 