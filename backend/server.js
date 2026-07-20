const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
// Aumentamos o limite para 50mb para suportar CSVs gigantes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ROTA 1: Buscar todos os bankrolls (Para exibir na tela principal)
// ROTA 1: Buscar todos os bankrolls (Agora com a soma automática dos lucros!)
app.get('/api/bankrolls', (req, res) => {
    // Esse SQL junta a tabela de bankrolls com a de apostas e soma o lucro_obtido.
    // O COALESCE garante que, se não tiver apostas, o lucro seja 0 em vez de nulo.
    const sql = `
        SELECT b.*, 
               COALESCE(SUM(a.lucro_obtido), 0) as lucro_total
        FROM bankrolls b
        LEFT JOIN apostas a ON b.id = a.bankroll_id
        GROUP BY b.id
        ORDER BY b.id DESC
    `;
    
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

// ROTA 3: Buscar UM bankroll específico e as casas de apostas dele
app.get('/api/bankrolls/:id', (req, res) => {
    const { id } = req.params;
    
    // Busca os dados do bankroll
    db.get(`SELECT * FROM bankrolls WHERE id = ?`, [id], (err, bankroll) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!bankroll) return res.status(404).json({ error: "Bankroll não encontrado" });

        // Busca as casas de apostas que pertencem a ele
        db.all(`SELECT * FROM casas_apostas WHERE bankroll_id = ?`, [id], (err, casas) => {
            if (err) return res.status(400).json({ error: err.message });
            bankroll.casas = casas; // Gruda as casas no objeto do bankroll
            res.json(bankroll);
        });
    });
});
// ROTA 3.1: Atualizar um bankroll (Edição)
app.put('/api/bankrolls/:id', (req, res) => {
    const { id } = req.params;
    const { nome, capital_inicial, casas_apostas } = req.body;

    db.run(
        `UPDATE bankrolls SET nome = ?, capital_inicial = ? WHERE id = ?`,
        [nome, capital_inicial, id],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });

            // Assim como fizemos nas apostas, apagamos as casas antigas e inserimos as novas
            db.run(`DELETE FROM casas_apostas WHERE bankroll_id = ?`, [id], (err) => {
                if (err) return res.status(400).json({ error: err.message });

                if (casas_apostas && casas_apostas.length > 0) {
                    const stmt = db.prepare(`INSERT INTO casas_apostas (bankroll_id, nome_casa, saldo_atual) VALUES (?, ?, ?)`);
                    casas_apostas.forEach(casa => {
                        const saldo = Number(casa.capital) || 0;
                        if (casa.nome && saldo > 0) {
                            stmt.run(id, casa.nome, saldo);
                        }
                    });
                    stmt.finalize();
                }
                res.json({ mensagem: "Bankroll atualizado com sucesso!" });
            });
        }
    );
});

// ROTA 3.2: Deletar um bankroll (Exclusão)
app.delete('/api/bankrolls/:id', (req, res) => {
    const { id } = req.params;
    // O ON DELETE CASCADE no banco vai apagar automaticamente as casas e as apostas atreladas a esta bankroll
    db.run(`DELETE FROM bankrolls WHERE id = ?`, [id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ mensagem: "Bankroll excluído com sucesso!" });
    });
});

// ROTA 4: Criar uma nova aposta (O Motor!)
app.post('/api/apostas', (req, res) => {
    const { bankroll_id, casa_aposta_id, data_hora, formato_aposta, valor_investido, lucro_obtido, status_geral, selecoes } = req.body;

    const sqlAposta = `INSERT INTO apostas (bankroll_id, casa_aposta_id, data_hora, formato_aposta, valor_investido, lucro_obtido, status_geral) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sqlAposta, [bankroll_id, casa_aposta_id, data_hora, formato_aposta, valor_investido, lucro_obtido || 0, status_geral || 'Pendente'], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        const apostaId = this.lastID;
        if (selecoes && selecoes.length > 0) {
            const stmt = db.prepare(`INSERT INTO selecoes (aposta_id, titulo, esporte, cotacao, status_selecao) VALUES (?, ?, ?, ?, ?)`);
            selecoes.forEach(sel => {
                stmt.run(apostaId, sel.titulo, sel.esporte, sel.cotacao, sel.status);
            });
            stmt.finalize();
        }
        res.json({ mensagem: "Aposta criada com sucesso!" });
    });
});

// ROTA 5: Buscar todas as apostas de UM bankroll
app.get('/api/apostas/bankroll/:bankroll_id', (req, res) => {
    const { bankroll_id } = req.params;
    
    // Busca todas as apostas desse bankroll ordenadas da mais recente para a mais antiga
    db.all(`SELECT * FROM apostas WHERE bankroll_id = ? ORDER BY data_hora DESC`, [bankroll_id], (err, apostas) => {
        if (err) return res.status(400).json({ error: err.message });
        
        // Função auxiliar para buscar as seleções de cada aposta
        const getSelecoes = (apostaId) => {
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM selecoes WHERE aposta_id = ?`, [apostaId], (err, selecoes) => {
                    if (err) reject(err);
                    else resolve(selecoes);
                });
            });
        };

        // Faz um loop em todas as apostas para buscar as seleções de cada uma
        Promise.all(apostas.map(async (aposta) => {
            aposta.selecoes = await getSelecoes(aposta.id);
            return aposta;
        }))
        .then(apostasComSelecoes => res.json(apostasComSelecoes))
        .catch(erro => res.status(500).json({ error: erro.message }));
    });
});

app.put('/api/apostas/:id', (req, res) => {
    const { id } = req.params;
    const { data_hora, casa_aposta_id, formato_aposta, valor_investido, lucro_obtido, status_geral, selecoes } = req.body;

    db.run(`UPDATE apostas SET data_hora = ?, casa_aposta_id = ?, formato_aposta = ?, valor_investido = ?, lucro_obtido = ?, status_geral = ? WHERE id = ?`,
        [data_hora, casa_aposta_id, formato_aposta, valor_investido, lucro_obtido, status_geral, id],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });

            // Para simplificar a edição das seleções: apagamos as antigas e salvamos as novas atualizadas
            db.run(`DELETE FROM selecoes WHERE aposta_id = ?`, [id], (err) => {
                if (err) return res.status(400).json({ error: err.message });
                
                if (selecoes && selecoes.length > 0) {
                    const stmt = db.prepare(`INSERT INTO selecoes (aposta_id, titulo, esporte, cotacao, status_selecao) VALUES (?, ?, ?, ?, ?)`);
                    selecoes.forEach(sel => {
                        stmt.run(id, sel.titulo, sel.esporte, sel.cotacao, sel.status);
                    });
                    stmt.finalize();
                }
                res.json({ mensagem: "Aposta atualizada com sucesso!" });
            });
        }
    );
});

// ROTA 6: Deletar uma aposta
app.delete('/api/apostas/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM apostas WHERE id = ?`, [id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ mensagem: "Aposta excluída com sucesso!" });
    });
});
// ROTA 7: Depósito/Retirada por Casa de Aposta
// ROTA 7: Depósito/Retirada por Casa de Aposta (Atualizada)
app.post('/api/casas/:id/transacao', (req, res) => {
    const { id } = req.params;
    const { bankroll_id, tipo, valor, data_hora } = req.body;
    const variacao = Number(valor);

    db.get(`SELECT saldo_atual FROM casas_apostas WHERE id = ?`, [id], (err, casa) => {
        if (err || !casa) return res.status(400).json({ error: err ? err.message : "Casa não encontrada" });

        let novoSaldo = casa.saldo_atual;
        if (tipo === 'deposito') novoSaldo += variacao;
        else if (tipo === 'retirada') novoSaldo -= variacao;

        db.run(`UPDATE casas_apostas SET saldo_atual = ? WHERE id = ?`, [novoSaldo, id], (err) => {
            if (err) return res.status(400).json({ error: err.message });

            // Atualiza também o capital total do bankroll
            db.get(`SELECT capital_inicial FROM bankrolls WHERE id = ?`, [bankroll_id], (err, br) => {
                if (err || !br) return res.status(400).json({ error: err ? err.message : "Bankroll não encontrado" });
                
                let novoCapital = br.capital_inicial;
                if (tipo === 'deposito') novoCapital += variacao;
                else if (tipo === 'retirada') novoCapital -= variacao;

                db.run(`UPDATE bankrolls SET capital_inicial = ? WHERE id = ?`, [novoCapital, bankroll_id], (err) => {
                    if (err) return res.status(400).json({ error: err.message });

                    // SALVA NO HISTÓRICO DE TRANSAÇÕES
                    db.run(`INSERT INTO transacoes (bankroll_id, casa_aposta_id, tipo, valor, data_hora) VALUES (?, ?, ?, ?, ?)`,
                    [bankroll_id, id, tipo, variacao, data_hora], (err) => {
                        if (err) return res.status(400).json({ error: err.message });
                        res.json({ mensagem: "Transação realizada e salva no histórico!" });
                    });
                });
            });
        });
    });
});

// ROTA 8: Buscar Histórico de Transações do Bankroll
app.get('/api/bankrolls/:id/transacoes', (req, res) => {
    const { id } = req.params;
    db.all(`
        SELECT t.*, c.nome_casa 
        FROM transacoes t
        LEFT JOIN casas_apostas c ON t.casa_aposta_id = c.id
        WHERE t.bankroll_id = ? 
        ORDER BY t.data_hora DESC
    `, [id], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

// ROTA 9: Excluir Transação (Reverte o saldo automaticamente)
app.delete('/api/transacoes/:id', (req, res) => {
    const { id } = req.params;
    
    db.get(`SELECT * FROM transacoes WHERE id = ?`, [id], (err, tr) => {
        if (err || !tr) return res.status(400).json({ error: "Transação não encontrada" });

        // Se era depósito, removemos. Se era saque, devolvemos o dinheiro.
        const variacao = tr.tipo === 'deposito' ? -tr.valor : tr.valor; 

        db.run(`UPDATE casas_apostas SET saldo_atual = saldo_atual + ? WHERE id = ?`, [variacao, tr.casa_aposta_id], (err) => {
            db.run(`UPDATE bankrolls SET capital_inicial = capital_inicial + ? WHERE id = ?`, [variacao, tr.bankroll_id], (err) => {
                db.run(`DELETE FROM transacoes WHERE id = ?`, [id], (err) => {
                    res.json({ mensagem: "Transação excluída e saldos revertidos!" });
                });
            });
        });
    });
});

// ROTA 10: Editar Transação (Reverte o antigo e aplica o novo saldo)
app.put('/api/transacoes/:id', (req, res) => {
    const { id } = req.params;
    const { tipo, valor, data_hora } = req.body;
    const novoValor = Number(valor);

    db.get(`SELECT * FROM transacoes WHERE id = ?`, [id], (err, tr) => {
        if (err || !tr) return res.status(400).json({ error: "Transação não encontrada" });

        // 1. Reverte o valor antigo matematicamente
        const reverterAntigo = tr.tipo === 'deposito' ? -tr.valor : tr.valor;
        // 2. Aplica o novo valor
        const aplicarNovo = tipo === 'deposito' ? novoValor : -novoValor;
        
        const variacaoTotal = reverterAntigo + aplicarNovo;

        db.run(`UPDATE casas_apostas SET saldo_atual = saldo_atual + ? WHERE id = ?`, [variacaoTotal, tr.casa_aposta_id], (err) => {
            db.run(`UPDATE bankrolls SET capital_inicial = capital_inicial + ? WHERE id = ?`, [variacaoTotal, tr.bankroll_id], (err) => {
                db.run(`UPDATE transacoes SET tipo = ?, valor = ?, data_hora = ? WHERE id = ?`, [tipo, novoValor, data_hora, id], (err) => {
                    res.json({ mensagem: "Transação atualizada!" });
                });
            });
        });
    });
});

// ROTA 11: Importar Apostas em Lote (Padrão Bet-Analytix)
app.post('/api/bankrolls/:id/importar', (req, res) => {
    const { id } = req.params;
    const { apostas } = req.body;

    if (!apostas || !apostas.length) return res.status(400).json({ error: "Nenhuma aposta para importar" });

    // Puxa as casas do bankroll para mapear os nomes que vêm do CSV aos IDs corretos do banco
    db.all(`SELECT id, nome_casa FROM casas_apostas WHERE bankroll_id = ?`, [id], (err, casas) => {
        if (err) return res.status(400).json({ error: err.message });

        const casasMap = {};
        casas.forEach(c => { casasMap[c.nome_casa.toLowerCase()] = c.id });

        const inserirAposta = (aposta) => {
            return new Promise((resolve, reject) => {
                let casaId = null;
                // Procura a casa no banco baseada no nome da coluna "Bookmaker"
                if (aposta.casa_aposta_nome) {
                    casaId = casasMap[aposta.casa_aposta_nome.toLowerCase()] || null;
                }
                
                const sqlAposta = `INSERT INTO apostas (bankroll_id, casa_aposta_id, data_hora, formato_aposta, valor_investido, lucro_obtido, status_geral) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                db.run(sqlAposta, [id, casaId, aposta.data_hora, aposta.formato_aposta, aposta.valor_investido, aposta.lucro_obtido, aposta.status_geral], function(err) {
                    if (err) return reject(err);
                    const apostaId = this.lastID;

                    if (aposta.selecoes && aposta.selecoes.length > 0) {
                        const stmt = db.prepare(`INSERT INTO selecoes (aposta_id, titulo, esporte, cotacao, status_selecao) VALUES (?, ?, ?, ?, ?)`);
                        aposta.selecoes.forEach(sel => {
                            stmt.run(apostaId, sel.titulo, sel.esporte, sel.cotacao, sel.status);
                        });
                        stmt.finalize();
                    }
                    resolve();
                });
            });
        };

        // Salva todas as apostas processadas
        Promise.all(apostas.map(a => inserirAposta(a)))
            .then(() => res.json({ mensagem: "Importação concluída com sucesso!" }))
            .catch(erro => res.status(500).json({ error: erro.message }));
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando de verdade na porta ${PORT}`);
});