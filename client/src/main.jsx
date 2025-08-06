import React from 'react';
import ReactDOM from 'react-dom/client';
import MainPage from './CardGrid'; // Or wherever you define it
import PublicationsLayout from './publications';
import './App.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <MainPage />
//   </React.StrictMode>
// );
root.render(
  <React.StrictMode>
    <PublicationsLayout />
  </React.StrictMode>
);