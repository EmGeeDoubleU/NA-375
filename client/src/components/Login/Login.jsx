import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    console.log("Login pressed:");
    console.log("Email:", formData.get('loginEmail'));
    console.log("Password:", formData.get('loginPassword'));
    setShowLogin(false)
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    console.log("Sign Up pressed:");
    console.log("Email:", formData.get('signupEmail'));
    console.log("Password:", formData.get('passwordInput'));
    console.log("Confirm Password:", formData.get('confirmInput'));
    setShowSignup(false)
  };

//   const handleLoginSubmit = (e) => {
//     e.preventDefault(); // prevent page reload
//     const formData = new FormData(e.target);
//     const username = formData.get('loginUsername');
//     const password = formData.get('loginPassword');
//     console.log("Login pressed:");
//     console.log("Username:", username);
//     console.log("Password:", password);
//     
//   };

//   // Handle Signup form submit
//   const handleSignupSubmit = (e) => {
//     e.preventDefault(); // prevent page reload
//     const formData = new FormData(e.target);
//     const email = formData.get('signupEmail');
//     const password = formData.get('passwordInput');
//     const confirm = formData.get('confirmInput');
//     console.log("Sign Up pressed:");
//     console.log("Email:", email);
//     console.log("Password:", password);
//     console.log("Confirm Password:", confirm);
//   };

  return (
    <div className="loginContainer">
      <div className="profilePictureContainer">
        <button id="profilePicture"></button>
        <p id="accountName"></p>
      </div>

      <div className="loginButtons">
        <button id="loginButton" className="accountButtons" onClick={() => setShowLogin(true)}>
          Login
        </button>
        <button id="signupButton" className="accountButtons" onClick={() => setShowSignup(true)}>
          Sign Up
        </button>
      </div>

      {showLogin && (
        <dialog open className="loginDialog">
            <div className="closeDialogContainer">
                 <button type="button" className="closeButton" onClick={() => setShowLogin(false)}>Close</button>
            </div>
            <h2 className="accountDialogHeader">Login</h2>
            <form className="loginForm" onSubmit={handleLoginSubmit}>
                <label htmlFor="loginEmail" className="loginLabels">Email Address</label>
                <input name="loginEmail" id="loginEmail" type="email" placeholder="Email" className="accountInputField" /><br />

                <label htmlFor="loginPassword" className="loginLabels">Password</label>
                <input name="loginPassword" id="loginPassword" type="password" placeholder="Password" className="accountInputField" /><br />

                <button type="submit" className="accountInputButton">Login</button>
            </form>
        </dialog>
      )}

      {showSignup && (
        <dialog open className="loginDialog">
            <div className="closeDialogContainer">
                 <button type="button" className="closeButton" onClick={() => setShowSignup(false)}>Close</button>
            </div>
            <h2 className="accountDialogHeader" onSubmit={handleSignupSubmit}>Sign Up</h2>
            <form className="loginForm" onSubmit={handleSignupSubmit}>
                <label htmlFor="signupEmail" className="loginLabels">Email Address</label>
                <input name="signupEmail" id="signupEmail" type="email" placeholder="Email" className="accountInputField" /><br />

                <label htmlFor="passwordInput" className="loginLabels">Password</label>
                <input name="passwordInput" id="passwordInput" type="password" placeholder="Password" className="accountInputField" /><br />

                <label htmlFor="confirmInput" className="loginLabels">Confirm Password</label>
                <input name="confirmInput" id="confirmInput" type="password" placeholder="Confirm Password" className="accountInputField" /><br />

                <button type="submit" className="accountInputButton">Sign Up</button>
            </form>
        </dialog>
      )}
    </div>
  );
};

export default Login;