import styled from "styled-components";

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin: 2rem auto;
  background-color: ${({ theme }) => theme.bgLight};
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: 0 4px 6px ${({ theme }) => theme.shadowLight};
  transition: all 0.3s ease;

  &:focus-within {
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.primary}20;
  }
`;

export const StyledSearchIcon = styled.div`
  width: 20px;
  height: 20px;
  margin-right: 12px;
  color: ${({ theme }) => theme.text_secondary};
  
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
`;