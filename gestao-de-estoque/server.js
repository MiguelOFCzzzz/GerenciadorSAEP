const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Conexão com o banco ──────────────────────────────────────────────────────
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'gestao_estoque'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('✅ Conectado ao MySQL com sucesso!');
});

// ─── ROTAS DE PRODUTOS ────────────────────────────────────────────────────────

// GET /produtos — Lista todos os produtos
app.get('/produtos', (req, res) => {
    db.query('SELECT * FROM produtos ORDER BY id', (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(result);
    });
});

// POST /produtos — Cadastra um novo produto
app.post('/produtos', (req, res) => {
    const { nome, quantidade, estoque_minimo = 5 } = req.body;

    if (!nome || quantidade === undefined) {
        return res.status(400).json({ erro: 'Nome e quantidade são obrigatórios.' });
    }

    const sql = 'INSERT INTO produtos (nome, quantidade, estoque_minimo) VALUES (?, ?, ?)';
    db.query(sql, [nome, quantidade, estoque_minimo], (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.status(201).json({ message: 'Produto cadastrado!', id: result.insertId });
    });
});

// PUT /produtos/:id — Edita um produto existente
app.put('/produtos/:id', (req, res) => {
    const { id } = req.params;
    const { nome, quantidade, estoque_minimo } = req.body;

    const sql = 'UPDATE produtos SET nome = ?, quantidade = ?, estoque_minimo = ? WHERE id = ?';
    db.query(sql, [nome, quantidade, estoque_minimo, id], (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });
        res.json({ message: 'Produto atualizado!' });
    });
});

// DELETE /produtos/:id — Remove um produto
app.delete('/produtos/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM produtos WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });
        res.json({ message: 'Produto excluído!' });
    });
});

// ─── ROTAS DE MOVIMENTAÇÕES ───────────────────────────────────────────────────

// GET /movimentacoes — Lista movimentações com nome do produto (JOIN)
app.get('/movimentacoes', (req, res) => {
    const sql = `
        SELECT m.id, p.nome AS produto, m.tipo, m.quantidade,
               DATE_FORMAT(m.data_mov, '%d/%m/%Y') AS data
        FROM movimentacoes m
        JOIN produtos p ON m.id_produto = p.id
        ORDER BY m.data_mov DESC
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(result);
    });
});

// POST /movimentacoes — Registra uma movimentação e atualiza o estoque
app.post('/movimentacoes', (req, res) => {
    const { id_produto, tipo, quantidade } = req.body;

    if (!id_produto || !tipo || !quantidade) {
        return res.status(400).json({ erro: 'Preencha todos os campos da movimentação.' });
    }

    // Atualiza a quantidade do produto (+ entrada / - saída)
    const sinal = tipo === 'E' ? '+' : '-';
    const sqlAtualiza = `UPDATE produtos SET quantidade = quantidade ${sinal} ? WHERE id = ?`;

    db.query(sqlAtualiza, [quantidade, id_produto], (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });

        // Registra no histórico
        const sqlMov = 'INSERT INTO movimentacoes (id_produto, tipo, quantidade) VALUES (?, ?, ?)';
        db.query(sqlMov, [id_produto, tipo, quantidade], (err2, result2) => {
            if (err2) return res.status(500).json({ erro: err2.message });
            res.status(201).json({ message: 'Movimentação registrada!', id: result2.insertId });
        });
    });
});

// ─── INICIA O SERVIDOR ────────────────────────────────────────────────────────
app.listen(3000, () => {
    console.log('🚀 Servidor rodando em http://localhost:3000');
});