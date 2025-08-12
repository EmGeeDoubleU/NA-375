import React from 'react';

const cards = [
  { id: 1, title: 'Jane Doe', did_research: 'Yes.',  subject: "Computer Science", contact:"Contact"},
  { id: 2, title: 'Professor 2', did_research: 'No', subject: "Electrical Engineering", contact:"Contact"},
  { id: 3, title: 'Professor 3', did_research: 'No', subject: "Biology", contact:"Contact"},
  { id: 4, title: 'Professor 4 ', did_research: 'Yes',  subject: "Computer Science", contact:"Contact"},
  { id: 5, title: 'Professor 5', did_research: 'No', subject: "Data Science", contact:"Contact"},
  { id: 6, title: 'Professor 6', did_research: 'Yes', subject: "Physics", contact:"Contact"},
];

const CardGrid = () => {
  return (
    <div className="card-container">
      <h1 className="container-header">Card Layout</h1>
      <div className="card-entry-container">
        {cards.map((card) => (
          <div key={card.id} className="card-entry">
            <h2 className="professor-name">{card.title}</h2>
            <p className="did-research-value">Published within the last year? {card.did_research}</p>
            <p className="subject-value">{card.subject}</p>
            <button className="contact-button">{card.contact}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardGrid;