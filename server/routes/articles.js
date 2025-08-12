const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Get all articles
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_articles')
      .select(`
        *,
        professors (
          name,
          position,
          email,
          departments (
            name,
            colleges (
              name,
              universities (
                name
              )
            )
          )
        )
      `)
      .order('publication_year', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Deduplicate articles based on title to get accurate counts
    const uniqueArticles = data.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    );

    res.json(uniqueArticles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get articles by professor ID
router.get('/professor/:professorId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_articles')
      .select(`
        *,
        professors (
          name,
          position,
          email,
          departments (
            name,
            colleges (
              name,
              universities (
                name
              )
            )
          )
        )
      `)
      .eq('professor_id', req.params.professorId)
      .order('publication_year', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Filter out articles without proper professor associations (same as main endpoint)
    const validArticles = data.filter(article => article.professors && article.professors.name);

    // Deduplicate articles based on title to get accurate counts
    const uniqueArticles = validArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    );

    res.json(uniqueArticles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get articles by department ID
router.get('/department/:departmentId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_articles')
      .select(`
        *,
        professors (
          name,
          position,
          email,
          departments (
            name,
            colleges (
              name,
              universities (
                name
              )
            )
          )
        )
      `)
      .eq('professors.department_id', req.params.departmentId)
      .order('publication_year', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get article by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_articles')
      .select(`
        *,
        professors (
          name,
          position,
          email,
          departments (
            name,
            colleges (
              name,
              universities (
                name
              )
            )
          )
        )
      `)
      .eq('article_id', req.params.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Search articles by title
router.get('/search/:query', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_articles')
      .select(`
        *,
        professors (
          name,
          position,
          email,
          departments (
            name,
            colleges (
              name,
              universities (
                name
              )
            )
          )
        )
      `)
      .ilike('title', `%${req.params.query}%`)
      .order('publication_year', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search articles' });
  }
});

// Get articles by year range
router.get('/year/:startYear/:endYear', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_articles')
      .select(`
        *,
        professors (
          name,
          position,
          email,
          departments (
            name,
            colleges (
              name,
              universities (
                name
              )
            )
          )
        )
      `)
      .gte('publication_year', req.params.startYear)
      .lte('publication_year', req.params.endYear)
      .order('publication_year', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch articles by year range' });
  }
});

module.exports = router; 