-- Complete schema for Drexel University faculty and research data
-- This SQL can be run in Supabase SQL Editor
-- It handles existing tables and adds missing columns

-- Drop existing tables if they exist (to ensure clean structure)
DROP TABLE IF EXISTS public.research_articles CASCADE;
DROP TABLE IF EXISTS public.professors CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;
DROP TABLE IF EXISTS public.universities CASCADE;

-- Create universities table
CREATE TABLE public.universities (
  university_id SERIAL PRIMARY KEY,
  name text UNIQUE
);

-- Create colleges table (belongs to university)
CREATE TABLE public.colleges (
  college_id SERIAL PRIMARY KEY,
  name text,
  university_id integer REFERENCES public.universities(university_id)
);

-- Create departments table (belongs to college)
CREATE TABLE public.departments (
  department_id SERIAL PRIMARY KEY,
  name text,
  college_id integer REFERENCES public.colleges(college_id)
);

-- Create professors table
CREATE TABLE public.professors (
  professor_id SERIAL PRIMARY KEY,
  name text,
  position text,
  email text,
  phone text,
  headshot text,
  google_scholar_link text,
  department_id integer REFERENCES public.departments(department_id)
);

-- Create research articles table
CREATE TABLE public.research_articles (
  article_id SERIAL PRIMARY KEY,
  title text,
  professor_id integer REFERENCES public.professors(professor_id),
  article_link text,
  publication_year text
);

-- Insert initial data
INSERT INTO public.universities (name) VALUES ('Drexel University');

INSERT INTO public.colleges (name, university_id) 
VALUES ('College of Computing & Informatics', (SELECT university_id FROM public.universities WHERE name = 'Drexel University'));

INSERT INTO public.departments (name, college_id) 
VALUES 
  ('Computer Science', (SELECT college_id FROM public.colleges WHERE name = 'College of Computing & Informatics')),
  ('Information Science', (SELECT college_id FROM public.colleges WHERE name = 'College of Computing & Informatics')); 