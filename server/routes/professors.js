const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Get all professors with publication metrics
router.get('/', async (req, res) => {
  try {
    // First get professors with hierarchy
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
      .order('name');

    if (profError) {
      return res.status(500).json({ error: profError.message });
    }

    // Get publication counts for each professor
    const { data: articles, error: artError } = await supabase
      .from('research_articles')
      .select('professor_id, publication_year')
      .order('publication_year', { ascending: false });

    if (artError) {
      return res.status(500).json({ error: artError.message });
    }

    // Calculate metrics for each professor
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const professorsWithMetrics = professors.map(professor => {
      const professorArticles = articles.filter(article => article.professor_id === professor.professor_id);
      const totalPapers = professorArticles.length;
      
      const publishedThisYear = professorArticles.some(article => 
        article.publication_year === currentYear.toString()
      ) ? 'Yes' : 'No';
      
      const publishedLastYear = professorArticles.some(article => 
        article.publication_year === lastYear.toString()
      ) ? 'Yes' : 'No';
      
      // Calculate average papers per year (simple calculation)
      const avgPapersPerYear = totalPapers > 0 ? Math.round(totalPapers / 5) : 0; // Assuming 5 years average

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
    res.status(500).json({ error: 'Failed to fetch professors' });
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
      .select('professor_id, publication_year')
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
      const totalPapers = professorArticles.length;
      
      const publishedThisYear = professorArticles.some(article => 
        article.publication_year === currentYear.toString()
      ) ? 'Yes' : 'No';
      
      const publishedLastYear = professorArticles.some(article => 
        article.publication_year === lastYear.toString()
      ) ? 'Yes' : 'No';
      
      const avgPapersPerYear = totalPapers > 0 ? Math.round(totalPapers / 5) : 0;

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
      .select('professor_id, publication_year')
      .eq('professor_id', req.params.id)
      .order('publication_year', { ascending: false });

    if (artError) {
      return res.status(500).json({ error: artError.message });
    }

    // Calculate metrics
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const totalPapers = articles.length;
    
    const publishedThisYear = articles.some(article => 
      article.publication_year === currentYear.toString()
    ) ? 'Yes' : 'No';
    
    const publishedLastYear = articles.some(article => 
      article.publication_year === lastYear.toString()
    ) ? 'Yes' : 'No';
    
    const avgPapersPerYear = totalPapers > 0 ? Math.round(totalPapers / 5) : 0;

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
      .select('professor_id, publication_year')
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
      const totalPapers = professorArticles.length;
      
      const publishedThisYear = professorArticles.some(article => 
        article.publication_year === currentYear.toString()
      ) ? 'Yes' : 'No';
      
      const publishedLastYear = professorArticles.some(article => 
        article.publication_year === lastYear.toString()
      ) ? 'Yes' : 'No';
      
      const avgPapersPerYear = totalPapers > 0 ? Math.round(totalPapers / 5) : 0;

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