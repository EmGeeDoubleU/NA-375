import React from 'react';

const publications = [
    {id: 1, title: "Web development in society", is_paywall: "Yes", date: "08-06-25"},
    {id: 2, title: "Title 2", is_paywall: "No", date: "03-02-24"},
    {id: 3, title: "Title 3", is_paywall: "Yes", date: "01-24-15"},
    {id: 4, title: "Title 4", is_paywall: "No", date: "12-22-19"}
]

const PublicationsLayout = () => {
    return (
        <div className="main-container">
            <h1 className="container-header">All Publications</h1>
            <div className="card-entry-container">
                {publications.map((publication) => (
                    <div className="card-entry">
                        <h2 className="publication-name">{publication.title}</h2>
                        <p>Behind a paywall? {publication.is_paywall}</p>
                        <p>Date of publication: {publication.date}</p>
                        <button className="contact-button">View Publication</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default PublicationsLayout;