import styled from "styled-components";

export const ErrorContainer = styled.div`
  background: ${({ theme }) => theme.error}20;
  border: 1px solid ${({ theme }) => theme.error}40;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin: 1rem auto;
  max-width: 500px;
  color: ${({ theme }) => theme.error};
`;

export const ErrorText = styled.p`
  margin: 0;
  font-weight: 500;
  text-align: center;
`; 