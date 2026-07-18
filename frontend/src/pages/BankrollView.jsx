import { useParams, Link } from 'react-router-dom';
import '../App.css';

export default function BankrollView() {
  // Isso aqui puxa o ID do bankroll da URL (ex: /bankroll/1)
  const { id } = useParams();

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Branks</h2>
        <Link to="/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
          ← Voltar ao Início
        </Link>
      </aside>

      <main className="main-content">
        <header className="header">
          <h1>Detalhes do Bankroll #{id}</h1>
          <button className="btn-primary">+ Adicionar aposta</button>
        </header>

        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <h2 style={{ color: '#6b7280' }}>O Gráfico e as Apostas vão entrar aqui!</h2>
        </div>
      </main>
    </div>
  );
}