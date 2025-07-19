import styled from "styled-components";
import SearchIcon from '@mui/icons-material/Search';

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin: 2rem auto;
  background-color: ${({ theme }) => theme.bgLight};
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:focus-within {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.primary};
  }
`;

export const StyledSearchIcon = styled(SearchIcon)`
  color: ${({ theme }) => theme.text_secondary};
  margin-right: 8px;
  font-size: 20px;
`;

export const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 10px;
  background: transparent;
  color: ${({ theme }) => theme.text_primary};

  &::placeholder {
    color: ${({ theme }) => theme.text_secondary};
  }
`;