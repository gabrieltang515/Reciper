import React from 'react';
import { useTheme } from 'styled-components';
import { ErrorContainer, ErrorText } from './styles';

const ErrorMessage = ({ message }) => {
  const theme = useTheme();

  if (!message) return null;

  return (
    <ErrorContainer theme={theme}>
      <ErrorText>❌ {message}</ErrorText>
    </ErrorContainer>
  );
};

export default ErrorMessage; 