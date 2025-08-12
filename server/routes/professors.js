const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Get all professors with publication metrics
router.get('/', async (req, res) => {
  try {
    // Single optimized query to get all professors with article counts
    const { data: professorsWithArticles, error: profError } = await supabase
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
        ),
        research_articles (
          publication_year
        )
      `)
      .order('name');

    if (profError) {
      return res.status(500).json({ error: profError.message });
    }

    // Calculate metrics efficiently in memory
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const professorsWithMetrics = professorsWithArticles.map(professor => {
      const articles = professor.research_articles || [];
      const totalPapers = articles.length;
      
      // Filter articles by year
      const articlesThisYear = articles.filter(article => 
        article.publication_year && article.publication_year.toString() === currentYear.toString()
      );
      const articlesLastYear = articles.filter(article => 
        article.publication_year && article.publication_year.toString() === lastYear.toString()
      );
      
      const publishedThisYear = articlesThisYear.length > 0 ? 'Yes' : 'No';
      const publishedLastYear = articlesLastYear.length > 0 ? 'Yes' : 'No';
      
      // Calculate average papers per year
      let avgPapersPerYear = 0;
      if (totalPapers > 0) {
        // Get all unique years for this professor
        const years = [...new Set(articles
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