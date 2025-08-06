import React from 'react';
import ReactDOM from 'react-dom/client';
import MainPage from './CardGrid'; // Or wherever you define it
import './App.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MainPage />
  </React.StrictMode>
);