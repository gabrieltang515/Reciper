import styled from "styled-components";

export const TitleContainer = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding: 0 1rem;
`;

export const MainTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: ${({ theme }) => theme.text_primary};
  margin-bottom: 0.5rem;
  letter-spacing: -1px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

export const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text_secondary};
  margin-top: 0;
  font-weight: 400;
`;