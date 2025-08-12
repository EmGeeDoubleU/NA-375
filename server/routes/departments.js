const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Get all departments
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        colleges (
          name,
          universities (
            name
          )
        )
      `)
      .order('name');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get departments by college ID
router.get('/college/:collegeId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('college_id', req.params.collegeId)
      .order('name');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        colleges (
          name,
          universities (
            name
          )
        )
      `)
      .eq('department_id', req.params.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

module.exports = router; 