import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BankrollView from './pages/BankrollView';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota da tela inicial (Grid de Bankrolls) */}
        <Route path="/" element={<Home />} />
        
        {/* Rota dinâmica para entrar em um bankroll específico */}
        <Route path="/bankroll/:id" element={<BankrollView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;