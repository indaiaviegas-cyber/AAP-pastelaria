# 🥟 Tenda do Pastel - Sistema de Pedidos Online

## 📖 Sobre o Projeto
O projeto **Tenda do Pastel** é uma plataforma full-stack desenvolvida como um projeto acadêmico interdisciplinar para a **FATEC Barueri**, com o objetivo de modernizar a gestão operacional e a experiência de atendimento de uma pastelaria local. 

Utilizando o padrão arquitetural MVC, a solução integra um banco de dados MySQL estruturado para o controle eficiente de estoque, usuários e fluxo de pedidos. A proposta central é otimizar os processos internos do microempreendimento, reduzir desperdícios e profissionalizar a administração do negócio por meio da tecnologia.

---

## ✨ Principais Funcionalidades

### 👤 Área do Cliente
- **Catálogo Dinâmico:** Filtro de produtos por categorias (Pastéis Salgados, Doces, Combos, Barcas, etc.) e barra de pesquisa inteligente.
- **Carrinho de Compras:** Adição de itens com verificação em tempo real do estoque e possibilidade de personalizar pedidos (ex: sem cebola) com adicionais cobrados à parte.
- **Checkout Completo:** Seleção de forma de pagamento, incluindo opção de **Voucher (Pluxee)**.
- **Gestão de Perfil:** Alteração de dados cadastrais (endereço, telefone) e sistema de recuperação/alteração de senha criptografada.
- **Histórico:** Acompanhamento do status dos pedidos e sistema de avaliação com estrelas.

### ⚙️ Painel Administrativo
- **Gestão de Produtos:** Adicionar novos itens, alterar disponibilidade e upload de imagens.
- **Controle de Estoque:** Atualização rápida da quantidade de insumos disponíveis.
- **Gestão de Pedidos:** Acompanhamento e alteração de status (Pendente, Preparando, Saiu para Entrega, Entregue).
- **Feedback:** Visualização das avaliações deixadas pelos clientes.

---

## 🛠️ Tecnologias Utilizadas

**Front-end:**
- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap 5 (Estilização responsiva)
- SweetAlert2 (Alertas e modais de UI/UX)

**Back-end:**
- Node.js
- Express.js (Rotas e API REST)
- Multer (Upload de imagens)
- Bcrypt.js (Criptografia de senhas)

**Banco de Dados:**
- MySQL (Dividido arquiteturalmente entre dados operacionais e de usuários)

---

## 💻 Como rodar o projeto localmente
1. Instale as dependências executando o comando: npm install
2. Configure o seu banco de dados MySQL.
3. Inicie o servidor executando o comando: node server.js
4. Acesse no navegador: http://localhost:3000

---
*Desenvolvido por Indaiá, Ian e Itallo.*
