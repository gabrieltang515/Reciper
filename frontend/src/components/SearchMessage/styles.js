import styled from "styled-components";

export const MessageContainer = styled.div`
  background: ${({ theme, isFallback }) => 
    isFallback ? `${theme.warning}20` : `${theme.success}20`};
  border: 1px solid ${({ theme, isFallback }) => 
    isFallback ? `${theme.warning}40` : `${theme.success}40`};
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin: 1rem auto;
  max-width: 600px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme, isFallback }) => 
    isFallback ? theme.warning : theme.success};
`;

export const MessageText = styled.p`
  margin: 0;
  font-weight: 500;
  text-align: center;
  flex: 1;
  color: ${({ theme }) => theme.text_primary};
`;

export const FallbackIcon = styled.span`
  font-size: 1.2rem;
  flex-shrink: 0;
`; 