// ═══════════════════════════════════════════════════════════════
//  app.js — Cérebro do frontend (gestao.html)
//  Todas as funções estão no escopo GLOBAL para que o HTML
//  inline (onclick="...") consiga acessá-las.
// ═══════════════════════════════════════════════════════════════

const API = 'http://localhost:3000';

// ─── Carrega e renderiza a tabela de produtos ──────────────────
async function carregarProdutos() {
    try {
        const resposta = await fetch(`${API}/produtos`);
        if (!resposta.ok) throw new Error('Falha ao buscar produtos');

        const produtos = await resposta.json();
        const tabela = document.querySelector('#secao-tabela tbody');
        tabela.innerHTML = '';

        if (produtos.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; color:#9ca3af; padding:30px;">
                        Nenhum produto cadastrado ainda.
                    </td>
                </tr>`;
            return;
        }

        produtos.forEach(p => {
            tabela.innerHTML += `
                <tr>
                    <td>${String(p.id).padStart(2, '0')}</td>
                    <td>${p.nome}</td>
                    <td>${p.quantidade}</td>
                    <td style="text-align: right;">
                        <button class="btn-e" onclick="abrirEdicao(${p.id}, '${p.nome}', ${p.quantidade}, ${p.estoque_minimo})">✏️</button>
                        <button class="btn-d" onclick="confirmarExclusao(${p.id})">🗑️</button>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        mostrarNotificacao('Não foi possível conectar ao servidor. Verifique se o Node.js está rodando.', 'erro');
    }
}

// ─── Busca local na tabela ─────────────────────────────────────
function filtrarTabela(termo) {
    const linhas = document.querySelectorAll('#secao-tabela tbody tr');
    linhas.forEach(linha => {
        const texto = linha.innerText.toLowerCase();
        linha.style.display = texto.includes(termo.toLowerCase()) ? '' : 'none';
    });
}

// ─── Salva (cria OU edita) um produto ─────────────────────────
async function salvarProduto(event) {
    event.preventDefault(); // Impede recarregamento da página

    const id           = document.getElementById('form-id').value;
    const nome         = document.getElementById('form-nome').value.trim();
    const quantidade   = parseInt(document.getElementById('form-qtd').value);
    const estoqueMin   = parseInt(document.getElementById('form-minimo').value) || 5;

    if (!nome || isNaN(quantidade)) {
        mostrarNotificacao('Preencha todos os campos obrigatórios.', 'erro');
        return;
    }

    const ehEdicao = id !== '';
    const url    = ehEdicao ? `${API}/produtos/${id}` : `${API}/produtos`;
    const metodo = ehEdicao ? 'PUT' : 'POST';

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, quantidade, estoque_minimo: estoqueMin })
        });

        const dados = await resposta.json();

        if (!resposta.ok) throw new Error(dados.erro || 'Erro ao salvar');

        mostrarNotificacao(ehEdicao ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        mostrarTela('secao-tabela');
        carregarProdutos();
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        mostrarNotificacao('Erro: ' + error.message, 'erro');
    }
}

// ─── Confirma e executa a exclusão ────────────────────────────
async function confirmarExclusao(id) {
    if (!confirm(`Deseja realmente excluir o produto ID: ${id}?\nEsta ação não pode ser desfeita.`)) return;

    try {
        const resposta = await fetch(`${API}/produtos/${id}`, { method: 'DELETE' });
        const dados = await resposta.json();

        if (!resposta.ok) throw new Error(dados.erro || 'Erro ao excluir');

        mostrarNotificacao('Produto excluído com sucesso!');
        carregarProdutos();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        mostrarNotificacao('Erro: ' + error.message, 'erro');
    }
}

// ─── Abre formulário em modo CADASTRO ─────────────────────────
function abrirCadastro() {
    document.getElementById('titulo-form').innerText = 'Novo Produto';
    document.getElementById('form-id').value       = '';
    document.getElementById('form-nome').value     = '';
    document.getElementById('form-qtd').value      = '';
    document.getElementById('form-minimo').value   = '5';
    mostrarTela('secao-formulario');
}

// ─── Abre formulário em modo EDIÇÃO ───────────────────────────
function abrirEdicao(id, nome, qtd, minimo) {
    document.getElementById('titulo-form').innerText = 'Editar Produto';
    document.getElementById('form-id').value       = id;
    document.getElementById('form-nome').value     = nome;
    document.getElementById('form-qtd').value      = qtd;
    document.getElementById('form-minimo').value   = minimo;
    mostrarTela('secao-formulario');
}

// ─── Alterna seções do painel ──────────────────────────────────
function mostrarTela(id) {
    const secoes = ['secao-tabela', 'secao-formulario'];
    secoes.forEach(s => {
        const el = document.getElementById(s);
        el.classList.add('hidden');
        el.style.display = '';
    });

    const ativa = document.getElementById(id);
    ativa.classList.remove('hidden');

    if (id === 'secao-formulario') {
        ativa.style.display = 'flex';
        document.getElementById('subtitulo').innerText = 'Formulário';
    } else {
        ativa.style.display = 'block';
        document.getElementById('subtitulo').innerText = 'Inventário';
    }
}

// ─── Notificação flutuante (substitui alerts) ──────────────────
function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    // Remove notificação anterior se existir
    const anterior = document.getElementById('notificacao-toast');
    if (anterior) anterior.remove();

    const toast = document.createElement('div');
    toast.id = 'notificacao-toast';
    toast.innerText = mensagem;
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px;
        background: ${tipo === 'erro' ? '#ef4444' : '#22c55e'};
        color: white; padding: 14px 22px; border-radius: 10px;
        font-weight: 500; font-size: 14px; z-index: 9999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        animation: fadeInUp 0.3s ease;
    `;

    // Adiciona animação
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to   { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ─── Inicialização ─────────────────────────────────────────────
window.onload = () => {
    carregarProdutos();

    // Listener de busca em tempo real
    const campoBusca = document.querySelector('input[placeholder="Buscar produto..."]');
    if (campoBusca) {
        campoBusca.addEventListener('input', (e) => filtrarTabela(e.target.value));
    }
};