// Available fields for filtering - now fetched dynamically from database
export const availableFields = []; // This will be populated from the database

// Cached department to field mapping
export const departmentToFieldMap = new Map();

// University colors for banners
export const universityColors = {
  'Drexel University': '#1e3a8a',
  'University of Pennsylvania': '#dc2626',
  'Temple University': '#f59e0b',
  'Thomas Jefferson University': '#7c3aed',
  'Other': '#6b7280'
};

// Function to fetch available fields and department mappings from the database
export const fetchAvailableFields = async () => {
  try {
    // Fetch fields of interest
    const fieldsResponse = await fetch('http://localhost:5001/api/fields');
    const fields = await fieldsResponse.json();
    
    // Extract field names and sort them
    const fieldNames = fields.map(field => field.name).sort();
    
    // Update the availableFields array
    availableFields.length = 0; // Clear the array
    availableFields.push(...fieldNames);
    
    // Fetch departments and their field mappings
    const deptResponse = await fetch('http://localhost:5001/api/departments');
    const departments = await deptResponse.json();
    
    // Clear the mapping
    departmentToFieldMap.clear();
    
    // For each department, get its field of interest
    for (const dept of departments) {
      try {
        const fieldResponse = await fetch(`http://localhost:5001/api/fields/department/${dept.department_id}`);
        const fieldData = await fieldResponse.json();
        departmentToFieldMap.set(dept.name, fieldData.name);
      } catch (error) {
        // If no mapping found, use department name as fallback
        departmentToFieldMap.set(dept.name, dept.name);
      }
    }
    
    return fieldNames;
  } catch (error) {
    console.error('Error fetching available fields:', error);
    // Fallback to basic fields if API fails
    const fallbackFields = [
      "Computer Science", "Biology", "Chemistry", "Physics", 
      "Mathematics", "Psychology", "Political Science", "Sociology",
      "Communication", "Criminal Justice", "English & Philosophy", 
      "Global Studies", "History", "Public Policy", "Environmental Science"
    ];
    availableFields.length = 0;
    availableFields.push(...fallbackFields);
    return fallbackFields;
  }
};

// Function to get field of interest from department name (synchronous, uses cached mapping)
export const getFieldFromDepartment = (departmentName) => {
  return departmentToFieldMap.get(departmentName) || departmentName;
};

// Function to generate initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

// Determine if a professor is a top researcher
export const isTopResearcher = (professor) => {
  return professor.total_papers >= 300 && 
         (professor.published_this_year === 'Yes' || professor.published_last_year === 'Yes') &&
         professor.avg_papers_per_year >= 6;
};

// Get metric color based on value and type
export const getMetricColor = (value, type) => {
  if (type === 'published') {
    return value === 'Yes' ? '#10b981' : '#ef4444';
  }
  if (type === 'total') {
    const num = parseInt(value);
    if (num >= 40) return '#10b981';
    if (num >= 25) return '#f59e0b';
    return '#ef4444';
  }
  if (type === 'average') {
    const num = parseInt(value);
    if (num >= 8) return '#10b981';
    if (num >= 5) return '#f59e0b';
    return '#ef4444';
  }
  return '#6b7280';
};

// Sort professors with top researchers first, then by the selected criteria
export const sortProfessors = (professors, selectedUniversities, selectedFields, sortBy, sortOrder) => {
  const filtered = professors.filter(professor => {
    const universityMatch = selectedUniversities.length === 0 || 
                           selectedUniversities.includes(professor.university_name);
    const professorField = getFieldFromDepartment(professor.department_name);
    const fieldMatch = selectedFields.length === 0 || 
                      selectedFields.includes(professorField);
    return universityMatch && fieldMatch;
  });

  // Separate top researchers from others
  const topResearchers = filtered.filter(isTopResearcher);
  const otherProfessors = filtered.filter(prof => !isTopResearcher(prof));

  // Sort each group by the selected criteria
  const sortProfessorsByCriteria = (profList) => {
    return profList.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'published_this_year':
          aValue = a.published_this_year === 'Yes' ? 1 : 0;
          bValue = b.published_this_year === 'Yes' ? 1 : 0;
          break;
        case 'published_last_year':
          aValue = a.published_last_year === 'Yes' ? 1 : 0;
          bValue = b.published_last_year === 'Yes' ? 1 : 0;
          break;
        case 'total_papers':
          aValue = a.total_papers;
          bValue = b.total_papers;
          break;
        case 'avg_papers_per_year':
          aValue = a.avg_papers_per_year;
          bValue = b.avg_papers_per_year;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Sort both groups and combine with top researchers first
  const sortedTopResearchers = sortProfessorsByCriteria(topResearchers);
  const sortedOtherProfessors = sortProfessorsByCriteria(otherProfessors);
  
  return [...sortedTopResearchers, ...sortedOtherProfessors];
};

// Filter professors based on selected universities and fields
export const filterProfessors = (professors, selectedUniversities, selectedFields) => {
  return professors.filter(professor => {
    const universityMatch = selectedUniversities.length === 0 || 
      selectedUniversities.includes(professor.university_name);
    const professorField = getFieldFromDepartment(professor.department_name);
    const fieldMatch = selectedFields.length === 0 || 
      selectedFields.includes(professorField);
    return universityMatch && fieldMatch;
  });
}; 