# API Endpoints Documentation

Base URL: `http://localhost:5001/api`

## Health Check
- **GET** `/health` - Check if server is running

## Universities
- **GET** `/universities` - Get all universities
- **GET** `/universities/:id` - Get university by ID

## Departments
- **GET** `/departments` - Get all departments with college and university info
- **GET** `/departments/:id` - Get department by ID with college and university info
- **GET** `/departments/college/:collegeId` - Get departments by college ID

## Professors
- **GET** `/professors` - Get all professors with department, college, and university info
- **GET** `/professors/:id` - Get professor by ID with department, college, and university info
- **GET** `/professors/department/:departmentId` - Get professors by department ID
- **GET** `/professors/search/:query` - Search professors by name (case-insensitive)

## Articles
- **GET** `/articles` - Get all articles with professor, department, college, and university info
- **GET** `/articles/:id` - Get article by ID with professor, department, college, and university info
- **GET** `/articles/professor/:professorId` - Get articles by professor ID
- **GET** `/articles/department/:departmentId` - Get articles by department ID
- **GET** `/articles/search/:query` - Search articles by title (case-insensitive)
- **GET** `/articles/year/:startYear/:endYear` - Get articles by year range

## Example Usage

### Get all professors
```bash
curl http://localhost:5001/api/professors
```

### Get professors from Computer Science department
```bash
curl http://localhost:5001/api/professors/department/1
```

### Search for professors with "Bass" in their name
```bash
curl http://localhost:5001/api/professors/search/Bass
```

### Get all articles from a specific professor
```bash
curl http://localhost:5001/api/articles/professor/2
```

### Search for articles with "machine learning" in the title
```bash
curl http://localhost:5001/api/articles/search/machine%20learning
```

### Get articles published between 2020 and 2024
```bash
curl http://localhost:5001/api/articles/year/2020/2024
```

## Response Format

All endpoints return JSON data. Error responses include an `error` field with a descriptive message.

### Success Response Example
```json
[
  {
    "professor_id": 2,
    "name": "An, Yuan",
    "position": "Associate Professor and Director of International Programs",
    "email": "yuan.an@drexel.edu",
    "phone": "215.895.2633",
    "headshot": "/~/media/Images/cci/Faculty/an-yuan.ashx?...",
    "google_scholar_link": "https://scholar.google.com/citations?user=6ojklR4AAAAJ&hl=en",
    "department_id": 2,
    "departments": {
      "name": "Information Science",
      "colleges": {
        "name": "College of Computing & Informatics",
        "universities": {
          "name": "Drexel University"
        }
      }
    }
  }
]
```

### Error Response Example
```json
{
  "error": "Professor not found"
}
```

## Data Structure

The API provides hierarchical data with the following relationships:
- Universities → Colleges → Departments → Professors → Articles
- Each level includes information from its parent levels
- All foreign key relationships are resolved and included in the response 