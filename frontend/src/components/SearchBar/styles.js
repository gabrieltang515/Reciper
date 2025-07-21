import styled from "styled-components";

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
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

export const SuggestionsDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.bgLight};
  border: 2px solid ${({ theme }) => theme.border};
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 8px 25px ${({ theme }) => theme.shadow};
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
`;

export const SuggestionCategory = styled.div`
  padding: 12px 16px 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.text_secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: ${({ theme }) => theme.bg};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

export const SuggestionItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: ${({ theme }) => theme.text_primary};
  background-color: ${({ isSelected, theme }) => 
    isSelected ? theme.primary + '20' : 'transparent'
  };
  border-bottom: 1px solid ${({ theme }) => theme.border}15;

  &:hover {
    background-color: ${({ theme }) => theme.primary}20;
    color: ${({ theme }) => theme.primary};
  }

  &:last-child {
    border-bottom: none;
  }
`;