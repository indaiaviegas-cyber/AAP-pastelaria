require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer'); 
const { dbOperacional, dbUsuarios } = require('./config/db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURAÇÃO DE UPLOAD DE IMAGENS ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/img/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ==========================================
// ROTAS DE NAVEGAÇÃO (FRONT-END)
// ==========================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/cadastro', (req, res) => res.sendFile(path.join(__dirname, 'views', 'cadastro.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'views', 'checkout.html')));
app.get('/sucesso', (req, res) => res.sendFile(path.join(__dirname, 'views', 'sucesso.html')));
app.get('/meus-pedidos', (req, res) => res.sendFile(path.join(__dirname, 'views', 'meus-pedidos.html')));
app.get('/perfil', (req, res) => res.sendFile(path.join(__dirname, 'views', 'perfil.html')));

// ==========================================
// API: AUTENTICAÇÃO (LOGIN E CADASTRO)
// ==========================================
app.post('/api/cadastro', async (req, res) => {
    const { nome, email, senha, endereco, telefone } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const sql = 'INSERT INTO clientes (nome, email, senha, endereco, telefone) VALUES (?, ?, ?, ?, ?)';
        dbUsuarios.query(sql, [nome, email, senhaHash, endereco, telefone], (err) => {
            if (err) return res.status(500).json({ sucesso: false, erro: err.message });
            res.json({ sucesso: true });
        });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: "Falha na criptografia." });
    }
});

app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    dbUsuarios.query('SELECT * FROM clientes WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ sucesso: false });
        
        const correta = await bcrypt.compare(senha, results[0].senha);
        
        if (correta) {
            res.json({ 
                sucesso: true, 
                usuario: { 
                    id: results[0].id_cliente, 
                    nome: results[0].nome, 
                    email: results[0].email,
                    endereco: results[0].endereco,
                    telefone: results[0].telefone
                } 
            });
        } else {
            res.status(401).json({ sucesso: false });
        }
    });
});

// --- ROTA PARA ATUALIZAR DADOS DO CLIENTE ---
app.put('/api/clientes/:id', (req, res) => {
    const { nome, telefone, endereco } = req.body;
    const idCliente = req.params.id;

    const sql = 'UPDATE clientes SET nome = ?, telefone = ?, endereco = ? WHERE id_cliente = ?';
    
    dbUsuarios.query(sql, [nome, telefone, endereco, idCliente], (err) => {
        if (err) {
            console.error("Erro ao atualizar cliente:", err.message);
            return res.status(500).json({ sucesso: false, erro: err.message });
        }
        res.json({ sucesso: true });
    });
});

// --- ROTA PARA ATUALIZAR A SENHA DO CLIENTE ---
app.put('/api/clientes/:id/senha', (req, res) => {
    const { senhaAtual, novaSenha } = req.body;
    const idCliente = req.params.id;

    // 1. Procura a senha atual criptografada no banco
    dbUsuarios.query('SELECT senha FROM clientes WHERE id_cliente = ?', [idCliente], async (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ sucesso: false, erro: 'Erro no servidor.' });

        // 2. Compara a senha digitada com a que está no banco
        const correta = await bcrypt.compare(senhaAtual, results[0].senha);
        if (!correta) return res.status(400).json({ sucesso: false, erro: 'A senha atual está incorreta.' });

        // 3. Se estiver certa, criptografa a nova senha e guarda
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(novaSenha, salt);

        dbUsuarios.query('UPDATE clientes SET senha = ? WHERE id_cliente = ?', [senhaHash, idCliente], (errUpdate) => {
            if (errUpdate) return res.status(500).json({ sucesso: false, erro: 'Erro ao atualizar senha.' });
            res.json({ sucesso: true });
        });
    });
});

// ==========================================
// API: PRODUTOS E CARDÁPIO (PÚBLICO)
// ==========================================
app.get('/api/produtos', (req, res) => {
    dbOperacional.query('SELECT * FROM produtos', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/adicionais/:categoria', (req, res) => {
    const { categoria } = req.params;
    const sql = 'SELECT * FROM adicionais WHERE id_categoria = ?';
    dbOperacional.query(sql, [categoria], (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results);
    });
});

app.get('/api/produtos-media', (req, res) => {
    const sql = `
        SELECT p.id_produto, p.nome, p.preco, p.imagem, p.estoque, p.id_categoria, p.disponivel,
               AVG(a.nota) as media, COUNT(a.id_avaliacao) as total_votos
        FROM produtos p
        LEFT JOIN avaliacoes a ON p.id_produto = a.id_produto
        GROUP BY p.id_produto;
    `;
    dbOperacional.query(sql, (err, results) => {
        if (err) return res.status(500).json({ sucesso: false, erro: err.message });
        res.json(results);
    });
});

// ==========================================
// API: ÁREA DO CLIENTE E PEDIDOS
// ==========================================
app.get('/api/meus-pedidos/:id_cliente', (req, res) => {
    const idCliente = req.params.id_cliente;
    const sql = `
        SELECT p.id_pedido, p.valor_total, p.status_pedido, DATE_FORMAT(p.data_pedido, "%d/%m/%Y %H:%i") as data,
        (SELECT COUNT(*) FROM avaliacoes a WHERE a.id_pedido = p.id_pedido) as ja_avaliado
        FROM pedidos p 
        WHERE p.id_cliente = ? 
        ORDER BY p.id_pedido DESC
    `;
    dbOperacional.query(sql, [idCliente], (err, results) => {
        if (err) return res.status(500).json({ sucesso: false, erro: err.message });
        res.json(results);
    });
});

app.get('/api/pedido-itens/:id_pedido', (req, res) => {
    const idPedido = req.params.id_pedido;
    const sql = `
        SELECT ip.id_produto, p.nome 
        FROM itens_pedido ip
        JOIN produtos p ON ip.id_produto = p.id_produto
        WHERE ip.id_pedido = ?`;
    dbOperacional.query(sql, [idPedido], (err, results) => {
        if (err) return res.status(500).json({ sucesso: false, erro: err.message });
        res.json(results);
    });
});

app.post('/api/finalizar-pedido', (req, res) => {
    const { itens, id_cliente, total, forma_pagamento, tipo_entrega, troco } = req.body;
    const sqlPedido = 'INSERT INTO pedidos (id_cliente, valor_total, forma_pagamento, tipo_entrega, troco, status_pedido) VALUES (?, ?, ?, ?, ?, ?)';
    
    dbOperacional.query(sqlPedido, [id_cliente, total, forma_pagamento, tipo_entrega, troco, 'Pendente'], (err, result) => {
        if (err) return res.status(500).json({ sucesso: false, erro: err.message });

        const idPedidoGerado = result.insertId;

        const promises = itens.map(item => {
            return new Promise((resolve, reject) => {
                const sqlItens = 'INSERT INTO itens_pedido (id_pedido, id_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?)';
                dbOperacional.query(sqlItens, [idPedidoGerado, item.id_produto, item.quantidade, item.preco], (errItens) => {
                    if (errItens) return reject(errItens);
                    
                    const sqlEstoque = 'UPDATE produtos SET estoque = estoque - ? WHERE id_produto = ?';
                    dbOperacional.query(sqlEstoque, [item.quantidade, item.id_produto], (errEstoque) => {
                        if (errEstoque) reject(errEstoque); else resolve();
                    });
                });
            });
        });

        Promise.all(promises)
            .then(() => res.json({ sucesso: true, id_pedido: idPedidoGerado }))
            .catch(errProcesso => res.status(500).json({ sucesso: false, erro: errProcesso.message }));
    });
});

app.post('/api/avaliar', (req, res) => {
    const { id_pedido, avaliacoes } = req.body;
    if (!avaliacoes || avaliacoes.length === 0) return res.status(400).json({ sucesso: false, erro: "Nenhuma avaliação." });

    const promises = avaliacoes.map(avaliacao => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO avaliacoes (id_pedido, id_produto, nota, comentario) VALUES (?, ?, ?, ?)';
            dbOperacional.query(sql, [id_pedido, avaliacao.id_produto, avaliacao.nota, avaliacao.comentario], (err) => {
                if (err) reject(err); else resolve();
            });
        });
    });

    Promise.all(promises)
        .then(() => res.json({ sucesso: true }))
        .catch(err => res.status(500).json({ sucesso: false, erro: err.message }));
});

// ==========================================
// API: PAINEL ADMINISTRADOR (ESTOQUE E PEDIDOS)
// ==========================================
app.post('/api/produtos', upload.single('imagem'), (req, res) => {
    const { nome, preco, id_categoria } = req.body;
    const imagem = req.file ? `/img/${req.file.filename}` : '/img/default.jpg';
    dbOperacional.query('INSERT INTO produtos (nome, preco, id_categoria, imagem) VALUES (?, ?, ?, ?)', [nome, preco, id_categoria, imagem], (err) => {
        if (err) return res.status(500).json({ sucesso: false });
        res.json({ sucesso: true });
    });
});

app.put('/api/produtos/:id', (req, res) => {
    dbOperacional.query('UPDATE produtos SET preco = ? WHERE id_produto = ?', [req.body.preco, req.params.id], (err) => {
        if (err) return res.status(500).json({ sucesso: false });
        res.json({ sucesso: true });
    });
});

app.patch('/api/produtos/:id/status', (req, res) => {
    dbOperacional.query('UPDATE produtos SET disponivel = ? WHERE id_produto = ?', [req.body.novoStatus, req.params.id], (err) => {
        if (err) return res.status(500).json({ sucesso: false });
        res.json({ sucesso: true });
    });
});

app.patch('/api/produtos/:id/estoque', (req, res) => {
    dbOperacional.query('UPDATE produtos SET estoque = ? WHERE id_produto = ?', [req.body.estoque, req.params.id], (err) => {
        if (err) return res.status(500).json({ sucesso: false });
        res.json({ sucesso: true });
    });
});

app.patch('/api/produtos/:id/imagem', upload.single('imagem'), (req, res) => {
    if (!req.file) return res.status(400).json({ sucesso: false });
    const imagem = `/img/${req.file.filename}`;
    dbOperacional.query('UPDATE produtos SET imagem = ? WHERE id_produto = ?', [imagem, req.params.id], (err) => {
        if (err) return res.status(500).json({ sucesso: false });
        res.json({ sucesso: true, novoCaminho: imagem });
    });
});

// --- ROTA NOVA ADMIN: Buscar todos os pedidos (RESTAURADA) ---
app.get('/api/admin/pedidos', (req, res) => {
    const sqlPedidos = `
        SELECT id_pedido, id_cliente, valor_total, status_pedido, 
               DATE_FORMAT(data_pedido, "%d/%m/%Y %H:%i") as data
        FROM pedidos
        ORDER BY id_pedido DESC
    `;

    dbOperacional.query(sqlPedidos, (err, pedidos) => {
        if (err) return res.status(500).json({ sucesso: false, erro: err.message });
        if (pedidos.length === 0) return res.json([]);

        dbUsuarios.query('SELECT id_cliente, nome FROM clientes', (errCli, clientes) => {
            if (errCli) {
                const resultadoSemNome = pedidos.map(p => ({ ...p, nome_cliente: 'Cliente #' + p.id_cliente }));
                return res.json(resultadoSemNome);
            }

            const mapaClientes = {};
            clientes.forEach(c => mapaClientes[c.id_cliente] = c.nome);

            const resultadoFinal = pedidos.map(p => ({
                ...p,
                nome_cliente: mapaClientes[p.id_cliente] || 'Cliente Desconhecido'
            }));

            res.json(resultadoFinal);
        });
    });
});

// --- ROTA NOVA ADMIN: Mudar o status do pedido ---
app.patch('/api/admin/pedidos/:id/status', (req, res) => {
    const { status } = req.body;
    dbOperacional.query('UPDATE pedidos SET status_pedido = ? WHERE id_pedido = ?', [status, req.params.id], (err) => {
        if (err) {
            console.error("❌ ERRO AO ATUALIZAR STATUS:", err.message);
            return res.status(500).json({ sucesso: false, erro: err.message });
        }
        res.json({ sucesso: true });
    });
});

// --- ROTA NOVA ADMIN: Buscar todas as avaliações ---
app.get('/api/admin/avaliacoes', (req, res) => {
    // Busca a avaliação, junta com o pedido (para saber o cliente) e junta com o produto (para saber o nome do pastel)
    const sqlAvaliacoes = `
        SELECT a.id_avaliacao, a.id_pedido, p.id_cliente, pr.nome as nome_produto, a.nota, a.comentario
        FROM avaliacoes a
        JOIN pedidos p ON a.id_pedido = p.id_pedido
        JOIN produtos pr ON a.id_produto = pr.id_produto
        ORDER BY a.id_avaliacao DESC
    `;

    dbOperacional.query(sqlAvaliacoes, (err, avaliacoes) => {
        if (err) return res.status(500).json({ sucesso: false, erro: err.message });
        if (avaliacoes.length === 0) return res.json([]);

        // Pega os nomes dos clientes no outro banco de dados
        dbUsuarios.query('SELECT id_cliente, nome FROM clientes', (errCli, clientes) => {
            if (errCli) {
                const resultadoSemNome = avaliacoes.map(a => ({ ...a, nome_cliente: 'Cliente #' + a.id_cliente }));
                return res.json(resultadoSemNome);
            }

            const mapaClientes = {};
            clientes.forEach(c => mapaClientes[c.id_cliente] = c.nome);

            const resultadoFinal = avaliacoes.map(a => ({
                ...a,
                nome_cliente: mapaClientes[a.id_cliente] || 'Cliente Desconhecido'
            }));

            res.json(resultadoFinal);
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Tenda do Pastel decolando na porta ${PORT}!`));