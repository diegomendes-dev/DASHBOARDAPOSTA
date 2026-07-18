import { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const [bankrolls, setBankrolls] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estados do formulário base
    const [nomeForm, setNomeForm] = useState('');
    const [capitalForm, setCapitalForm] = useState('');

    // Novos estados para a divisão das casas
    const [isDividido, setIsDividido] = useState(false);
    const [casasForm, setCasasForm] = useState([{ nome: '', capital: '' }]);

    useEffect(() => {
        carregarBankrolls();
    }, []);

    // EFEITO MÁGICO: Se ativar a divisão, toda vez que digitar um valor nas casas, 
    // ele soma tudo sozinho e trava o Capital Inicial
    useEffect(() => {
        if (isDividido) {
            const somaTotal = casasForm.reduce((acumulador, casa) => {
                return acumulador + (Number(casa.capital) || 0);
            }, 0);
            setCapitalForm(somaTotal); // Atualiza o input principal bloqueado
        }
    }, [casasForm, isDividido]);

    const carregarBankrolls = async () => {
        try {
            const resposta = await fetch('http://localhost:3000/api/bankrolls');
            const dados = await resposta.json();
            setBankrolls(dados);
        } catch (erro) {
            console.error("Erro ao buscar:", erro);
        }
    };

    // Funções para gerenciar a lista dinâmica de casas de apostas
    const adicionarLinhaCasa = () => {
        setCasasForm([...casasForm, { nome: '', capital: '' }]);
    };

    const removerLinhaCasa = (index) => {
        const novaLista = casasForm.filter((_, i) => i !== index);
        setCasasForm(novaLista);
    };

    const atualizarLinhaCasa = (index, campo, valor) => {
        const novaLista = [...casasForm];
        novaLista[index][campo] = valor;
        setCasasForm(novaLista);
    };

    const fecharModalELimpar = () => {
        setIsModalOpen(false);
        setNomeForm('');
        setCapitalForm('');
        setIsDividido(false);
        setCasasForm([{ nome: '', capital: '' }]);
    };

    const salvarBankroll = async (e) => {
        e.preventDefault();
        try {
            await fetch('http://localhost:3000/api/bankrolls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: nomeForm,
                    capital_inicial: Number(capitalForm),
                    moeda: 'BRL',
                    // Se o botão de dividir estiver marcado, manda a lista. Se não, manda vazio.
                    casas_apostas: isDividido ? casasForm : []
                })
            });
            fecharModalELimpar();
            carregarBankrolls();
        } catch (erro) {
            console.error("Erro ao salvar:", erro);
        }
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <h2>Branks</h2>
            </aside>

            <main className="main-content">
                <header className="header">
                    <h1>Bankrolls</h1>
                    <div>
                        <button className="btn-primary" style={{ marginRight: '10px', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc' }}>
                            Organizar
                        </button>
                        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                            + Adicionar bankroll
                        </button>
                    </div>
                </header>

                <div className="bankroll-grid">
                    {bankrolls.map((br) => (
                        <div
                            key={br.id}
                            className="bankroll-card"
                            onClick={() => navigate(`/bankroll/${br.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-header">
                                <h3>{br.nome}</h3>
                                <span style={{ cursor: 'pointer', color: '#9ca3af' }}>⚙️</span>
                            </div>
                            <div className="card-metrics">
                                <div className="metric-box">
                                    <span className="metric-label">ROI</span>
                                    <span className="metric-value">0.00%</span>
                                </div>
                                <div className="metric-box">
                                    <span className="metric-label">PROGRESSÃO</span>
                                    <span className="metric-value">0.00%</span>
                                </div>
                            </div>
                            <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>
                                Capital: R$ {br.capital_inicial.toFixed(2)}
                            </div>
                        </div>
                    ))}

                    <div className="add-card" onClick={() => setIsModalOpen(true)}>
                        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                        </svg>
                        <span>Adicionar bankroll</span>
                    </div>
                </div>
            </main>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Adicionar bankroll</h2>
                            <button className="close-btn" onClick={fecharModalELimpar}>×</button>
                        </div>

                        <form onSubmit={salvarBankroll}>
                            <div className="form-group">
                                <label>Nome da bankroll</label>
                                <input
                                    type="text" className="form-input" required
                                    value={nomeForm}
                                    onChange={(e) => setNomeForm(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Capital inicial</label>
                                <input
                                    type="number" step="0.01" required
                                    className="form-input"
                                    value={capitalForm}
                                    // Se isDividido for true, trava o campo (readOnly/disabled).
                                    disabled={isDividido}
                                    onChange={(e) => setCapitalForm(e.target.value)}
                                    placeholder={isDividido ? "Calculado automaticamente..." : "Ex: 1000"}
                                />
                            </div>

                            {/* TOGGLE PARA DIVIDIR CAPITAL */}
                            <div className="toggle-container">
                                <span>Dividir o capital em várias casas de apostas</span>
                                <input
                                    type="checkbox"
                                    checked={isDividido}
                                    onChange={(e) => setIsDividido(e.target.checked)}
                                />
                            </div>

                            {/* LISTA DINÂMICA DE CASAS SÓ APARECE SE O TOGGLE TIVER LIGADO */}
                            {isDividido && (
                                <div className="casas-dinamicas">
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                                        <label style={{ flex: 1, fontSize: '12px', color: '#4b5563' }}>Casa de apostas</label>
                                        <label style={{ flex: 1, fontSize: '12px', color: '#4b5563' }}>Capital</label>
                                        <div style={{ width: '40px' }}></div> {/* Espaço pro botão de fechar */}
                                    </div>

                                    {casasForm.map((casa, index) => (
                                        <div key={index} className="casa-row">
                                            <select
                                                className="form-input" style={{ flex: 1 }} required
                                                value={casa.nome}
                                                onChange={(e) => atualizarLinhaCasa(index, 'nome', e.target.value)}
                                            >
                                                <option value="">Selecionar...</option>
                                                <option value="10Bet">10Bet</option>
                                                <option value="Bet365">Bet365</option>
                                                <option value="Betano">Betano</option>
                                                <option value="BetMGM">BetMGM</option>
                                                <option value="SportingBet">SportingBet</option>
                                            </select>

                                            <input
                                                type="number" className="form-input" style={{ flex: 1 }}
                                                placeholder="0" required
                                                value={casa.capital}
                                                onChange={(e) => atualizarLinhaCasa(index, 'capital', e.target.value)}
                                            />

                                            {/* O botão de remover só aparece se tiver mais de 1 casa */}
                                            {casasForm.length > 1 && (
                                                <button type="button" className="btn-remove" onClick={() => removerLinhaCasa(index)}>
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <button type="button" className="btn-add-casa" onClick={adicionarLinhaCasa}>
                                        Adicionar casa de apostas
                                    </button>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={fecharModalELimpar}>Cancelar</button>
                                <button type="submit" className="btn-primary">Adicionar bankroll</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default App;