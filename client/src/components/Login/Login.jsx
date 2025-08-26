import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const [accounts, setAccounts] = useState([]); // in-memory account storage
  const [currentUser, setCurrentUser] = useState(null); // currently logged-in user

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('loginEmail');
    const password = formData.get('loginPassword');

    const user = accounts.find(
      (acc) => acc.email === email && acc.password === password
    );

    if (user) {
      setCurrentUser(user);
      setShowLogin(false);
    } else {
      alert("Invalid email or password. Please sign up first.");
    }
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const firstName = formData.get('firstName');
    const email = formData.get('signupEmail');
    const password = formData.get('passwordInput');
    const confirm = formData.get('confirmInput');

    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    if (accounts.some((acc) => acc.email === email)) {
      alert("This email is already registered.");
      return;
    }

    const newUser = { firstName, email, password };
    setAccounts([...accounts, newUser]);
    setCurrentUser(newUser);
    setShowSignup(false);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
  };

  return (
    <div className="loginContainer">
      <div className="profilePictureContainer">
        <button id="profilePicture"></button>
        <p id="accountName">
          {currentUser ? currentUser.firstName : ""}
        </p>
      </div>

      <div className="loginButtons">
        {!currentUser && (
          <>
            <button
              id="loginButton"
              className="accountButtons"
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>
            <button
              id="signupButton"
              className="accountButtons"
              onClick={() => setShowSignup(true)}
            >
              Sign Up
            </button>
          </>
        )}
        {currentUser && (
          <button
            id="signoutButton"
            className="accountButtons"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        )}
      </div>

      {/* Login Dialog */}
      {showLogin && (
        <dialog open className="loginDialog">
          <div className="closeDialogContainer">
            <button
              type="button"
              className="closeButton"
              onClick={() => setShowLogin(false)}
            >
              Close
            </button>
          </div>
          <h2 className="accountDialogHeader">Login</h2>
          <form className="loginForm" onSubmit={handleLoginSubmit}>
            <label htmlFor="loginEmail" className="loginLabels">
              Email Address
            </label>
            <input
              name="loginEmail"
              id="loginEmail"
              type="email"
              placeholder="Email"
              className="accountInputField"
              required
            />
            <br />

            <label htmlFor="loginPassword" className="loginLabels">
              Password
            </label>
            <input
              name="loginPassword"
              id="loginPassword"
              type="password"
              placeholder="Password"
              className="accountInputField"
              required
            />
            <br />

            <button type="submit" className="accountInputButton">
              Login
            </button>
          </form>
        </dialog>
      )}

      {/* Signup Dialog */}
      {showSignup && (
        <dialog open className="loginDialog">
          <div className="closeDialogContainer">
            <button
              type="button"
              className="closeButton"
              onClick={() => setShowSignup(false)}
            >
              Close
            </button>
          </div>
          <h2 className="accountDialogHeader">Sign Up</h2>
          <form className="loginForm" onSubmit={handleSignupSubmit}>
            <label htmlFor="firstName" className="loginLabels">
              First Name
            </label>
            <input
              name="firstName"
              id="firstName"
              type="text"
              placeholder="First Name"
              className="accountInputField"
              required
            />
            <br />

            <label htmlFor="signupEmail" className="loginLabels">
              Email Address
            </label>
            <input
              name="signupEmail"
              id="signupEmail"
              type="email"
              placeholder="Email"
              className="accountInputField"
              required
            />
            <br />

            <label htmlFor="passwordInput" className="loginLabels">
              Password
            </label>
            <input
              name="passwordInput"
              id="passwordInput"
              type="password"
              placeholder="Password"
              className="accountInputField"
              required
            />
            <br />

            <label htmlFor="confirmInput" className="loginLabels">
              Confirm Password
            </label>
            <input
              name="confirmInput"
              id="confirmInput"
              type="password"
              placeholder="Confirm Password"
              className="accountInputField"
              required
            />
            <br />

            <button type="submit" className="accountInputButton">
              Sign Up
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default Login;
