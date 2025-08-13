import React, { useState } from 'react';
import './ProfilePhoto.css';

// Function to generate initials from name
const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

// Profile Photo Component with error handling
const ProfilePhoto = ({ professor, className = "professor-avatar" }) => {
  const [imageError, setImageError] = useState(false);
  
  // If no headshot or image failed to load, show initials
  if (!professor.headshot || imageError) {
    const initialsClass = className === "profile-avatar" ? "profile-avatar-initials" : "professor-avatar-initials";
    return (
      <div className={initialsClass}>
        {getInitials(professor.name)}
      </div>
    );
  }
  
  // Try to load the image, fallback to initials on error
  return (
    <img 
      src={professor.headshot} 
      alt={professor.name}
      className={className}
      onError={() => setImageError(true)}
    />
  );
};

export default ProfilePhoto; 