import styled from "styled-components";

export const RecipeCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 800px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.card_light || 'rgba(255, 255, 255, 0.1)'};
`;

export const RecipeHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

export const RecipeTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text_primary};
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

export const RecipeImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

export const RecipeMeta = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

export const MetaItem = styled.span`
  background: ${({ theme }) => theme.bgLight};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: ${({ theme }) => theme.text_secondary};
  font-weight: 500;
  font-size: 0.9rem;
`;

export const RecipeSection = styled.div`
  margin-bottom: 2rem;
`;

export const RecipeSectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: ${({ theme }) => theme.text_primary};
  font-size: 1.5rem;
  font-weight: 600;
  border-bottom: 2px solid ${({ theme }) => theme.bgLight};
  padding-bottom: 0.5rem;
`;

export const IngredientsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    background: ${({ theme }) => theme.bgLight};
    border-radius: 8px;
    border-left: 4px solid ${({ theme }) => theme.primary};
    color: ${({ theme }) => theme.text_primary};
    font-weight: 500;
  }
`;

export const InstructionsList = styled.ol`
  padding-left: 1.5rem;
  margin: 0;
  
  li {
    padding: 0.75rem 0;
    color: ${({ theme }) => theme.text_primary};
    line-height: 1.6;
    font-weight: 500;
  }
`; 