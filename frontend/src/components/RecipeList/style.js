import styled from "styled-components";

export const RecipeListContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

export const RecipeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

export const RecipeCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.card_light || 'rgba(255, 255, 255, 0.1)'};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 768px) {
    margin: 0 0.5rem;
  }
`;

export const RecipeImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
`;

export const RecipeInfo = styled.div`
  padding: 1.5rem;
`;

export const RecipeTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text_primary};
  margin: 0 0 1rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const RecipeMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
`;

export const RecipeSource = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text_secondary};
  font-weight: 500;
`;

export const RecipeRating = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.primary};
  font-weight: 500;
`;

export const RecipeTime = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text_secondary};
  font-weight: 500;
`;

export const NoResults = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${({ theme }) => theme.text_secondary};
  font-size: 1.1rem;
  font-weight: 500;
`;

export const LoadMoreContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding: 1rem;
`;

export const LoadMoreButton = styled.button`
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px ${({ theme }) => theme.shadow};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.primary}dd;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px ${({ theme }) => theme.shadow};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;
