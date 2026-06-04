const verificarAutenticacao = (req, res, next) => {
    const { id_cliente } = req.body;
    if (!id_cliente || id_cliente === "null" || id_cliente === 0) {
        return res.status(401).json({ sucesso: false, mensagem: "Usuário não autenticado." });
    }
    next();
};

const validarPedido = (req, res, next) => {
    const { itens, valor_total } = req.body;
    if (!itens || itens.length === 0 || valor_total <= 0) {
        return res.status(400).json({ sucesso: false, mensagem: "Carrinho vazio ou inválido." });
    }
    next();
};

// ESSA LINHA É OBRIGATÓRIA! Verifique se ela existe no final do arquivo:
module.exports = { verificarAutenticacao, validarPedido };