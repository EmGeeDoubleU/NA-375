# CS375 Project: Professor Research Platform

**Team Name:** N/A  
**Team Members:** Michael Warshowsky, Gabe Lebaudy  
**Professor:** Boris Valerstein

## Project Overview

Our project is a web application that allows students and early-career researchers to efficiently find professors and researchers who are actively publishing in their fields of interest. The platform provides filtering tools to narrow down results by university, department, and academic discipline. It displays clear, concise information about a professor's recent publishing activity and provides users with publication history and contact details.

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/EmGeeDoubleU/NA-375.git
   cd NA-375
   ```

2. **Install all dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install && cd ..
   
   # Install client dependencies
   cd client && npm install && cd ..
   ```

3. **Start the development servers**
   ```bash
   # Start both client and server simultaneously
   npm run dev
   ```

   Or start them separately:
   ```bash
   # Start server only (runs on port 5001)
   npm run server
   
   # Start client only (runs on port 3000)
   npm run client
   ```

4. **Access the application**
   - **React Client**: http://localhost:3000
   - **Express Server**: http://localhost:5001
   - **API Health Check**: http://localhost:5001/api/health

## Core Features

### Search and Filtering
Users can refine searches using the following filters:
- **University** - Filter by specific institutions
- **University Department** - Narrow down by academic departments
- **Field of Study** - Focus on specific academic disciplines

### Results Display
Search results are displayed in a card-based grid layout. Each card includes:
- University affiliation (visually distinguished with color-coded labels)
- Professor's name, position, and department
- Summary of publishing activity (this year, last year, total publications, average per year)
- Action buttons to view full publication history or initiate contact

### Professor Profiles
Detailed profile pages include:
- Chronological list of publications with dates
- Recent publishing activity indicators
- Contact information

### Visual Indicators
Color-coded signals (green/yellow/red) indicate the professor's level of recent publishing activity to help users quickly evaluate options.

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React (HTML, CSS, JavaScript) |
| Backend | Node.js with Express.js |
| Database | Supabase (PostgreSQL) |
| Hosting | Fly.io or personal server |
| Version Control | Github |
| Data Collection | Python scripts for scraping |

## Data Collection

Data will be collected through custom Python scripts that scrape publicly available university webpages and Google Scholar.

## UI Overview

The current planned user interface consists of a clean, modern design focused on simplicity and ease of use:
- Users can select universities and fields of interest via clearly labeled toggle buttons
- Professors are displayed in structured, consistent cards for easy comparison
- University affiliations are visually highlighted for clarity
- Color-coded activity indicators provide fast insights without reading detailed metrics
- Contact and publication information is accessible with dedicated action buttons

## Project Structure

```
NA-375/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   └── App.css        # Styling
│   └── package.json
├── server/                 # Express backend
│   ├── server.js          # Main server file
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## Available Scripts

### Root Directory
- `npm run dev` - Start both client and server in development mode
- `npm run server` - Start only the Express server
- `npm run client` - Start only the React client
- `npm run build` - Build the React app for production
- `npm run install-all` - Install dependencies for all packages

### Server Directory
- `npm run dev` - Start server with nodemon (auto-restart on changes)
- `npm start` - Start server in production mode

### Client Directory
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run tests

## API Endpoints

### Server Health
- `GET /api/health` - Check server status
- `GET /` - Welcome message

## Development

The application is set up for easy development:

1. **Hot Reloading**: Both client and server support hot reloading
2. **Concurrent Development**: Run both servers with a single command
3. **Clean Starting Point**: Empty React app and minimal Express server
4. **Ready to Build**: All dependencies and scripts configured

## Next Steps

1. **Database Setup**: Configure Supabase connection and schema
2. **Data Collection**: Implement Python scraping scripts
3. **API Development**: Build professor search and filtering endpoints
4. **UI Components**: Create professor cards and search interface
5. **Authentication**: Add user authentication if needed
6. **Deployment**: Set up hosting on Fly.io or personal server

## Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Common Issues

1. **Port already in use**: 
   - Kill existing processes: `lsof -ti:3000 | xargs kill -9`
   - Or use different ports by setting environment variables

2. **Module not found errors**:
   - Make sure all dependencies are installed: `npm run install-all`

3. **React app not loading**:
   - Check if the client is running on http://localhost:3000
   - Check browser console for errors

4. **Server not responding**:
   - Check if the server is running on http://localhost:5001
   - Test the health endpoint: `curl http://localhost:5001/api/health`

## License

MIT 