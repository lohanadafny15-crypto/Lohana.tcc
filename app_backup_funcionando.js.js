/* ==========================================================================
   EDUCONNECT - SERVIDOR BACKEND
   Node.js + Express + PostgreSQL + bcrypt
   ========================================================================== */

require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;

/* ==========================================================================
   SESSÕES DO ADMINISTRADOR
   ========================================================================== */

const sessoesAdmin = new Map();

function gerarTokenAdmin() {
    return crypto.randomBytes(32).toString("hex");
}

function verificarTokenAdmin(req, res, next) {
    const autorizacao = req.headers.authorization;

    if (!autorizacao || !autorizacao.startsWith("Bearer ")) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Acesso não autorizado."
        });
    }

    const token = autorizacao.replace("Bearer ", "").trim();

    if (!token || !sessoesAdmin.has(token)) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Sessão administrativa inválida ou expirada."
        });
    }

    req.admin = sessoesAdmin.get(token);

    next();
}

/* ==========================================================================
   CONFIGURAÇÕES DO EXPRESS
   ========================================================================== */

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

/* ==========================================================================
   CONEXÃO COM POSTGRESQL
   ========================================================================== */

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "educonnect",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    options: "-c client_encoding=UTF8"
});

pool.on("connect", (client) => {
    client.query("SET client_encoding TO 'UTF8'");
});

/* ==========================================================================
   TESTE DE CONEXÃO COM O BANCO
   ========================================================================== */

pool.connect()
    .then((client) => {

        console.log("==========================================");
        console.log(" EDUCONNECT - SERVIDOR");
        console.log("==========================================");
        console.log("PostgreSQL conectado com sucesso.");

        client.release();

    })
    .catch((erro) => {

        console.error("Erro ao conectar ao PostgreSQL:");
        console.error(erro.message);

    });

/* ==========================================================================
   ROTA PRINCIPAL
   ========================================================================== */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "teste.html"));
});

app.get("/teste.css", (req, res) => {
    res.sendFile(path.join(__dirname, "teste.css"));
});

app.get("/teste.js", (req, res) => {
    res.sendFile(path.join(__dirname, "teste.js"));
});

/* ==========================================================================
   TESTAR BANCO DE DADOS
   ========================================================================== */

app.get("/api/teste-banco", async (req, res) => {

    try {

        const resultado = await pool.query("SELECT NOW()");

        res.json({
            sucesso: true,
            mensagem: "Banco de dados conectado.",
            horario: resultado.rows[0].now
        });

    } catch (erro) {

        console.error("Erro no teste do banco:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Não foi possível acessar o banco de dados."
        });
    }
});

/* ==========================================================================
   CADASTRO DE ALUNO
   ========================================================================== */

app.post("/api/alunos/cadastro", async (req, res) => {

    try {

        const {
            nome,
            email,
            senha
        } = req.body;

        /* ----------------------------------------------------------
           VALIDAÇÃO
        ---------------------------------------------------------- */

        if (!nome || !email || !senha) {

            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha nome, e-mail e senha."
            });
        }

        if (senha.length < 6) {

            return res.status(400).json({
                sucesso: false,
                mensagem: "A senha deve possuir pelo menos 6 caracteres."
            });
        }

        /* ----------------------------------------------------------
           VERIFICAR E-MAIL
        ---------------------------------------------------------- */

        const usuarioExistente = await pool.query(
            `
            SELECT id
            FROM alunos
            WHERE LOWER(email) = LOWER($1)
            LIMIT 1
            `,
            [email]
        );

        if (usuarioExistente.rows.length > 0) {

            return res.status(409).json({
                sucesso: false,
                mensagem: "Este e-mail já está cadastrado."
            });
        }

        /* ----------------------------------------------------------
           CRIPTOGRAFAR SENHA
        ---------------------------------------------------------- */

        const senhaHash = await bcrypt.hash(senha, 10);

        /* ----------------------------------------------------------
           INSERIR ALUNO
        ---------------------------------------------------------- */

        const resultado = await pool.query(
            `
            INSERT INTO alunos
            (
                nome,
                email,
                senha
            )
            VALUES
            (
                $1,
                $2,
                $3
            )
            RETURNING
                id,
                nome,
                email
            `,
            [
                nome,
                email,
                senhaHash
            ]
        );

        res.status(201).json({
            sucesso: true,
            mensagem: "Cadastro realizado com sucesso.",
            usuario: resultado.rows[0]
        });

    } catch (erro) {

        console.error("Erro no cadastro:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao realizar cadastro."
        });
    }
});

/* ==========================================================================
   LOGIN DO ALUNO
   ========================================================================== */

app.post("/api/alunos/login", async (req, res) => {

    try {

        const {
            email,
            senha
        } = req.body;

        if (!email || !senha) {

            return res.status(400).json({
                sucesso: false,
                mensagem: "Informe o e-mail e a senha."
            });
        }

        /* ----------------------------------------------------------
           BUSCAR ALUNO
        ---------------------------------------------------------- */

        const resultado = await pool.query(
            `
            SELECT
                id,
                nome,
                email,
                senha
            FROM alunos
            WHERE LOWER(email) = LOWER($1)
            LIMIT 1
            `,
            [email]
        );

        if (resultado.rows.length === 0) {

            return res.status(401).json({
                sucesso: false,
                mensagem: "E-mail ou senha incorretos."
            });
        }

        const aluno = resultado.rows[0];

        /* ----------------------------------------------------------
           VERIFICAR SENHA
        ---------------------------------------------------------- */

        const senhaCorreta = await bcrypt.compare(
            senha,
            aluno.senha
        );

        if (!senhaCorreta) {

            return res.status(401).json({
                sucesso: false,
                mensagem: "E-mail ou senha incorretos."
            });
        }

        /* ----------------------------------------------------------
           LOGIN APROVADO
        ---------------------------------------------------------- */

        res.json({
            sucesso: true,
            mensagem: "Login realizado com sucesso.",
            usuario: {
                id: aluno.id,
                nome: aluno.nome,
                email: aluno.email
            }
        });

    } catch (erro) {

        console.error("Erro no login do aluno:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno no login."
        });
    }
});

/* ==========================================================================
   LOGIN DO ADMINISTRADOR
   ========================================================================== */

app.post("/api/admin/login", async (req, res) => {

    try {

        const {
            email,
            senha
        } = req.body;

        /* ----------------------------------------------------------
           VALIDAÇÃO
        ---------------------------------------------------------- */

        if (!email || !senha) {

            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha o e-mail e a senha."
            });
        }

        /* ----------------------------------------------------------
           BUSCAR ADMINISTRADOR
        ---------------------------------------------------------- */

        const resultado = await pool.query(
            `
            SELECT
                id,
                nome,
                email,
                senha
            FROM administradores
            WHERE LOWER(email) = LOWER($1)
            LIMIT 1
            `,
            [email]
        );

        if (resultado.rows.length === 0) {

            return res.status(401).json({
                sucesso: false,
                mensagem: "E-mail ou senha incorretos."
            });
        }

        const admin = resultado.rows[0];

        /* ----------------------------------------------------------
           VERIFICAR SENHA
        ---------------------------------------------------------- */

        const senhaCorreta = await bcrypt.compare(
            senha,
            admin.senha
        );

        if (!senhaCorreta) {

            return res.status(401).json({
                sucesso: false,
                mensagem: "E-mail ou senha incorretos."
            });
        }

        /* ----------------------------------------------------------
           GERAR SESSÃO ADMINISTRATIVA
        ---------------------------------------------------------- */

        const token = gerarTokenAdmin();

        sessoesAdmin.set(token, {
            id: admin.id,
            nome: admin.nome,
            email: admin.email
        });

        /* ----------------------------------------------------------
           LOGIN APROVADO
        ---------------------------------------------------------- */

        res.json({
            sucesso: true,
            mensagem: "Administrador autenticado.",
            token: token,
            usuario: {
                id: admin.id,
                nome: admin.nome,
                email: admin.email
            }
        });

    } catch (erro) {

        console.error("Erro no login administrativo:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno no login administrativo."
        });
    }
});

/* ==========================================================================
   LISTAR MONITORES
   ========================================================================== */

app.get("/api/monitores", async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                id,
                nome,
                materia,
                email
            FROM monitores
            WHERE ativo = TRUE
            ORDER BY nome
        `);

        res.json({
            sucesso: true,
            monitores: resultado.rows
        });

    } catch (erro) {

        console.error("Erro ao buscar monitores:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar monitores."
        });
    }
});

/* ==========================================================================
   TESTE DE ENCODING
   ========================================================================== */

app.get("/api/teste-encoding", async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                nome,
                materia,
                encode(convert_to(nome, 'UTF8'), 'hex') AS nome_hex,
                encode(convert_to(materia, 'UTF8'), 'hex') AS materia_hex
            FROM monitores
            WHERE id = 3
        `);

        const encoding = await pool.query(`
            SHOW client_encoding
        `);

        res.json({
            encoding: encoding.rows[0],
            dados: resultado.rows
        });

    } catch (erro) {

        console.error("Erro no teste de encoding:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro no teste de encoding.",
            erro: erro.message
        });
    }
});

// ============================================================
// CRIAR AGENDAMENTO
// ============================================================

app.post("/api/agendamentos", async (req, res) => {
    try {
        const { aluno_id, monitor_id, data_agendamento } = req.body;

        if (!aluno_id || !monitor_id || !data_agendamento) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Aluno, monitor e data são obrigatórios."
            });
        }

        // Verifica se o aluno existe
        const alunoResult = await pool.query(
            "SELECT id, nome, email FROM alunos WHERE id = $1",
            [aluno_id]
        );

        if (alunoResult.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado."
            });
        }

        // Verifica se o monitor existe
        const monitorResult = await pool.query(
            "SELECT id, nome FROM monitores WHERE id = $1",
            [monitor_id]
        );

        if (monitorResult.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Monitor não encontrado."
            });
        }

        // Verifica se o horário já está ocupado para esse monitor
        const conflito = await pool.query(
            `
            SELECT id
            FROM agendamentos
            WHERE monitor_id = $1
            AND data_agendamento = $2
            AND status = 'Confirmado'
            LIMIT 1
            `,
            [monitor_id, data_agendamento]
        );

        if (conflito.rows.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Este horário já está ocupado."
            });
        }

        // Cria o agendamento
        const resultado = await pool.query(
            `
            INSERT INTO agendamentos
            (aluno_id, monitor_id, data_agendamento, status)
            VALUES ($1, $2, $3, 'Confirmado')
            RETURNING *
            `,
            [aluno_id, monitor_id, data_agendamento]
        );

        res.status(201).json({
            sucesso: true,
            mensagem: "Agendamento realizado com sucesso.",
            agendamento: resultado.rows[0]
        });

    } catch (erro) {
        console.error("Erro ao criar agendamento:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao criar agendamento."
        });
    }
});


// ============================================================
// LISTAR TODOS OS AGENDAMENTOS
// ACESSO PROTEGIDO PARA ADMIN
// ============================================================

app.get(
    "/api/agendamentos",
    verificarTokenAdmin,
    async (req, res) => {
        try {
            const resultado = await pool.query(
                `
                SELECT
                    a.id,
                    a.aluno_id,
                    alunos.nome AS aluno_nome,
                    alunos.email AS aluno_email,
                    a.monitor_id,
                    monitores.nome AS monitor_nome,
                    a.data_agendamento,
                    a.status
                FROM agendamentos a
                INNER JOIN alunos
                    ON a.aluno_id = alunos.id
                INNER JOIN monitores
                    ON a.monitor_id = monitores.id
                ORDER BY a.data_agendamento ASC
                `
            );

            res.json({
                sucesso: true,
                agendamentos: resultado.rows
            });

        } catch (erro) {
            console.error("Erro ao buscar agendamentos:", erro);

            res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao buscar agendamentos."
            });
        }
    }
);


// ============================================================
// AGENDAMENTOS DE UM ALUNO
// ============================================================

app.get(
    "/api/alunos/:alunoId/agendamentos",
    async (req, res) => {
        try {
            const { alunoId } = req.params;

            const resultado = await pool.query(
                `
                SELECT
                    a.id,
                    a.aluno_id,
                    a.monitor_id,
                    m.nome AS monitor_nome,
                    a.data_agendamento,
                    a.status
                FROM agendamentos a
                INNER JOIN monitores m
                    ON a.monitor_id = m.id
                WHERE a.aluno_id = $1
                ORDER BY a.data_agendamento ASC
                `,
                [alunoId]
            );

            res.json({
                sucesso: true,
                agendamentos: resultado.rows
            });

        } catch (erro) {
            console.error(
                "Erro ao buscar agendamentos do aluno:",
                erro
            );

            res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao buscar agendamentos do aluno."
            });
        }
    }
);

// ============================================================
// CANCELAR / EXCLUIR AGENDAMENTO
// ACESSO PROTEGIDO PARA ADMIN
// ============================================================

app.delete(
    "/api/agendamentos/:id",
    verificarTokenAdmin,
    async (req, res) => {
        try {
            const { id } = req.params;

            const resultado = await pool.query(
                `
                DELETE FROM agendamentos
                WHERE id = $1
                RETURNING *
                `,
                [id]
            );

            if (resultado.rows.length === 0) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: "Agendamento não encontrado."
                });
            }

            res.json({
                sucesso: true,
                mensagem: "Agendamento excluído com sucesso.",
                agendamento: resultado.rows[0]
            });

        } catch (erro) {
            console.error("Erro ao excluir agendamento:", erro);

            res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao excluir agendamento."
            });
        }
    }
);


// ============================================================
// BUSCAR AGENDAMENTOS POR DATA
// ACESSO PROTEGIDO PARA ADMIN
// ============================================================

app.get(
    "/api/agendamentos/data/:data",
    verificarTokenAdmin,
    async (req, res) => {
        try {
            const { data } = req.params;

            const resultado = await pool.query(
                `
                SELECT
                    a.id,
                    a.aluno_id,
                    alunos.nome AS aluno_nome,
                    alunos.email AS aluno_email,
                    a.monitor_id,
                    monitores.nome AS monitor_nome,
                    a.data_agendamento,
                    a.status
                FROM agendamentos a
                INNER JOIN alunos
                    ON a.aluno_id = alunos.id
                INNER JOIN monitores
                    ON a.monitor_id = monitores.id
                WHERE DATE(a.data_agendamento) = $1
                ORDER BY a.data_agendamento ASC
                `,
                [data]
            );

            res.json({
                sucesso: true,
                agendamentos: resultado.rows
            });

        } catch (erro) {
            console.error(
                "Erro ao buscar agendamentos por data:",
                erro
            );

            res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao buscar agendamentos por data."
            });
        }
    }
);


// ============================================================
// ESTATÍSTICAS DO ADMINISTRADOR
// ACESSO PROTEGIDO
// ============================================================

app.get(
    "/api/admin/estatisticas",
    verificarTokenAdmin,
    async (req, res) => {
        try {

            // Quantidade de alunos
            const alunosResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM alunos
                `
            );

            // Quantidade de monitores
            const monitoresResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM monitores
                `
            );

            // Quantidade de agendamentos
            const agendamentosResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM agendamentos
                `
            );

            // Agendamentos confirmados
            const confirmadosResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM agendamentos
                WHERE status = 'Confirmado'
                `
            );

            res.json({
                sucesso: true,
                estatisticas: {
                    alunos: Number(alunosResult.rows[0].total),
                    monitores: Number(monitoresResult.rows[0].total),
                    agendamentos: Number(
                        agendamentosResult.rows[0].total
                    ),
                    confirmados: Number(
                        confirmadosResult.rows[0].total
                    )
                }
            });

        } catch (erro) {
            console.error(
                "Erro ao buscar estatísticas:",
                erro
            );

            res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao buscar estatísticas."
            });
        }
    }
);

// ============================================================
// LOGOUT DO ADMINISTRADOR
// ============================================================

app.post(
    "/api/admin/logout",
    verificarTokenAdmin,
    (req, res) => {

        const autorizacao = req.headers.authorization;

        const token = autorizacao
            .replace("Bearer ", "")
            .trim();

        // Remove a sessão da memória
        sessoesAdmin.delete(token);

        res.json({
            sucesso: true,
            mensagem: "Logout realizado com sucesso."
        });
    }
);


// ============================================================
// DASHBOARD ADMINISTRATIVO
// ACESSO PROTEGIDO
// ============================================================

app.get(
    "/api/admin/dashboard",
    verificarTokenAdmin,
    async (req, res) => {

        try {

            // Total de alunos
            const alunosResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM alunos
                `
            );

            // Total de monitores
            const monitoresResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM monitores
                `
            );

            // Total de agendamentos
            const agendamentosResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM agendamentos
                `
            );

            // Lista dos agendamentos
            const listaAgendamentos = await pool.query(
                `
                SELECT
                    a.id,
                    a.aluno_id,
                    alunos.nome AS aluno_nome,
                    alunos.email AS aluno_email,
                    a.monitor_id,
                    monitores.nome AS monitor_nome,
                    monitores.materia AS materia,
                    a.data_agendamento,
                    a.status
                FROM agendamentos a
                INNER JOIN alunos
                    ON a.aluno_id = alunos.id
                INNER JOIN monitores
                    ON a.monitor_id = monitores.id
                ORDER BY a.data_agendamento ASC
                `
            );

            res.json({
                sucesso: true,

                metricas: {
                    usuarios: Number(
                        alunosResult.rows[0].total
                    ),

                    monitores: Number(
                        monitoresResult.rows[0].total
                    ),

                    agendamentos: Number(
                        agendamentosResult.rows[0].total
                    )
                },

                agendamentos:
                    listaAgendamentos.rows
            });

        } catch (erro) {

            console.error(
                "Erro ao carregar dashboard administrativo:",
                erro
            );

            res.status(500).json({
                sucesso: false,
                mensagem:
                    "Erro ao carregar o painel administrativo."
            });
        }
    }
);


// ============================================================
// TRATAMENTO DE ROTAS NÃO ENCONTRADAS
// ============================================================

app.use((req, res) => {

    res.status(404).json({
        sucesso: false,
        mensagem: "Rota não encontrada."
    });

});


// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(PORT, () => {

    console.log("");
    console.log("==========================================");
    console.log("       EDUCONNECT ONLINE");
    console.log("==========================================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log("");
    console.log("Rotas disponíveis:");
    console.log("GET  /");
    console.log("GET  /api/teste-banco");
    console.log("POST /api/alunos/cadastro");
    console.log("POST /api/alunos/login");
    console.log("POST /api/admin/login");
    console.log("POST /api/admin/logout");
    console.log("GET  /api/monitores");
    console.log("POST /api/agendamentos");
    console.log("GET  /api/agendamentos");
    console.log("GET  /api/agendamentos/data/:data");
    console.log("DELETE /api/agendamentos/:id");
    console.log("GET  /api/admin/estatisticas");
    console.log("GET  /api/admin/dashboard");
    console.log("");

});