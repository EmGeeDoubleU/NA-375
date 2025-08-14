const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Import routes
const universitiesRoutes = require('./routes/universities');
const departmentsRoutes = require('./routes/departments');
const professorsRoutes = require('./routes/professors');
const articlesRoutes = require('./routes/articles');
const fieldsRoutes = require('./routes/fields');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString() 
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// API routes
app.use('/api/universities', universitiesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/professors', professorsRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/fields', fieldsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`API endpoints:`);
  console.log(`  - Universities: http://localhost:${PORT}/api/universities`);
  console.log(`  - Departments: http://localhost:${PORT}/api/departments`);
  console.log(`  - Professors: http://localhost:${PORT}/api/professors`);
  console.log(`  - Articles: http://localhost:${PORT}/api/articles`);
  console.log(`  - Fields: http://localhost:${PORT}/api/fields`);
}); 