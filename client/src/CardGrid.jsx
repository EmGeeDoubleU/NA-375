import React from 'react';

const cards = [
  { id: 1, title: 'Jane Doe', did_research: 'Yes.',  subject: "Computer Science"},
  { id: 2, title: 'Professor 2', did_research: 'No', subject: "Electrical Engineering"},
  { id: 3, title: 'Professor 3', did_research: 'No', subject: "Biology"},
  { id: 4, title: 'Professor 4 ', did_research: 'Yes',  subject: "Computer Science"},
  { id: 5, title: 'Professor 5', did_research: 'No', subject: "Data Science"},
  { id: 6, title: 'Professor 6', did_research: 'Yes', subject: "Physics"},
];

const schoolButtons = [
  {id: 1, school: "Drexel Univerisity"},
  {id: 2, school: "University of Pennsylvania"},
  {id: 3, school: "Temple University"},
  {id: 4, school: "Jefferson University"},
  {id: 5, school: "Other"}
]

const subjectButtons = [
  {id: 1, subject: "Computer Science"},
  {id: 2, subject: "Biology"},
  {id: 3, subject: "Chemistry"},
  {id: 4, subject: "Physics"},
  {id: 5, subject: "Mathematics"},
  {id: 6, subject: "Medicine"},
  {id: 7, subject: "Psychology"},
  {id: 8, subject: "Economics"},
  {id: 9, subject: "Political Science"}
]

const navigationLayout = () => {
  return (
    <div className="main-container">
      <h1 className="container-header">Narrow Your Search</h1>
      <div className="school-selection-buttons-container">
        {schoolButtons.map((school) => (
          <button className="param-button">{school.school}</button>
        ))}
      </div>
      <div className="subject-selection-buttons-container">
        {subjectButtons.map((subject) => (
          <button className="param-button">{subject.subject}</button>
        ))}
      </div>
    </div>
  )
}

const CardGrid = () => {
  return (
    <div className="card-container">
      <h1 className="container-header">Professors</h1>
      <div className="card-entry-container">
        {cards.map((card) => (
          <div key={card.id} className="card-entry">
            <h2 className="professor-name">{card.title}</h2>
            <p className="did-research-value">Published within the last year? {card.did_research}</p>
            <p className="subject-value">{card.subject}</p>
            <div className="card-buttons">
              <button className="contact-button">Contact</button>
              <button className="contact-button">All Publications</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MainPage = () => {
  return (
    <div>
      {navigationLayout()}
      <CardGrid />
    </div>
  );
};

export default MainPage;