// UserProvider.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import menuConfig from './MenuConfig'; // Import the menu configuration

const UserContext = createContext();

export const UserProvider = ({ children }) => {

  useEffect(() => {
    const storedRole = localStorage.getItem('userType');
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  const [userRole, setUserRole] = useState('user'); // Default role, can be updated after login
  const [user, setUser] = useState(null); // Add a user state if needed

  const value = {
    userRole,
    setUserRole,
    setUser, // To set the user data after login
    menus: menuConfig[userRole], // Get menu items based on the role
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  return useContext(UserContext);
};
