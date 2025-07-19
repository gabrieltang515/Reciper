import styled from "styled-components";

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 2rem auto;
  background-color: ${({ theme }) => theme.bgLight};
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: 0 4px 6px ${({ theme }) => theme.shadowLight};
  transition: all 0.3s ease;
  gap: 8px;

  &:focus-within {
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.primary}20;
  }
`;

export const StyledSearchIcon = styled.div`
  width: 20px;
  height: 20px;
  margin-right: 8px;
  color: ${({ theme }) => theme.text_secondary};
  flex-shrink: 0;
  
  &::before {
    content: "🔍";
    font-size: 18px;
  }
`;

export const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 10px 0;
  background: transparent;
  color: ${({ theme }) => theme.text_primary};
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.text_secondary};
    font-weight: 400;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const SearchButton = styled.button`
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.primary}dd;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;