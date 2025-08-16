-- Add College of Arts and Sciences and its departments to the database
-- Run this in Supabase SQL Editor before running Script 4

-- First, add the College of Arts and Sciences
INSERT INTO public.colleges (name, university_id) 
VALUES ('College of Arts and Sciences', (SELECT university_id FROM public.universities WHERE name = 'Drexel University'))
ON CONFLICT DO NOTHING;

-- Get the college_id for College of Arts and Sciences
DO $$
DECLARE
    coas_college_id INTEGER;
BEGIN
    SELECT college_id INTO coas_college_id 
    FROM public.colleges 
    WHERE name = 'College of Arts and Sciences';
    
    -- Add all COAS departments
    INSERT INTO public.departments (name, college_id) VALUES
        ('Department of Biology', coas_college_id),
        ('Department of Chemistry', coas_college_id),
        ('Department of Communication', coas_college_id),
        ('Department of Criminology and Justice Studies', coas_college_id),
        ('Department of English and Philosophy', coas_college_id),
        ('Department of Global Studies and Modern Languages', coas_college_id),
        ('Department of History', coas_college_id),
        ('Department of Mathematics', coas_college_id),
        ('Department of Physics', coas_college_id),
        ('Department of Politics', coas_college_id),
        ('Department of Psychological and Brain Sciences', coas_college_id),
        ('Department of Sociology', coas_college_id),
        ('Department of Biodiversity, Earth and Environmental Science', coas_college_id)
    ON CONFLICT DO NOTHING;
    
    -- Add centers (optional - you can comment these out if you don't want them)
    INSERT INTO public.departments (name, college_id) VALUES
        ('Center for Public Policy', coas_college_id),
        ('Center for Science, Technology and Society', coas_college_id),
        ('WELL Center', coas_college_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Added College of Arts and Sciences (ID: %) and its departments', coas_college_id;
END $$;

-- Verify the additions
SELECT 
    c.name as college_name,
    d.name as department_name,
    d.department_id
FROM public.colleges c
JOIN public.departments d ON c.college_id = d.college_id
WHERE c.name = 'College of Arts and Sciences'
ORDER BY d.name; 