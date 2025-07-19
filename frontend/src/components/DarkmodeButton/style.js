import styled from "styled-components";

export const DarkModeButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.card};
  color: ${({ theme }) => theme.text_primary};
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px ${({ theme }) => theme.shadow};
  transition: all 0.3s ease;
  z-index: 1000;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px ${({ theme }) => theme.shadow};
  }

  &:active {
    transform: scale(0.95);
  }
`;
