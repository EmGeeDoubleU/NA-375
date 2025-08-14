const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Get all fields of interest
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fields_of_interest')
      .select('*')
      .order('name');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fields of interest' });
  }
});

// Get field of interest by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fields_of_interest')
      .select('*')
      .eq('field_id', req.params.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Field of interest not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch field of interest' });
  }
});

// Get departments for a specific field of interest
router.get('/:id/departments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('department_field_mappings')
      .select(`
        departments (
          department_id,
          name,
          colleges (
            name,
            universities (
              name
            )
          )
        )
      `)
      .eq('field_id', req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Extract department data
    const departments = data.map(item => item.departments).filter(Boolean);

    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments for field of interest' });
  }
});

// Get field of interest for a specific department
router.get('/department/:departmentId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('department_field_mappings')
      .select(`
        fields_of_interest (
          field_id,
          name,
          description
        )
      `)
      .eq('department_id', req.params.departmentId)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'No field of interest found for this department' });
    }

    res.json(data.fields_of_interest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch field of interest for department' });
  }
});

module.exports = router; 