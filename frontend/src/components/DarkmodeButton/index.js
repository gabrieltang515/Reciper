import React from 'react';
import { useTheme } from 'styled-components';
import { DarkModeButton as StyledButton } from './style';

const DarkmodeButton = ({ darkMode, setDarkMode }) => {
  const theme = useTheme();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <StyledButton onClick={toggleDarkMode} theme={theme}>
      {darkMode ? '☀️' : '🌙'}
    </StyledButton>
  );
};

export default DarkmodeButton;
