const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// ROTA 1: Buscar todos os bankrolls (Para exibir na tela principal)
app.get('/api/bankrolls', (req, res) => {
    // Essa query depois será melhorada para calcular o ROI e Progressão com base nas apostas
    const sql = `SELECT * FROM bankrolls ORDER BY id DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ROTA 2: Criar um novo bankroll (Para o botão de Adicionar)
app.post('/api/bankrolls', (req, res) => {
    // Agora recebemos também o array 'casas_apostas' do React
    const { nome, capital_inicial, moeda, casas_apostas } = req.body;
    
    const sqlBankroll = `INSERT INTO bankrolls (nome, capital_inicial, moeda) VALUES (?, ?, ?)`;
    const paramsBankroll = [nome, capital_inicial || 0, moeda || 'BRL'];
    
    // Insere o Bankroll primeiro
    db.run(sqlBankroll, paramsBankroll, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        
        const bankrollId = this.lastID; // Pega o ID que acabou de ser gerado

        // Se o usuário dividiu o saldo e enviou as casas de apostas, vamos salvar uma por uma
        if (casas_apostas && casas_apostas.length > 0) {
            const stmt = db.prepare(`INSERT INTO casas_apostas (bankroll_id, nome_casa, saldo_atual) VALUES (?, ?, ?)`);
            
            casas_apostas.forEach(casa => {
                const saldo = Number(casa.capital) || 0;
                if (casa.nome && saldo > 0) {
                    stmt.run(bankrollId, casa.nome, saldo);
                }
            });
            stmt.finalize();
        }

        res.json({
            id: bankrollId,
            nome,
            capital_inicial,
            moeda,
            mensagem: "Bankroll e casas criados com sucesso!"
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando de verdade na porta ${PORT}`);
});