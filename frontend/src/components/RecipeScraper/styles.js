import styled from "styled-components";

export const ScraperForm = styled.form`
  width: 100%;
`;

export const ScraperContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin: 1rem auto;
  background-color: ${({ theme }) => theme.bgLight};
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  gap: 8px;

  &:focus-within {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.primary};
  }
`;

export const ScraperInput = styled.input`
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

export const ScrapeButton = styled.button`
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.primary}dd;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`; 