const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Get all professors
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('professors')
      .select(`
        *,
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

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch professors' });
  }
});

// Get professors by department ID
router.get('/department/:departmentId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('professors')
      .select(`
        *,
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

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch professors' });
  }
});

// Get professor by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('professors')
      .select(`
        *,
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

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Professor not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch professor' });
  }
});

// Search professors by name
router.get('/search/:query', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('professors')
      .select(`
        *,
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

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search professors' });
  }
});

module.exports = router; 