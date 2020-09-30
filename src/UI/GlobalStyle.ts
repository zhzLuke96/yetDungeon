import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 16px;
    color: #E1E1E6;
    background-color: black;
  }

  #root {
    width: 100vw;
    height: 100vh;
  }

  canvas { 
    width: 100%;
    height: 100%;
    cursor: none;
  }
`;
