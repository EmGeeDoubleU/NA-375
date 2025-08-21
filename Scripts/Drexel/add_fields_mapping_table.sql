-- Add Fields of Interest mapping table
-- This allows departments to be grouped into broader academic disciplines

-- Create the fields of interest table
CREATE TABLE IF NOT EXISTS public.fields_of_interest (
  field_id SERIAL PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the department-field mapping table
CREATE TABLE IF NOT EXISTS public.department_field_mappings (
  mapping_id SERIAL PRIMARY KEY,
  department_id integer REFERENCES public.departments(department_id) ON DELETE CASCADE,
  field_id integer REFERENCES public.fields_of_interest(field_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, field_id)
);

-- Insert the fields of interest
INSERT INTO public.fields_of_interest (name, description) VALUES
  ('Computer Science', 'Computer Science and Information Technology'),
  ('Biology', 'Biological Sciences'),
  ('Chemistry', 'Chemical Sciences'),
  ('Physics', 'Physical Sciences'),
  ('Mathematics', 'Mathematical Sciences'),
  ('Psychology', 'Psychological and Brain Sciences'),
  ('Political Science', 'Political Science and Government'),
  ('Sociology', 'Sociological Studies'),
  ('Communication', 'Communication Studies'),
  ('Criminal Justice', 'Criminology and Justice Studies'),
  ('English & Philosophy', 'English Literature and Philosophy'),
  ('Global Studies', 'Global Studies and Modern Languages'),
  ('History', 'Historical Studies'),
  ('Public Policy', 'Public Policy and Social Sciences'),
  ('Environmental Science', 'Environmental and Earth Sciences')
ON CONFLICT (name) DO NOTHING;

-- Map departments to fields of interest
-- First, get the field IDs
DO $$
DECLARE
  cs_field_id INTEGER;
  bio_field_id INTEGER;
  chem_field_id INTEGER;
  phys_field_id INTEGER;
  math_field_id INTEGER;
  psych_field_id INTEGER;
  pol_field_id INTEGER;
  soc_field_id INTEGER;
  comm_field_id INTEGER;
  crim_field_id INTEGER;
  eng_field_id INTEGER;
  global_field_id INTEGER;
  hist_field_id INTEGER;
  policy_field_id INTEGER;
  env_field_id INTEGER;
BEGIN
  -- Get field IDs
  SELECT field_id INTO cs_field_id FROM public.fields_of_interest WHERE name = 'Computer Science';
  SELECT field_id INTO bio_field_id FROM public.fields_of_interest WHERE name = 'Biology';
  SELECT field_id INTO chem_field_id FROM public.fields_of_interest WHERE name = 'Chemistry';
  SELECT field_id INTO phys_field_id FROM public.fields_of_interest WHERE name = 'Physics';
  SELECT field_id INTO math_field_id FROM public.fields_of_interest WHERE name = 'Mathematics';
  SELECT field_id INTO psych_field_id FROM public.fields_of_interest WHERE name = 'Psychology';
  SELECT field_id INTO pol_field_id FROM public.fields_of_interest WHERE name = 'Political Science';
  SELECT field_id INTO soc_field_id FROM public.fields_of_interest WHERE name = 'Sociology';
  SELECT field_id INTO comm_field_id FROM public.fields_of_interest WHERE name = 'Communication';
  SELECT field_id INTO crim_field_id FROM public.fields_of_interest WHERE name = 'Criminal Justice';
  SELECT field_id INTO eng_field_id FROM public.fields_of_interest WHERE name = 'English & Philosophy';
  SELECT field_id INTO global_field_id FROM public.fields_of_interest WHERE name = 'Global Studies';
  SELECT field_id INTO hist_field_id FROM public.fields_of_interest WHERE name = 'History';
  SELECT field_id INTO policy_field_id FROM public.fields_of_interest WHERE name = 'Public Policy';
  SELECT field_id INTO env_field_id FROM public.fields_of_interest WHERE name = 'Environmental Science';

  -- Insert department mappings
  INSERT INTO public.department_field_mappings (department_id, field_id) VALUES
    -- College of Computing & Informatics
    ((SELECT department_id FROM public.departments WHERE name = 'Computer Science'), cs_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Information Science'), cs_field_id),
    
    -- College of Arts and Sciences - Sciences
    ((SELECT department_id FROM public.departments WHERE name = 'Department of Biology'), bio_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Department of Chemistry'), chem_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Department of Physics'), phys_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Department of Mathematics'), math_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Department of Psychological and Brain Sciences'), psych_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Department of Biodiversity, Earth and Environmental Science'), env_field_id),
    
    -- College of Arts and Sciences - Social Sciences
    ((SELECT department_id FROM public.departments WHERE name = 'Department of Politics'), pol_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Department of Sociology'), soc_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Department of Communication'), comm_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Department of Criminology and Justice Studies'), crim_field_id),
    
    -- College of Arts and Sciences - Humanities
    ((SELECT department_id FROM public.departments WHERE name = 'Department of English and Philosophy'), eng_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Department of Global Studies and Modern Languages'), global_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Department of History'), hist_field_id),
    
    -- Centers
    ((SELECT department_id FROM public.departments WHERE name = 'Center for Public Policy'), policy_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'Center for Science, Technology and Society'), policy_field_id),
    ((SELECT department_id FROM public.departments WHERE name = 'WELL Center'), psych_field_id)
  ON CONFLICT (department_id, field_id) DO NOTHING;

  RAISE NOTICE 'Department-field mappings created successfully';
END $$;

-- Verify the mappings
SELECT 
  d.name as department_name,
  f.name as field_of_interest
FROM public.departments d
JOIN public.department_field_mappings dfm ON d.department_id = dfm.department_id
JOIN public.fields_of_interest f ON dfm.field_id = f.field_id
ORDER BY f.name, d.name; 