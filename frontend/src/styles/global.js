import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #0b0e14; /* Fundo extremamente escuro da imagem */
    color: #f3f4f6;
    -webkit-font-smoothing: antialiased;
  }

  button {
    font-family: inherit;
  }

  input, select {
    font-family: inherit;
  }

  /* Customização de Scrollbar para o tema dark */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0b0e14;
  }
  ::-webkit-scrollbar-thumb {
    background: #1f2937;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #374151;
  }
`;