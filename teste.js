/* ==========================================================================
   EDUCONNECT - JAVASCRIPT PRINCIPAL
   ========================================================================== */


/* ==========================================================================
   CONFIGURAÇÃO DA API
   ========================================================================== */

const API_ORIGIN = window.location.protocol === "file:"
    ? "http://localhost:3000"
    : window.location.origin;
const API_URL = `${API_ORIGIN}/api`;

function atualizarDataCabecalho() {
    const elemento = document.getElementById("headerDate");
    if (!elemento) return;

    const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric"
    }).format(new Date());
    elemento.textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
}

function definirMensagemVisual(elemento, texto, tipo = "success") {
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.classList.remove("success", "error", "warning", "show");
    if (texto) elemento.classList.add(tipo, "show");
}


/* ========================================================================== 
   RECURSOS EXTERNOS
   ========================================================================== */

function abrirSite(materia) {

    const links = {

        matematica: "https://www.todamateria.com.br/matematica/",
        fisica: "https://www.todamateria.com.br/fisica/",
        quimica: "https://www.todamateria.com.br/quimica/",
        portugues: "https://www.todamateria.com.br/lingua-portuguesa/",
        historia: "https://www.todamateria.com.br/historia/",
        geografia: "https://www.todamateria.com.br/geografia/",
        biologia: "https://www.todamateria.com.br/biologia/",
        ingles: "https://www.todamateria.com.br/ingles/"

    };

    if (links[materia]) {

        window.open(
            links[materia],
            "_blank"
        );

    }

}


function inicializarRecursosEducacionais() {
    const formulario = document.getElementById("resourceForm");
    if (formulario && formulario.dataset.initialized !== "true") {
        formulario.dataset.initialized = "true";
        formulario.addEventListener("submit", publicarRecursoEducacional);
    }

    const formularioProfessor = document.getElementById("teacherAccountForm");
    if (formularioProfessor && formularioProfessor.dataset.initialized !== "true") {
        formularioProfessor.dataset.initialized = "true";
        formularioProfessor.addEventListener("submit", criarContaProfessor);
    }

    const atualizarSolicitacoes = document.getElementById("refreshTeacherRequestsButton");
    if (atualizarSolicitacoes && atualizarSolicitacoes.dataset.initialized !== "true") {
        atualizarSolicitacoes.dataset.initialized = "true";
        atualizarSolicitacoes.addEventListener("click", carregarSolicitacoesProfessoresAdmin);
    }

    carregarRecursosEducacionais();
    carregarContasProfessoresAdmin();
    carregarSolicitacoesProfessoresAdmin();
}

function criarCartaoRecurso(recurso, permitirExcluir = false) {
    const cartao = document.createElement("article");
    cartao.className = `recommended-resource ${recurso.tipo === "video" ? "video-resource" : "activity-resource"}`;

    if (permitirExcluir) {
        cartao.classList.add("admin-resource-item");
        const icone = document.createElement("span");
        icone.className = "admin-resource-item-icon";
        icone.innerHTML = recurso.tipo === "video"
            ? '<i class="fa-solid fa-circle-play" aria-hidden="true"></i>'
            : '<i class="fa-solid fa-file-lines" aria-hidden="true"></i>';
        cartao.appendChild(icone);
    }

    const conteudo = document.createElement("div");
    if (permitirExcluir) conteudo.className = "admin-resource-item-copy";
    const titulo = document.createElement("strong");
    titulo.textContent = recurso.titulo;
    conteudo.appendChild(titulo);

    if (recurso.descricao) {
        const descricao = document.createElement("p");
        descricao.textContent = recurso.descricao;
        conteudo.appendChild(descricao);
    }

    const professor = document.createElement("span");
    professor.textContent = `Indicado por ${recurso.professorNome}`;
    conteudo.appendChild(professor);
    if (recurso.alunoId) {
        const audiencia = document.createElement("span");
        audiencia.className = "resource-audience-label";
        audiencia.textContent = `Visível somente para ${recurso.alunoNome || "um aluno específico"}`;
        conteudo.appendChild(audiencia);
    }
    cartao.appendChild(conteudo);

    if (permitirExcluir) {
        const excluir = document.createElement("button");
        excluir.type = "button";
        excluir.className = "resource-delete-button";
        excluir.textContent = "Excluir";
        excluir.setAttribute("aria-label", `Excluir ${recurso.titulo}`);
        excluir.addEventListener("click", () => excluirRecursoEducacional(recurso.id));
        cartao.appendChild(excluir);
    } else if (recurso.tipo === "video") {
        const videoId = extrairIdVideoYoutube(recurso.url);
        const playerArea = document.createElement("div");
        playerArea.className = "recommended-resource-video";

        if (videoId) {
            const assistir = document.createElement("button");
            assistir.type = "button";
            assistir.className = "resource-play-button";
            assistir.innerHTML = '<i class="fa-solid fa-circle-play" aria-hidden="true"></i> Assistir na plataforma';
            assistir.setAttribute("aria-label", `Assistir ${recurso.titulo} na plataforma`);
            assistir.addEventListener("click", () => {
                const player = document.createElement("iframe");
                player.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`;
                player.title = recurso.titulo;
                player.loading = "lazy";
                player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                player.referrerPolicy = "strict-origin-when-cross-origin";
                player.allowFullscreen = true;
                playerArea.replaceChildren(player);
            }, { once: true });
            playerArea.appendChild(assistir);
        } else {
            const aviso = document.createElement("span");
            aviso.className = "resource-video-unavailable";
            aviso.textContent = "Este link não permite reprodução incorporada.";
            playerArea.appendChild(aviso);
        }

        cartao.appendChild(playerArea);
    } else {
        let linkURL;
        try {
            linkURL = new URL(recurso.url);
        } catch {
            return null;
        }
        if (!["http:", "https:"].includes(linkURL.protocol)) {
            return null;
        }

        const link = document.createElement("a");
        link.href = linkURL.toString();
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Acessar";
        cartao.appendChild(link);
    }

    return cartao;
}

function extrairIdVideoYoutube(urlInformada) {
    let url;
    try {
        url = new URL(urlInformada);
    } catch {
        return null;
    }

    const hostsPermitidos = new Set([
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be"
    ]);
    if (!hostsPermitidos.has(url.hostname.toLowerCase())) return null;

    let videoId = "";
    if (["youtu.be", "www.youtu.be"].includes(url.hostname.toLowerCase())) {
        videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
    } else {
        const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})\/?$/);
        videoId = match?.[1] || "";
    }

    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
}

async function carregarRecursosEducacionais() {
    const recursosAdmin = document.getElementById("adminResourcesList");
    const materias = new Map(
        [...document.querySelectorAll("[data-subject-resources]")].map(container => [
            container.dataset.subjectResources,
            container
        ])
    );

    try {
        const admin = verificarAdminLogado();
        const aluno = verificarUsuarioLogado();
        const endpoint = admin?.token
            ? `${API_URL}/admin/recursos-educacionais`
            : aluno?.token
                ? `${API_URL}/alunos/meus/recursos-educacionais`
                : `${API_URL}/recursos-educacionais`;
        const headers = admin?.token
            ? obterHeadersAdmin()
            : aluno?.token
                ? { Authorization: `Bearer ${aluno.token}` }
                : {};
        const resposta = await fetch(endpoint, { headers });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso || !Array.isArray(dados.recursos)) {
            throw new Error(dados.mensagem || `Erro HTTP ${resposta.status}`);
        }

        materias.forEach(container => container.replaceChildren());

        dados.recursos.forEach(recurso => {
            const materia = normalizarMateriaRecurso(recurso.materia);
            const destino = materias.get(materia);
            if (!destino) return;

            let grupo = destino.querySelector(`[data-resource-type="${recurso.tipo}"]`);
            if (!grupo) {
                grupo = document.createElement("section");
                grupo.className = "subject-resource-group";
                grupo.dataset.resourceType = recurso.tipo;

                const titulo = document.createElement("h4");
                titulo.innerHTML = recurso.tipo === "video"
                    ? '<i class="fa-solid fa-circle-play" aria-hidden="true"></i> Videoaulas indicadas'
                    : '<i class="fa-solid fa-book-open" aria-hidden="true"></i> Atividades indicadas';
                grupo.appendChild(titulo);

                const lista = document.createElement("div");
                lista.className = "subject-resource-list";
                grupo.appendChild(lista);
                destino.appendChild(grupo);
            }

            const cartao = criarCartaoRecurso(recurso);
            if (cartao) grupo.querySelector(".subject-resource-list").appendChild(cartao);
        });

        if (recursosAdmin) {
            recursosAdmin.replaceChildren();
            if (!dados.recursos.length) {
                const mensagem = document.createElement("p");
                mensagem.className = "admin-resource-empty";
                mensagem.innerHTML = '<i class="fa-regular fa-folder-open" aria-hidden="true"></i><span><strong>Nenhum material publicado ainda</strong><small>Os vídeos e sites que você cadastrar aparecerão aqui.</small></span>';
                recursosAdmin.appendChild(mensagem);
            } else {
                dados.recursos.forEach(recurso => {
                    const cartao = criarCartaoRecurso(recurso, true);
                    if (cartao) recursosAdmin.appendChild(cartao);
                });
            }
        }
    } catch (erro) {
        console.error("Erro ao carregar materiais educacionais:", erro);
        [...materias.values(), recursosAdmin].filter(Boolean).forEach(container => {
            const mensagem = document.createElement("p");
            mensagem.textContent = "Não foi possível carregar os materiais. Tente novamente.";
            container.replaceChildren(mensagem);
        });
    }
}

function normalizarMateriaRecurso(materia) {
    return String(materia || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
}

async function publicarRecursoEducacional(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const mensagem = document.getElementById("resourceFormMessage");
    const botao = document.getElementById("saveResourceButton");
    if (!(formulario instanceof HTMLFormElement) || !mensagem || !botao) return;

    mensagem.textContent = "";
    botao.disabled = true;

    try {
        const resposta = await fetch(`${API_URL}/admin/recursos-educacionais`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...obterHeadersAdmin()
            },
            body: JSON.stringify({
                tipo: document.getElementById("resourceType")?.value,
                materia: document.getElementById("resourceSubject")?.value.trim(),
                titulo: document.getElementById("resourceTitle")?.value.trim(),
                url: document.getElementById("resourceUrl")?.value.trim(),
                professorNome: document.getElementById("resourceTeacher")?.value.trim(),
                descricao: document.getElementById("resourceDescription")?.value.trim()
            })
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível publicar o material.");
        }

        formulario.reset();
        mensagem.textContent = "Material publicado para os alunos.";
        await carregarRecursosEducacionais();
    } catch (erro) {
        console.error("Erro ao publicar material educacional:", erro);
        mensagem.textContent = erro.message || "Não foi possível publicar o material.";
    } finally {
        botao.disabled = false;
    }
}

async function excluirRecursoEducacional(id) {
    if (!window.confirm("Deseja excluir este material?")) return;

    try {
        const resposta = await fetch(`${API_URL}/admin/recursos-educacionais/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: obterHeadersAdmin()
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível excluir o material.");
        }
        await carregarRecursosEducacionais();
    } catch (erro) {
        console.error("Erro ao excluir material educacional:", erro);
        window.alert(erro.message || "Não foi possível excluir o material.");
    }
}

async function carregarContasProfessoresAdmin() {
    const lista = document.getElementById("adminTeachersList");
    if (!lista || !verificarAdminLogado()?.token) return;

    try {
        const resposta = await fetch(`${API_URL}/admin/professores`, {
            headers: obterHeadersAdmin()
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso || !Array.isArray(dados.professores)) {
            throw new Error(dados.mensagem || "Não foi possível carregar as contas.");
        }

        lista.replaceChildren();
        if (!dados.professores.length) {
            const vazio = document.createElement("p");
            vazio.className = "admin-resource-empty";
            vazio.innerHTML = '<i class="fa-solid fa-user-plus" aria-hidden="true"></i><span><strong>Nenhuma conta de professor cadastrada</strong><small>Preencha os campos acima para criar o primeiro acesso.</small></span>';
            lista.appendChild(vazio);
            return;
        }

        dados.professores.forEach(professor => {
            const item = document.createElement("article");
            item.className = "recommended-resource admin-account-item";
            const avatar = document.createElement("span");
            avatar.className = "admin-account-avatar";
            avatar.setAttribute("aria-hidden", "true");
            avatar.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
            const detalhes = document.createElement("div");
            detalhes.className = "admin-account-details";
            const nome = document.createElement("strong");
            nome.textContent = professor.nome;
            const info = document.createElement("span");
            info.textContent = `${professor.materia} · ${professor.email}`;
            detalhes.append(nome, info);
            const excluir = document.createElement("button");
            excluir.type = "button";
            excluir.className = "resource-delete-button";
            excluir.textContent = "Remover conta";
            excluir.addEventListener("click", () => excluirContaProfessor(professor.id));
            item.append(avatar, detalhes, excluir);
            lista.appendChild(item);
        });
    } catch (erro) {
        console.error("Erro ao carregar contas de professores:", erro);
        lista.textContent = "Não foi possível carregar as contas. Tente novamente.";
    }
}

async function carregarSolicitacoesProfessoresAdmin() {
    const lista = document.getElementById("adminTeacherRequests");
    const mensagem = document.getElementById("adminTeacherRequestsMessage");
    if (!lista || !verificarAdminLogado()?.token) return;

    try {
        const resposta = await fetch(`${API_URL}/admin/solicitacoes-professores`, {
            headers: obterHeadersAdmin(),
            cache: "no-store"
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso || !Array.isArray(dados.solicitacoes)) {
            throw new Error(dados.mensagem || "Não foi possível carregar as solicitações.");
        }

        lista.replaceChildren();
        if (!dados.solicitacoes.length) {
            const vazio = document.createElement("p");
            vazio.className = "admin-resource-empty";
            vazio.textContent = "Nenhuma solicitação aguardando aprovação.";
            lista.appendChild(vazio);
            return;
        }

        dados.solicitacoes.forEach(solicitacao => {
            const item = document.createElement("article");
            item.className = "recommended-resource admin-account-item teacher-request-item";
            const detalhes = document.createElement("div");
            detalhes.className = "admin-account-details";
            const nome = document.createElement("strong");
            nome.textContent = solicitacao.nome;
            const info = document.createElement("span");
            info.textContent = `${solicitacao.materia} · ${solicitacao.email}`;
            const data = document.createElement("small");
            data.textContent = `Solicitado em ${new Date(solicitacao.criadaEm).toLocaleString("pt-BR")}`;
            detalhes.append(nome, info, data);

            const acoes = document.createElement("div");
            acoes.className = "teacher-request-actions";
            const aprovar = document.createElement("button");
            aprovar.type = "button";
            aprovar.className = "btn-confirm";
            aprovar.textContent = "Aprovar";
            aprovar.addEventListener("click", () => aprovarSolicitacaoProfessor(solicitacao.id));
            const rejeitar = document.createElement("button");
            rejeitar.type = "button";
            rejeitar.className = "resource-delete-button";
            rejeitar.textContent = "Rejeitar";
            rejeitar.addEventListener("click", () => rejeitarSolicitacaoProfessor(solicitacao.id));
            acoes.append(aprovar, rejeitar);
            item.append(detalhes, acoes);
            lista.appendChild(item);
        });
    } catch (erro) {
        console.error("Erro ao carregar solicitações de professores:", erro);
        definirMensagemVisual(
            mensagem,
            erro.message || "Não foi possível carregar as solicitações.",
            "error"
        );
        if (!mensagem) lista.textContent = "Não foi possível carregar as solicitações. Tente novamente.";
    }
}

async function aprovarSolicitacaoProfessor(id) {
    try {
        const resposta = await fetch(
            `${API_URL}/admin/solicitacoes-professores/${encodeURIComponent(id)}/aprovar`,
            {
                method: "POST",
                headers: obterHeadersAdmin()
            }
        );
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível aprovar o cadastro.");
        }
        const mensagem = document.getElementById("adminTeacherRequestsMessage");
        definirMensagemVisual(
            mensagem,
            `Cadastro de ${dados.professor.nome} aprovado. Avise o professor de que já pode entrar com o e-mail e a senha cadastrados.`
        );
        await Promise.all([
            carregarSolicitacoesProfessoresAdmin(),
            carregarContasProfessoresAdmin(),
            carregarPainelAdmin()
        ]);
    } catch (erro) {
        console.error("Erro ao aprovar solicitação de professor:", erro);
        window.alert(erro.message || "Não foi possível aprovar o cadastro.");
    }
}

async function rejeitarSolicitacaoProfessor(id) {
    if (!window.confirm("Rejeitar esta solicitação? O acesso ao chat não será liberado.")) return;

    try {
        const resposta = await fetch(
            `${API_URL}/admin/solicitacoes-professores/${encodeURIComponent(id)}/rejeitar`,
            {
                method: "POST",
                headers: obterHeadersAdmin()
            }
        );
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível rejeitar o cadastro.");
        }
        const mensagem = document.getElementById("adminTeacherRequestsMessage");
        definirMensagemVisual(mensagem, "Solicitação rejeitada.");
        await Promise.all([
            carregarSolicitacoesProfessoresAdmin(),
            carregarPainelAdmin()
        ]);
    } catch (erro) {
        console.error("Erro ao rejeitar solicitação de professor:", erro);
        window.alert(erro.message || "Não foi possível rejeitar o cadastro.");
    }
}

async function criarContaProfessor(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const mensagem = document.getElementById("teacherAccountMessage");
    const botao = document.getElementById("createTeacherAccountButton");
    if (!(formulario instanceof HTMLFormElement) || !mensagem || !botao) return;

    definirMensagemVisual(mensagem, "");
    botao.disabled = true;

    try {
        const resposta = await fetch(`${API_URL}/admin/professores`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...obterHeadersAdmin()
            },
            body: JSON.stringify({
                nome: document.getElementById("teacherAccountName")?.value.trim(),
                email: document.getElementById("teacherAccountEmail")?.value.trim(),
                materia: document.getElementById("teacherAccountSubject")?.value.trim(),
                senha: document.getElementById("teacherAccountPassword")?.value
            })
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível criar a conta.");
        }

        formulario.reset();
        definirMensagemVisual(mensagem, "Conta criada. Compartilhe as credenciais com o professor.");
        await carregarContasProfessoresAdmin();
    } catch (erro) {
        console.error("Erro ao criar conta de professor:", erro);
        definirMensagemVisual(
            mensagem,
            erro.message || "Não foi possível criar a conta.",
            "error"
        );
    } finally {
        botao.disabled = false;
    }
}

async function excluirContaProfessor(id) {
    if (!window.confirm("Remover esta conta de professor? A sessão dele será encerrada.")) return;

    try {
        const resposta = await fetch(`${API_URL}/admin/professores/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: obterHeadersAdmin()
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível remover a conta.");
        }
        await carregarContasProfessoresAdmin();
    } catch (erro) {
        console.error("Erro ao remover conta de professor:", erro);
        window.alert(erro.message || "Não foi possível remover a conta.");
    }
}

function obterProfessorAtual() {
    try {
        const salvo = sessionStorage.getItem("professorLogado");
        return salvo ? JSON.parse(salvo) : null;
    } catch (erro) {
        console.error("Não foi possível ler a sessão do professor:", erro);
        sessionStorage.removeItem("professorLogado");
        return null;
    }
}

function obterHeadersProfessor() {
    const professor = obterProfessorAtual();
    return professor?.token
        ? { Authorization: `Bearer ${professor.token}` }
        : {};
}

function mostrarPortalProfessor(professor) {
    const login = document.getElementById("teacherLoginPanel");
    const painel = document.getElementById("teacherDashboardPanel");
    const identity = document.getElementById("teacherPortalIdentity");
    const logout = document.getElementById("teacherLogoutButton");
    const nome = document.getElementById("teacherDashboardName");
    const materia = document.getElementById("professorResourceSubject");

    if (login) login.style.display = professor ? "none" : "block";
    if (painel) painel.style.display = professor ? "block" : "none";
    if (logout) logout.style.display = professor ? "inline-flex" : "none";
    if (identity) {
        identity.textContent = professor
            ? `${professor.nome} · ${professor.materia}`
            : "Acesso seguro para professores";
    }
    if (nome) nome.textContent = professor?.nome || "professor(a)";
    if (professor && materia && !materia.value) {
        materia.value = professor.materia || "";
    }
    if (materia) materia.readOnly = Boolean(professor);
    if (!professor) {
        pararChatProfessor();
    }
}

let socketAtendimentoProfessor = null;
let timerChatProfessor = null;
let alunoChatProfessorSelecionado = null;
let enviandoRespostaProfessor = false;
let conversasProfessor = [];
let sessaoChatProfessor = 0;
let requisicaoMensagensConversaProfessor = 0;

function atualizarStatusChatProfessor(texto) {
    const status = document.getElementById("teacherChatStatus");
    if (status) status.textContent = texto;
}

function pararChatProfessor() {
    sessaoChatProfessor += 1;
    if (timerChatProfessor) {
        clearInterval(timerChatProfessor);
        timerChatProfessor = null;
    }
    if (socketAtendimentoProfessor) {
        socketAtendimentoProfessor.disconnect();
        socketAtendimentoProfessor = null;
    }
    alunoChatProfessorSelecionado = null;
    conversasProfessor = [];
}

async function buscarConversasProfessor() {
    const sessaoAtual = sessaoChatProfessor;
    const resposta = await fetch(`${API_URL}/professores/chat/conversas`, {
        headers: obterHeadersProfessor()
    });
    const dados = await resposta.json();
    if (!resposta.ok || !dados.sucesso || !Array.isArray(dados.conversas)) {
        throw new Error(dados.mensagem || "Não foi possível carregar as conversas.");
    }
    if (sessaoAtual !== sessaoChatProfessor || !obterProfessorAtual()) return;
    conversasProfessor = dados.conversas;
    renderizarConversasProfessor();

    const alunoDirecionado = new URLSearchParams(window.location.search).get("conversa");
    if (
        alunoDirecionado &&
        /^\d+$/.test(alunoDirecionado) &&
        String(alunoChatProfessorSelecionado) !== alunoDirecionado &&
        conversasProfessor.some(conversa => String(conversa.alunoId) === alunoDirecionado)
    ) {
        await abrirConversaProfessor(alunoDirecionado);
    }
}

function renderizarConversasProfessor() {
    const lista = document.getElementById("teacherChatConversations");
    atualizarOpcoesAlunoMaterialProfessor();
    if (!lista) return;
    lista.replaceChildren();

    if (!conversasProfessor.length) {
        const vazio = document.createElement("p");
        vazio.className = "teacher-chat-empty";
        vazio.textContent = "Nenhum aluno enviou uma dúvida ainda.";
        lista.appendChild(vazio);
        return;
    }

    conversasProfessor.forEach(conversa => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "teacher-chat-conversation";
        if (String(conversa.alunoId) === String(alunoChatProfessorSelecionado)) {
            botao.classList.add("is-selected");
        }
        botao.setAttribute("aria-pressed", String(
            String(conversa.alunoId) === String(alunoChatProfessorSelecionado)
        ));

        const nome = document.createElement("strong");
        nome.textContent = conversa.alunoNome || "Aluno";
        const previa = document.createElement("span");
        previa.textContent = conversa.ultimaMensagem || "Nova conversa";
        const rodape = document.createElement("small");
        const data = conversa.ultimaMensagemEm ? new Date(conversa.ultimaMensagemEm) : null;
        rodape.textContent = data && !Number.isNaN(data.getTime())
            ? data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
            : "";
        botao.append(nome, previa, rodape);

        const naoLidas = Number(conversa.naoLidas) || 0;
        if (naoLidas > 0) {
            const badge = document.createElement("span");
            badge.className = "teacher-chat-unread";
            badge.textContent = String(naoLidas);
            badge.setAttribute("aria-label", `${naoLidas} mensagens não lidas`);
            botao.appendChild(badge);
        }

        botao.addEventListener("click", () => abrirConversaProfessor(conversa.alunoId));
        lista.appendChild(botao);
    });
}

function atualizarOpcoesAlunoMaterialProfessor() {
    const seletor = document.getElementById("professorResourceStudent");
    if (!seletor) return;

    const alunoSelecionado = seletor.value;
    const opcaoInicial = document.createElement("option");
    opcaoInicial.value = "";
    opcaoInicial.textContent = conversasProfessor.length
        ? "Selecione uma conversa"
        : "Nenhuma conversa disponível";
    seletor.replaceChildren(opcaoInicial);

    conversasProfessor.forEach(conversa => {
        const opcao = document.createElement("option");
        opcao.value = String(conversa.alunoId);
        opcao.textContent = conversa.alunoNome || `Aluno ${conversa.alunoId}`;
        seletor.appendChild(opcao);
    });

    if (conversasProfessor.some(conversa => String(conversa.alunoId) === alunoSelecionado)) {
        seletor.value = alunoSelecionado;
    }

    atualizarVisibilidadeMaterialProfessor();
}

function atualizarVisibilidadeMaterialProfessor() {
    const tipo = document.getElementById("professorResourceType");
    const grupo = document.getElementById("professorResourceAudienceGroup");
    const audiencia = document.getElementById("professorResourceAudience");
    const grupoAluno = document.getElementById("professorResourceStudentGroup");
    const aluno = document.getElementById("professorResourceStudent");
    if (!tipo || !grupo || !audiencia || !grupoAluno || !aluno) return;

    const video = tipo.value === "video";
    const direcionado = video && audiencia.value === "aluno";
    grupo.hidden = !video;
    grupoAluno.hidden = !direcionado;
    aluno.required = direcionado;
    aluno.disabled = direcionado && conversasProfessor.length === 0;
}

async function carregarMensagensConversaProfessor({ silencioso = false } = {}) {
    const alunoId = alunoChatProfessorSelecionado;
    const sessaoAtual = sessaoChatProfessor;
    const requisicaoAtual = ++requisicaoMensagensConversaProfessor;
    const mensagensContainer = document.getElementById("teacherChatMessages");
    const campo = document.getElementById("teacherChatReplyInput");
    const botao = document.getElementById("teacherChatReplyButton");
    if (!alunoId || !mensagensContainer) return;

    try {
        const resposta = await fetch(
            `${API_URL}/professores/chat/conversas/${encodeURIComponent(alunoId)}/mensagens`,
            { headers: obterHeadersProfessor() }
        );
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso || !Array.isArray(dados.mensagens)) {
            throw new Error(dados.mensagem || "Não foi possível carregar esta conversa.");
        }
        if (
            sessaoAtual !== sessaoChatProfessor ||
            requisicaoAtual !== requisicaoMensagensConversaProfessor ||
            !obterProfessorAtual() ||
            String(alunoId) !== String(alunoChatProfessorSelecionado)
        ) return;

        const estavaNoFim = mensagensContainer.scrollHeight - mensagensContainer.scrollTop
            <= mensagensContainer.clientHeight + 60;
        mensagensContainer.replaceChildren();
        dados.mensagens.forEach(mensagem => {
            const item = document.createElement("article");
            item.className = `teacher-chat-message ${
                mensagem.remetenteTipo === "professor" ? "from-teacher" : "from-student"
            }`;
            const autor = document.createElement("strong");
            autor.textContent = mensagem.remetenteTipo === "professor"
                ? "Você"
                : mensagem.alunoNome || "Aluno";
            const texto = document.createElement("p");
            renderizarTextoRespostaChat(texto, mensagem.mensagem || "");
            const horario = document.createElement("small");
            const data = mensagem.criadaEm ? new Date(mensagem.criadaEm) : null;
            horario.textContent = data && !Number.isNaN(data.getTime())
                ? data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                : "";
            item.append(autor, texto, horario);
            mensagensContainer.appendChild(item);
        });
        if (!dados.mensagens.length) {
            const vazio = document.createElement("p");
            vazio.className = "teacher-chat-empty";
            vazio.textContent = "Inicie a conversa respondendo à dúvida do aluno.";
            mensagensContainer.appendChild(vazio);
        }
        if (campo) campo.disabled = false;
        if (botao) botao.disabled = false;
        if (estavaNoFim || !silencioso) {
            mensagensContainer.scrollTop = mensagensContainer.scrollHeight;
        }
        await buscarConversasProfessor().catch(erro => {
            console.error("Erro ao atualizar a lista de conversas do professor:", erro);
        });
    } catch (erro) {
        if (
            sessaoAtual !== sessaoChatProfessor ||
            requisicaoAtual !== requisicaoMensagensConversaProfessor ||
            !obterProfessorAtual()
        ) return;
        console.error("Erro ao carregar mensagens do aluno:", erro);
        if (!silencioso) mensagensContainer.textContent = erro.message || "Não foi possível carregar esta conversa.";
    }
}

async function abrirConversaProfessor(alunoId) {
    alunoChatProfessorSelecionado = String(alunoId);
    const seletorAlunoMaterial = document.getElementById("professorResourceStudent");
    if (seletorAlunoMaterial) {
        seletorAlunoMaterial.value = String(alunoId);
    }
    const mensagens = document.getElementById("teacherChatMessages");
    const campo = document.getElementById("teacherChatReplyInput");
    const botao = document.getElementById("teacherChatReplyButton");
    if (mensagens) mensagens.textContent = "Carregando conversa...";
    if (campo) campo.disabled = true;
    if (botao) botao.disabled = true;
    renderizarConversasProfessor();
    await carregarMensagensConversaProfessor();
}

async function atualizarChatProfessor() {
    await carregarAgendamentosCanceladosProfessor();
    try {
        if (alunoChatProfessorSelecionado) {
            await carregarMensagensConversaProfessor({ silencioso: true });
        } else {
            await buscarConversasProfessor();
        }
        atualizarStatusChatProfessor("Atualizado agora");
    } catch (erro) {
        console.error("Erro ao atualizar a caixa do professor:", erro);
        atualizarStatusChatProfessor("Falha ao atualizar");
    }
}

async function iniciarChatProfessor() {
    pararChatProfessor();
    atualizarStatusChatProfessor("Conectando...");
    await atualizarChatProfessor();
    timerChatProfessor = setInterval(atualizarChatProfessor, 15000);

    try {
        await carregarClienteSocketIO();
        socketAtendimentoProfessor = io(API_ORIGIN, {
            transports: ["polling", "websocket"],
            reconnection: true
        });
        socketAtendimentoProfessor.on("connect", () => {
            const professor = obterProfessorAtual();
            if (professor?.token) {
                socketAtendimentoProfessor.emit("chat:entrar-professor", {
                    token: professor.token
                });
            }
        });
        socketAtendimentoProfessor.on("chat:professor-mensagem", atualizarChatProfessor);
        socketAtendimentoProfessor.on("agendamento:cancelado", carregarAgendamentosCanceladosProfessor);
        socketAtendimentoProfessor.on("chat:conectado-professor", () => {
            atualizarStatusChatProfessor("Conectado · atualizações em tempo real");
        });
        socketAtendimentoProfessor.on("chat:erro-professor", dados => {
            console.error("Falha na conexão do chat do professor:", dados?.mensagem);
            atualizarStatusChatProfessor("Tempo real indisponível · atualizando automaticamente");
        });
        socketAtendimentoProfessor.on("connect_error", erro => {
            console.error("Erro na conexão em tempo real do professor:", erro);
            atualizarStatusChatProfessor("Tempo real indisponível · atualizando automaticamente");
        });
        socketAtendimentoProfessor.on("disconnect", () => {
            atualizarStatusChatProfessor("Reconectando · atualização automática ativa");
        });
    } catch (erro) {
        console.error("Não foi possível iniciar atualizações em tempo real:", erro);
        atualizarStatusChatProfessor("Atualização automática ativa");
    }
}

async function responderAlunoProfessor(evento) {
    evento.preventDefault();
    if (enviandoRespostaProfessor || !alunoChatProfessorSelecionado) return;

    const campo = document.getElementById("teacherChatReplyInput");
    const botao = document.getElementById("teacherChatReplyButton");
    const feedback = document.getElementById("teacherChatMessage");
    const mensagem = campo?.value.trim();
    if (!campo || !botao || !mensagem) return;

    enviandoRespostaProfessor = true;
    botao.disabled = true;
    if (feedback) feedback.textContent = "";
    const alunoId = alunoChatProfessorSelecionado;
    try {
        const resposta = await fetch(
            `${API_URL}/professores/chat/conversas/${encodeURIComponent(alunoId)}/mensagens`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...obterHeadersProfessor()
                },
                body: JSON.stringify({ mensagem })
            }
        );
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível enviar a resposta.");
        }
        campo.value = "";
        if (String(alunoId) === String(alunoChatProfessorSelecionado)) {
            await carregarMensagensConversaProfessor();
        }
        if (feedback) feedback.textContent = "Resposta enviada ao aluno.";
        await buscarConversasProfessor().catch(erro => {
            console.error("Resposta enviada, mas não foi possível atualizar a lista:", erro);
        });
    } catch (erro) {
        console.error("Erro ao enviar resposta ao aluno:", erro);
        if (feedback) feedback.textContent = erro.message || "Não foi possível enviar a resposta.";
    } finally {
        enviandoRespostaProfessor = false;
        botao.disabled = !alunoChatProfessorSelecionado;
    }
}

async function carregarAgendamentosCanceladosProfessor() {
    const lista = document.getElementById("teacherCancelledAppointments");
    const professor = obterProfessorAtual();
    if (!lista || !professor) return;

    try {
        const resposta = await fetch(
            `${API_URL}/professores/agendamentos/cancelados`,
            { headers: obterHeadersProfessor() }
        );
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso || !Array.isArray(dados.agendamentos)) {
            throw new Error(dados.mensagem || "Não foi possível carregar os agendamentos cancelados.");
        }

        lista.replaceChildren();
        if (!dados.agendamentos.length) {
            const vazio = document.createElement("p");
            vazio.className = "teacher-appointments-empty";
            vazio.textContent = "Nenhum agendamento cancelado foi registrado para seus horários.";
            lista.appendChild(vazio);
            return;
        }

        dados.agendamentos.forEach(agendamento => {
            const cartao = document.createElement("article");
            cartao.className = "teacher-cancelled-appointment";

            const aluno = document.createElement("strong");
            aluno.textContent = agendamento.alunoNome || "Aluno";
            const monitor = document.createElement("span");
            monitor.textContent = [agendamento.monitorNome, agendamento.monitorMateria]
                .filter(Boolean)
                .join(" · ");

            const data = agendamento.dataAgendamento
                ? new Date(agendamento.dataAgendamento)
                : null;
            const horario = document.createElement("time");
            horario.dateTime = data && !Number.isNaN(data.getTime())
                ? data.toISOString()
                : "";
            horario.textContent = data && !Number.isNaN(data.getTime())
                ? data.toLocaleString("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short"
                })
                : "Data não informada";

            const status = document.createElement("span");
            status.className = "teacher-appointment-cancelled-status";
            status.textContent = "Cancelado";

            cartao.append(aluno, monitor, horario, status);
            lista.appendChild(cartao);
        });
    } catch (erro) {
        console.error("Erro ao carregar agendamentos cancelados do professor:", erro);
        lista.textContent = erro.message || "Não foi possível carregar os agendamentos cancelados.";
    }
}

async function entrarProfessor(evento) {
    evento.preventDefault();
    const botao = document.getElementById("teacherLoginButton");
    const mensagem = document.getElementById("teacherLoginMessage");
    if (!botao || !mensagem) return;

    definirMensagemVisual(mensagem, "");
    botao.disabled = true;
    try {
        const resposta = await fetch(`${API_URL}/professores/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: document.getElementById("teacherLoginEmail")?.value.trim(),
                senha: document.getElementById("teacherLoginPassword")?.value
            })
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso || !dados.token) {
            throw new Error(dados.mensagem || "Não foi possível entrar.");
        }
        sessionStorage.setItem("professorLogado", JSON.stringify({
            ...dados.professor,
            token: dados.token
        }));
        document.getElementById("teacherLoginForm")?.reset();
        mostrarPortalProfessor(dados.professor);
        await carregarMateriaisProfessor();
        await iniciarChatProfessor();
    } catch (erro) {
        console.error("Erro ao entrar na área do professor:", erro);
        definirMensagemVisual(
            mensagem,
            erro.message || "Não foi possível entrar.",
            "error"
        );
    } finally {
        botao.disabled = false;
    }
}

async function cadastrarProfessor(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const botao = document.getElementById("teacherSignupButton");
    const mensagem = document.getElementById("teacherSignupMessage");
    if (!(formulario instanceof HTMLFormElement) || !botao || !mensagem) return;

    definirMensagemVisual(mensagem, "");
    botao.disabled = true;
    try {
        const resposta = await fetch(`${API_URL}/professores/cadastro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome: document.getElementById("teacherSignupName")?.value.trim(),
                email: document.getElementById("teacherSignupEmail")?.value.trim(),
                materia: document.getElementById("teacherSignupSubject")?.value.trim(),
                senha: document.getElementById("teacherSignupPassword")?.value
            })
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível enviar a solicitação.");
        }

        formulario.reset();
        definirMensagemVisual(
            mensagem,
            dados.mensagem || "Solicitação enviada para aprovação da administração."
        );
    } catch (erro) {
        console.error("Erro ao solicitar acesso de professor:", erro);
        definirMensagemVisual(
            mensagem,
            erro.message || "Não foi possível enviar a solicitação.",
            "error"
        );
    } finally {
        botao.disabled = false;
    }
}

async function publicarMaterialProfessor(evento) {
    evento.preventDefault();
    const botao = document.getElementById("publishProfessorResourceButton");
    const mensagem = document.getElementById("professorResourceMessage");
    const formulario = evento.currentTarget;
    if (!botao || !mensagem || !(formulario instanceof HTMLFormElement)) return;

    mensagem.textContent = "";
    const tipo = document.getElementById("professorResourceType")?.value;
    const visibilidade = tipo === "video"
        ? document.getElementById("professorResourceAudience")?.value || "todos"
        : "todos";
    const alunoId = visibilidade === "aluno"
        ? document.getElementById("professorResourceStudent")?.value
        : "";
    if (visibilidade === "aluno" && !alunoId) {
        mensagem.textContent = "Selecione a conversa do aluno que receberá o vídeo.";
        return;
    }

    botao.disabled = true;
    try {
        const resposta = await fetch(`${API_URL}/professores/recursos-educacionais`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...obterHeadersProfessor()
            },
            body: JSON.stringify({
                tipo,
                materia: document.getElementById("professorResourceSubject")?.value.trim(),
                titulo: document.getElementById("professorResourceTitle")?.value.trim(),
                url: document.getElementById("professorResourceUrl")?.value.trim(),
                descricao: document.getElementById("professorResourceDescription")?.value.trim(),
                visibilidade,
                alunoId
            })
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível publicar o material.");
        }
        formulario.reset();
        const materia = document.getElementById("professorResourceSubject");
        const professor = obterProfessorAtual();
        if (materia) materia.value = professor?.materia || "";
        atualizarVisibilidadeMaterialProfessor();
        mensagem.textContent = visibilidade === "aluno"
            ? "Vídeo publicado para o aluno selecionado."
            : "Material publicado e disponível para todos os alunos.";
        await carregarMateriaisProfessor();
    } catch (erro) {
        console.error("Erro ao publicar material como professor:", erro);
        mensagem.textContent = erro.message || "Não foi possível publicar o material.";
    } finally {
        botao.disabled = false;
    }
}

async function carregarMateriaisProfessor() {
    const lista = document.getElementById("teacherPortalResources");
    const professor = obterProfessorAtual();
    if (!lista || !professor) return;

    try {
        const resposta = await fetch(`${API_URL}/professores/recursos-educacionais`, {
            headers: obterHeadersProfessor()
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso || !Array.isArray(dados.recursos)) {
            throw new Error(dados.mensagem || "Não foi possível carregar os materiais.");
        }
        const materiais = dados.recursos;
        lista.replaceChildren();
        if (!materiais.length) {
            const vazio = document.createElement("p");
            vazio.textContent = "Você ainda não publicou materiais.";
            lista.appendChild(vazio);
            return;
        }
        materiais.forEach(recurso => {
            const cartao = criarCartaoRecurso(recurso);
            if (cartao) lista.appendChild(cartao);
        });
    } catch (erro) {
        console.error("Erro ao carregar materiais do professor:", erro);
        lista.textContent = "Não foi possível carregar seus materiais.";
    }
}

async function sairPortalProfessor() {
    const mensagem = document.getElementById("teacherLoginMessage");
    let erroLogout = null;
    try {
        const resposta = await fetch(`${API_URL}/professores/logout`, {
            method: "POST",
            headers: obterHeadersProfessor()
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível confirmar o encerramento da sessão.");
        }
    } catch (erro) {
        console.error("Erro ao encerrar sessão do professor:", erro);
        erroLogout = erro;
    } finally {
        sessionStorage.removeItem("professorLogado");
        mostrarPortalProfessor(null);
        if (mensagem) {
            definirMensagemVisual(
                mensagem,
                erroLogout
                    ? "Sessão encerrada neste dispositivo, mas não foi possível confirmar o encerramento no servidor."
                    : "Sessão encerrada com sucesso."
            );
        }
    }
}

async function inicializarPortalProfessor() {
    if (window.location.pathname.replace(/\/+$/, "") !== "/professor") return false;

    document.getElementById("authScreen")?.style.setProperty("display", "none");
    document.getElementById("siteContainer")?.style.setProperty("display", "none");
    const portal = document.getElementById("teacherPortal");
    if (portal) portal.style.display = "block";

    document.getElementById("teacherLoginForm")?.addEventListener("submit", entrarProfessor);
    document.getElementById("teacherSignupForm")?.addEventListener("submit", cadastrarProfessor);
    document.getElementById("professorResourceForm")?.addEventListener("submit", publicarMaterialProfessor);
    document.getElementById("professorResourceType")?.addEventListener("change", atualizarVisibilidadeMaterialProfessor);
    document.getElementById("professorResourceAudience")?.addEventListener("change", atualizarVisibilidadeMaterialProfessor);
    document.getElementById("teacherLogoutButton")?.addEventListener("click", sairPortalProfessor);
    document.getElementById("teacherChatReplyForm")?.addEventListener("submit", responderAlunoProfessor);
    atualizarVisibilidadeMaterialProfessor();

    const professor = obterProfessorAtual();
    if (professor?.token) {
        try {
            const resposta = await fetch(`${API_URL}/professores/sessao`, {
                headers: obterHeadersProfessor()
            });
            const dados = await resposta.json();
            if (!resposta.ok || !dados.sucesso) {
                throw new Error(dados.mensagem || "Sessão expirada.");
            }
            sessionStorage.setItem("professorLogado", JSON.stringify({
                ...dados.professor,
                token: professor.token
            }));
            mostrarPortalProfessor(dados.professor);
            await carregarMateriaisProfessor();
            await iniciarChatProfessor();
        } catch (erro) {
            console.error("Sessão de professor inválida:", erro);
            sessionStorage.removeItem("professorLogado");
            mostrarPortalProfessor(null);
        }
    } else {
        mostrarPortalProfessor(null);
    }
    return true;
}


/* ==========================================================================
   CONTROLE DE TELAS
   ========================================================================== */


function showView(viewName) {
    const views = {
        dashboard: document.getElementById("dashboardView"),
        about: document.getElementById("aboutView"),
        chat: document.getElementById("chatView"),
        adm: document.getElementById("admView")
    };

    const links = {
        dashboard: document.getElementById("linkDashboard"),
        about: document.getElementById("linkAbout"),
        chat: document.getElementById("linkChat"),
        adm: document.getElementById("linkAdm")
    };

    // Esconde todas as telas.
    Object.keys(views).forEach(function (name) {
        if (views[name]) {
            views[name].style.setProperty("display", "none", "important");
            views[name].classList.remove("admin-view-active");
        }

        if (links[name]) {
            links[name].classList.remove("active");
            links[name].removeAttribute("aria-current");
        }
    });

    // O painel administrativo fica bloqueado por padrão.
    document.body.classList.remove("admin-authenticated");

    if (!views[viewName]) {
        console.warn("Tela não encontrada:", viewName);
        return;
    }

    // Abre o painel administrativo somente com sessão válida.
    if (viewName === "adm") {
        const admin = verificarAdminLogado();

        if (!admin || !admin.token) {
            openAdminModal();
            return;
        }

        const authScreen = document.getElementById("authScreen");
        const siteContainer = document.getElementById("siteContainer");
        if (authScreen) authScreen.style.display = "none";
        if (siteContainer) siteContainer.style.display = "none";

        document.body.classList.add("admin-authenticated");
        views.adm.classList.add("admin-view-active");
        views.adm.style.setProperty("display", "flex", "important");
        window.scrollTo(0, 0);

        const adminName = document.getElementById("adminDashboardName");
        if (adminName) {
            adminName.textContent = admin.nome || "Administrador";
        }

        if (links.adm) {
            links.adm.classList.add("active");
            links.adm.setAttribute("aria-current", "page");
        }

        inicializarFormularioMonitorAdmin();
        inicializarRecursosEducacionais();
        carregarPainelAdmin();
        conectarSocketAdmin();
        carregarContasProfessoresAdmin();
        carregarSolicitacoesProfessoresAdmin();
        clearInterval(intervaloPollingAdmin);
        intervaloPollingAdmin = setInterval(function () {
            if (document.body.classList.contains("admin-authenticated")) {
                carregarPainelAdmin();
                carregarSolicitacoesProfessoresAdmin();
            }
        }, 60000);
    } else {
        // Exibe somente a tela selecionada.
        if (viewName === "dashboard") {
            views.dashboard.style.setProperty("display", "grid", "important");
        } else {
            views[viewName].style.setProperty("display", "flex", "important");
        }

        if (links[viewName]) {
            links[viewName].classList.add("active");
            links[viewName].setAttribute("aria-current", "page");
        }
    }

    // Fecha o menu lateral em dispositivos menores.
    const sidebar = document.getElementById("navSidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    // Inicializa o chat quando a tela é aberta.
    if (viewName === "chat") {
        inicializarChatIA();
    }
}



/* =========================================================================
   LOGIN DO ADMINISTRADOR
   ========================================================================== */

function openAdminModal() {

    const admin =
        verificarAdminLogado();

    if (window.location.pathname.replace(/\/+$/, "") === "/admin") {
        const authScreen = document.getElementById("authScreen");
        const siteContainer = document.getElementById("siteContainer");
        if (siteContainer) siteContainer.style.display = "none";
        if (authScreen) authScreen.style.display = "flex";
        toggleAuthMode("admin");
        document.getElementById("adminCardEmail")?.focus();
        return;
    }

    if (admin) {

        showView(
            "adm"
        );

        return;

    }


    const emailInput =
        document.getElementById(
            "adminEmailInput"
        );


    const passwordInput =
        document.getElementById(
            "adminPasswordInput"
        );


    if (emailInput) {

        emailInput.value =
            "";

    }


    if (passwordInput) {

        passwordInput.value =
            "";

    }


    const modal =
        document.getElementById(
            "adminAuthModal"
        );


    if (modal) {

        modal.classList.add(
            "active"
        );


        setTimeout(
            function () {

                if (emailInput) {

                    emailInput.focus();

                }

            },
            100
        );

    }

}


function closeAdminModal() {

    const modal =
        document.getElementById(
            "adminAuthModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

    if (window.location.pathname.replace(/\/+$/, "") === "/admin") {
        window.location.assign("/");
    }

}


/* ==========================================================================
   AUTENTICAÇÃO ADMIN - CABEÇALHOS
   ========================================================================== */

function obterHeadersAdmin() {

    const admin =
        verificarAdminLogado();


    const headers =
        {};


    if (
        admin &&
        admin.token
    ) {

        headers.Authorization =
            `Bearer ${admin.token}`;

    }


    return headers;

}


/* ==========================================================================
   LOGIN ADMINISTRATIVO
   ========================================================================== */

async function verifyAdminPassword() {

    const integratedCard =
        document.getElementById("adminLoginCard");

    const integratedLogin =
        Boolean(
            integratedCard &&
            integratedCard.style.display !== "none"
        );

    const emailInput =
        document.getElementById(
            integratedLogin ? "adminCardEmail" : "adminEmailInput"
        );


    const passwordInput =
        document.getElementById(
            integratedLogin ? "adminCardPassword" : "adminPasswordInput"
        );

    const mensagemLogin = document.getElementById(
        integratedLogin ? "adminCardLoginMessage" : "adminLoginMessage"
    );

    if (
        !emailInput ||
        !passwordInput
    ) {

        alert(
            "Campos de login do administrador não encontrados."
        );

        return;

    }


    const email =
        emailInput.value.trim();


    const senha =
        passwordInput.value;


    if (
        !email ||
        !senha
    ) {

        alert(
            "Preencha o e-mail e a senha."
        );

        return;

    }


    const botoes = integratedLogin
        ? [document.getElementById("adminCardLoginButton")].filter(Boolean)
        : Array.from(document.querySelectorAll("#adminAuthModal .btn-confirm"));

    if (mensagemLogin) {
        mensagemLogin.textContent = "";
        mensagemLogin.className = "auth-message";
    }


    botoes.forEach(
        function (botao) {

            botao.disabled =
                true;


            botao.innerText =
                "Acessando...";

        }
    );


    try {

        const resposta =
            await fetch(
                `${API_URL}/admin/login`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    credentials:
                        "include",

                    body:
                        JSON.stringify({

                            email:
                                email,

                            senha:
                                senha

                        })

                }
            );


        let dados =
            {};


        try {

            dados =
                await resposta.json();

        } catch (erro) {

            dados =
                {};

        }


        if (
            resposta.ok &&
            dados.sucesso
        ) {

            if (
                dados.usuario
            ) {

                const adminSessao = {

                    ...dados.usuario,

                    token:
                        dados.token ||
                        dados.usuario.token ||
                        null

                };


                sessionStorage.setItem(
                    "adminLogado",
                    JSON.stringify(
                        adminSessao
                    )
                );

            }


            if (!integratedLogin) {
                closeAdminModal();
            }


            emailInput.value =
                "";


            passwordInput.value =
                "";

            if (mensagemLogin) {
                mensagemLogin.textContent = "";
                mensagemLogin.className = "auth-message";
            }

            showView(
                "adm"
            );


            if (!integratedLogin) {
                alert("Login administrativo realizado com sucesso.");
            }

        } else {

            const mensagem = dados.mensagem || "E-mail ou senha incorretos.";
            if (mensagemLogin) {
                mensagemLogin.textContent = mensagem;
                mensagemLogin.className = "auth-message error show";
            } else {
                alert(mensagem);
            }

        }


    } catch (erro) {

        console.error(
            "Erro no login administrativo:",
            erro
        );


        const mensagem = "Não foi possível conectar ao servidor. Verifique se a aplicação está em execução.";
        if (mensagemLogin) {
            mensagemLogin.textContent = mensagem;
            mensagemLogin.className = "auth-message error show";
        } else {
            alert(mensagem);
        }


    } finally {

        botoes.forEach(
            function (botao) {

                botao.disabled =
                    false;


                botao.innerHTML = integratedLogin
                    ? "Entrar no painel administrativo"
                    : "Acessar";

            }
        );

    }

}


/* ==========================================================================
   VERIFICAR ADMINISTRADOR
   ========================================================================== */

function verificarAdminLogado() {

    const salvo =
        sessionStorage.getItem(
            "adminLogado"
        );


    if (!salvo) {

        return null;

    }


    try {

        return JSON.parse(
            salvo
        );

    } catch (erro) {

        sessionStorage.removeItem(
            "adminLogado"
        );

        return null;

    }

}


/* ==========================================================================
   LOGOUT ADMIN
   ========================================================================== */

async function logoutAdmin() {

    try {

        await fetch(
            `${API_URL}/admin/logout`,
            {

                method:
                    "POST",

                credentials:
                    "include",

                headers:
                    obterHeadersAdmin()

            }
        );

    } catch (erro) {

        console.warn(
            "Erro ao realizar logout administrativo:",
            erro
        );

    }


    sessionStorage.removeItem(
        "adminLogado"
    );

    desconectarSocketAdmin();
    clearInterval(intervaloPollingAdmin);
    intervaloPollingAdmin = null;

    document.body.classList.remove("admin-authenticated");

    const admView = document.getElementById("admView");
    if (admView) {
        admView.classList.remove("admin-view-active");
        admView.style.setProperty("display", "none", "important");
    }

    const siteContainer = document.getElementById("siteContainer");
    const authScreen = document.getElementById("authScreen");
    if (verificarUsuarioLogado()) {
        if (authScreen) authScreen.style.display = "none";
        if (siteContainer) siteContainer.style.display = "flex";
        showView("dashboard");
    } else if (authScreen && siteContainer) {
        siteContainer.style.display = "none";
        authScreen.style.display = "flex";
        toggleAuthMode("login");
        return;
    }

    if (siteContainer) siteContainer.style.display = "flex";

}


/* ==========================================================================
   AUTENTICAÇÃO DO ALUNO
   ========================================================================== */

function toggleAuthMode(
    mode
) {

    const loginCard =
        document.getElementById(
            "loginCard"
        );


    const registerCard =
        document.getElementById(
            "registerCard"
        );

    const adminLoginCard =
        document.getElementById(
            "adminLoginCard"
        );


    if (
        !loginCard ||
        !registerCard ||
        !adminLoginCard
    ) {

        return;

    }

    loginCard.style.display = "none";
    registerCard.style.display = "none";
    adminLoginCard.style.display = "none";

    if (
        mode === "register"
    ) {

        registerCard.style.display = "block";

    } else if (mode === "admin") {

        adminLoginCard.style.display = "block";

    } else {

        loginCard.style.display = "block";

    }

}


/* ==========================================================================
   LOGIN / CADASTRO
   ========================================================================== */

async function handleAuth(
    event
) {

    event.preventDefault();


    const form =
        event.target;


    if (!form) {

        return;

    }


    const registerCard =
        document.getElementById(
            "registerCard"
        );


    const isRegister =
        registerCard &&
        registerCard.contains(
            form
        );


    const inputs =
        form.querySelectorAll(
            "input"
        );


    let dadosEnvio =
        {};


    if (isRegister) {

        const nome =
            inputs[0]?.value.trim();


        const email =
            inputs[1]?.value.trim();


        const senha =
            inputs[2]?.value;


        if (
            !nome ||
            !email ||
            !senha
        ) {

            alert(
                "Preencha todos os campos."
            );

            return;

        }


        if (
            senha.length < 6
        ) {

            alert(
                "A senha deve possuir pelo menos 6 caracteres."
            );

            return;

        }


        dadosEnvio = {

            nome:
                nome,

            email:
                email,

            senha:
                senha

        };

    } else {

        const email =
            inputs[0]?.value.trim();


        const senha =
            inputs[1]?.value;


        if (
            !email ||
            !senha
        ) {

            alert(
                "Preencha o e-mail e a senha."
            );

            return;

        }


        dadosEnvio = {

            email:
                email,

            senha:
                senha

        };

    }


    const endpoint =
        isRegister
            ? `${API_URL}/alunos/cadastro`
            : `${API_URL}/alunos/login`;


    const botao =
        form.querySelector(
            "button[type='submit']"
        );


    if (botao) {

        botao.disabled =
            true;


        botao.innerText =
            isRegister
                ? "Cadastrando..."
                : "Entrando...";

    }


    try {

        const resposta =
            await fetch(
                endpoint,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    credentials:
                        "include",

                    body:
                        JSON.stringify(
                            dadosEnvio
                        )

                }
            );


        let dados =
            {};


        try {

            dados =
                await resposta.json();

        } catch (erro) {

            dados =
                {};

        }


        if (
            resposta.ok &&
            dados.sucesso
        ) {

            if (
                dados.usuario
            ) {

                const usuarioSessao = {
                    ...dados.usuario,
                    token: dados.token
                };

                sessionStorage.setItem(
                    "usuarioLogado",
                    JSON.stringify(usuarioSessao)
                );

            }


            const authScreen =
                document.getElementById(
                    "authScreen"
                );


            const siteContainer =
                document.getElementById(
                    "siteContainer"
                );


            if (
                authScreen &&
                siteContainer
            ) {

                authScreen.style.opacity =
                    "0";


                authScreen.style.transform =
                    "scale(0.95)";


                setTimeout(
                    function () {

                        authScreen.style.display =
                            "none";


                        siteContainer.style.display =
                            "flex";


                        authScreen.style.opacity =
                            "1";


                        authScreen.style.transform =
                            "scale(1)";


                        atualizarUsuarioNaInterface();


                        showView(
                            "dashboard"
                        );

                        carregarRecursosEducacionais();

                    },
                    400
                );

            }


            if (
                isRegister
            ) {

                alert(
                    dados.emailEnviado
                        ? `Cadastro realizado com sucesso! Enviamos uma confirmação para ${dados.usuario.email}. Verifique também a caixa de spam.`
                        : `Cadastro realizado, mas não foi possível enviar a confirmação para ${dados.usuario.email}. Verifique se o endereço está correto e confira a configuração de e-mail da plataforma.`
                );

            }

        } else {

            alert(
                dados.mensagem ||
                (
                    isRegister
                        ? "Não foi possível realizar o cadastro."
                        : "E-mail ou senha incorretos."
                )
            );

        }


    } catch (erro) {

        console.error(
            "Erro de autenticação:",
            erro
        );


        alert(
            "Não foi possível conectar ao servidor.\n\n" +
            "Verifique se o Node.js está funcionando."
        );


    } finally {

        if (botao) {

            botao.disabled =
                false;


            botao.innerText =
                isRegister
                    ? "Concluir Cadastro"
                    : "Entrar no Painel";

        }

    }

}


/* ==========================================================================
   VERIFICAR USUÁRIO
   ========================================================================== */

function verificarUsuarioLogado() {

    const salvo =
        sessionStorage.getItem(
            "usuarioLogado"
        );


    if (!salvo) {

        return null;

    }


    try {

        return JSON.parse(
            salvo
        );

    } catch (erro) {

        sessionStorage.removeItem(
            "usuarioLogado"
        );

        return null;

    }

}


/* ==========================================================================
   ATUALIZAR USUÁRIO NA INTERFACE
   ========================================================================== */

function atualizarUsuarioNaInterface() {

    const usuario =
        verificarUsuarioLogado();


    if (!usuario) {

        return;

    }


    const nome =
        usuario.nome ||
        usuario.nome_completo ||
        "Aluno(a)";


    const email =
        usuario.email ||
        "aluno@email.com";


    const nomeElementos =
        document.querySelectorAll(
            ".user-name, #userName, #profileName"
        );


    nomeElementos.forEach(
        function (elemento) {

            elemento.textContent =
                nome;

        }
    );


    const emailElementos =
        document.querySelectorAll(
            ".user-email, #userEmail, #profileEmail"
        );


    emailElementos.forEach(
        function (elemento) {

            elemento.textContent =
                email;

        }
    );


    const avatarElementos =
        document.querySelectorAll(
            ".user-avatar, #userAvatar, #profileAvatar"
        );


    const iniciais =
        nome
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
                function (parte) {

                    return parte
                        .charAt(0)
                        .toUpperCase();

                }
            )
            .join("");


    avatarElementos.forEach(
        function (elemento) {

            elemento.textContent =
                iniciais ||
                "AL";

        }
    );

}

/* ==========================================================================
   LOGOUT DO ALUNO
   ========================================================================== */

async function logout() {

    const usuario =
        verificarUsuarioLogado();

    reiniciarChatIA();

    document.body.classList.remove("admin-authenticated");

    const admViewOnLogout = document.getElementById("admView");
    if (admViewOnLogout) {
        admViewOnLogout.classList.remove("admin-view-active");
        admViewOnLogout.style.setProperty("display", "none", "important");
    }

    try {

        if (usuario?.token) {
            await fetch(
                `${API_URL}/alunos/logout`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${usuario.token}`
                    }
                }
            );
        }

    } catch (erro) {

        console.warn(
            "Logout do servidor não realizado.",
            erro
        );

    }

    sessionStorage.removeItem(
        "usuarioLogado"
    );

    sessionStorage.removeItem(
        "adminLogado"
    );


    const authScreen =
        document.getElementById(
            "authScreen"
        );


    const siteContainer =
        document.getElementById(
            "siteContainer"
        );


    if (
        !authScreen ||
        !siteContainer
    ) {

        return;

    }


    siteContainer.style.display =
        "none";


    authScreen.style.display =
        "flex";


    authScreen.style.opacity =
        "1";


    authScreen.style.transform =
        "scale(1)";


    toggleAuthMode(
        "login"
    );

}


/* ==========================================================================
   EXCLUIR CONTA DO ALUNO
   ========================================================================== */

async function excluirMinhaConta() {

    const usuario =
        verificarUsuarioLogado();


    if (!usuario || !usuario.token) {

        alert(
            "Sua sessão precisa ser atualizada. Saia da conta e entre novamente antes de excluí-la."
        );

        return;

    }


    const confirmar =
        window.confirm(
            "Tem certeza de que deseja excluir sua conta? Seus agendamentos, notificações e histórico do chat também serão apagados. Esta ação não pode ser desfeita."
        );


    if (!confirmar) {
        return;
    }


    const senha =
        window.prompt(
            "Informe sua senha atual para confirmar a exclusão da conta:"
        );


    if (senha === null) {
        return;
    }


    if (!senha.trim()) {

        alert(
            "Informe sua senha para confirmar a exclusão."
        );

        return;

    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/alunos/conta`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${usuario.token}`
                    },
                    credentials: "include",
                    body: JSON.stringify({ senha })
                }
            );

        const dados =
            await resposta.json();


        if (!resposta.ok || !dados.sucesso) {

            alert(
                dados.mensagem ||
                "Não foi possível excluir sua conta."
            );

            return;

        }


        await logout();

        alert(
            dados.mensagem ||
            "Sua conta foi excluída com sucesso."
        );


    } catch (erro) {

        console.error(
            "Erro ao excluir a conta:",
            erro
        );

        alert(
            "Não foi possível conectar ao servidor para excluir sua conta."
        );

    }

}


/* ==========================================================================
   MENU SANDUÍCHE
   ========================================================================== */

function inicializarMenu() {

    const sandwichBtn =
        document.getElementById(
            "sandwichBtn"
        );


    const navSidebar =
        document.getElementById(
            "navSidebar"
        );


    if (
        !sandwichBtn ||
        !navSidebar
    ) {

        return;

    }


    if (
        sandwichBtn.dataset.initialized ===
        "true"
    ) {

        return;

    }


    sandwichBtn.dataset.initialized =
        "true";


    sandwichBtn.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            navSidebar.classList.toggle(
                "open"
            );

        }
    );


    document.addEventListener(
        "click",
        function (event) {

            if (
                !navSidebar.contains(
                    event.target
                ) &&
                event.target !==
                    sandwichBtn
            ) {

                navSidebar.classList.remove(
                    "open"
                );

            }

        }
    );

}


/* ==========================================================================
   VARIÁVEIS DO AGENDAMENTO
   ========================================================================== */

let modal = null;

let alertToast = null;

let selectedDayText = null;

let currentDayElement = null;

let savedDay = 0;

let agendamentos = [];
let meusAgendamentos = [];

let dataAtual =
    new Date();


/*
   Horários padrão da monitoria.
   Se o seu HTML já tiver opções no select,
   elas serão usadas automaticamente.
*/

const HORARIOS_PADRAO = [

    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00"

];


/* ==========================================================================
   INICIALIZAR ELEMENTOS DE AGENDAMENTO
   ========================================================================== */

function inicializarElementosAgendamento() {

    modal =
        document.getElementById(
            "scheduleModal"
        );


    alertToast =
        document.getElementById(
            "alertToast"
        );


    selectedDayText =
        document.getElementById(
            "selectedDayText"
        );

    renderizarCalendario();

    prepararHorariosPadrao();

}


/* ==========================================================================
   PREPARAR HORÁRIOS
   ========================================================================== */

function prepararHorariosPadrao() {

    const scheduleTime =
        document.getElementById(
            "scheduleTime"
        );


    if (!scheduleTime) {

        return;

    }


    /*
       Se o select estiver vazio,
       criamos os horários automaticamente.
    */

    const opcoes =
        Array.from(
            scheduleTime.options
        ).filter(function (option) {

            return Boolean(
                option.value
            );

        });


    if (opcoes.length === 0) {

        HORARIOS_PADRAO.forEach(
            function (horario) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    horario;


                option.textContent =
                    horario;


                scheduleTime.appendChild(
                    option
                );

            }
        );

    }

}


/* ==========================================================================
   CARREGAR PROFESSORES
   ========================================================================== */

async function carregarMonitores() {

    const monitorSelect =
        document.getElementById(
            "monitorSelect"
        );


    const monitorCards =
        document.getElementById(
            "monitorCards"
        );


    if (!monitorSelect) {

        return;

    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/monitores`
            );


        if (!resposta.ok) {

            throw new Error(
                `HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        if (
            !dados.sucesso ||
            !Array.isArray(
                dados.monitores
            )
        ) {

            throw new Error(
                "Lista de professores inválida."
            );

        }


        monitorSelect.innerHTML =
            '<option value="">Selecione um professor</option>';


        dados.monitores.forEach(
            function (monitor) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    monitor.id;


                option.textContent =
                    `${monitor.nome} - ${monitor.materia}`;


                monitorSelect.appendChild(
                    option
                );

            }
        );


        renderizarCardsMonitores(
            dados.monitores
        );


        if (
            monitorSelect.dataset.listenerAgendamento !==
            "true"
        ) {

            monitorSelect.addEventListener(
                "change",
                function () {

                    atualizarCardsProfessorSelecionado();

                    atualizarHorariosDisponiveis();

                    atualizarResumoAgendamento();

                }
            );


            monitorSelect.dataset.listenerAgendamento =
                "true";

        }


    } catch (erro) {

        console.error(
            "Erro ao carregar professores:",
            erro
        );


        if (monitorCards) {

            monitorCards.innerHTML = `
                <div class="schedule-empty">
                    Não foi possível carregar os professores.
                </div>
            `;

        }

    }

}


/* ==========================================================================
   CARDS DOS PROFESSORES
   ========================================================================== */

function renderizarCardsMonitores(
    monitores
) {

    const container =
        document.getElementById(
            "monitorCards"
        );


    if (!container) {

        return;

    }


    if (
        !Array.isArray(monitores) ||
        monitores.length === 0
    ) {

        container.innerHTML = `
            <div class="schedule-empty">
                Nenhum professor disponível.
            </div>
        `;

        return;

    }


    container.innerHTML =
        monitores.map(
            function (monitor) {

                const nome =
                    monitor.nome ||
                    "Professor";


                const materia =
                    monitor.materia ||
                    "Monitoria";


                const partes =
                    String(nome)
                        .split(/\s+/)
                        .filter(Boolean);


                const iniciais =
                    partes
                        .slice(0, 2)
                        .map(
                            function (parte) {

                                return parte[0];

                            }
                        )
                        .join("")
                        .toUpperCase();


                return `
                    <button
                        type="button"
                        class="monitor-card"
                        data-monitor-id="${escaparHTML(monitor.id)}"
                        onclick="selecionarMonitor('${escaparHTML(monitor.id)}')"
                    >

                        <span class="monitor-avatar">
                            ${escaparHTML(iniciais || "P")}
                        </span>

                        <span class="monitor-card-info">

                            <strong>
                                ${escaparHTML(nome)}
                            </strong>

                            <small>
                                ${escaparHTML(materia)}
                            </small>

                        </span>

                        <i class="fa-solid fa-check monitor-card-check"></i>

                    </button>
                `;

            }
        )
        .join("");

}


/* ==========================================================================
   SELECIONAR PROFESSOR
   ========================================================================== */

function selecionarMonitor(
    monitorId
) {

    const select =
        document.getElementById(
            "monitorSelect"
        );


    if (!select) {

        return;

    }


    select.value =
        String(monitorId);


    ultimoEstadoDisponibilidadeServidor = null;
    atualizarCardsProfessorSelecionado();
    atualizarHorariosDisponiveis();
    atualizarResumoAgendamento();
    consultarDisponibilidadeServidor();

}


/* ==========================================================================
   ATUALIZAR CARD DO PROFESSOR
   ========================================================================== */

function atualizarCardsProfessorSelecionado() {

    const select =
        document.getElementById(
            "monitorSelect"
        );


    if (!select) {

        return;

    }


    const monitorId =
        String(
            select.value || ""
        );


    document
        .querySelectorAll(
            "#monitorCards .monitor-card"
        )
        .forEach(
            function (card) {

                card.classList.toggle(
                    "selected",
                    String(
                        card.dataset.monitorId
                    ) === monitorId
                );

            }
        );

}


/* ==========================================================================
   ATUALIZAR HORÁRIOS
   ========================================================================== */

function atualizarHorariosDisponiveis() {

    const monitorSelect =
        document.getElementById(
            "monitorSelect"
        );


    const scheduleTime =
        document.getElementById(
            "scheduleTime"
        );


    const timeSlots =
        document.getElementById(
            "timeSlots"
        );


    if (!monitorSelect) {

        return;

    }


    if (!scheduleTime) {

        return;

    }


    prepararHorariosPadrao();


    const monitorId =
        monitorSelect.value;


    if (
        !monitorId ||
        !savedDay
    ) {

        if (timeSlots) {

            timeSlots.innerHTML = `
                <div class="schedule-empty">
                    Escolha um professor para ver os horários.
                </div>
            `;

        }

        return;

    }


    const ano =
        dataAtual.getFullYear();


    const mes =
        dataAtual.getMonth();


    const opcoes =
        Array.from(
            scheduleTime.options
        ).filter(
            function (option) {

                return Boolean(
                    option.value
                );

            }
        );


    /*
       Mantemos o select sincronizado.
    */

    opcoes.forEach(
        function (option) {

            const ocupado =
                horarioEstaOcupado(
                    monitorId,
                    ano,
                    mes,
                    savedDay,
                    option.value
                );


            /*
               IMPORTANTE:
               horário ocupado NÃO é desabilitado.
               Ele continua podendo ser escolhido.
            */

            option.disabled =
                false;


            if (ocupado) {

                option.textContent =
                    `${option.value} - Ocupado`;

                option.dataset.ocupado =
                    "true";

            } else {

                option.textContent =
                    option.value;

                option.dataset.ocupado =
                    "false";

            }

        }
    );


    /*
       Cria os botões visuais dos horários.
    */

    if (timeSlots) {

        timeSlots.innerHTML =
            opcoes.map(
                function (option) {

                    const horario =
                        option.value;


                    const ocupado =
                        horarioEstaOcupado(
                            monitorId,
                            ano,
                            mes,
                            savedDay,
                            horario
                        );


                    return `
                        <button
                            type="button"
                            class="time-slot ${
                                ocupado
                                    ? "occupied"
                                    : "available"
                            }"
                            data-time="${escaparHTML(horario)}"
                            onclick="selecionarHorario('${escaparHTML(horario)}')"
                        >

                            <span class="time-slot-main">

                                <i class="fa-regular fa-clock"></i>

                                ${escaparHTML(horario)}

                            </span>

                            <span class="time-slot-status">

                                ${
                                    ocupado
                                        ? `
                                            <i class="fa-solid fa-circle-xmark"></i>
                                            Ocupado
                                          `
                                        : `
                                            <i class="fa-solid fa-circle-check"></i>
                                            Disponível
                                          `
                                }

                            </span>

                        </button>
                    `;

                }
            )
            .join("");

    }


    atualizarResumoAgendamento();

}


/* ==========================================================================
   SELECIONAR HORÁRIO
   ========================================================================== */

function selecionarHorario(
    horario
) {

    const scheduleTime =
        document.getElementById(
            "scheduleTime"
        );


    if (!scheduleTime) {

        return;

    }


    scheduleTime.value =
        horario;


    document
        .querySelectorAll(
            "#timeSlots .time-slot"
        )
        .forEach(
            function (slot) {

                slot.classList.toggle(
                    "selected",
                    slot.dataset.time ===
                        horario
                );

            }
        );


    ultimoEstadoDisponibilidadeServidor = null;
    atualizarAvisoHorarioOcupado();
    atualizarResumoAgendamento();
    consultarDisponibilidadeServidor();

}


/* ==========================================================================
   AVISO DE HORÁRIO OCUPADO
   ========================================================================== */


/* Disponibilidade consultada no servidor para sincronizar entre alunos/sessões. */
let verificacaoDisponibilidadeEmCurso = false;
let ultimoEstadoDisponibilidadeServidor = null;
let temporizadorDisponibilidadeAgendamento = null;

function obterDataSelecionadaAgendamento() {
    if (!savedDay) return "";
    return `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, "0")}-${String(savedDay).padStart(2, "0")}`;
}

async function consultarDisponibilidadeServidor() {
    const monitorSelect = document.getElementById("monitorSelect");
    const scheduleTime = document.getElementById("scheduleTime");
    const warning = document.getElementById("occupiedScheduleWarning");
    const confirmButton = document.querySelector("#scheduleModal .btn-confirm");
    if (!monitorSelect || !scheduleTime || !warning) return null;

    const monitorId = monitorSelect.value;
    const data = obterDataSelecionadaAgendamento();
    const horario = scheduleTime.value;
    if (!monitorId || !data || !horario) {
        ultimoEstadoDisponibilidadeServidor = null;
        atualizarAvisoHorarioOcupado();
        if (confirmButton) confirmButton.disabled = false;
        return null;
    }
    if (verificacaoDisponibilidadeEmCurso) return ultimoEstadoDisponibilidadeServidor;
    verificacaoDisponibilidadeEmCurso = true;
    try {
        const params = new URLSearchParams({ monitorId, data, horario });
        const response = await fetch(`${API_URL}/agendamentos/disponibilidade?${params.toString()}`, {
            method: "GET",
            credentials: "include",
            cache: "no-store"
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.sucesso !== true) throw new Error(result.mensagem || "Não foi possível consultar a disponibilidade.");
        ultimoEstadoDisponibilidadeServidor = result.disponivel === false || result.ocupado === true;
        atualizarAvisoHorarioOcupado();
        if (confirmButton) confirmButton.disabled = ultimoEstadoDisponibilidadeServidor;
        return ultimoEstadoDisponibilidadeServidor;
    } catch (error) {
        console.warn("[AGENDAMENTO] Não foi possível consultar a disponibilidade online:", error);
        // Falha de rede não deve afirmar que o horário está livre; a API fará a validação final.
        ultimoEstadoDisponibilidadeServidor = null;
        if (confirmButton) confirmButton.disabled = false;
        return null;
    } finally {
        verificacaoDisponibilidadeEmCurso = false;
    }
}

function iniciarAtualizacaoDisponibilidadeAgendamento() {
    pararAtualizacaoDisponibilidadeAgendamento();
    consultarDisponibilidadeServidor();
    temporizadorDisponibilidadeAgendamento = setInterval(() => {
        const modal = document.getElementById("scheduleModal");
        if (!modal || !modal.classList.contains("active")) {
            pararAtualizacaoDisponibilidadeAgendamento();
            return;
        }
        consultarDisponibilidadeServidor();
    }, 4000);
}

function pararAtualizacaoDisponibilidadeAgendamento() {
    if (temporizadorDisponibilidadeAgendamento) {
        clearInterval(temporizadorDisponibilidadeAgendamento);
        temporizadorDisponibilidadeAgendamento = null;
    }
}

function atualizarAvisoHorarioOcupado() {
    const warning = document.getElementById("occupiedScheduleWarning");
    const monitorSelect = document.getElementById("monitorSelect");
    const scheduleTime = document.getElementById("scheduleTime");
    if (!warning || !monitorSelect || !scheduleTime) return;

    const localOccupied = Boolean(monitorSelect.value) &&
        Boolean(scheduleTime.value) &&
        horarioEstaOcupado(
            monitorSelect.value,
            dataAtual.getFullYear(),
            dataAtual.getMonth(),
            savedDay,
            scheduleTime.value
        );
    const occupied = localOccupied || ultimoEstadoDisponibilidadeServidor === true;
    warning.hidden = !occupied;

    const message = warning.querySelector("span");
    if (message) {
        message.textContent = occupied
            ? "Este professor já tem uma reserva nessa data e horário. Escolha outro horário para continuar."
            : "Este horário está disponível para agendamento.";
    }

    const confirmButton = document.querySelector("#scheduleModal .btn-confirm");
    if (confirmButton && occupied) confirmButton.disabled = true;
}

/* ==========================================================================
   RESUMO DO AGENDAMENTO
   ========================================================================== */

function atualizarResumoAgendamento() {

    const summary =
        document.getElementById(
            "scheduleSummary"
        );


    const monitorSelect =
        document.getElementById(
            "monitorSelect"
        );


    const scheduleTime =
        document.getElementById(
            "scheduleTime"
        );


    if (
        !summary ||
        !monitorSelect ||
        !scheduleTime
    ) {

        return;

    }


    const option =
        monitorSelect.options[
            monitorSelect.selectedIndex
        ];


    const professor =
        option &&
        option.value
            ? option.textContent
            : "Nenhum professor";


    const horario =
        scheduleTime.value ||
        "Nenhum horário";


    summary.innerHTML = `
        <i class="fa-solid fa-circle-info"></i>

        <span>

            <strong>Resumo:</strong>

            ${escaparHTML(professor)}

            •

            ${escaparHTML(horario)}

        </span>
    `;


    atualizarAvisoHorarioOcupado();

}


/* ==========================================================================
   CARREGAR AGENDAMENTOS
   ========================================================================== */

async function carregarAgendamentos() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/agendamentos`,
                {

                    method: "GET",

                    credentials: "include"

                }
            );


        if (!resposta.ok) {

            console.warn(
                "Não foi possível carregar os agendamentos."
            );

            return;

        }


        const dados =
            await resposta.json();


        if (
            dados.sucesso &&
            Array.isArray(
                dados.agendamentos
            )
        ) {

            agendamentos =
                dados.agendamentos;

        } else if (
            Array.isArray(dados)
        ) {

            agendamentos =
                dados;

        } else {

            agendamentos =
                [];

        }


        renderizarCalendario();


        atualizarTabelaAgendamentos();


        atualizarContadorAgendamentos();


        carregarNotificacoes();


    } catch (erro) {

        console.error(
            "Erro ao carregar agendamentos:",
            erro
        );

    }

}


async function abrirMeusAgendamentos({ mensagemSucesso = "" } = {}) {
    const modalAgendamentos = document.getElementById("studentAppointmentsModal");
    const lista = document.getElementById("studentAppointmentsList");
    const usuario = verificarUsuarioLogado();

    if (!modalAgendamentos || !lista) {
        console.error("A área de agendamentos do aluno não foi encontrada.");
        return;
    }

    if (!usuario?.token) {
        alert("Faça login novamente para consultar seus agendamentos.");
        return;
    }

    modalAgendamentos.classList.add("active");
    modalAgendamentos.setAttribute("aria-hidden", "false");
    lista.innerHTML = '<div class="student-appointments-message">Carregando seus agendamentos...</div>';

    try {
        const resposta = await fetch(`${API_URL}/agendamentos/meus`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${usuario.token}`
            },
            credentials: "include"
        });
        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso || !Array.isArray(dados.agendamentos)) {
            throw new Error(dados.mensagem || "Não foi possível carregar seus agendamentos.");
        }

        meusAgendamentos = dados.agendamentos;
        renderizarMeusAgendamentos(mensagemSucesso);
    } catch (erro) {
        console.error("Erro ao carregar agendamentos do aluno:", erro);
        lista.innerHTML = `
            <div class="student-appointments-message is-error">
                ${escaparHTML(erro.message || "Não foi possível carregar seus agendamentos. Tente novamente.")}
            </div>
        `;
    }
}

function fecharMeusAgendamentos() {
    const modalAgendamentos = document.getElementById("studentAppointmentsModal");
    if (!modalAgendamentos) return;

    modalAgendamentos.classList.remove("active");
    modalAgendamentos.setAttribute("aria-hidden", "true");
}

function renderizarMeusAgendamentos(mensagemSucesso = "") {
    const lista = document.getElementById("studentAppointmentsList");
    if (!lista) return;

    if (meusAgendamentos.length === 0) {
        lista.innerHTML = `
            ${mensagemSucesso ? `<div class="student-appointments-success" role="status">${escaparHTML(mensagemSucesso)}</div>` : ""}
            <div class="student-appointments-message">
                <i class="fa-regular fa-calendar"></i>
                <strong>Você ainda não tem monitorias agendadas.</strong>
                <span>Quando fizer um agendamento, ele aparecerá aqui.</span>
            </div>
        `;
        return;
    }

    const agora = Date.now();
    const proximos = [];
    const historico = [];

    meusAgendamentos.forEach(agendamento => {
        const data = agendamento.data_agendamento || agendamento.data;
        const dataObj = data ? new Date(data) : null;
        const cancelado = ["cancelado", "cancelada", "canceled", "cancelled"]
            .includes(String(agendamento.status || "").toLocaleLowerCase("pt-BR"));
        if (!cancelado && dataObj && !Number.isNaN(dataObj.getTime()) && dataObj.getTime() > agora) {
            proximos.push(agendamento);
        } else {
            historico.push(agendamento);
        }
    });

    proximos.sort((a, b) => new Date(a.data_agendamento || a.data) - new Date(b.data_agendamento || b.data));
    historico.sort((a, b) => new Date(b.data_agendamento || b.data) - new Date(a.data_agendamento || a.data));

    const renderizarCartao = agendamento => {
        const data = agendamento.data_agendamento || agendamento.data;
        const dataObj = data ? new Date(data) : null;
        const dataValida = dataObj && !Number.isNaN(dataObj.getTime());
        const status = String(agendamento.status || "Confirmado");
        const cancelado = ["cancelado", "cancelada", "canceled", "cancelled"]
            .includes(status.toLocaleLowerCase("pt-BR"));
        const podeCancelar = !cancelado && dataValida && dataObj.getTime() > Date.now();
        const dataFormatada = dataValida
            ? dataObj.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            })
            : "Data não informada";
        const horario = dataValida
            ? dataObj.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit"
            })
            : "--:--";
        const monitor = agendamento.monitor_nome || agendamento.monitor || "Monitor não informado";
        const materia = agendamento.monitor_materia || agendamento.materia || "";
        const id = escaparHTML(agendamento.id);

        return `
            <article class="student-appointment-card">
                <div class="student-appointment-date">
                    <span class="student-appointment-date-icon">
                        <i class="fa-regular fa-calendar-check"></i>
                    </span>
                    <div>
                        <strong>${escaparHTML(dataFormatada)}</strong>
                        <span>Às ${escaparHTML(horario)}</span>
                    </div>
                </div>
                <div class="student-appointment-details">
                    <strong>${escaparHTML(monitor)}</strong>
                    ${materia ? `<span>${escaparHTML(materia)}</span>` : ""}
                </div>
                <div class="student-appointment-actions">
                    <span class="student-appointment-status${cancelado ? " is-cancelled" : ""}">
                        ${escaparHTML(status)}
                    </span>
                    ${podeCancelar ? `
                        <button
                            type="button"
                            class="student-appointment-cancel"
                            onclick="cancelarMeuAgendamento('${id}', this)"
                        >
                            <i class="fa-regular fa-calendar-xmark"></i>
                            Cancelar monitoria
                        </button>
                    ` : ""}
                </div>
            </article>
        `;
    };

    const renderizarGrupo = (titulo, agendamentos, classe) => agendamentos.length
        ? `
            <section class="student-appointment-group ${classe}" aria-label="${titulo}">
                <div class="student-appointment-group-heading">
                    <h3>${titulo}</h3>
                    <span>${agendamentos.length}</span>
                </div>
                ${agendamentos.map(renderizarCartao).join("")}
            </section>
        `
        : "";

    lista.innerHTML = `
        ${mensagemSucesso ? `<div class="student-appointments-success" role="status">${escaparHTML(mensagemSucesso)}</div>` : ""}
        ${renderizarGrupo("Próximas monitorias", proximos, "is-upcoming")}
        ${renderizarGrupo("Histórico", historico, "is-history")}
    `;
}

async function cancelarMeuAgendamento(id, botao) {
    const usuario = verificarUsuarioLogado();
    if (!usuario?.token) {
        alert("Faça login novamente para cancelar uma monitoria.");
        return;
    }

    if (!confirm("Deseja cancelar esta monitoria?")) return;

    if (botao) {
        botao.disabled = true;
        botao.textContent = "Cancelando...";
    }

    try {
        const resposta = await fetch(
            `${API_URL}/agendamentos/${encodeURIComponent(id)}/cancelar`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${usuario.token}`
                },
                credentials: "include"
            }
        );
        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível cancelar a monitoria.");
        }

        const agendamentoId = String(id);
        meusAgendamentos = meusAgendamentos.map(agendamento =>
            String(agendamento.id) === agendamentoId
                ? { ...agendamento, status: "cancelado" }
                : agendamento
        );
        agendamentos = agendamentos.map(agendamento =>
            String(agendamento.id) === agendamentoId
                ? { ...agendamento, status: "cancelado" }
                : agendamento
        );

        renderizarCalendario();
        renderizarMeusAgendamentos(
            dados.mensagem || "Agendamento cancelado com sucesso."
        );
    } catch (erro) {
        console.error("Erro ao cancelar agendamento do aluno:", erro);
        alert(erro.message || "Não foi possível cancelar a monitoria. Tente novamente.");
        if (botao) {
            botao.disabled = false;
            botao.innerHTML = '<i class="fa-regular fa-calendar-xmark"></i> Cancelar monitoria';
        }
    }
}


/* ========================================================================== 
   VERIFICAR SE O DIA POSSUI AGENDAMENTO
   ========================================================================== */

function diaEstaOcupado(
    ano,
    mes,
    dia
) {

    return agendamentos.some(
        function (agendamento) {

            const data =
                agendamento.data_agendamento ||
                agendamento.data ||
                agendamento.dataAgendamento;


            if (!data) {

                return false;

            }


            const dataObj =
                new Date(data);


            if (
                isNaN(
                    dataObj.getTime()
                )
            ) {

                return false;

            }


            return (

                dataObj.getFullYear() ===
                    ano &&

                dataObj.getMonth() ===
                    mes &&

                dataObj.getDate() ===
                    dia &&

                (
                    !agendamento.status ||
                    agendamento.status ===
                        "Confirmado"
                )

            );

        }
    );

}


/* ==========================================================================
   VERIFICAR HORÁRIO OCUPADO
   ========================================================================== */

function horarioEstaOcupado(
    monitorId,
    ano,
    mes,
    dia,
    horario
) {

    return agendamentos.some(
        function (agendamento) {

            if (
                String(
                    agendamento.monitor_id
                ) !==
                String(monitorId)
            ) {

                return false;

            }


            const data =
                agendamento.data_agendamento ||
                agendamento.data ||
                agendamento.dataAgendamento;


            if (!data) {

                return false;

            }


            const dataObj =
                new Date(data);


            if (
                isNaN(
                    dataObj.getTime()
                )
            ) {

                return false;

            }


            const horaAgendada =
                agendamento.hora ||
                agendamento.horario ||
                agendamento.hora_agendamento ||
                (
                    dataObj.getHours()
                        .toString()
                        .padStart(2, "0") +
                    ":" +
                    dataObj.getMinutes()
                        .toString()
                        .padStart(2, "0")
                );


            return (

                dataObj.getFullYear() ===
                    ano &&

                dataObj.getMonth() ===
                    mes &&

                dataObj.getDate() ===
                    dia &&

                String(
                    horaAgendada
                ).substring(0, 5) ===
                    String(horario).substring(0, 5) &&

                (
                    !agendamento.status ||
                    agendamento.status ===
                        "Confirmado"
                )

            );

        }
    );

}

/* ==========================================================================
   CLIQUE NO DIA DO CALENDÁRIO
   ========================================================================== */

async function handleDayClick(
    element,
    dayNumber
) {

    if (
        !element ||
        element.classList.contains(
            "disabled"
        )
    ) {

        return;

    }


    /*
       IMPORTANTE:
       nenhum dia é selecionado automaticamente.
       A seleção acontece somente aqui.
    */

    savedDay =
        Number(dayNumber);


    if (currentDayElement) {

        currentDayElement.classList.remove(
            "selected"
        );

    }


    currentDayElement =
        element;


    element.classList.add(
        "selected"
    );


    if (selectedDayText) {

        selectedDayText.innerText =
            String(
                savedDay
            ).padStart(
                2,
                "0"
            );

    }


    const selectedMonthText =
        document.getElementById(
            "selectedMonthText"
        );


    if (selectedMonthText) {

        selectedMonthText.innerText =
            dataAtual.toLocaleDateString(
                "pt-BR",
                {
                    month: "long"
                }
            );

    }


    const monitorSelect =
        document.getElementById(
            "monitorSelect"
        );


    const scheduleTime =
        document.getElementById(
            "scheduleTime"
        );


    const warning =
        document.getElementById(
            "occupiedScheduleWarning"
        );


    const timeSlots =
        document.getElementById(
            "timeSlots"
        );


    if (monitorSelect) {

        monitorSelect.value =
            "";

    }


    if (scheduleTime) {

        scheduleTime.value =
            "";

    }


    if (warning) {

        warning.hidden =
            true;

    }


    if (timeSlots) {

        timeSlots.innerHTML = `
            <div class="schedule-empty">
                Selecione um professor para ver os horários.
            </div>
        `;

    }


    document
        .querySelectorAll(
            "#monitorCards .monitor-card"
        )
        .forEach(
            function (card) {

                card.classList.remove(
                    "selected"
                );

            }
        );


    /*
       Abre o modal imediatamente.
    */

    if (modal) {

        modal.classList.add(
            "active"
        );

    }


    /*
       Carrega os professores.
    */

    await carregarMonitores();


    /*
       Atualiza os horários para o dia escolhido.
    */

    atualizarHorariosDisponiveis();
    atualizarResumoAgendamento();
    iniciarAtualizacaoDisponibilidadeAgendamento();

}


/* ==========================================================================
   FECHAR MODAL
   ========================================================================== */

function closeModal() {

    pararAtualizacaoDisponibilidadeAgendamento();
    ultimoEstadoDisponibilidadeServidor = null;

    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    if (currentDayElement) {

        currentDayElement.classList.remove(
            "selected"
        );

    }


    currentDayElement =
        null;


    savedDay =
        0;


    const monitorSelect =
        document.getElementById(
            "monitorSelect"
        );


    const scheduleTime =
        document.getElementById(
            "scheduleTime"
        );


    const warning =
        document.getElementById(
            "occupiedScheduleWarning"
        );


    const timeSlots =
        document.getElementById(
            "timeSlots"
        );


    if (monitorSelect) {

        monitorSelect.value =
            "";

    }


    if (scheduleTime) {

        scheduleTime.value =
            "";

    }


    if (warning) {

        warning.hidden =
            true;

    }


    if (timeSlots) {

        timeSlots.innerHTML =
            "";

    }


    document
        .querySelectorAll(
            "#monitorCards .monitor-card"
        )
        .forEach(
            function (card) {

                card.classList.remove(
                    "selected"
                );

            }
        );

}


/* ==========================================================================
   CONFIRMAR AGENDAMENTO
   ========================================================================== */

async function confirmAppointment() {

    if (!savedDay) {

        alert(
            "Selecione um dia."
        );

        return;

    }


    const monitorSelect =
        document.getElementById(
            "monitorSelect"
        );


    if (!monitorSelect) {

        alert(
            "Campo de professor não encontrado."
        );

        return;

    }


    const monitor =
        monitorSelect.value;


    if (!monitor) {

        alert(
            "Selecione um professor."
        );

        return;

    }


    const scheduleTime =
        document.getElementById(
            "scheduleTime"
        );


    if (!scheduleTime) {

        alert(
            "Campo de horário não encontrado."
        );

        return;

    }


    const horario =
        scheduleTime.value;


    if (!horario) {

        alert(
            "Selecione um horário."
        );

        return;

    }


    const usuario =
        verificarUsuarioLogado();


    if (!usuario) {

        alert(
            "Você precisa estar logado para agendar uma monitoria."
        );

        closeModal();

        return;

    }


    const ano =
        dataAtual.getFullYear();


    const mes =
        dataAtual.getMonth();


    const ocupadoLocal = horarioEstaOcupado(monitor, ano, mes, savedDay, horario);
    const ocupadoServidor = await consultarDisponibilidadeServidor();
    if (ocupadoLocal || ocupadoServidor === true) {
        atualizarAvisoHorarioOcupado();
        alert("Esse horário já está ocupado para este professor. Escolha outro horário.");
        return;
    }


    const dataAgendamento =
        `${ano}-${String(mes + 1).padStart(2, "0")}-${String(savedDay).padStart(2, "0")}`;


    const botao =
        document.querySelector(
            "#scheduleModal .btn-confirm"
        );


    try {

        if (botao) {

            botao.disabled =
                true;

            botao.innerText =
                "Agendando...";

        }


        const resposta =
            await fetch(
                `${API_URL}/agendamentos`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    credentials:
                        "include",

                    body:
                        JSON.stringify({

                            aluno_id:
                                usuario.id,

                            monitor_id:
                                monitor,

                            data_agendamento:
                                dataAgendamento,

                            horario:
                                String(horario).trim()

                        })

                }
            );


        let dados = {};


        try {

            dados =
                await resposta.json();

        } catch (erro) {

            dados = {};

        }


        if (
            resposta.ok &&
            dados.sucesso
        ) {

            alert(
                "Monitoria agendada com sucesso!"
            );


            closeModal();


            await carregarAgendamentos();


        } else {

            alert(
                dados.mensagem ||
                "Não foi possível realizar o agendamento."
            );

        }


    } catch (erro) {

        console.error(
            "Erro ao realizar agendamento:",
            erro
        );


        alert(
            "Não foi possível conectar ao servidor."
        );


    } finally {

        if (botao) {

            botao.disabled =
                false;

            botao.innerText =
                "Confirmar Horário";

        }

    }

}


/* ==========================================================================
   CALENDÁRIO
   ========================================================================== */

function renderizarCalendario() {

    const monthYearElement =
        document.getElementById(
            "calendarMonthYear"
        );


    const calendarGrid =
        document.getElementById(
            "calendarGrid"
        );


    if (
        !monthYearElement ||
        !calendarGrid
    ) {

        return;

    }


    const ano =
        dataAtual.getFullYear();


    const mes =
        dataAtual.getMonth();


    const meses = [

        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"

    ];


    monthYearElement.innerText =
        `${meses[mes]} ${ano}`;


    calendarGrid.innerHTML =
        "";


    const diasSemana = [

        "D",
        "S",
        "T",
        "Q",
        "Q",
        "S",
        "S"

    ];


    diasSemana.forEach(
        function (dia) {

            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "week-day";


            header.innerText =
                dia;


            calendarGrid.appendChild(
                header
            );

        }
    );


    const primeiroDiaSemana =
        new Date(
            ano,
            mes,
            1
        ).getDay();


    const totalDiasMes =
        new Date(
            ano,
            mes + 1,
            0
        ).getDate();


    const ultimoDiaMesAnterior =
        new Date(
            ano,
            mes,
            0
        ).getDate();

    const hoje = new Date();

    /*
       Dias anteriores ao início do mês.
       Eles são apenas visuais.
       Não podem ser clicados.
    */

    for (
        let i =
            primeiroDiaSemana - 1;

        i >= 0;

        i--
    ) {

        const dayDiv =
            document.createElement(
                "div"
            );


        dayDiv.className =
            "day disabled";


        dayDiv.innerText =
            ultimoDiaMesAnterior - i;


        calendarGrid.appendChild(
            dayDiv
        );

    }


    /*
       Dias do mês atual.
    */

    for (
        let dia = 1;

        dia <= totalDiasMes;

        dia++
    ) {

        const dayDiv =
            document.createElement(
                "div"
            );


        dayDiv.className =
            "day";


        dayDiv.innerText =
            dia;


        /*
           Apenas adiciona a classe visual
           de ocupado.

           NÃO seleciona automaticamente.
        */

        if (
            diaEstaOcupado(
                ano,
                mes,
                dia
            )
        ) {

            dayDiv.classList.add(
                "occupied"
            );

        }

        if (
            ano === hoje.getFullYear() &&
            mes === hoje.getMonth() &&
            dia === hoje.getDate()
        ) {
            dayDiv.classList.add("today");
        }


        /*
           O clique é o único responsável
           pela seleção.
        */

        dayDiv.addEventListener(
            "click",
            function () {

                handleDayClick(
                    dayDiv,
                    dia
                );

            }
        );


        calendarGrid.appendChild(
            dayDiv
        );

    }


    /*
       Se o usuário estiver mudando de mês,
       não carregamos uma seleção antiga.
    */

    currentDayElement =
        null;


    savedDay =
        0;

}


/* ==========================================================================
   MUDAR MÊS
   ========================================================================== */

function mudarMes(
    direcao
) {

    dataAtual.setMonth(
        dataAtual.getMonth() +
        Number(direcao)
    );


    currentDayElement =
        null;


    savedDay =
        0;


    renderizarCalendario();

}


/* ==========================================================================
   REMOVER AGENDAMENTO
   ========================================================================== */

async function removerAgendamento(
    id,
    btn
) {

    if (!id) {

        removerLinhaVisual(
            btn
        );

        return;

    }


    const confirmar =
        confirm(
            "Deseja realmente excluir este agendamento?"
        );


    if (!confirmar) {

        return;

    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/agendamentos/${id}`,
                {

                    method: "DELETE",

                    credentials:
                        "include"

                }
            );


        const dados =
            await resposta.json();


        if (
            resposta.ok &&
            dados.sucesso
        ) {

            await carregarAgendamentos();

        } else {

            alert(
                dados.mensagem ||
                "Não foi possível remover o agendamento."
            );

        }


    } catch (erro) {

        console.error(
            "Erro ao remover agendamento:",
            erro
        );


        alert(
            "Não foi possível conectar ao servidor."
        );

    }

}


/* ==========================================================================
   COMPATIBILIDADE
   ========================================================================== */

function removerLinha(
    btn
) {

    if (!btn) {

        return;

    }


    const linha =
        btn.closest("tr");


    const id =
        linha?.dataset?.id;


    if (id) {

        removerAgendamento(
            id,
            btn
        );

        return;

    }


    removerLinhaVisual(
        btn
    );


    atualizarContadorAgendamentos();

}


function removerLinhaVisual(
    btn
) {

    if (!btn) {

        return;

    }


    const linha =
        btn.closest("tr");


    if (linha) {

        linha.remove();

    }

}


/* ==========================================================================
   CONTADOR DE AGENDAMENTOS
   ========================================================================== */

function atualizarContadorAgendamentos() {

    const contador =
        document.getElementById(
            "countAgendamentos"
        );


    if (!contador) {

        return;

    }


    contador.innerText =
        agendamentos.length;

}


/* ==========================================================================
   TABELA ADMINISTRATIVA
   ========================================================================== */

function atualizarTabelaAgendamentos() {

    const tabela =
        document.getElementById(
            "tableAgendamentos"
        );


    if (!tabela) {

        return;

    }


    tabela.innerHTML =
        "";


    if (
        agendamentos.length === 0
    ) {

        tabela.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="text-align:center; padding:20px;"
                >
                    Nenhum agendamento encontrado.
                </td>
            </tr>
        `;

        return;

    }


    agendamentos.forEach(
        function (agendamento) {

            const linha =
                document.createElement(
                    "tr"
                );


            const id =
                agendamento.id ||
                agendamento.agendamento_id ||
                "";


            linha.dataset.id =
                id;


            const aluno =
                agendamento.aluno ||
                agendamento.aluno_nome ||
                "Não informado";


            const email =
                agendamento.aluno_email ||
                agendamento.email ||
                "Não informado";


            const monitor =
                agendamento.monitor ||
                agendamento.monitor_nome ||
                agendamento.nome_monitor ||
                "Não informado";


            const materia =
                agendamento.materia ||
                extrairMateriaMonitor(
                    monitor
                );


            const dataAgendamento =
                agendamento.data ||
                agendamento.data_agendamento;


            let horario =
                "Não informado";


            if (dataAgendamento) {

                const dataObj =
                    new Date(
                        dataAgendamento
                    );


                if (
                    !isNaN(
                        dataObj.getTime()
                    )
                ) {

                    horario =
                        `${String(
                            dataObj.getHours()
                        ).padStart(
                            2,
                            "0"
                        )}:${String(
                            dataObj.getMinutes()
                        ).padStart(
                            2,
                            "0"
                        )}`;

                }

            }


            const status =
                agendamento.status ||
                "Confirmado";
            const statusNormalizado = String(status).trim().toLocaleLowerCase("pt-BR");
            const agendamentoCancelado = [
                "cancelado",
                "cancelada",
                "canceled",
                "cancelled"
            ].includes(statusNormalizado);


            linha.innerHTML = `

                <td>
                    ${escaparHTML(aluno)}
                </td>

                <td>
                    ${escaparHTML(email)}
                </td>

                <td>
                    ${escaparHTML(monitor)}
                </td>

                <td>
                    ${escaparHTML(materia)}
                </td>

                <td>
                    ${escaparHTML(
                        formatarData(
                            dataAgendamento
                        )
                    )}
                </td>

                <td>
                    ${escaparHTML(horario)}
                </td>

                <td>

                    <span class="status-badge">
                        ${escaparHTML(status)}
                    </span>

                </td>

                <td style="text-align:right;">

                    <button
                        type="button"
                        class="admin-table-action${agendamentoCancelado ? " is-delete" : ""}"
                        ${agendamentoCancelado
                            ? `onclick="apagarAgendamentoAdmin('${escaparHTML(id)}', this)" title="Excluir monitoria cancelada"`
                            : `onclick="atualizarStatusAgendamentoAdmin('${escaparHTML(id)}', 'cancelado', this)"`}
                    >

                        ${agendamentoCancelado
                            ? '<i class="fa-regular fa-trash-can" aria-hidden="true"></i> Apagar'
                            : "Cancelar"}

                    </button>

                </td>

            `;


            tabela.appendChild(
                linha
            );

        }
    );

}


async function apagarAgendamentoAdmin(id, botao) {
    if (!verificarAdminLogado()?.token) {
        openAdminModal();
        return;
    }

    if (!confirm("Apagar definitivamente esta monitoria cancelada? Esta ação não pode ser desfeita.")) {
        return;
    }

    if (botao) {
        botao.disabled = true;
        botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Apagando...';
    }

    try {
        const resposta = await fetch(`${API_URL}/admin/agendamentos/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: obterHeadersAdmin(),
            credentials: "include"
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível apagar a monitoria.");
        }

        agendamentos = agendamentos.filter(agendamento =>
            String(agendamento.id || agendamento.agendamento_id) !== String(id)
        );
        atualizarTabelaAgendamentos();
        atualizarContadorAgendamentos();
        renderizarCalendario();
        agendarAtualizacaoAdmin();
    } catch (erro) {
        console.error("Erro ao apagar monitoria cancelada:", erro);
        alert(erro.message || "Não foi possível apagar a monitoria.");
        if (botao) {
            botao.disabled = false;
            botao.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i> Apagar';
        }
    }
}


async function atualizarStatusAgendamentoAdmin(id, status, botao) {
    if (!id || !verificarAdminLogado()?.token) {
        openAdminModal();
        return;
    }

    if (!confirm("Deseja cancelar esta monitoria?")) return;
    if (botao) {
        botao.disabled = true;
        botao.textContent = "Atualizando...";
    }

    try {
        const resposta = await fetch(`${API_URL}/admin/agendamentos/${encodeURIComponent(id)}/status`, {
            method: "PATCH",
            headers: {
                ...obterHeadersAdmin(),
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ status })
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Não foi possível atualizar o agendamento.");
        }
        await carregarPainelAdmin();
    } catch (erro) {
        console.error("Erro ao atualizar status do agendamento:", erro);
        alert(erro.message || "Não foi possível atualizar o agendamento.");
        if (botao) {
            botao.disabled = false;
            botao.textContent = "Cancelar";
        }
    }
}


/* ========================================================================== 
   EXTRAIR MATÉRIA
   ========================================================================== */

function extrairMateriaMonitor(
    monitor
) {

    if (!monitor) {

        return "Não informado";

    }


    const texto =
        String(monitor);


    const inicio =
        texto.indexOf("(");


    const fim =
        texto.indexOf(")");


    if (
        inicio !== -1 &&
        fim !== -1 &&
        fim > inicio
    ) {

        return texto.substring(
            inicio + 1,
            fim
        );

    }


    return "Não informado";

}


/* ==========================================================================
   FORMATAR DATA
   ========================================================================== */

function formatarData(
    data
) {

    if (!data) {

        return "Não informado";

    }


    const dataObj =
        new Date(data);


    if (
        isNaN(
            dataObj.getTime()
        )
    ) {

        return String(data);

    }


    return dataObj.toLocaleDateString(
        "pt-BR",
        {

            day: "2-digit",

            month: "2-digit",

            year: "numeric"

        }
    );

}


/* ==========================================================================
   ESCAPAR HTML
   ========================================================================== */

function escaparHTML(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }


    return String(valor)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}

/* ==========================================================================
   PAINEL ADMINISTRATIVO
   ========================================================================== */

let carregamentoPainelAdminEmCurso = false;
let intervaloPollingAdmin = null;

function atualizarIndicadorTempoReal(estado, texto) {
    const indicador = document.getElementById("adminLiveStatus");
    if (!indicador) return;

    indicador.classList.remove("is-live", "is-offline", "is-connecting");
    indicador.classList.add(estado);
    indicador.querySelector("span")?.setAttribute("aria-hidden", "true");
    indicador.lastChild.textContent = ` ${texto}`;
}

function atualizarHorarioUltimaCargaAdmin() {
    const elemento = document.getElementById("adminLastUpdated");
    if (elemento) {
        elemento.textContent = `Atualizado às ${new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })}`;
    }
}

async function atualizarPainelAdminAgora() {
    const button = document.querySelector(".admin-refresh-button");
    if (button) {
        button.disabled = true;
        button.classList.add("is-refreshing");
    }
    try {
        await carregarPainelAdmin();
    } finally {
        if (button) {
            button.disabled = false;
            button.classList.remove("is-refreshing");
        }
    }
}

async function carregarDadosAdmin() {
    const admin = verificarAdminLogado();
    if (!admin?.token) return;

    try {
        const [respostaAlunos, respostaMonitores] = await Promise.all([
            fetch(`${API_URL}/admin/alunos?limite=200`, {
                headers: obterHeadersAdmin(),
                credentials: "include",
                cache: "no-store"
            }),
            fetch(`${API_URL}/admin/monitores`, {
                headers: obterHeadersAdmin(),
                credentials: "include",
                cache: "no-store"
            })
        ]);

        if (!respostaAlunos.ok || !respostaMonitores.ok) {
            if ([respostaAlunos.status, respostaMonitores.status].some(status => status === 401 || status === 403)) {
                tratarSessaoAdminExpirada();
            }
            throw new Error("Não foi possível carregar alunos e monitores.");
        }

        const [dadosAlunos, dadosMonitores] = await Promise.all([
            respostaAlunos.json(),
            respostaMonitores.json()
        ]);

        renderizarTabelaAlunosAdmin(dadosAlunos.alunos);
        renderizarTabelaMonitoresAdmin(dadosMonitores.monitores);
    } catch (erro) {
        console.error("Erro ao carregar cadastros administrativos:", erro);
        const tabelaAlunos = document.getElementById("adminStudentsTable");
        const tabelaMonitores = document.getElementById("adminMonitorsTable");
        if (tabelaAlunos) tabelaAlunos.innerHTML = '<tr><td colspan="2">Não foi possível carregar os alunos.</td></tr>';
        if (tabelaMonitores) tabelaMonitores.innerHTML = '<tr><td colspan="4">Não foi possível carregar os monitores.</td></tr>';
    }
}

function renderizarTabelaAlunosAdmin(alunos) {
    const tabela = document.getElementById("adminStudentsTable");
    if (!tabela) return;
    tabela.replaceChildren();

    if (!Array.isArray(alunos) || alunos.length === 0) {
        tabela.innerHTML = '<tr><td colspan="2">Nenhum aluno cadastrado.</td></tr>';
        return;
    }

    alunos.forEach(aluno => {
        const linha = document.createElement("tr");
        const nome = document.createElement("td");
        const email = document.createElement("td");
        nome.textContent = aluno.nome || "Aluno sem nome";
        email.textContent = aluno.email || "E-mail não informado";
        linha.append(nome, email);
        tabela.appendChild(linha);
    });

    filtrarTabelaAdmin("adminStudentsTable", document.getElementById("adminStudentSearch")?.value || "");
}

function renderizarTabelaMonitoresAdmin(monitores) {
    const tabela = document.getElementById("adminMonitorsTable");
    if (!tabela) return;
    tabela.replaceChildren();

    if (!Array.isArray(monitores) || monitores.length === 0) {
        tabela.innerHTML = '<tr><td colspan="4">Nenhum monitor cadastrado.</td></tr>';
        return;
    }

    monitores.forEach(monitor => {
        const linha = document.createElement("tr");
        const nome = document.createElement("td");
        const materia = document.createElement("td");
        const status = document.createElement("td");
        const acao = document.createElement("td");
        const badge = document.createElement("span");
        const botao = document.createElement("button");
        const ativo = monitor.ativo === true;

        nome.textContent = monitor.nome || "Monitor";
        materia.textContent = monitor.materia || "Matéria não informada";
        badge.className = `admin-status-badge ${ativo ? "is-active" : "is-inactive"}`;
        badge.textContent = ativo ? "Ativo" : "Inativo";
        status.appendChild(badge);
        botao.type = "button";
        botao.className = "admin-table-action";
        botao.textContent = ativo ? "Desativar" : "Ativar";
        botao.addEventListener("click", () => atualizarStatusMonitorAdmin(monitor, !ativo, botao));
        acao.appendChild(botao);
        linha.append(nome, materia, status, acao);
        tabela.appendChild(linha);
    });
}

function filtrarTabelaAdmin(tbodyId, termo) {
    const tabela = document.getElementById(tbodyId);
    if (!tabela) return;
    const consulta = String(termo || "").trim().toLocaleLowerCase("pt-BR");
    Array.from(tabela.rows).forEach(linha => {
        linha.hidden = Boolean(consulta) && !linha.textContent.toLocaleLowerCase("pt-BR").includes(consulta);
    });
}

async function atualizarStatusMonitorAdmin(monitor, ativo, botao) {
    if (!monitor?.id) return;
    if (botao) botao.disabled = true;

    try {
        const resposta = await fetch(`${API_URL}/admin/monitores/${encodeURIComponent(monitor.id)}`, {
            method: ativo ? "PUT" : "DELETE",
            headers: {
                ...obterHeadersAdmin(),
                ...(ativo ? { "Content-Type": "application/json" } : {})
            },
            credentials: "include",
            ...(ativo ? {
                body: JSON.stringify({
                    nome: monitor.nome,
                    materia: monitor.materia,
                    email: monitor.email || "",
                    ativo: true
                })
            } : {})
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || dados.erro || "Não foi possível atualizar o monitor.");
        }
        await carregarDadosAdmin();
        agendarAtualizacaoAdmin();
    } catch (erro) {
        console.error("Erro ao atualizar status do monitor:", erro);
        alert(erro.message || "Não foi possível atualizar o monitor.");
        if (botao) botao.disabled = false;
    }
}

function tratarSessaoAdminExpirada() {
    sessionStorage.removeItem("adminLogado");
    desconectarSocketAdmin();
    clearInterval(intervaloPollingAdmin);
    intervaloPollingAdmin = null;
    document.body.classList.remove("admin-authenticated");

    const admView = document.getElementById("admView");
    if (admView) {
        admView.classList.remove("admin-view-active");
        admView.style.setProperty("display", "none", "important");
    }

    openAdminModal();
}

async function carregarPainelAdmin() {

    const admin =
        verificarAdminLogado();

    if (carregamentoPainelAdminEmCurso) return;

    if (!admin) {

        openAdminModal();

        return;

    }

    carregamentoPainelAdminEmCurso = true;

    try {
        const adminNome = document.getElementById("adminDashboardName");
        const dataAtualElemento = document.getElementById("adminCurrentDate");
        if (adminNome) adminNome.textContent = admin.nome || "Administrador";
        if (dataAtualElemento) {
            dataAtualElemento.textContent = new Date().toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            });
        }

        const resposta =
            await fetch(
                `${API_URL}/admin/dashboard`,
                {

                    method: "GET",

                    headers: obterHeadersAdmin(),

                    credentials: "include"

                }
            );


        if (
            resposta.status === 401 ||
            resposta.status === 403
        ) {

            tratarSessaoAdminExpirada();

            return;

        }


        if (!resposta.ok) {

            console.warn(
                "Não foi possível carregar o painel administrativo."
            );

            return;

        }


        const dados = await resposta.json();

        if (!dados.sucesso) {
            throw new Error(
                dados.erro || "A API não retornou os dados do painel."
            );
        }

        const [
            respostaAgendamentos,
            respostaAlunos,
            respostaMonitores
        ] =
            await Promise.all([
                fetch(`${API_URL}/admin/agendamentos`, {
                    headers: obterHeadersAdmin(),
                    credentials: "include"
                }),
                fetch(`${API_URL}/admin/alunos?limite=200`, {
                    headers: obterHeadersAdmin(),
                    credentials: "include",
                    cache: "no-store"
                }),
                fetch(`${API_URL}/admin/monitores`, {
                    headers: obterHeadersAdmin(),
                    credentials: "include",
                    cache: "no-store"
                })
            ]);

        if (
            !respostaAgendamentos.ok ||
            !respostaAlunos.ok ||
            !respostaMonitores.ok
        ) {
            throw new Error("Não foi possível carregar os dados do painel administrativo.");
        }

        const [dadosAgendamentos, dadosAlunos, dadosMonitores] =
            await Promise.all([
                respostaAgendamentos.json(),
                respostaAlunos.json(),
                respostaMonitores.json()
            ]);

        const metricas = dados.estatisticas || dados.metricas;
        atualizarMetricasAdmin(metricas);
        renderizarTabelaAlunosAdmin(dadosAlunos.alunos);
        renderizarTabelaMonitoresAdmin(dadosMonitores.monitores);

        if (Array.isArray(dadosAgendamentos.agendamentos)) {
            agendamentos = dadosAgendamentos.agendamentos;
            atualizarTabelaAgendamentos();
            atualizarContadorAgendamentos();
            renderizarCalendario();
        }

        renderizarGraficoAgendamentosAdmin(metricas?.agendamentosPorMes);
        atualizarResumoChatAdmin(metricas);
        atualizarHorarioUltimaCargaAdmin();


    } catch (erro) {

        console.error(
            "Erro ao carregar painel administrativo:",
            erro
        );

    } finally {
        carregamentoPainelAdminEmCurso = false;
    }

}


function renderizarGraficoAgendamentosAdmin(meses) {
    const container = document.getElementById("adminMonthlyChartBars");

    if (!container || !Array.isArray(meses)) {
        return;
    }

    container.style.display = "flex";
    container.replaceChildren();
    const maximo = Math.max(
        ...meses.map(item => Number(item.quantidade || 0)),
        0
    );
    const nomesMeses = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];

    meses.forEach(function (item) {
        const quantidade = Number(item.quantidade || 0);
        const coluna = document.createElement("div");
        coluna.className = "monthly-bar-item";

        const barra = document.createElement("div");
        barra.className = "monthly-bar scheduled";
        barra.style.height = maximo > 0
            ? `${Math.max((quantidade / maximo) * 100, 3)}%`
            : "3%";
        barra.title = `${quantidade} agendamentos`;
        barra.setAttribute(
            "aria-label",
            `${quantidade} agendamentos`
        );

        const rotulo = document.createElement("span");
        rotulo.textContent = nomesMeses[Number(item.mes) - 1] || "";

        coluna.append(barra, rotulo);
        container.appendChild(coluna);
    });
}


function atualizarResumoChatAdmin(metricas) {
    const container = document.getElementById("adminChatUsage");

    if (!container) {
        return;
    }

    const indicadores = [
        {
            icone: "fa-solid fa-comments",
            rotulo: "Acessos ao chat",
            valor: metricas?.acessosChatHoje
        },
        {
            icone: "fa-solid fa-wand-magic-sparkles",
            rotulo: "Perguntas à EduAssist",
            valor: metricas?.perguntasIaHoje
        }
    ];

    container.replaceChildren();
    indicadores.forEach(indicador => {
        const cartao = document.createElement("article");
        cartao.className = "chat-usage-stat";

        const icone = document.createElement("span");
        icone.className = "chat-usage-icon";
        const simbolo = document.createElement("i");
        simbolo.className = indicador.icone;
        icone.appendChild(simbolo);

        const texto = document.createElement("div");
        texto.className = "chat-usage-copy";
        const rotulo = document.createElement("span");
        rotulo.textContent = indicador.rotulo;
        const valor = document.createElement("strong");
        valor.textContent = Number(indicador.valor || 0).toLocaleString("pt-BR");
        texto.append(rotulo, valor);
        cartao.append(icone, texto);
        container.appendChild(cartao);
    });
}


async function inicializarPortalAdmin() {
    const authScreen = document.getElementById("authScreen");
    const siteContainer = document.getElementById("siteContainer");
    const teacherPortal = document.getElementById("teacherPortal");
    const emailInput = document.getElementById("adminCardEmail");
    const admin = verificarAdminLogado();

    if (authScreen) authScreen.style.display = "flex";
    if (siteContainer) siteContainer.style.display = "none";
    if (teacherPortal) teacherPortal.style.display = "none";

    if (admin?.token) {
        try {
            const resposta = await fetch(`${API_URL}/admin/dashboard`, {
                headers: obterHeadersAdmin(),
                credentials: "include",
                cache: "no-store"
            });
            if (resposta.ok) {
                showView("adm");
                return;
            }

            if (resposta.status !== 401 && resposta.status !== 403) {
                throw new Error("Não foi possível validar a sessão administrativa.");
            }

            sessionStorage.removeItem("adminLogado");
        } catch (erro) {
            console.error("Erro ao validar sessão administrativa:", erro);
            const mensagem = document.getElementById("adminCardLoginMessage");
            if (mensagem) {
                mensagem.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
                mensagem.className = "auth-message error show";
            }
        }
    }

    toggleAuthMode("admin");
    emailInput?.focus();
}


function inicializarFormularioMonitorAdmin() {
    const form = document.getElementById("adminMonitorForm");
    if (!form || form.dataset.initialized === "true") return;

    form.dataset.initialized = "true";
    form.addEventListener("submit", async event => {
        event.preventDefault();
        const button = form.querySelector("button[type='submit']");
        const message = document.getElementById("adminMonitorMessage");
        const payload = {
            nome: document.getElementById("adminMonitorName")?.value.trim(),
            materia: document.getElementById("adminMonitorSubject")?.value.trim(),
            email: document.getElementById("adminMonitorEmail")?.value.trim()
        };

        if (button) button.disabled = true;
        if (message) {
            message.textContent = "";
            message.className = "auth-message";
        }

        try {
            const resposta = await fetch(`${API_URL}/admin/monitores`, {
                method: "POST",
                headers: {
                    ...obterHeadersAdmin(),
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            const dados = await resposta.json();
            if (!resposta.ok || !dados.sucesso) {
                throw new Error(dados.mensagem || dados.erro || "Não foi possível cadastrar o monitor.");
            }

            form.reset();
            if (message) {
                message.textContent = "Monitor cadastrado com sucesso.";
                message.className = "auth-message success show";
            }
            await carregarDadosAdmin();
            agendarAtualizacaoAdmin();
        } catch (erro) {
            console.error("Erro ao cadastrar monitor:", erro);
            if (message) {
                message.textContent = erro.message || "Não foi possível cadastrar o monitor.";
                message.className = "auth-message error show";
            }
        } finally {
            if (button) button.disabled = false;
        }
    });
}


/* ========================================================================== 
   PAINEL ADMIN EM TEMPO REAL (SOCKET.IO)
   ========================================================================== */

let socketAdmin = null;
let atualizacaoAdminTimer = null;

const EVENTOS_ADMIN_TEMPO_REAL = [
    "aluno:novo-cadastro",
    "aluno:login",
    "aluno:logout",
    "agendamento:novo",
    "agendamento:atualizado",
    "admin:dashboard-atualizado",
    "admin:atualizacao",
    "admin:atividade",
    "monitores:atualizados",
    "admin:monitor-criado",
    "chat:nova-mensagem"
];

function agendarAtualizacaoAdmin() {

    clearTimeout(atualizacaoAdminTimer);

    // Agrupa eventos seguidos em uma única atualização
    atualizacaoAdminTimer = setTimeout(function () {

        if (!document.body.classList.contains("admin-authenticated")) {
            return;
        }

        carregarPainelAdmin();

    }, 400);

}

async function conectarSocketAdmin() {

    const admin = verificarAdminLogado();

    if (!admin || !admin.token) {
        return;
    }

    if (socketAdmin) {
        if (!socketAdmin.connected) {
            socketAdmin.connect();
        }
        return;
    }

    try {
        await carregarClienteSocketIO();
    } catch (erro) {
        console.warn(erro.message);
        return;
    }

    socketAdmin = io(API_ORIGIN, {
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
    });

    // Reentra na sala dos admins a cada (re)conexão
    socketAdmin.on("connect", function () {

        const atual = verificarAdminLogado();

        if (!atual || !atual.token) {
            return;
        }

        atualizarIndicadorTempoReal("is-connecting", "Validando acesso...");
        socketAdmin.emit("chat:entrar-admin", { token: atual.token });
    });

    socketAdmin.on("chat:conectado-admin", function () {
        atualizarIndicadorTempoReal("is-live", "Ao vivo");
        agendarAtualizacaoAdmin();
    });

    socketAdmin.on("chat:erro", function (dados) {
        console.warn("Não foi possível autenticar o socket administrativo:", dados?.erro);
        atualizarIndicadorTempoReal("is-offline", "Acesso ao vivo recusado");
    });

    socketAdmin.on("disconnect", function () {
        atualizarIndicadorTempoReal("is-offline", "Reconectando...");
    });

    socketAdmin.on("connect_error", function () {
        atualizarIndicadorTempoReal("is-offline", "Sem conexão ao vivo");
    });

    EVENTOS_ADMIN_TEMPO_REAL.forEach(function (evento) {
        socketAdmin.on(evento, agendarAtualizacaoAdmin);
    });

    clearInterval(intervaloPollingAdmin);
    intervaloPollingAdmin = setInterval(function () {
        if (document.body.classList.contains("admin-authenticated")) {
            carregarPainelAdmin();
            carregarSolicitacoesProfessoresAdmin();
        }
    }, 60000);

}

function desconectarSocketAdmin() {

    clearTimeout(atualizacaoAdminTimer);

    if (socketAdmin) {
        socketAdmin.disconnect();
        socketAdmin = null;
    }

}


/* ==========================================================================
   MÉTRICAS ADMIN
   ========================================================================== */

function atualizarMetricasAdmin(
    metricas
) {

    if (!metricas) {

        return;

    }


    const cards =
        document.querySelectorAll(
            "#admView .metric-card"
        );


    const usuarios =
        metricas.usuarios ??
        metricas.usuariosTotais ??
        metricas.totalUsuarios;


    const monitores =
        metricas.monitores ??
        metricas.monitoresAtivos ??
        metricas.totalMonitores;


    const agendamentosTotal =
        metricas.agendamentos ??
        metricas.totalAgendamentos;


    if (
        usuarios !== undefined &&
        cards[0]
    ) {

        const valor =
            cards[0].querySelector(
                ".metric-value"
            );


        if (valor) {

            valor.innerText =
                Number(
                    usuarios
                ).toLocaleString(
                    "pt-BR"
                );

        }

    }


    if (
        monitores !== undefined &&
        cards[1]
    ) {

        const valor =
            cards[1].querySelector(
                ".metric-value"
            );


        if (valor) {

            valor.innerText =
                monitores;

        }

    }


    if (
        agendamentosTotal !== undefined
    ) {

        const contador =
            document.getElementById(
                "countAgendamentos"
            );


        if (contador) {

            contador.innerText =
                agendamentosTotal;

        }

        const pendentes = document.getElementById("adminPendingAppointments");
        if (pendentes && metricas.agendamentosPendentes !== undefined) {
            pendentes.textContent = Number(metricas.agendamentosPendentes).toLocaleString("pt-BR");
        }

    }

}


/* ==========================================================================
   MODAIS
   ========================================================================== */

function inicializarModais() {

    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            function (modalElemento) {

                if (
                    modalElemento.dataset.initialized ===
                    "true"
                ) {

                    return;

                }


                modalElemento.dataset.initialized =
                    "true";


                modalElemento.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target ===
                            modalElemento
                        ) {

                            modalElemento.classList.remove(
                                "active"
                            );

                        }

                    }
                );

            }
        );

}


/* ==========================================================================
   TECLA ESC
   ========================================================================== */

function inicializarTeclaEscape() {

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            document
                .querySelectorAll(
                    ".modal.active"
                )
                .forEach(
                    function (modalElemento) {

                        modalElemento.classList.remove(
                            "active"
                        );

                    }
                );

        }
    );

}


/* ==========================================================================
   PROTEGER PAINEL ADMIN
   ========================================================================== */

function protegerPainelAdmin() {

    const admin =
        verificarAdminLogado();


    const admView =
        document.getElementById(
            "admView"
        );


    if (admView) {

        if (
            !admin ||
            !admin.token
        ) {

            admView.style.setProperty(
                "display",
                "none",
                "important"
            );

        } else {

            /*
               O painel só será exibido pelo
               showView("adm").
            */

            admView.style.setProperty(
                "display",
                "none",
                "important"
            );

        }

    }

}


/* ==========================================================================
   NOTIFICAÇÕES
   ========================================================================== */

let intervaloNotificacoes =
    null;


/* ==========================================================================
   CARREGAR NOTIFICAÇÕES
   ========================================================================== */

async function carregarNotificacoes() {

    const container =
        document.getElementById(
            "notificationsContainer"
        );


    if (!container) {

        return;

    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/notificacoes`,
                {

                    credentials:
                        "include"

                }
            );


        if (!resposta.ok) {

            return;

        }


        const dados =
            await resposta.json();


        const notificacoes =
            Array.isArray(
                dados.notificacoes
            )
                ? dados.notificacoes
                : [];


        const naoLidas =
            notificacoes.filter(
                function (notificacao) {

                    return !notificacao.lida;

                }
            );


        if (
            !dados.sucesso ||
            naoLidas.length === 0
        ) {

            container.innerHTML = `
                <p class="no-notifications">
                    Nenhuma notificação nova no momento.
                </p>
            `;

            return;

        }


        container.innerHTML =
            naoLidas.map(
                function (notificacao) {

                    return `

                        <div class="notification-item unread">

                            <div class="notification-icon">

                                <i class="fa-solid fa-bell"></i>

                            </div>

                            <div class="notification-content">

                                <strong>
                                    Nova notificação
                                </strong>

                                <p>
                                    ${escaparHTML(
                                        notificacao.mensagem ||
                                        ""
                                    )}
                                </p>

                                <small>
                                    Monitor:
                                    ${escaparHTML(
                                        notificacao.monitor_nome ||
                                        "Não informado"
                                    )}
                                </small>

                                <small>
                                    ${
                                        notificacao.criada_em
                                            ? new Date(
                                                notificacao.criada_em
                                            ).toLocaleString(
                                                "pt-BR"
                                            )
                                            : ""
                                    }
                                </small>

                                <button
                                    type="button"
                                    class="notification-read-btn"
                                    onclick="marcarNotificacaoComoLida(${Number(notificacao.id)})"
                                >
                                    Marcar como lida
                                </button>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    } catch (erro) {

        console.error(
            "Erro ao carregar notificações:",
            erro
        );

    }

}


/* ==========================================================================
   MARCAR NOTIFICAÇÃO COMO LIDA
   ========================================================================== */

async function marcarNotificacaoComoLida(
    id
) {

    try {

        const resposta =
            await fetch(
                `${API_URL}/notificacoes/${id}/lida`,
                {

                    method: "PATCH",

                    credentials:
                        "include"

                }
            );


        const dados =
            await resposta.json();


        if (
            resposta.ok &&
            dados.sucesso
        ) {

            await carregarNotificacoes();

        }

    } catch (erro) {

        console.error(
            "Erro ao marcar notificação como lida:",
            erro
        );

    }

}

/* ==========================================================================
   MOSTRAR / OCULTAR SENHA
   ========================================================================== */

function togglePasswordVisibility(
    inputId,
    button
) {

    const input =
        document.getElementById(
            inputId
        );


    if (!input) {

        return;

    }


    if (
        input.type ===
        "password"
    ) {

        input.type =
            "text";


        if (button) {

            button.innerHTML =
                '<i class="fa-solid fa-eye-slash"></i>';

        }

    } else {

        input.type =
            "password";


        if (button) {

            button.innerHTML =
                '<i class="fa-solid fa-eye"></i>';

        }

    }

}

/* ==========================================================================
   EDUASSIST AI - CHAT EDUCACIONAL EM TEMPO REAL
   ========================================================================== */

/* --------------------------------------------------------------------------
   VARIÁVEIS DO CHAT
   -------------------------------------------------------------------------- */

let socketChat = null;
let socketChatConectado = false;
let chatInicializado = false;
let chatCarregandoHistorico = false;
let chatEnviando = false;
let chatIdentidadeInicializada = null;
let chatModoAtendimento = "ia";
let professorChatSelecionado = "";
let professoresDisponiveisChat = [];
let timerHistoricoProfessorAluno = null;
let requisicaoHistoricoProfessor = 0;
let requisicaoListaProfessoresChat = 0;
let requisicaoHistoricoIA = 0;

const chatIdsRenderizados = new Set();

function definirModoAtendimentoChat(modo) {
    chatModoAtendimento = modo === "professor" ? "professor" : "ia";
    requisicaoHistoricoIA += 1;
    requisicaoListaProfessoresChat += 1;
    requisicaoHistoricoProfessor += 1;
    chatCarregandoHistorico = false;
    const botaoIA = document.getElementById("chatModeAI");
    const botaoProfessor = document.getElementById("chatModeTeacher");
    const escolhaProfessor = document.getElementById("chatTeacherChoice");
    const descricao = document.getElementById("chatModeDescription");
    const titulo = document.getElementById("chatConversationTitle");
    const input = document.getElementById("chatInput");
    const professorAtivo = chatModoAtendimento === "professor";

    botaoIA?.classList.toggle("is-active", !professorAtivo);
    botaoProfessor?.classList.toggle("is-active", professorAtivo);
    botaoIA?.setAttribute("aria-pressed", String(!professorAtivo));
    botaoProfessor?.setAttribute("aria-pressed", String(professorAtivo));
    if (escolhaProfessor) escolhaProfessor.hidden = !professorAtivo;
    if (descricao) {
        descricao.textContent = professorAtivo
            ? "Sua dúvida será enviada ao professor escolhido. Você receberá um aviso por e-mail quando ele responder."
            : "A EduAssist responde na hora.";
    }
    if (titulo) titulo.textContent = professorAtivo ? "Conversa com professor" : "Conversa com a EduAssist";
    if (input) {
        input.placeholder = professorAtivo
            ? "Escreva sua dúvida para o professor..."
            : "Pergunte qualquer dúvida sobre as matérias...";
    }
    ["deepSearchButton", "chatWebButton", "chatSettingsButton"].forEach(id => {
        const controle = document.getElementById(id);
        if (controle) controle.hidden = professorAtivo;
    });

    clearInterval(timerHistoricoProfessorAluno);
    timerHistoricoProfessorAluno = null;
    limparMensagensChat();

    if (professorAtivo) {
        carregarProfessoresParaChat();
    } else {
        atualizarStatusChat("online", "EduAssist IA");
        carregarHistoricoChat();
    }
}

async function carregarProfessoresParaChat() {
    const requisicaoAtual = ++requisicaoListaProfessoresChat;
    const aluno = obterAlunoAtualChat();
    const seletor = document.getElementById("chatTeacherSelect");
    if (!seletor || chatModoAtendimento !== "professor") return;
    if (!aluno?.token) {
        seletor.replaceChildren(new Option("Faça login para escolher um professor", ""));
        seletor.disabled = true;
        atualizarStatusChat("offline", "Faça login para conversar com um professor");
        return;
    }

    seletor.replaceChildren(new Option("Carregando professores...", ""));
    seletor.disabled = true;
    atualizarStatusChat("conectando", "Carregando professores...");

    try {
        const resposta = await fetch(`${API_URL}/chat/professores`, {
            headers: { Authorization: `Bearer ${aluno.token}` }
        });
        const dados = await resposta.json();
        if (
            requisicaoAtual !== requisicaoListaProfessoresChat ||
            chatModoAtendimento !== "professor"
        ) return;
        if (!resposta.ok || !dados.sucesso || !Array.isArray(dados.professores)) {
            throw new Error(dados.mensagem || "Não foi possível carregar os professores.");
        }

        professoresDisponiveisChat = dados.professores;
        seletor.replaceChildren(new Option("Selecione um professor", ""));
        professoresDisponiveisChat.forEach(professor => {
            const opcao = new Option(
                `${professor.nome} · ${professor.materia}`,
                String(professor.id)
            );
            seletor.appendChild(opcao);
        });

        if (!professoresDisponiveisChat.length) {
            seletor.replaceChildren(new Option("Nenhum professor disponível", ""));
            atualizarStatusChat("offline", "Nenhum professor disponível");
            adicionarMensagemChat(
                "assistant",
                "Ainda não há professores disponíveis para conversar. Você pode tirar sua dúvida com a EduAssist."
            );
            return;
        }

        seletor.disabled = false;
        const selecionadoExiste = professoresDisponiveisChat.some(
            professor => String(professor.id) === professorChatSelecionado
        );
        if (!selecionadoExiste) professorChatSelecionado = "";
        seletor.value = professorChatSelecionado;

        if (professorChatSelecionado) {
            seletor.value = professorChatSelecionado;
            selecionarProfessorParaChat();
        } else {
            atualizarStatusChat("online", "Escolha um professor");
            adicionarMensagemChat(
                "assistant",
                "Selecione um professor para iniciar uma conversa. Sua dúvida será enviada diretamente a ele e ficará salva no seu histórico."
            );
        }
    } catch (erro) {
        if (
            requisicaoAtual !== requisicaoListaProfessoresChat ||
            chatModoAtendimento !== "professor"
        ) return;
        console.error("Erro ao carregar professores para o chat:", erro);
        seletor.replaceChildren(new Option("Não foi possível carregar", ""));
        atualizarStatusChat("offline", "Professores indisponíveis");
        adicionarMensagemChat(
            "assistant",
            erro.message || "Não foi possível carregar a lista de professores."
        );
    }
}

function renderizarMensagemProfessorAluno(mensagem) {
    const container = obterContainerMensagensChat();
    if (!container || !mensagem) return;
    const id = mensagem.id ? String(mensagem.id) : null;
    if (id && chatIdsRenderizados.has(id)) return;
    if (id) chatIdsRenderizados.add(id);

    const tipoProfessor = mensagem.remetenteTipo === "professor";
    const item = document.createElement("article");
    item.className = `chat-message ${tipoProfessor ? "assistant" : "user"}`;
    if (id) item.dataset.messageId = id;

    const bolha = document.createElement("div");
    bolha.className = "chat-bubble";
    const autor = document.createElement("span");
    autor.className = "message-author";
    const professor = professoresDisponiveisChat.find(
        atual => String(atual.id) === String(professorChatSelecionado)
    );
    autor.textContent = tipoProfessor
        ? professor?.nome || "Professor"
        : "Você";

    const conteudo = document.createElement("div");
    conteudo.className = "message-content";
    if (tipoProfessor) {
        renderizarTextoRespostaChat(conteudo, String(mensagem.mensagem || ""));
    } else {
        conteudo.textContent = String(mensagem.mensagem || "");
    }
    bolha.append(autor, conteudo);
    item.appendChild(bolha);

    if (mensagem.criadaEm) {
        const horario = document.createElement("small");
        horario.className = "chat-message-time";
        const data = new Date(mensagem.criadaEm);
        horario.textContent = Number.isNaN(data.getTime())
            ? ""
            : data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        item.appendChild(horario);
    }

    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
}

async function carregarHistoricoProfessorAluno() {
    const requisicaoAtual = ++requisicaoHistoricoProfessor;
    const aluno = obterAlunoAtualChat();
    const professorId = professorChatSelecionado;
    const professor = professoresDisponiveisChat.find(
        atual => String(atual.id) === professorId
    );
    const container = obterContainerMensagensChat();
    if (!aluno?.token || !professorId || !container) return;

    try {
        const resposta = await fetch(
            `${API_URL}/chat/professores/${encodeURIComponent(professorId)}/mensagens`,
            { headers: { Authorization: `Bearer ${aluno.token}` } }
        );
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso || !Array.isArray(dados.mensagens)) {
            throw new Error(dados.mensagem || "Não foi possível carregar esta conversa.");
        }
        if (
            requisicaoAtual !== requisicaoHistoricoProfessor ||
            chatModoAtendimento !== "professor" ||
            professorId !== professorChatSelecionado
        ) return;

        chatIdsRenderizados.clear();
        container.replaceChildren();
        if (!dados.mensagens.length) {
            adicionarMensagemChat(
                "assistant",
                `Você iniciou uma conversa com ${professor?.nome || "o professor"}. Envie sua dúvida e aguarde a resposta; ela aparecerá aqui.`
            );
        } else {
            dados.mensagens.forEach(renderizarMensagemProfessorAluno);
        }
        atualizarStatusChat("online", "Conversa salva");
    } catch (erro) {
        if (requisicaoAtual !== requisicaoHistoricoProfessor) return;
        console.error("Erro ao carregar conversa com professor:", erro);
        atualizarStatusChat("offline", "Conversa indisponível");
        container.replaceChildren();
        adicionarMensagemChat(
            "assistant",
            erro.message || "Não foi possível carregar a conversa com este professor."
        );
    }
}

function iniciarAtualizacaoHistoricoProfessorAluno() {
    clearInterval(timerHistoricoProfessorAluno);
    timerHistoricoProfessorAluno = setInterval(() => {
        if (chatModoAtendimento === "professor" && professorChatSelecionado) {
            carregarHistoricoProfessorAluno();
        }
    }, 10000);
}

function selecionarProfessorParaChat() {
    const seletor = document.getElementById("chatTeacherSelect");
    professorChatSelecionado = seletor?.value || "";
    requisicaoHistoricoProfessor += 1;
    clearInterval(timerHistoricoProfessorAluno);
    timerHistoricoProfessorAluno = null;
    limparMensagensChat();

    if (!professorChatSelecionado) {
        const titulo = document.getElementById("chatConversationTitle");
        if (titulo) titulo.textContent = "Conversa com professor";
        atualizarStatusChat("online", "Escolha um professor");
        adicionarMensagemChat("assistant", "Selecione um professor para iniciar uma conversa.");
        return;
    }

    const professor = professoresDisponiveisChat.find(
        atual => String(atual.id) === professorChatSelecionado
    );
    if (!professor) {
        professorChatSelecionado = "";
        if (seletor) seletor.value = "";
        atualizarStatusChat("offline", "Professor indisponível");
        adicionarMensagemChat("assistant", "Este professor não está mais disponível. Atualize a lista e escolha outro.");
        return;
    }

    const titulo = document.getElementById("chatConversationTitle");
    if (titulo) titulo.textContent = `Conversa com ${professor.nome}`;
    const descricao = document.getElementById("chatModeDescription");
    if (descricao) {
        descricao.textContent = `Sua dúvida será enviada para ${professor.nome}; você receberá um aviso por e-mail quando ele responder.`;
    }
    carregarHistoricoProfessorAluno();
    iniciarAtualizacaoHistoricoProfessorAluno();
}

function inicializarControlesModoChat() {
    const botaoModoIA = document.getElementById("chatModeAI");
    const botaoModoProfessor = document.getElementById("chatModeTeacher");
    const seletorProfessor = document.getElementById("chatTeacherSelect");

    if (botaoModoIA && botaoModoIA.dataset.initialized !== "true") {
        botaoModoIA.dataset.initialized = "true";
        botaoModoIA.addEventListener("click", () => definirModoAtendimentoChat("ia"));
    }
    if (botaoModoProfessor && botaoModoProfessor.dataset.initialized !== "true") {
        botaoModoProfessor.dataset.initialized = "true";
        botaoModoProfessor.addEventListener("click", () => definirModoAtendimentoChat("professor"));
    }
    if (seletorProfessor && seletorProfessor.dataset.initialized !== "true") {
        seletorProfessor.dataset.initialized = "true";
        seletorProfessor.addEventListener("change", selecionarProfessorParaChat);
    }
}


/* --------------------------------------------------------------------------
   OBTER ALUNO LOGADO
   -------------------------------------------------------------------------- */

function obterAlunoAtualChat() {

    try {

        const usuario = sessionStorage.getItem("usuarioLogado");

        if (!usuario) {
            return null;
        }

        const aluno = JSON.parse(usuario);

        if (!aluno) {
            return null;
        }

        return aluno;

    } catch (erro) {

        console.error(
            "Erro ao obter aluno do chat:",
            erro
        );

        return null;
    }
}


/* --------------------------------------------------------------------------
   ATUALIZAR STATUS DO CHAT
   -------------------------------------------------------------------------- */

function atualizarStatusChat(status, mensagem) {

    const elemento = document.getElementById("chatStatus");

    if (!elemento) {
        return;
    }

    elemento.classList.remove(
        "online",
        "offline",
        "conectando"
    );

    if (status === "online") {

        elemento.classList.add("online");

        elemento.textContent =
            mensagem || "IA online";

    } else if (status === "offline") {

        elemento.classList.add("offline");

        elemento.textContent =
            mensagem || "IA offline";

    } else {

        elemento.classList.add("conectando");

        elemento.textContent =
            mensagem || "Conectando...";
    }
}


/* --------------------------------------------------------------------------
   LOCALIZAR CONTAINER DAS MENSAGENS
   -------------------------------------------------------------------------- */

function obterContainerMensagensChat() {

    const idsPossiveis = [
        "chatMessages",
        "chatMessagesContainer",
        "messagesContainer",
        "chatContainer"
    ];

    for (const id of idsPossiveis) {

        const elemento = document.getElementById(id);

        if (elemento) {
            return elemento;
        }
    }

    return null;
}

function adicionarTextoFormatadoChat(elemento, texto) {
    const adicionarLinks = (destino, trecho) => {
        const fragmentoLinks = document.createDocumentFragment();
        const padraoLinks = /https?:\/\/[^\s<]+|www\.[^\s<]+/gi;
        let inicioLinks = 0;
        let linkEncontrado;

        while ((linkEncontrado = padraoLinks.exec(trecho)) !== null) {
            let urlTexto = linkEncontrado[0];
            let pontuacaoFinal = "";
            while (/[.,!?;:)\]}]$/.test(urlTexto)) {
                pontuacaoFinal = urlTexto.slice(-1) + pontuacaoFinal;
                urlTexto = urlTexto.slice(0, -1);
            }

            fragmentoLinks.appendChild(
                document.createTextNode(trecho.slice(inicioLinks, linkEncontrado.index))
            );
            const href = urlTexto.toLowerCase().startsWith("www.")
                ? `https://${urlTexto}`
                : urlTexto;
            let urlSegura = false;
            try {
                const url = new URL(href);
                urlSegura = url.protocol === "http:" || url.protocol === "https:";
            } catch (erro) {
                urlSegura = false;
            }

            if (urlSegura) {
                const link = document.createElement("a");
                link.href = href;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.className = "chat-message-link";
                link.textContent = urlTexto;
                fragmentoLinks.appendChild(link);
            } else {
                fragmentoLinks.appendChild(document.createTextNode(urlTexto));
            }
            fragmentoLinks.appendChild(document.createTextNode(pontuacaoFinal));
            inicioLinks = padraoLinks.lastIndex;
        }

        fragmentoLinks.appendChild(document.createTextNode(trecho.slice(inicioLinks)));
        destino.appendChild(fragmentoLinks);
    };

    const fragmento = document.createDocumentFragment();
    const padrao = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`)/g;
    let inicio = 0;
    let correspondencia;

    while ((correspondencia = padrao.exec(texto)) !== null) {
        adicionarLinks(fragmento, texto.slice(inicio, correspondencia.index));

        const marcador = correspondencia[0];
        const emNegrito = marcador.startsWith("**") || marcador.startsWith("__");
        const tamanhoMarcador = marcador.startsWith("`") ? 1 : 2;
        const destaque = document.createElement(emNegrito ? "strong" : "code");
        const conteudo = marcador.slice(tamanhoMarcador, -tamanhoMarcador);
        if (emNegrito) adicionarLinks(destaque, conteudo);
        else destaque.textContent = conteudo;
        fragmento.appendChild(destaque);
        inicio = padrao.lastIndex;
    }

    adicionarLinks(fragmento, texto.slice(inicio));
    elemento.appendChild(fragmento);
}

function renderizarTextoRespostaChat(elemento, texto) {
    const linhas = texto.replace(/\r\n?/g, "\n").split("\n");
    let linhasParagrafo = [];
    let listaAtual = null;
    let tipoLista = null;

    const finalizarParagrafo = () => {
        if (!linhasParagrafo.length) return;

        const paragrafo = document.createElement("p");
        linhasParagrafo.forEach((linha, indice) => {
            if (indice > 0) paragrafo.appendChild(document.createElement("br"));
            adicionarTextoFormatadoChat(paragrafo, linha);
        });
        elemento.appendChild(paragrafo);
        linhasParagrafo = [];
    };

    const finalizarLista = () => {
        listaAtual = null;
        tipoLista = null;
    };

    linhas.forEach(linha => {
        const linhaLimpa = linha.trim();
        if (!linhaLimpa) {
            finalizarParagrafo();
            finalizarLista();
            return;
        }

        const titulo = linhaLimpa.match(/^(#{1,3})\s+(.+)$/);
        const tituloEmNegrito = linhaLimpa.match(/^\*\*(.{1,100})\*\*:?\s*$/);
        if (titulo || tituloEmNegrito) {
            finalizarParagrafo();
            finalizarLista();
            const cabecalho = document.createElement(
                titulo?.[1].length === 1 ? "h3" : "h4"
            );
            adicionarTextoFormatadoChat(cabecalho, titulo?.[2] || tituloEmNegrito[1]);
            elemento.appendChild(cabecalho);
            return;
        }

        const itemLista = linhaLimpa.match(/^(?:[-*•]\s+|(\d+)[.)]\s+)(.+)$/);
        if (itemLista) {
            finalizarParagrafo();
            const novoTipoLista = itemLista[1] ? "ol" : "ul";
            if (tipoLista !== novoTipoLista) {
                finalizarLista();
                listaAtual = document.createElement(novoTipoLista);
                listaAtual.className = "message-list";
                elemento.appendChild(listaAtual);
                tipoLista = novoTipoLista;
            }

            const item = document.createElement("li");
            adicionarTextoFormatadoChat(item, itemLista[2]);
            listaAtual.appendChild(item);
            return;
        }

        finalizarLista();

        const respostaFinal = linhaLimpa.match(/^(?:\*\*)?(resposta final|conclusão)(?:\*\*)?:?\s*(.*)$/i);
        if (respostaFinal) {
            finalizarParagrafo();
            const destaque = document.createElement("p");
            destaque.className = "message-answer-highlight";
            const rotulo = document.createElement("strong");
            rotulo.textContent = `${respostaFinal[1]}${respostaFinal[2] ? ": " : ""}`;
            destaque.appendChild(rotulo);
            adicionarTextoFormatadoChat(destaque, respostaFinal[2]);
            elemento.appendChild(destaque);
            return;
        }

        linhasParagrafo.push(linha);
    });

    finalizarParagrafo();
}


/* --------------------------------------------------------------------------
   ADICIONAR MENSAGEM NA TELA
   -------------------------------------------------------------------------- */

function adicionarMensagemChat(
    tipo,
    texto,
    idMensagem = null,
    data = null
) {

    const container =
        obterContainerMensagensChat();

    if (!container) {

        console.warn(
            "Container de mensagens do chat não encontrado."
        );

        return;
    }

    if (
        idMensagem !== null &&
        idMensagem !== undefined
    ) {

        const chave = String(idMensagem);

        if (chatIdsRenderizados.has(chave)) {
            return;
        }

        chatIdsRenderizados.add(chave);
    }

    const mensagem = document.createElement("div");

    mensagem.className =
        `chat-message ${tipo === "user" ? "user" : "assistant"}`;

    if (idMensagem !== null && idMensagem !== undefined) {

        mensagem.dataset.messageId =
            String(idMensagem);
    }

    const bolha = document.createElement("div");

    bolha.className = "chat-bubble";

    const conteudo = document.createElement("div");

    conteudo.className = "message-content";

    const textoSeguro =
        String(texto || "")
            .trim();

    if (textoSeguro) {

        if (tipo === "user") {
            conteudo.textContent = textoSeguro;
        } else {
            renderizarTextoRespostaChat(conteudo, textoSeguro);
        }

    } else {

        conteudo.textContent =
            "Não foi possível obter uma resposta.";
    }

    bolha.appendChild(conteudo);

    mensagem.appendChild(bolha);

    if (data) {

        const horario =
            document.createElement("small");

        horario.className =
            "chat-message-time";

        try {

            horario.textContent =
                new Date(data).toLocaleTimeString(
                    "pt-BR",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        } catch {

            horario.textContent = "";
        }

        mensagem.appendChild(horario);
    }

    container.appendChild(mensagem);

    container.scrollTop =
        container.scrollHeight;
}


/* --------------------------------------------------------------------------
   INDICADOR DE CARREGAMENTO DA IA
   -------------------------------------------------------------------------- */

function mostrarCarregandoIA() {

    removerCarregandoIA();

    const container =
        obterContainerMensagensChat();

    if (!container) {
        return;
    }

    const carregando =
        document.createElement("div");

    carregando.id =
        "chatIACarregando";

    carregando.className =
        "chat-message assistant";

    const bolha =
        document.createElement("div");

    bolha.className =
        "chat-bubble";

    const conteudo =
        document.createElement("div");

    conteudo.className =
        "message-content";

    conteudo.textContent = chatModoAtendimento === "professor"
        ? "Enviando sua dúvida ao professor..."
        : "EduAssist está pensando...";

    bolha.appendChild(conteudo);

    carregando.appendChild(bolha);

    container.appendChild(carregando);

    container.scrollTop =
        container.scrollHeight;
}


/* --------------------------------------------------------------------------
   REMOVER CARREGAMENTO
   -------------------------------------------------------------------------- */

function removerCarregandoIA() {

    const elemento =
        document.getElementById(
            "chatIACarregando"
        );

    if (elemento) {
        elemento.remove();
    }
}


/* --------------------------------------------------------------------------
   LIMPAR CHAT
   -------------------------------------------------------------------------- */

function limparMensagensChat() {

    const container =
        obterContainerMensagensChat();

    if (!container) {
        return;
    }

    container.innerHTML = "";

    chatIdsRenderizados.clear();
}

function reiniciarChatIA() {
    clearInterval(timerHistoricoProfessorAluno);
    timerHistoricoProfessorAluno = null;
    requisicaoHistoricoIA += 1;
    requisicaoListaProfessoresChat += 1;
    requisicaoHistoricoProfessor += 1;
    professorChatSelecionado = "";
    chatModoAtendimento = "ia";
    document.getElementById("chatModeAI")?.classList.add("is-active");
    document.getElementById("chatModeTeacher")?.classList.remove("is-active");
    document.getElementById("chatModeAI")?.setAttribute("aria-pressed", "true");
    document.getElementById("chatModeTeacher")?.setAttribute("aria-pressed", "false");
    const teacherChoice = document.getElementById("chatTeacherChoice");
    if (teacherChoice) teacherChoice.hidden = true;
    const chatInput = document.getElementById("chatInput");
    if (chatInput) chatInput.placeholder = "Pergunte qualquer dúvida sobre as matérias...";
    ["deepSearchButton", "chatWebButton", "chatSettingsButton"].forEach(id => {
        const controle = document.getElementById(id);
        if (controle) controle.hidden = false;
    });
    if (socketChat) {
        socketChat.removeAllListeners();
        socketChat.disconnect();
        socketChat = null;
    }

    socketChatConectado = false;
    chatInicializado = false;
    chatCarregandoHistorico = false;
    chatEnviando = false;
    chatIdentidadeInicializada = null;
    limparMensagensChat();
}


/* --------------------------------------------------------------------------
   RENDERIZAR HISTÓRICO
   -------------------------------------------------------------------------- */

function renderizarHistoricoChat(mensagens) {

    if (!Array.isArray(mensagens)) {
        return;
    }

    limparMensagensChat();

    if (mensagens.length === 0) {

        adicionarMensagemChat(
            "assistant",
            "Olá! Eu sou o EduAssist. Posso ajudar você com conteúdos escolares, exercícios e dúvidas relacionadas aos seus estudos."
        );

        return;
    }

    mensagens.forEach((mensagem) => {

        if (!mensagem) {
            return;
        }

        const id =
            mensagem.id ||
            mensagem.mensagem_id ||
            mensagem.id_mensagem;

        const remetenteTipo =
            mensagem.remetenteTipo ||
            mensagem.remetente_tipo;

        const data =
            mensagem.criada_em ||
            mensagem.criadaEm ||
            mensagem.created_at ||
            mensagem.data;

        if (remetenteTipo && mensagem.mensagem) {
            const tipo = remetenteTipo === "aluno"
                ? "user"
                : "assistant";

            adicionarMensagemChat(
                tipo,
                mensagem.mensagem,
                id
                    ? `${id}-${tipo === "user" ? "pergunta" : "resposta"}`
                    : null,
                data
            );

            return;
        }

        const pergunta =
            mensagem.pergunta ||
            mensagem.mensagem ||
            mensagem.conteudo;

        const resposta =
            mensagem.respostaIA ||
            mensagem.resposta_ia ||
            mensagem.resposta;

        if (pergunta) {

            adicionarMensagemChat(
                "user",
                pergunta,
                id
                    ? `${id}-pergunta`
                    : null,
                data
            );
        }

        if (resposta) {

            adicionarMensagemChat(
                "assistant",
                resposta,
                id
                    ? `${id}-resposta`
                    : null,
                data
            );
        }
    });
}


/* --------------------------------------------------------------------------
   CARREGAR HISTÓRICO DO BANCO
   -------------------------------------------------------------------------- */

async function carregarHistoricoChat() {
    const requisicaoAtual = ++requisicaoHistoricoIA;

    const aluno =
        obterAlunoAtualChat();

    if (!aluno) {
        return;
    }

    if (!aluno.token) {

        console.warn(
            "Sessão do aluno não possui token de autenticação."
        );

        return;
    }

    chatCarregandoHistorico = true;

    try {

        const resposta =
            await fetch(
                `${API_URL}/chat/historico`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${aluno.token}`
                    }
                }
            );

        if (!resposta.ok) {

            throw new Error(
                resposta.status === 401
                    ? "Sua sessão expirou. Entre novamente para acessar seu chat."
                    : `Erro HTTP ${resposta.status}`
            );
        }

        const dados =
            await resposta.json();

        if (requisicaoAtual !== requisicaoHistoricoIA || chatModoAtendimento !== "ia") {
            return;
        }

        if (
            dados &&
            dados.sucesso &&
            Array.isArray(dados.mensagens)
        ) {

            renderizarHistoricoChat(
                dados.mensagens
            );

        } else if (
            dados &&
            Array.isArray(dados.mensagens)
        ) {

            renderizarHistoricoChat(
                dados.mensagens
            );

        } else {

            limparMensagensChat();

            adicionarMensagemChat(
                "assistant",
                "Olá! Eu sou o EduAssist. Envie uma dúvida sobre seus estudos para começar."
            );
        }

    } catch (erro) {

        if (requisicaoAtual !== requisicaoHistoricoIA || chatModoAtendimento !== "ia") {
            return;
        }

        console.error(
            "Erro ao carregar histórico do chat:",
            erro
        );

        limparMensagensChat();

        adicionarMensagemChat(
            "assistant",
            "Não foi possível carregar o histórico. Você ainda pode tentar enviar uma nova pergunta."
        );

    } finally {

        if (requisicaoAtual === requisicaoHistoricoIA) {
            chatCarregandoHistorico = false;
        }
    }
}


/* --------------------------------------------------------------------------
   PROCESSAR EVENTOS RECEBIDOS PELO SOCKET
   -------------------------------------------------------------------------- */

function processarEventoChat(dados) {

    if (!dados) {
        return;
    }

    const aluno =
        obterAlunoAtualChat();

    if (!aluno) {
        return;
    }

    const alunoAtualId =
        aluno.id ||
        aluno.aluno_id;

    const alunoEventoId =
        dados.alunoId ??
        dados.aluno_id ??
        dados.usuarioId ??
        dados.usuario_id;

    if (
        alunoAtualId &&
        alunoEventoId !== undefined &&
        alunoEventoId !== null &&
        String(alunoEventoId) !== String(alunoAtualId)
    ) {

        return;
    }

    if (dados.professorId || dados.professor_id) {
        const professorId = String(dados.professorId || dados.professor_id);
        if (
            chatModoAtendimento === "professor" &&
            professorId === professorChatSelecionado
        ) {
            carregarHistoricoProfessorAluno();
        }
        return;
    }

    removerCarregandoIA();

    const id =
        dados.id ||
        dados.mensagemId ||
        dados.mensagem_id;

    const data =
        dados.criada_em ||
        dados.criadaEm ||
        dados.created_at ||
        dados.data ||
        new Date().toISOString();

    const remetenteTipo =
        dados.remetenteTipo ||
        dados.remetente_tipo;

    if (remetenteTipo && dados.mensagem) {
        const tipo = remetenteTipo === "aluno"
            ? "user"
            : "assistant";

        adicionarMensagemChat(
            tipo,
            dados.mensagem,
            id
                ? `${id}-${tipo === "user" ? "pergunta" : "resposta"}`
                : null,
            data
        );

        return;
    }

    const pergunta =
        dados.pergunta;

    const resposta =
        dados.respostaIA ||
        dados.resposta_ia ||
        dados.resposta;

    if (pergunta) {
        adicionarMensagemChat(
            "user",
            pergunta,
            id ? `${id}-pergunta` : null,
            data
        );
    }

    if (resposta) {
        adicionarMensagemChat(
            "assistant",
            resposta,
            id ? `${id}-resposta` : null,
            data
        );
    }
}


/* --------------------------------------------------------------------------
   CONECTAR SOCKET.IO
   -------------------------------------------------------------------------- */

function conectarSocketChat() {

    if (
        socketChat &&
        socketChat.connected
    ) {

        socketChatConectado = true;

        atualizarStatusChat(
            "online",
            chatModoAtendimento === "ia" ? "IA online" : "Chat conectado"
        );

        return;
    }

    if (typeof io !== "function") {

        console.warn(
            "Socket.IO ainda não está disponível."
        );

        atualizarStatusChat(
            "conectando",
            "Carregando conexão..."
        );

        return;
    }

    socketChat =
        io(
            API_ORIGIN,
            {
                transports: [
                    "polling",
                    "websocket"
                ],

                reconnection: true,

                reconnectionAttempts: Infinity,

                reconnectionDelay: 1000,

                reconnectionDelayMax: 5000
            }
        );

    socketChat.on(
        "connect",
        () => {

            socketChatConectado = true;

            atualizarStatusChat(
                "online",
                chatModoAtendimento === "ia" ? "IA online" : "Chat conectado"
            );

            const aluno =
                obterAlunoAtualChat();

            if (!aluno) {
                return;
            }

            if (!aluno.token) {
                return;
            }

            socketChat.emit(
                "chat:entrar-aluno",
                {
                    token: aluno.token
                }
            );
        }
    );

    socketChat.on(
        "disconnect",
        () => {

            socketChatConectado = false;

            atualizarStatusChat(
                "offline",
                chatModoAtendimento === "ia"
                    ? "IA desconectada"
                    : "Tempo real indisponível · atualização automática ativa"
            );
        }
    );

    socketChat.on(
        "connect_error",
        (erro) => {

            console.error(
                "Erro no Socket.IO:",
                erro
            );

            socketChatConectado = false;

            atualizarStatusChat(
                "offline",
                chatModoAtendimento === "ia"
                    ? "Reconectando..."
                    : "Tempo real indisponível · atualização automática ativa"
            );
        }
    );

    socketChat.on(
        "chat:nova-mensagem",
        (dados) => {
            processarEventoChat(dados);
        }
    );

    socketChat.on(
        "chat:mensagem-enviada",
        (dados) => {
            processarEventoChat(dados);
        }
    );

    socketChat.on(
        "chat:resposta-ia",
        (dados) => {

            processarEventoChat(dados);
        }
    );

    socketChat.on(
        "chat:atualizado",
        (dados) => {

            processarEventoChat(dados);
        }
    );

    socketChat.on(
        "chat:erro",
        (dados) => {

            removerCarregandoIA();

            const mensagemErro =
                dados?.mensagem ||
                dados?.erro ||
                "Ocorreu um erro ao processar sua pergunta.";

            adicionarMensagemChat(
                "assistant",
                mensagemErro
            );
        }
    );
}


/* --------------------------------------------------------------------------
   CARREGAR CLIENTE SOCKET.IO
   -------------------------------------------------------------------------- */

function carregarClienteSocketIO() {

    return new Promise((resolve, reject) => {

        if (typeof io === "function") {

            resolve();

            return;
        }

        const scriptExistente =
            document.querySelector(
                'script[src*="/socket.io/socket.io.js"]'
            );

        if (scriptExistente) {

            scriptExistente.addEventListener(
                "load",
                () => resolve()
            );

            scriptExistente.addEventListener(
                "error",
                () => reject(
                    new Error(
                        "Não foi possível carregar o Socket.IO."
                    )
                )
            );

            return;
        }

        const script =
            document.createElement("script");

        script.src =
            "/socket.io/socket.io.js";

        script.async = true;

        script.onload = () => {

            resolve();
        };

        script.onerror = () => {

            reject(
                new Error(
                    "Não foi possível carregar o Socket.IO."
                )
            );
        };

        document.head.appendChild(script);
    });
}


/* --------------------------------------------------------------------------
   ENVIAR MENSAGEM PARA A IA
   -------------------------------------------------------------------------- */

async function enviarMensagemChatIA() {

    if (chatEnviando) {
        return;
    }

    const aluno =
        obterAlunoAtualChat();

    if (!aluno) {

        adicionarMensagemChat(
            "assistant",
            "Faça login para utilizar o EduAssist."
        );

        return;
    }

    const input =
        document.getElementById(
            "chatInput"
        ) ||
        document.getElementById(
            "messageInput"
        ) ||
        document.getElementById(
            "chatMessageInput"
        );

    if (!input) {

        console.error(
            "Campo de mensagem do chat não encontrado."
        );

        return;
    }

    const pergunta =
        String(
            input.value || ""
        ).trim();

    if (!pergunta) {
        return;
    }

    if (pergunta.length > 4000) {

        alert(
            "Sua pergunta é muito grande. Envie uma pergunta com até 4000 caracteres."
        );

        return;
    }

    if (!aluno.token) {

        adicionarMensagemChat(
            "assistant",
            "Faça login novamente para acessar seu chat."
        );

        return;
    }

    if (
        chatModoAtendimento === "professor" &&
        !professorChatSelecionado
    ) {
        adicionarMensagemChat(
            "assistant",
            "Escolha um professor antes de enviar sua dúvida."
        );
        document.getElementById("chatTeacherSelect")?.focus();
        return;
    }

    const modoEnvio = chatModoAtendimento;
    const professorIdEnvio = professorChatSelecionado;
    chatEnviando = true;

    input.value = "";

    input.disabled = true;

    const botaoEnviar =
        document.getElementById(
            "sendChatButton"
        ) ||
        document.getElementById(
            "chatSendButton"
        ) ||
        document.querySelector(
            '[data-chat-send]'
        );

    if (botaoEnviar) {
        botaoEnviar.disabled = true;
    }

    const idLocalMensagem = `local-user-${Date.now()}`;
    if (modoEnvio === "professor") {
        renderizarMensagemProfessorAluno({
            id: idLocalMensagem,
            remetenteTipo: "aluno",
            mensagem: pergunta
        });
    } else {
        adicionarMensagemChat(
            "user",
            pergunta,
            idLocalMensagem
        );
    }

    mostrarCarregandoIA();

    try {

        const resposta =
            await fetch(
                modoEnvio === "professor"
                    ? `${API_URL}/chat/professores/${encodeURIComponent(professorIdEnvio)}/mensagens`
                    : `${API_URL}/chat`,
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${aluno.token}`
                    },

                    body: JSON.stringify({
                        ...(modoEnvio === "professor"
                            ? { mensagem: pergunta }
                            : { pergunta })
                    })
                }
            );

        let dados = null;

        try {

            dados =
                await resposta.json();

        } catch {

            dados = null;
        }

        if (!resposta.ok) {

            throw new Error(
                dados?.erro ||
                (typeof dados?.mensagem === "string" ? dados.mensagem : "") ||
                `Erro HTTP ${resposta.status}`
            );
        }

        removerCarregandoIA();

        if (modoEnvio === "professor") {
            if (
                chatModoAtendimento === "professor" &&
                professorChatSelecionado === professorIdEnvio
            ) {
                await carregarHistoricoProfessorAluno();
                iniciarAtualizacaoHistoricoProfessorAluno();
                const descricao = document.getElementById("chatModeDescription");
                if (descricao) {
                    descricao.textContent = "Sua dúvida foi enviada; a resposta do professor aparecerá aqui.";
                }
            }
            return;
        }

        if (chatModoAtendimento !== modoEnvio) return;

        /*
         * Caso o backend retorne a resposta
         * diretamente pelo POST.
         */

        const respostaIA =
            dados?.respostaIA ||
            dados?.resposta_ia ||
            dados?.resposta ||
            dados?.mensagemIA;

        if (respostaIA) {

            const id =
                dados?.chat?.id ||
                dados?.id ||
                dados?.mensagemId ||
                dados?.mensagem_id ||
                `local-ai-${Date.now()}`;

            adicionarMensagemChat(
                "assistant",
                respostaIA,
                `${id}-resposta`
            );
        }

        /*
         * Se o backend apenas salvar a mensagem
         * e enviar a resposta pelo Socket.IO,
         * não adicionamos outra mensagem aqui.
         */

    } catch (erro) {

        console.error(
            "Erro ao enviar mensagem para IA:",
            erro
        );

        removerCarregandoIA();

        if (modoEnvio === "professor") {
            const mensagemLocal = [...document.querySelectorAll(
                "#chatMessages [data-message-id]"
            )].find(item => item.dataset.messageId === idLocalMensagem);
            mensagemLocal?.remove();
            chatIdsRenderizados.delete(idLocalMensagem);
            if (
                chatModoAtendimento === "professor" &&
                professorChatSelecionado === professorIdEnvio
            ) {
                adicionarMensagemChat(
                    "assistant",
                    erro.message || "Não foi possível enviar sua pergunta. Tente novamente."
                );
            }
        } else {
            if (chatModoAtendimento === modoEnvio) {
                adicionarMensagemChat(
                    "assistant",
                    erro.message ||
                    "Não foi possível enviar sua pergunta. Tente novamente."
                );
            }
        }

    } finally {

        chatEnviando = false;

        input.disabled = false;

        if (botaoEnviar) {
            botaoEnviar.disabled = false;
        }

        input.focus();
    }
}


/* --------------------------------------------------------------------------
   INICIALIZAR CHAT
   -------------------------------------------------------------------------- */

async function inicializarChatIA() {

    inicializarControlesModoChat();

    const aluno =
        obterAlunoAtualChat();

    if (!aluno?.token) {
        reiniciarChatIA();
        return;
    }

    const alunoIdAtual = String(
        aluno.id ||
        aluno.aluno_id ||
        aluno.email ||
        aluno.token
    );

    if (
        chatInicializado &&
        chatIdentidadeInicializada === alunoIdAtual
    ) {
        if (socketChat && !socketChat.connected) {
            conectarSocketChat();
        }
        return;
    }

    if (chatInicializado) {
        reiniciarChatIA();
    }

    chatInicializado = true;
    chatIdentidadeInicializada = alunoIdAtual;
    limparMensagensChat();

    atualizarStatusChat(
        "conectando",
        "Conectando..."
    );

    try {

        await carregarClienteSocketIO();

        conectarSocketChat();

    } catch (erro) {

        console.error(
            "Erro ao iniciar Socket.IO:",
            erro
        );

        atualizarStatusChat(
            "offline",
            "Chat offline"
        );
    }

    if (chatModoAtendimento === "professor") {
        await carregarProfessoresParaChat();
    } else {
        await carregarHistoricoChat();
    }

    const input =
        document.getElementById(
            "chatInput"
        ) ||
        document.getElementById(
            "messageInput"
        ) ||
        document.getElementById(
            "chatMessageInput"
        );

    if (input) {

        input.addEventListener(
            "keydown",
            (evento) => {

                if (
                    evento.key === "Enter" &&
                    !evento.shiftKey
                ) {

                    evento.preventDefault();

                    enviarMensagemChatIA();
                }
            }
        );
    }

    const botaoEnviar =
        document.getElementById(
            "sendChatButton"
        ) ||
        document.getElementById(
            "chatSendButton"
        ) ||
        document.querySelector(
            '[data-chat-send]'
        );

    if (botaoEnviar) {

        botaoEnviar.addEventListener(
            "click",
            (evento) => {

                evento.preventDefault();

                enviarMensagemChatIA();
            }
        );
    }
}

/* ==========================================================================
   INICIALIZAÇÃO FINAL DO EDUCONNECT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    atualizarDataCabecalho();
    window.setInterval(atualizarDataCabecalho, 60 * 1000);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) atualizarDataCabecalho();
    });

    console.log(
        "🚀 EduConnect: iniciando aplicação..."
    );

    try {

        /* ------------------------------------------------------------------
           INICIALIZAÇÃO DOS MODAIS
           ------------------------------------------------------------------ */

        inicializarModais();


        /* ------------------------------------------------------------------
           INICIALIZAÇÃO DA TECLA ESC
           ------------------------------------------------------------------ */

        inicializarTeclaEscape();


        /* ------------------------------------------------------------------
           INICIALIZAÇÃO DO MENU
           ------------------------------------------------------------------ */

        inicializarMenu();


        /* ------------------------------------------------------------------
           INICIALIZAÇÃO DOS AGENDAMENTOS
           ------------------------------------------------------------------ */

        inicializarElementosAgendamento();

        prepararHorariosPadrao();


        /* ------------------------------------------------------------------
           VERIFICAR USUÁRIO LOGADO
           ------------------------------------------------------------------ */

        verificarUsuarioLogado();


        /* ------------------------------------------------------------------
           PROTEGER PAINEL ADMINISTRATIVO
           ------------------------------------------------------------------ */

        protegerPainelAdmin();


        /* ------------------------------------------------------------------
           VERIFICAR ELEMENTOS DO SITE
           ------------------------------------------------------------------ */

        const authScreen =
            document.getElementById(
                "authScreen"
            );

        const siteContainer =
            document.getElementById(
                "siteContainer"
            );

        const caminhoAtual = window.location.pathname.replace(/\/+$/, "");
        const portalProfessorAtivo = await inicializarPortalProfessor();
        if (!portalProfessorAtivo && caminhoAtual !== "/admin") {
            inicializarRecursosEducacionais();
        }

        /*
         * Se existe usuário salvo, mostramos o site.
         */

        const usuarioSalvo =
            portalProfessorAtivo || caminhoAtual === "/admin"
                ? null
                : sessionStorage.getItem("usuarioLogado");

        if (portalProfessorAtivo) {
            // O portal do professor já foi inicializado acima.
        } else if (caminhoAtual === "/admin") {
            inicializarFormularioMonitorAdmin();
            await inicializarPortalAdmin();
        } else if (usuarioSalvo) {

            try {

                const usuario =
                    JSON.parse(usuarioSalvo);

                if (usuario) {

                    if (authScreen) {

                        authScreen.style.display =
                            "none";
                    }

                    if (siteContainer) {

                        siteContainer.style.display =
                            "flex";
                    }

                    atualizarUsuarioNaInterface();

                    /*
                     * Mostra o dashboard somente
                     * para o aluno.
                     */

                    showView("dashboard");


                    /* ------------------------------------------------------
                       CARREGAR MONITORES
                       ------------------------------------------------------ */

                    try {

                        await carregarMonitores();

                    } catch (erro) {

                        console.error(
                            "Erro ao carregar monitores:",
                            erro
                        );
                    }


                    /* ------------------------------------------------------
                       CARREGAR AGENDAMENTOS
                       ------------------------------------------------------ */

                    try {

                        await carregarAgendamentos();

                    } catch (erro) {

                        console.error(
                            "Erro ao carregar agendamentos:",
                            erro
                        );
                    }


                    /* ------------------------------------------------------
                       INICIALIZAR CHAT COM IA
                       ------------------------------------------------------ */

                    try {

                        await inicializarChatIA();

                    } catch (erro) {

                        console.error(
                            "Erro ao inicializar EduAssist:",
                            erro
                        );
                    }
                }

            } catch (erro) {

                console.error(
                    "Sessão do usuário inválida:",
                    erro
                );

                sessionStorage.removeItem(
                    "usuarioLogado"
                );

                if (authScreen) {

                    authScreen.style.display =
                        "flex";
                }

                if (siteContainer) {

                    siteContainer.style.display =
                        "none";
                }
            }

        } else {

            /*
             * Nenhum usuário está logado.
             * Mantemos somente a tela de autenticação.
             */

            if (authScreen) {

                authScreen.style.display =
                    "flex";
            }

            if (siteContainer) {

                siteContainer.style.display =
                    "none";
            }

            protegerPainelAdmin();
        }


        /* ------------------------------------------------------------------
           EVENTOS DOS BOTÕES DO CHAT
           ------------------------------------------------------------------ */

        const botaoEnviarChat =
            document.getElementById(
                "sendChatButton"
            ) ||
            document.getElementById(
                "chatSendButton"
            ) ||
            document.querySelector(
                "[data-chat-send]"
            );

        if (botaoEnviarChat) {

            /*
             * Evita adicionar o evento duas vezes.
             */

            if (
                !botaoEnviarChat.dataset
                    .chatInicializado
            ) {

                botaoEnviarChat.dataset
                    .chatInicializado = "true";

                botaoEnviarChat.addEventListener(
                    "click",
                    (evento) => {

                        evento.preventDefault();

                        enviarMensagemChatIA();
                    }
                );
            }
        }


        /* ------------------------------------------------------------------
           CAMPO DE CHAT
           ------------------------------------------------------------------ */

        const inputChat =
            document.getElementById(
                "chatInput"
            ) ||
            document.getElementById(
                "messageInput"
            ) ||
            document.getElementById(
                "chatMessageInput"
            );

        if (inputChat) {

            if (
                !inputChat.dataset
                    .chatInicializado
            ) {

                inputChat.dataset
                    .chatInicializado = "true";

                inputChat.addEventListener(
                    "keydown",
                    (evento) => {

                        /*
                         * Enter envia.
                         *
                         * Shift + Enter cria
                         * uma nova linha.
                         */

                        if (
                            evento.key === "Enter" &&
                            !evento.shiftKey
                        ) {

                            evento.preventDefault();

                            enviarMensagemChatIA();
                        }
                    }
                );
            }
        }


        /* ------------------------------------------------------------------
           BOTÃO DE LOGOUT
           ------------------------------------------------------------------ */

        const botoesLogout =
            document.querySelectorAll(
                "[data-logout]"
            );

        botoesLogout.forEach(
            (botao) => {

                if (
                    botao.dataset
                        .logoutInicializado
                ) {

                    return;
                }

                botao.dataset
                    .logoutInicializado = "true";

                botao.addEventListener(
                    "click",
                    (evento) => {

                        evento.preventDefault();

                        logout();
                    }
                );
            }
        );


        /* ------------------------------------------------------------------
           BOTÃO DO ADMINISTRADOR
           ------------------------------------------------------------------ */

        const botoesAdmin =
            document.querySelectorAll(
                "[data-admin]"
            );

        botoesAdmin.forEach(
            (botao) => {

                if (
                    botao.dataset
                        .adminInicializado
                ) {

                    return;
                }

                botao.dataset
                    .adminInicializado = "true";

                botao.addEventListener(
                    "click",
                    (evento) => {

                        evento.preventDefault();

                        openAdminModal();
                    }
                );
            }
        );


        /* ------------------------------------------------------------------
           CARREGAR NOTIFICAÇÕES
           ------------------------------------------------------------------ */

        if (usuarioSalvo) {

            try {

                await carregarNotificacoes();

            } catch (erro) {

                console.warn(
                    "Não foi possível carregar notificações:",
                    erro
                );
            }
        }


        /* ------------------------------------------------------------------
           FINALIZAÇÃO
           ------------------------------------------------------------------ */

        console.log(
            "✅ EduConnect iniciado com sucesso."
        );

    } catch (erro) {

        console.error(
            "❌ Erro durante a inicialização do EduConnect:",
            erro
        );
    }
});


/* ==========================================================================
   TRATAMENTO GLOBAL DE ERROS
   ========================================================================== */

window.addEventListener(
    "error",
    (evento) => {

        console.error(
            "❌ Erro JavaScript:",
            evento.error || evento.message
        );
    }
);


/* ==========================================================================
   TRATAMENTO DE PROMISES REJEITADAS
   ========================================================================== */

window.addEventListener(
    "unhandledrejection",
    (evento) => {

        console.error(
            "❌ Promise rejeitada:",
            evento.reason
        );
    }
);


/* ==========================================================================
   EDUCONNECT CARREGADO
   ========================================================================== */

console.log(
    "📚 EduConnect - Premium Dashboard"
);

console.log(
    "🤖 EduAssist AI preparado"
);

console.log(
    "🔌 Sistema de tempo real preparado"
);



/* ==========================================================================
   EDUASSIST AI — ORGANIZAÇÃO DAS CONVERSAS E MENU LATERAL
   Armazenamento local por aluno; não altera a aparência geral do EduConnect.
   ========================================================================== */
(() => {
    const STORAGE_PREFIX = "educonnect_chat_conversations_v1";
    let activeConversationId = null;
    let activeConversation = null;
    let activeOwnerKey = null;
    let previousViewForChat = null;

    function currentStudentKey() {
        const student = typeof obterAlunoAtualChat === "function" ? obterAlunoAtualChat() : null;
        if (!student?.token) return "sem-sessao";

        const identity =
            student.id ||
            student.aluno_id ||
            student.email ||
            student.token;

        let hash = 2166136261;
        for (const character of String(identity)) {
            hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
        }

        return `aluno_${(hash >>> 0).toString(36)}`;
    }
    function sincronizarDonoDaConversa() {
        const ownerKey = currentStudentKey();

        if (activeOwnerKey === ownerKey) return false;

        activeOwnerKey = ownerKey;
        activeConversationId = null;
        activeConversation = null;

        if (typeof limparMensagensChat === "function") {
            limparMensagensChat();
        }

        return true;
    }
    function storageKey() { return `${STORAGE_PREFIX}_${currentStudentKey()}`; }
    function readConversations() {
        sincronizarDonoDaConversa();

        const student = typeof obterAlunoAtualChat === "function" ? obterAlunoAtualChat() : null;
        if (!student?.token) return [];

        try {
            const value = JSON.parse(localStorage.getItem(storageKey()) || "[]");
            return Array.isArray(value) ? value : [];
        } catch (_) { return []; }
    }
    // Histórico persistente por aluno e sincronização imediata entre abas do mesmo navegador.
    const CHAT_SYNC_CHANNEL = "educonnect-chat-sidebar-sync";
    let chatSyncChannel = null;
    try {
        if ("BroadcastChannel" in window) {
            chatSyncChannel = new BroadcastChannel(CHAT_SYNC_CHANNEL);
            chatSyncChannel.addEventListener("message", event => {
                if (event.data?.key === storageKey()) {
                    renderSidebarHistory(document.getElementById("chatSearchInput")?.value || "");
                }
            });
        }
    } catch (error) {
        console.warn("Sincronização entre abas indisponível; o histórico local continuará funcionando.", error);
    }

    function writeConversations(items) {
        sincronizarDonoDaConversa();

        const student = typeof obterAlunoAtualChat === "function" ? obterAlunoAtualChat() : null;
        if (!student?.token) return;

        const key = storageKey();
        try {
            localStorage.setItem(key, JSON.stringify(items.slice(0, 80)));
            chatSyncChannel?.postMessage({ key, updatedAt: Date.now() });
        } catch (error) {
            console.warn("Não foi possível salvar o histórico local do chat.", error);
        }
    }

    // O evento storage atualiza a barra lateral em outras abas/janelas abertas.
    window.addEventListener("storage", event => {
        if (event.key === storageKey()) {
            renderSidebarHistory(document.getElementById("chatSearchInput")?.value || "");
        }
    });
    function titleFrom(text) {
        const clean = String(text || "").replace(/\s+/g, " ").trim();
        return clean.length > 44 ? clean.slice(0, 41) + "..." : (clean || "Novo chat");
    }
    function ensureConversation() {
        sincronizarDonoDaConversa();

        if (activeConversation) return activeConversation;
        activeConversation = {
            id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: "Novo chat",
            updatedAt: new Date().toISOString(),
            messages: []
        };
        activeConversationId = activeConversation.id;
        return activeConversation;
    }
    function persistActive() {
        if (sincronizarDonoDaConversa()) {
            renderSidebarHistory();
            return;
        }

        if (!activeConversation || !activeConversation.messages.length) {
            renderSidebarHistory();
            return;
        }
        activeConversation.updatedAt = new Date().toISOString();
        const firstUser = activeConversation.messages.find(m => m.role === "user");
        if (firstUser) activeConversation.title = titleFrom(firstUser.text);
        const all = readConversations().filter(c => c.id !== activeConversation.id);
        all.unshift(activeConversation);
        writeConversations(all);
        renderSidebarHistory();
        updateConversationHeading();
    }
    function updateConversationHeading() {
        const title = document.getElementById("chatConversationTitle");
        if (title) title.textContent = activeConversation?.title || "Novo chat";
    }
    function prepararElementosDaBarraLateral() {
        const section = document.querySelector("#chatView .history-section");
        if (section && !document.getElementById("chatHistoryList")) {
            // O HTML original tinha conversas de exemplo fixas; substituímos apenas a lista,
            // mantendo a estrutura visual e os estilos existentes.
            section.replaceChildren();
            const today = document.createElement("h4");
            today.textContent = "HOJE";
            const list = document.createElement("div");
            list.id = "chatHistoryList";
            const older = document.createElement("h4");
            older.id = "chatOlderHeading";
            older.textContent = "ANTERIORES";
            const olderList = document.createElement("div");
            olderList.id = "chatOlderHistoryList";
            section.append(today, list, older, olderList);
        }
        const menuItems = document.querySelectorAll("#chatView .menu-group .menu-item");
        ["explore", "library", "files", "history"].forEach((action, index) => {
            const item = menuItems[index];
            if (item) {
                item.dataset.chatAction = action;
                item.setAttribute("role", "button");
                item.setAttribute("tabindex", "0");
                item.style.cursor = "pointer";
            }
        });
        const main = document.querySelector("#chatView .blueassist-main");
        if (main && !document.getElementById("chatConversationTitle")) {
            const topBar = main.querySelector(".blueassist-top-bar");
            if (topBar) {
                const heading = document.createElement("span");
                heading.id = "chatConversationTitle";
                heading.textContent = "Novo chat";
                heading.style.cssText = "font-weight:600; margin-left:12px;";
                topBar.appendChild(heading);
            }
        }
    }

    function renderSidebarHistory(filter = "") {
        sincronizarDonoDaConversa();
        prepararElementosDaBarraLateral();
        const list = document.getElementById("chatHistoryList");
        const olderList = document.getElementById("chatOlderHistoryList");
        if (!list || !olderList) return;
        const needle = String(filter || "").trim().toLocaleLowerCase("pt-BR");
        const conversations = readConversations()
            .filter(c => !needle || String(c.title || "").toLocaleLowerCase("pt-BR").includes(needle))
            .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        list.replaceChildren();
        olderList.replaceChildren();
        const todayKey = new Date().toDateString();
        const today = conversations.filter(c => new Date(c.updatedAt || 0).toDateString() === todayKey);
        const older = conversations.filter(c => new Date(c.updatedAt || 0).toDateString() !== todayKey);
        function appendConversation(target, conversation) {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "history-item" + (conversation.id === activeConversationId ? " active" : "");
            item.textContent = conversation.title || "Novo chat";
            item.title = conversation.title || "Novo chat";
            item.style.cssText = "display:block;width:100%;text-align:left;border:0;background:transparent;cursor:pointer;";
            item.addEventListener("click", () => openSavedConversation(conversation.id));
            target.appendChild(item);
        }
        today.forEach(c => appendConversation(list, c));
        older.forEach(c => appendConversation(olderList, c));
        const noResults = !conversations.length;
        if (noResults) {
            const empty = document.createElement("p");
            empty.className = "chat-history-empty";
            empty.textContent = needle ? "Nenhuma conversa encontrada." : "Suas conversas aparecerão aqui.";
            list.appendChild(empty);
        }
        const olderHeading = document.getElementById("chatOlderHeading");
        if (olderHeading) olderHeading.hidden = older.length === 0;
    }
    function addWelcomeMessage() {
        if (typeof limparMensagensChat === "function") limparMensagensChat();
        if (typeof adicionarMensagemChat === "function") {
            adicionarMensagemChat("assistant", "Olá! Eu sou o EduAssist. 😊\n\nPosso ajudar com matérias escolares, exercícios e explicações passo a passo.\n\n**Para começar:** escreva sua dúvida abaixo ou escolha uma sugestão.");
        }
    }
    function startNewConversation() {
        sincronizarDonoDaConversa();
        persistActive();
        activeConversation = {
            id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: "Novo chat",
            updatedAt: new Date().toISOString(),
            messages: []
        };
        activeConversationId = activeConversation.id;
        if (typeof limparMensagensChat === "function") limparMensagensChat();
        addWelcomeMessage();
        const input = document.getElementById("chatInput");
        if (input) { input.value = ""; input.disabled = false; input.focus(); }
        updateConversationHeading();
        renderSidebarHistory(document.getElementById("chatSearchInput")?.value || "");
        hideSidebarPanel();
    }
    function openSavedConversation(id) {
        sincronizarDonoDaConversa();
        persistActive();
        const saved = readConversations().find(c => c.id === id);
        if (!saved) return;
        activeConversation = JSON.parse(JSON.stringify(saved));
        activeConversationId = saved.id;
        if (typeof limparMensagensChat === "function") limparMensagensChat();
        (activeConversation.messages || []).forEach(m => {
            if (typeof adicionarMensagemChat === "function") {
                adicionarMensagemChat(m.role === "user" ? "user" : "assistant", m.text, m.id || null, m.at || null);
            }
        });
        if (!activeConversation.messages.length) addWelcomeMessage();
        updateConversationHeading();
        renderSidebarHistory(document.getElementById("chatSearchInput")?.value || "");
        hideSidebarPanel();
    }
    function hideSidebarPanel() {
        document.getElementById("chatSidebarPanel")?.remove();
        document.querySelectorAll("[data-chat-action]").forEach(item => {
            item.classList.remove("is-active");
            item.setAttribute("aria-expanded", "false");
        });
    }
    function showSidebarPanel(kind) {
        hideSidebarPanel();
        const main = document.querySelector("#chatView .blueassist-main");
        if (!main) return;
        const panel = document.createElement("section");
        panel.id = "chatSidebarPanel";
        panel.className = "chat-sidebar-panel";
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-live", "polite");
        const title = document.createElement("h4");
        title.className = "chat-sidebar-panel-title";
        const titleIcon = document.createElement("i");
        titleIcon.className = ({ explore: "ph ph-compass", library: "ph ph-bookmark-simple", files: "ph ph-folder-open", history: "ph ph-clock-counter-clockwise" })[kind] || "ph ph-sparkle";
        titleIcon.setAttribute("aria-hidden", "true");
        title.appendChild(titleIcon);
        const titleText = document.createElement("span");
        title.appendChild(titleText);
        const body = document.createElement("div");
        body.className = "chat-sidebar-panel-body";
        if (kind === "explore") {
            titleText.textContent = "Explorar sugestões";
            body.innerHTML = "";
            const p = document.createElement("p");
            p.textContent = "Escolha um tema para iniciar uma conversa:";
            body.appendChild(p);
            [
                ["Matemática", "Explique uma função do primeiro grau com exemplos."],
                ["Ciências", "Explique as leis de Newton de forma simples."],
                ["Redação", "Sugira temas de redação e ajude a montar uma estrutura."],
                ["Português", "Explique regras de pontuação com exemplos."]
            ].forEach(([label, prompt]) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "chat-suggestion-card";
                const cardIcon = document.createElement("i");
                cardIcon.className = ({ "Matemática": "ph ph-calculator", "Ciências": "ph ph-atom", "Redação": "ph ph-notebook", "Português": "ph ph-quotes" })[label] || "ph ph-lightbulb";
                cardIcon.setAttribute("aria-hidden", "true");
                const cardLabel = document.createElement("strong");
                cardLabel.textContent = label;
                const cardArrow = document.createElement("span");
                cardArrow.className = "chat-suggestion-arrow";
                cardArrow.innerHTML = "<i class=\"ph ph-arrow-up-right\" aria-hidden=\"true\"></i>";
                button.append(cardIcon, cardLabel, cardArrow);
                button.addEventListener("click", () => {
                    startNewConversation();
                    const input = document.getElementById("chatInput");
                    if (input) input.value = prompt;
                    hideSidebarPanel();
                    input?.focus();
                });
                body.appendChild(button);
            });
        } else if (kind === "library") {
            titleText.textContent = "Biblioteca";
            const p = document.createElement("p");
            p.textContent = "Salve materiais importantes usando os favoritos do navegador ou retome uma conversa no histórico lateral. As conversas ficam guardadas neste dispositivo.";
            body.appendChild(p);
        } else if (kind === "files") {
            titleText.textContent = "Arquivos";
            const p = document.createElement("p");
            p.textContent = "Você pode selecionar um arquivo para consultar. O arquivo fica disponível nesta conversa apenas se o navegador e o servidor oferecerem suporte ao envio.";
            const input = document.createElement("input");
            input.type = "file"; input.accept = ".txt,.pdf,.doc,.docx,.csv,.png,.jpg,.jpeg";
            input.setAttribute("aria-label", "Selecionar arquivo para referência");
            input.style.display = "block"; input.style.marginTop = "8px";
            input.addEventListener("change", () => {
                const file = input.files && input.files[0];
                if (file) {
                    const notice = document.createElement("p");
                    notice.textContent = `Arquivo selecionado: ${file.name}. O envio para a IA precisa estar implementado no servidor para que o conteúdo seja analisado.`;
                    body.appendChild(notice);
                }
            });
            body.append(p, input);
        } else {
            titleText.textContent = "Histórico de conversas";
            const p = document.createElement("p");
            p.textContent = "Selecione uma conversa na barra lateral para reabri-la. Use a busca para filtrar os títulos.";
            body.appendChild(p);
            const button = document.createElement("button");
            button.type = "button"; button.textContent = "Limpar histórico";
            button.className = "chat-clear-history-button";
            button.addEventListener("click", () => {
                const confirmed = window.confirm("Deseja apagar todas as conversas salvas neste navegador? Essa ação não pode ser desfeita.");
                if (!confirmed) return;
                try { localStorage.removeItem(storageKey()); } catch (error) {
                    console.warn("Não foi possível limpar o histórico local.", error);
                }
                activeConversation = null;
                activeConversationId = null;
                if (typeof limparMensagensChat === "function") limparMensagensChat();
                const search = document.getElementById("chatSearchInput");
                if (search) search.value = "";
                startNewConversation();
                renderSidebarHistory("");
                const notice = document.createElement("p");
                notice.className = "chat-history-empty-notice";
                notice.textContent = "Histórico apagado. Suas próximas conversas aparecerão aqui.";
                body.appendChild(notice);
            });
            body.appendChild(button);
        }
        panel.append(title, body);
        const top = main.querySelector(".blueassist-top-bar");
        if (top) top.insertAdjacentElement("afterend", panel);
        else main.prepend(panel);
    }

    // Renderiza Markdown básico como elementos DOM seguros, sem inserir HTML da IA.
    function appendFormattedText(container, raw) {
        // Normaliza respostas da IA que chegam com Markdown/LaTeX literal.
        const normalize = value => String(value || "")
            .replace(/\r\n?/g, "\n")
            .replace(/\\\[([\s\S]*?)\\\]/g, "$1")
            .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
            .replace(/^\s*>\s?/gm, "")
            .replace(/^\s*[-*_]{3,}\s*$/gm, "")
            .replace(/\\(?:quad|qquad)\b/g, " ")
            .replace(/\\(?:Rightarrow|rightarrow)\b/g, " → ")
            .replace(/\\(?:ne|neq)\b/g, " ≠ ")
            .replace(/\\(?:times)\b/g, " × ")
            .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1/$2)")
            .replace(/\\sqrt\s*\{([^{}]+)\}/g, "√($1)")
            .replace(/\\text\s*\{([^{}]*)\}/g, "$1")
            .replace(/\\(?:left|right)\b/g, "")
            .replace(/\\%/g, "%")
            .replace(/\\_/g, "_")
            .replace(/\\\\/g, "\n")
            .replace(/\\([()[\]{}])/g, "$1")
            .replace(/\\([a-zA-Z]+)/g, "$1")
            // Preserve marcadores de negrito para appendInline renderizar corretamente.
            .replace(/(^|\s)(#{1,4}\s+)/g, "$1\\n$2")
            .replace(/\s+(\d+[.)]\s+)/g, "\\n$1")
            .replace(/\s+([-*•]\s+)/g, "\\n$1")
            .trim();

        const lines = normalize(raw).split("\n");
        let list = null, listType = null, paragraph = [];
        const flushParagraph = () => {
            if (!paragraph.length) return;
            const p = document.createElement("p");
            appendInline(p, paragraph.join(" "));
            container.appendChild(p);
            paragraph = [];
        };
        const closeList = () => { list = null; listType = null; };
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) { flushParagraph(); closeList(); return; }
            const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
            if (heading) {
                flushParagraph(); closeList();
                const h = document.createElement(heading[1].length <= 2 ? "h3" : "h4");
                appendInline(h, heading[2]);
                container.appendChild(h); return;
            }
            const bullet = trimmed.match(/^(?:[-*•]|\u2022)\s+(.+)$/);
            const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
            if (bullet || numbered) {
                flushParagraph();
                const type = bullet ? "ul" : "ol";
                if (!list || listType !== type) {
                    closeList(); list = document.createElement(type); listType = type;
                    container.appendChild(list);
                }
                const li = document.createElement("li");
                appendInline(li, (bullet || numbered)[1]);
                list.appendChild(li); return;
            }
            closeList();
            paragraph.push(trimmed);
        });
        flushParagraph();
    }
    function appendInline(parent, text) {
        const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        parts.forEach(part => {
            if (!part) return;
            if (part.startsWith("**") && part.endsWith("**")) {
                const strong = document.createElement("strong");
                adicionarTextoFormatadoChat(strong, part.slice(2, -2)); parent.appendChild(strong);
            } else if (part.startsWith("`") && part.endsWith("`")) {
                const code = document.createElement("code");
                code.textContent = part.slice(1, -1); parent.appendChild(code);
            } else {
                adicionarTextoFormatadoChat(parent, part);
            }
        });
    }

    const originalAddMessage = window.adicionarMensagemChat;
    if (typeof originalAddMessage === "function") {
        window.adicionarMensagemChat = function(role, text, id = null, date = null) {
            originalAddMessage(role, text, id, date);
            const cleanText = String(text || "").trim();
            if (!cleanText || String(id || "").startsWith("legacy-")) return;
            const conversation = ensureConversation();
            // IDs locais de usuário são temporários e a resposta pode vir com ID do servidor.
            const messageId = id ? String(id) : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            if (conversation.messages.some(m => m.id === messageId)) return;
            conversation.messages.push({ id: messageId, role: role === "user" ? "user" : "assistant", text: cleanText, at: date || new Date().toISOString() });
            persistActive();
        };
    }

    // Substitui o renderizador de bolhas por uma versão organizada e segura.
    if (typeof window.adicionarMensagemChat === "function") {
        const formattedAdd = window.adicionarMensagemChat;
        window.adicionarMensagemChat = function(role, text, id = null, date = null) {
            formattedAdd(role, text, id, date);
            const container = document.getElementById("chatMessages");
            if (!container) return;
            const message = id ? container.querySelector(`[data-message-id="${CSS.escape(String(id))}"]`) : container.lastElementChild;
            const content = message?.querySelector(".message-content");
            if (content && !content.dataset.formatted) {
                content.replaceChildren();
                appendFormattedText(content, text);
                content.dataset.formatted = "true";
            }
        };
    }

    // O novo chat não importa todo o histórico agregado do servidor para a conversa atual.
    window.carregarHistoricoChat = async function() {
        const conversation = ensureConversation();
        if (conversation.messages.length) {
            if (typeof limparMensagensChat === "function") limparMensagensChat();
            conversation.messages.forEach(m => {
                const original = window.adicionarMensagemChat;
                // Evita duplicar a gravação ao reconstruir mensagens salvas.
                original(m.role, m.text, `restore-${m.id}`, m.at);
            });
        } else {
            addWelcomeMessage();
        }
        updateConversationHeading();
        renderSidebarHistory();
    };

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) renderSidebarHistory(document.getElementById("chatSearchInput")?.value || "");
    });

    document.addEventListener("DOMContentLoaded", () => {
        activeConversation = null;
        activeConversationId = null;
        prepararElementosDaBarraLateral();
        renderSidebarHistory();
        document.getElementById("newChatButton")?.addEventListener("click", startNewConversation);
        document.getElementById("chatSearchInput")?.addEventListener("input", e => renderSidebarHistory(e.target.value));
        document.querySelectorAll("#chatView [data-chat-action]").forEach(button => {
            const activate = () => showSidebarPanel(button.dataset.chatAction);
            button.addEventListener("click", activate);
            button.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
            });
        });
        // Ao entrar no chat vindo de outra tela, começa uma conversa vazia.
        const baseShowView = window.showView;
        if (typeof baseShowView === "function" && !baseShowView.__chatWrapped) {
            const wrapped = function(viewName) {
                const enteringChat = viewName === "chat" && previousViewForChat !== "chat";
                const leavingChat = previousViewForChat === "chat" && viewName !== "chat";
                if (leavingChat) persistActive();
                baseShowView.apply(this, arguments);
                if (enteringChat) {
                    startNewConversation();
                    if (typeof inicializarChatIA === "function") inicializarChatIA();
                }
                previousViewForChat = viewName;
            };
            wrapped.__chatWrapped = true;
            window.showView = wrapped;
        }
        // Recarrega histórico dinâmico e nome do usuário sem mexer no restante do menu.
        renderSidebarHistory();
        const student = typeof obterAlunoAtualChat === "function" ? obterAlunoAtualChat() : null;
        if (student) {
            const name = document.getElementById("chatUserName");
            const email = document.getElementById("chatUserEmail");
            const avatar = document.getElementById("chatUserAvatar");
            if (name) name.textContent = student.nome || student.name || "Aluno(a)";
            if (email) email.textContent = student.email || "aluno@email.com";
            if (avatar) avatar.textContent = String(student.nome || student.name || "Aluno").split(/\s+/).slice(0,2).map(s => s[0]).join("").toUpperCase();
        }
    });
})();

/* Correções de navegação da autenticação e dos painéis laterais */
document.addEventListener("DOMContentLoaded", () => {
    const registerLink = document.getElementById("showRegister");
    const loginLink = document.getElementById("showLogin");
    const adminLoginLink = document.getElementById("showAdminLogin");
    const studentLoginLink = document.getElementById("showStudentLogin");

    function openAdminLogin(event) {
        event.preventDefault();
        toggleAuthMode("admin");
        document.getElementById("adminCardEmail")?.focus();
    }

    registerLink?.addEventListener("click", event => {
        event.preventDefault();
        toggleAuthMode("register");
        document.getElementById("registerName")?.focus();
    });
    loginLink?.addEventListener("click", event => {
        event.preventDefault();
        toggleAuthMode("login");
        document.getElementById("loginEmail")?.focus();
    });
    adminLoginLink?.addEventListener("click", openAdminLogin);
    document.querySelectorAll(".showAdminLoginLink").forEach(link => {
        link.addEventListener("click", openAdminLogin);
    });
    studentLoginLink?.addEventListener("click", event => {
        event.preventDefault();
        toggleAuthMode("login");
        document.getElementById("loginEmail")?.focus();
    });
    // Garante que os itens da barra lateral funcionem também com teclado.
    document.querySelectorAll("#chatView .menu-group .menu-item").forEach(item => {
        item.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                item.click();
            }
        });
    });
    // Evita que o link de cadastro fique preso em uma âncora sem ação.
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", () => {
            const message = document.getElementById("registerMessage");
            if (message) {
                message.textContent = "Enviando cadastro...";
                message.classList.remove("error", "success");
            }
        });
    }
});
