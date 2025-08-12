import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FacultyDirectory from './FacultyDirectory';
import PublicationsPage from './PublicationsPage';
import './App.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<FacultyDirectory />} />
        <Route path="/professor/:professorId" element={<PublicationsPage />} />
      </Routes>
    </Router>
  </React.StrictMode>
);