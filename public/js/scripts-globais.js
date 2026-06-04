// Inicializa o carrinho com segurança (Proteção contra Memória Corrompida)
let carrinho = [];
try {
    let salvo = localStorage.getItem('carrinho');
    if (salvo && salvo !== "undefined" && salvo !== "null") {
        carrinho = JSON.parse(salvo);
        if (!Array.isArray(carrinho)) carrinho = [];
    }
} catch (e) {
    console.error("Erro ao ler o carrinho. Limpando memória...");
    carrinho = [];
    localStorage.removeItem('carrinho');
}

// FUNÇÃO PARA GUARDAR E ATUALIZAR A TELA
function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    if (typeof atualizarVisualCarrinho === 'function') {
        atualizarVisualCarrinho();
    }
}

// GESTÃO DE SESSÃO (Login/Logout)
function verificarSessao() {
    const user = localStorage.getItem('usuario');
    const area = document.getElementById('area-login');
    
    if (user && area) {
        const dados = JSON.parse(user);

        let botaoAdmin = "";
        if (dados.id === 1) {
            botaoAdmin = `
                <a href="/admin" class="btn btn-dark btn-sm px-3 fw-bold border-light shadow-sm">
                    ⚙️ Painel Admin
                </a>
            `;
        }

        area.innerHTML = `
            <div class="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-2 w-100">
                <span class="text-white fw-semibold mb-2 mb-sm-0 text-center">
                    Olá, <span class="text-warning text-capitalize">${dados.nome}</span>!
                </span>
                <div class="d-flex gap-2">
                    ${botaoAdmin}
                    <a href="/perfil" class="btn btn-outline-light btn-sm px-3 fw-bold" title="Meu Perfil">
                        👤 Perfil
                    </a>
                    <a href="/meus-pedidos" class="btn btn-outline-light btn-sm px-3 fw-bold">
                        📋 Meus Pedidos
                    </a>
                    <button class="btn btn-outline-light btn-sm px-3 fw-bold" onclick="sair()">
                        Sair
                    </button>
                </div>
            </div>
        `;
    }
}

function sair() {
    Swal.fire({
        title: 'Deseja sair?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, sair!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('usuario');
            window.location.reload();
        }
    });
}

document.addEventListener('DOMContentLoaded', verificarSessao);