const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cria ou conecta ao arquivo do banco de dados na mesma pasta
const dbPath = path.resolve(__dirname, 'banco.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Inicializar as tabelas
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS bankrolls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            capital_inicial REAL NOT NULL DEFAULT 0,
            moeda TEXT DEFAULT 'BRL',
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS casas_apostas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bankroll_id INTEGER NOT NULL,
            nome_casa TEXT NOT NULL,
            saldo_atual REAL NOT NULL DEFAULT 0,
            FOREIGN KEY (bankroll_id) REFERENCES bankrolls (id) ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS apostas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bankroll_id INTEGER NOT NULL,
            casa_aposta_id INTEGER,
            data_hora DATETIME NOT NULL,
            formato_aposta TEXT NOT NULL,
            valor_investido REAL NOT NULL,
            lucro_obtido REAL DEFAULT 0,
            status_geral TEXT DEFAULT 'Pendente',
            FOREIGN KEY (bankroll_id) REFERENCES bankrolls (id) ON DELETE CASCADE,
            FOREIGN KEY (casa_aposta_id) REFERENCES casas_apostas (id) ON DELETE SET NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS selecoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aposta_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            esporte TEXT NOT NULL,
            cotacao REAL NOT NULL,
            status_selecao TEXT DEFAULT 'Pendente',
            FOREIGN KEY (aposta_id) REFERENCES apostas (id) ON DELETE CASCADE
        )
    `);
    // ---> ADICIONE ESTA NOVA TABELA AQUI <---
    db.run(`
        CREATE TABLE IF NOT EXISTS transacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bankroll_id INTEGER NOT NULL,
            casa_aposta_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            valor REAL NOT NULL,
            data_hora DATETIME NOT NULL,
            FOREIGN KEY (bankroll_id) REFERENCES bankrolls (id) ON DELETE CASCADE,
            FOREIGN KEY (casa_aposta_id) REFERENCES casas_apostas (id) ON DELETE CASCADE
        )
    `);

    
});

module.exports = db;