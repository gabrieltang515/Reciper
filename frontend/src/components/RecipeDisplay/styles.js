import styled from "styled-components";

export const RecipeCard = styled.div`
  background: ${({ theme }) => theme.bgLight};
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 8px 32px ${({ theme }) => theme.shadowLight};
  position: relative;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: ${({ theme }) => theme.bg};
  border: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text_primary};
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.primary};
    color: white;
    transform: scale(1.1);
  }
`;

export const RecipeHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

export const RecipeTitle = styled.h1`
  color: ${({ theme }) => theme.text_primary};
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
`;

export const RecipeImage = styled.img`
  width: 100%;
  max-width: 400px;
  height: 250px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

export const RecipeMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: ${({ theme }) => theme.bg};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
`;

export const MetaItem = styled.span`
  color: ${({ theme }) => theme.text_secondary};
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.bgLight};
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.border};
`;

export const RecipeNote = styled.div`
  background: ${({ theme }) => theme.primary}10;
  border: 1px solid ${({ theme }) => theme.primary}30;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.text_primary};
  font-size: 0.9rem;
  line-height: 1.5;
`;

export const RecipeSection = styled.div`
  margin-bottom: 2rem;
`;

export const RecipeSectionTitle = styled.h2`
  color: ${({ theme }) => theme.text_primary};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${({ theme }) => theme.primary};
`;

export const IngredientsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;

  li {
    color: ${({ theme }) => theme.text_primary};
    padding: 0.75rem 1rem;
    background: ${({ theme }) => theme.bg};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    font-size: 0.95rem;
    line-height: 1.4;
    position: relative;
    padding-left: 2rem;

    &::before {
      content: "🥕";
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
    }
  }
`;

export const InstructionsList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  counter-reset: step-counter;

  li {
    color: ${({ theme }) => theme.text_primary};
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
    background: ${({ theme }) => theme.bg};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    font-size: 1rem;
    line-height: 1.6;
    position: relative;
    padding-left: 3rem;
    counter-increment: step-counter;

    &::before {
      content: counter(step-counter);
      position: absolute;
      left: 1rem;
      top: 1rem;
      background: ${({ theme }) => theme.primary};
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
    }

    strong {
      color: ${({ theme }) => theme.primary};
      font-weight: 600;
    }
  }
`; 