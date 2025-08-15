const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Get all professors with pre-calculated publication metrics (lightning fast!)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get total count for pagination info
    const { count: totalCount, error: countError } = await supabase
      .from('professors')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return res.status(500).json({ error: countError.message });
    }

    // Get professors with pre-calculated metrics
    let query = supabase
      .from('professors')
      .select(`
        professor_id,
        name,
        position,
        email,
        phone,
        headshot,
        google_scholar_link,
        total_publications,
        published_this_year,
        published_last_year,
        avg_papers_per_year,
        departments (
          name,
          colleges (
            name,
            universities (
              name
            )
          )
        )
      `)
      .order('name');
    
    // Apply pagination only if limit is specified and not too large
    if (limit && limit < 1000) {
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data: professors, error: profError } = await query;
    
    if (profError) {
      return res.status(500).json({ error: profError.message });
    }
    
    console.log(`✅ Fetched ${professors.length} professors with pre-calculated metrics`);
    
    // Transform the response to match the expected format
    const professorsWithMetrics = professors.map(professor => ({
      id: professor.professor_id,
      name: professor.name,
      position: professor.position,
      email: professor.email,
      phone: professor.phone,
      headshot: professor.headshot,
      google_scholar_link: professor.google_scholar_link,
      department_name: professor.departments?.name || 'Unknown',
      college_name: professor.departments?.colleges?.name || 'Unknown',
      university_name: professor.departments?.colleges?.universities?.name || 'Unknown',
      published_this_year: professor.published_this_year ? 'Yes' : 'No',
      published_last_year: professor.published_last_year ? 'Yes' : 'No',
      total_papers: professor.total_publications,
      avg_papers_per_year: professor.avg_papers_per_year
    }));
    
    // Return response with metadata
    res.json({
      professors: professorsWithMetrics,
      pagination: {
        page: parseInt(page),
        limit: limit || totalCount,
        total: totalCount,
        totalPages: limit ? Math.ceil(totalCount / limit) : 1,
        hasMore: limit ? page * limit < totalCount : false
      }
    });
  } catch (error) {
    console.error('Error fetching professors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get professors by department ID
router.get('/department/:departmentId', async (req, res) => {
  try {
    const { data: professors, error: profError } = await supabase
      .from('professors')
      .select(`
        professor_id,
        name,
        position,
        email,
        phone,
        headshot,
        google_scholar_link,
        departments (
          name,
          colleges (
            name,
            universities (
              name
            )
          )
        )
      `)
      .eq('department_id', req.params.departmentId)
      .order('name');

    if (profError) {
      return res.status(500).json({ error: profError.message });
    }

    // Get publication counts for these professors
    const professorIds = professors.map(p => p.professor_id);
    const { data: articles, error: artError } = await supabase
      .from('research_articles')
      .select('professor_id, publication_year, title')
      .in('professor_id', professorIds)
      .order('publication_year', { ascending: false });

    if (artError) {
      return res.status(500).json({ error: artError.message });
    }

    // Calculate metrics
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const professorsWithMetrics = professors.map(professor => {
      const professorArticles = articles.filter(article => article.professor_id === professor.professor_id);
      
      // Deduplicate articles based on title to get accurate counts
      const uniqueArticles = professorArticles.filter((article, index, self) => 
        index === self.findIndex(a => a.title === article.title)
      );
      
      const totalPapers = uniqueArticles.length;
      
      const articlesThisYear = uniqueArticles.filter(article => 
        article.publication_year && article.publication_year.toString() === currentYear.toString()
      );
      const articlesLastYear = uniqueArticles.filter(article => 
        article.publication_year && article.publication_year.toString() === lastYear.toString()
      );
      
      const publishedThisYear = articlesThisYear.length > 0 ? 'Yes' : 'No';
      const publishedLastYear = articlesLastYear.length > 0 ? 'Yes' : 'No';
      
      let avgPapersPerYear = 0;
      if (totalPapers > 0) {
        const years = [...new Set(uniqueArticles
          .map(article => article.publication_year)
          .filter(year => year && year !== 'No year' && year !== 'N/A')
        )];
        
        if (years.length > 0) {
          avgPapersPerYear = Math.round((totalPapers / years.length) * 10) / 10;
        } else {
          avgPapersPerYear = Math.round((totalPapers / 5) * 10) / 10;
        }
      }

      return {
        id: professor.professor_id,
        name: professor.name,
        position: professor.position,
        email: professor.email,
        phone: professor.phone,
        headshot: professor.headshot,
        google_scholar_link: professor.google_scholar_link,
        department_name: professor.departments?.name || 'Unknown',
        college_name: professor.departments?.colleges?.name || 'Unknown',
        university_name: professor.departments?.colleges?.universities?.name || 'Unknown',
        published_this_year: publishedThisYear,
        published_last_year: publishedLastYear,
        total_papers: totalPapers,
        avg_papers_per_year: avgPapersPerYear
      };
    });

    res.json(professorsWithMetrics);
  } catch (error) {
    console.error('Error fetching professors by department:', error);
    res.status(500).json({ error: 'Failed to fetch professors' });
  }
});

// Get professor by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: professor, error: profError } = await supabase
      .from('professors')
      .select(`
        professor_id,
        name,
        position,
        email,
        phone,
        headshot,
        google_scholar_link,
        departments (
          name,
          colleges (
            name,
            universities (
              name
            )
          )
        )
      `)
      .eq('professor_id', req.params.id)
      .single();

    if (profError) {
      return res.status(500).json({ error: profError.message });
    }

    if (!professor) {
      return res.status(404).json({ error: 'Professor not found' });
    }

    // Get publication data for this professor
    const { data: articles, error: artError } = await supabase
      .from('research_articles')
      .select('professor_id, publication_year, title')
      .eq('professor_id', req.params.id)
      .order('publication_year', { ascending: false });

    if (artError) {
      return res.status(500).json({ error: artError.message });
    }

    // Calculate metrics
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    // Deduplicate articles based on title to get accurate counts
    const uniqueArticles = articles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    );
    
    const totalPapers = uniqueArticles.length;
    
    const articlesThisYear = uniqueArticles.filter(article => 
      article.publication_year && article.publication_year.toString() === currentYear.toString()
    );
    const articlesLastYear = uniqueArticles.filter(article => 
      article.publication_year && article.publication_year.toString() === lastYear.toString()
    );
    
    const publishedThisYear = articlesThisYear.length > 0 ? 'Yes' : 'No';
    const publishedLastYear = articlesLastYear.length > 0 ? 'Yes' : 'No';
    
    let avgPapersPerYear = 0;
    if (totalPapers > 0) {
      const years = [...new Set(uniqueArticles
        .map(article => article.publication_year)
        .filter(year => year && year !== 'No year' && year !== 'N/A')
      )];
      
      if (years.length > 0) {
        avgPapersPerYear = Math.round((totalPapers / years.length) * 10) / 10;
      } else {
        avgPapersPerYear = Math.round((totalPapers / 5) * 10) / 10;
      }
    }

    const professorWithMetrics = {
      id: professor.professor_id,
      name: professor.name,
      position: professor.position,
      email: professor.email,
      phone: professor.phone,
      headshot: professor.headshot,
      google_scholar_link: professor.google_scholar_link,
      department_name: professor.departments?.name || 'Unknown',
      college_name: professor.departments?.colleges?.name || 'Unknown',
      university_name: professor.departments?.colleges?.universities?.name || 'Unknown',
      published_this_year: publishedThisYear,
      published_last_year: publishedLastYear,
      total_papers: totalPapers,
      avg_papers_per_year: avgPapersPerYear
    };

    res.json(professorWithMetrics);
  } catch (error) {
    console.error('Error fetching professor:', error);
    res.status(500).json({ error: 'Failed to fetch professor' });
  }
});

// Search professors by name
router.get('/search/:query', async (req, res) => {
  try {
    const { data: professors, error: profError } = await supabase
      .from('professors')
      .select(`
        professor_id,
        name,
        position,
        email,
        phone,
        headshot,
        google_scholar_link,
        departments (
          name,
          colleges (
            name,
            universities (
              name
            )
          )
        )
      `)
      .ilike('name', `%${req.params.query}%`)
      .order('name');

    if (profError) {
      return res.status(500).json({ error: profError.message });
    }

    // Get publication counts for these professors
    const professorIds = professors.map(p => p.professor_id);
    const { data: articles, error: artError } = await supabase
      .from('research_articles')
      .select('professor_id, publication_year, title')
      .in('professor_id', professorIds)
      .order('publication_year', { ascending: false });

    if (artError) {
      return res.status(500).json({ error: artError.message });
    }

    // Calculate metrics
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const professorsWithMetrics = professors.map(professor => {
      const professorArticles = articles.filter(article => article.professor_id === professor.professor_id);
      
      // Deduplicate articles based on title to get accurate counts
      const uniqueArticles = professorArticles.filter((article, index, self) => 
        index === self.findIndex(a => a.title === article.title)
      );
      
      const totalPapers = uniqueArticles.length;
      
      const articlesThisYear = uniqueArticles.filter(article => 
        article.publication_year && article.publication_year.toString() === currentYear.toString()
      );
      const articlesLastYear = uniqueArticles.filter(article => 
        article.publication_year && article.publication_year.toString() === lastYear.toString()
      );
      
      const publishedThisYear = articlesThisYear.length > 0 ? 'Yes' : 'No';
      const publishedLastYear = articlesLastYear.length > 0 ? 'Yes' : 'No';
      
      let avgPapersPerYear = 0;
      if (totalPapers > 0) {
        const years = [...new Set(uniqueArticles
          .map(article => article.publication_year)
          .filter(year => year && year !== 'No year' && year !== 'N/A')
        )];
        
        if (years.length > 0) {
          avgPapersPerYear = Math.round((totalPapers / years.length) * 10) / 10;
        } else {
          avgPapersPerYear = Math.round((totalPapers / 5) * 10) / 10;
        }
      }

      return {
        id: professor.professor_id,
        name: professor.name,
        position: professor.position,
        email: professor.email,
        phone: professor.phone,
        headshot: professor.headshot,
        google_scholar_link: professor.google_scholar_link,
        department_name: professor.departments?.name || 'Unknown',
        college_name: professor.departments?.colleges?.name || 'Unknown',
        university_name: professor.departments?.colleges?.universities?.name || 'Unknown',
        published_this_year: publishedThisYear,
        published_last_year: publishedLastYear,
        total_papers: totalPapers,
        avg_papers_per_year: avgPapersPerYear
      };
    });

    res.json(professorsWithMetrics);
  } catch (error) {
    console.error('Error searching professors:', error);
    res.status(500).json({ error: 'Failed to search professors' });
  }
});

module.exports = router; 