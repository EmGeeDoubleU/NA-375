import React from 'react';
import ReactDOM from 'react-dom/client';
import CardGrid from './CardGrid'; // Make sure the filename is CardGrid.jsx
import './App.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CardGrid />
  </React.StrictMode>
);