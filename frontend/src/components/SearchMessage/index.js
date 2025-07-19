import React from 'react';
import { useTheme } from 'styled-components';
import { MessageContainer, MessageText, FallbackIcon } from './styles';

const SearchMessage = ({ message, isFallback }) => {
  const theme = useTheme();

  return (
    <MessageContainer theme={theme} isFallback={isFallback}>
      {isFallback && <FallbackIcon>💡</FallbackIcon>}
      <MessageText theme={theme}>{message}</MessageText>
    </MessageContainer>
  );
};

export default SearchMessage; 