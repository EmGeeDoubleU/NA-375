const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Get all universities
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

// Get university by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .eq('university_id', req.params.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'University not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch university' });
  }
});

module.exports = router; 