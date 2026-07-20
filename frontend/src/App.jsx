import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BankrollView from './pages/BankrollView';
import { GlobalStyle } from './styles/global';

function App() {
  return (
    <BrowserRouter>
      <GlobalStyle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bankroll/:id" element={<BankrollView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;