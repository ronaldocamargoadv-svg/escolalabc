import pg from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const perfis = [
  ["administrador_geral", "Acesso total à plataforma", true],
  ["gestor_labc", "Gestão de cursos, turmas, presenças e certificados", true],
  ["instrutor", "Gestão das próprias turmas e presenças", true],
  ["participante", "Inscrições, materiais, frequência e certificados", true],
  ["moderador", "Moderação de fóruns e comentários", true],
  ["convidado", "Acesso restrito a conteúdos permitidos", true],
  ["coordenador_curso", "Perfil personalizado para apoio à coordenação de cursos", false],
  ["moderador_forum", "Perfil personalizado para moderação de debates", false],
  ["gestor_certificados", "Perfil personalizado para emissão e bloqueio de certificados", false],
  ["apoio_administrativo", "Perfil personalizado para apoio em usuários e inscrições", false],
  ["avaliador", "Perfil personalizado para consulta de relatórios e acompanhamento", false]
];

const permissionCatalog = [
  ["users.view", "Visualizar usuários", "Usuários"],
  ["users.create", "Cadastrar usuários", "Usuários"],
  ["users.edit", "Editar usuários", "Usuários"],
  ["users.delete", "Excluir usuários", "Usuários"],
  ["roles.view", "Visualizar perfis", "Perfis"],
  ["roles.create", "Criar perfis personalizados", "Perfis"],
  ["roles.edit", "Editar perfis", "Perfis"],
  ["roles.delete", "Excluir perfis personalizados", "Perfis"],
  ["permissions.manage", "Gerenciar permissões de perfis", "Perfis"],
  ["courses.view", "Visualizar cursos", "Cursos"],
  ["courses.create", "Criar cursos", "Cursos"],
  ["courses.edit", "Editar cursos", "Cursos"],
  ["courses.delete", "Excluir cursos", "Cursos"],
  ["courses.publish", "Publicar ou arquivar cursos", "Cursos"],
  ["classes.view", "Visualizar aulas e turmas", "Aulas"],
  ["classes.create", "Criar aulas e turmas", "Aulas"],
  ["classes.edit", "Editar aulas e turmas", "Aulas"],
  ["classes.delete", "Excluir aulas e turmas", "Aulas"],
  ["instructor.assignment.view", "Visualizar vínculos de Instrutores", "Instrutoria"],
  ["instructor.assignment.create", "Vincular Instrutores a turmas", "Instrutoria"],
  ["instructor.assignment.edit", "Editar vínculos de Instrutores", "Instrutoria"],
  ["instructor.assignment.remove", "Remover vínculos de Instrutores", "Instrutoria"],
  ["instructor.assignment.deactivate", "Encerrar vínculos de Instrutores", "Instrutoria"],
  ["instructor.view_own_classes", "Visualizar turmas vinculadas", "Instrutoria"],
  ["instructor.manage_own_lessons", "Gerenciar aulas da turma vinculada", "Instrutoria"],
  ["instructor.publish_materials_own_class", "Publicar materiais da turma vinculada", "Instrutoria"],
  ["instructor.view_students_own_class", "Visualizar alunos da turma vinculada", "Instrutoria"],
  ["instructor.manage_attendance_own_class", "Registrar frequência da turma vinculada", "Instrutoria"],
  ["instructor.view_progress_own_class", "Visualizar progresso da turma vinculada", "Instrutoria"],
  ["instructor.send_announcements_own_class", "Enviar comunicados da turma vinculada", "Instrutoria"],
  ["instructor.request_certification_own_class", "Solicitar certificação da turma vinculada", "Instrutoria"],
  ["materials.view", "Visualizar materiais publicados", "Materiais"],
  ["materials.view_own_class", "Visualizar materiais das turmas vinculadas", "Materiais"],
  ["materials.create_own_class", "Adicionar materiais às aulas vinculadas", "Materiais"],
  ["materials.edit_own_class", "Editar materiais das aulas vinculadas", "Materiais"],
  ["materials.delete_own_class", "Excluir materiais das aulas vinculadas", "Materiais"],
  ["materials.publish_own_class", "Publicar materiais das aulas vinculadas", "Materiais"],
  ["materials.manage_all", "Gerenciar materiais de todas as aulas", "Materiais"],
  ["enrollments.view", "Consultar inscrições", "Inscrições"],
  ["enrollments.create", "Realizar inscrição", "Inscrições"],
  ["enrollments.manage", "Gerenciar inscrições", "Inscrições"],
  ["attendance.view", "Visualizar frequência", "Frequência"],
  ["attendance.manage", "Registrar frequência", "Frequência"],
  ["certificates.view", "Visualizar certificados", "Certificados"],
  ["certificates.issue", "Emitir certificados", "Certificados"],
  ["certificates.cancel", "Cancelar certificados", "Certificados"],
  ["certificates.download", "Baixar certificados próprios", "Certificados"],
  ["reports.view", "Visualizar relatórios", "Relatórios"],
  ["reports.export", "Exportar relatórios", "Relatórios"],
  ["progress.view_all", "Visualizar progresso de todos os alunos", "Engajamento"],
  ["progress.view_own", "Visualizar o próprio progresso", "Engajamento"],
  ["progress.view_courses_managed", "Visualizar progresso das próprias turmas", "Engajamento"],
  ["progress.export", "Exportar acompanhamento de progresso", "Engajamento"],
  ["learning_events.view", "Visualizar eventos de aprendizagem", "Engajamento"],
  ["learning_events.manage", "Gerenciar eventos de aprendizagem", "Engajamento"],
  ["evaluations.manage_all", "Gerenciar avaliações de todas as turmas", "Avaliações"],
  ["evaluations.view_all", "Visualizar avaliações de todas as turmas", "Avaliações"],
  ["evaluations.configure_certification", "Configurar requisitos de certificação", "Avaliações"],
  ["evaluations.reopen", "Reabrir avaliações", "Avaliações"],
  ["evaluations.export", "Exportar avaliações", "Avaliações"],
  ["evaluations.view_own_class", "Visualizar avaliações das próprias turmas", "Avaliações"],
  ["evaluations.view_course_feedback_own_class", "Visualizar avaliação da turma vinculada", "Avaliações"],
  ["evaluations.respond_course_feedback", "Responder avaliação da turma", "Avaliações"],
  ["evaluations.view_own_results", "Visualizar próprios resultados de avaliação", "Avaliações"],
  ["student_assessments.view_all", "Visualizar avaliações de alunos", "Avaliações"],
  ["student_assessments.create_own_class", "Avaliar alunos da turma vinculada", "Avaliações"],
  ["student_assessments.edit_own_class", "Editar avaliações da turma vinculada", "Avaliações"],
  ["quizzes.manage_all", "Gerenciar questionários de todas as turmas", "Questionários"],
  ["quizzes.create_own_class", "Criar questionários da turma vinculada", "Questionários"],
  ["quizzes.edit_own_class", "Editar questionários da turma vinculada", "Questionários"],
  ["quizzes.publish_own_class", "Publicar questionários da turma vinculada", "Questionários"],
  ["quizzes.view_results_own_class", "Ver resultados dos questionários da turma vinculada", "Questionários"],
  ["quizzes.respond", "Responder questionários", "Questionários"],
  ["certification.request_release_own_class", "Solicitar liberação de certificado da turma vinculada", "Certificação"],
  ["certification.view_own_requirements", "Visualizar próprios requisitos de certificação", "Certificação"],
  ["certificates.override_release", "Liberar certificado por exceção administrativa", "Certificados"],
  ["calendar.view_own", "Visualizar a própria agenda", "Agenda"],
  ["calendar.create_own", "Criar compromissos pessoais", "Agenda"],
  ["calendar.edit_own", "Editar compromissos pessoais", "Agenda"],
  ["calendar.delete_own", "Excluir compromissos pessoais", "Agenda"],
  ["calendar.view_course", "Visualizar agenda de cursos autorizados", "Agenda"],
  ["calendar.view_class", "Visualizar agenda de turmas autorizadas", "Agenda"],
  ["calendar.create_class_event", "Criar eventos de turmas autorizadas", "Agenda"],
  ["calendar.edit_class_event", "Editar eventos de turmas autorizadas", "Agenda"],
  ["calendar.view_institutional", "Visualizar agenda institucional", "Agenda"],
  ["calendar.create_institutional", "Criar eventos institucionais", "Agenda"],
  ["calendar.edit_institutional", "Editar eventos institucionais", "Agenda"],
  ["calendar.delete_institutional", "Excluir eventos institucionais", "Agenda"],
  ["calendar.export", "Exportar agenda em formato iCalendar", "Agenda"],
  ["calendar.integration_configure", "Configurar integração da própria agenda", "Agenda"],
  ["calendar.integration_enable", "Ativar integração da própria agenda", "Agenda"],
  ["calendar.integration_disable", "Desativar integração da própria agenda", "Agenda"],
  ["invite.view", "Visualizar links de cadastro", "Convites"],
  ["invite.create_student", "Gerar link para aluno", "Convites"],
  ["invite.create_instructor", "Gerar link para instrutor", "Convites"],
  ["invite.create_admin", "Gerar link para administrador", "Convites"],
  ["invite.revoke", "Revogar links de cadastro", "Convites"],
  ["invite.manage", "Gerenciar links de cadastro", "Convites"],
  ["forums.view", "Visualizar fóruns", "Fóruns"],
  ["forums.post", "Postar em fóruns", "Fóruns"],
  ["forums.moderate", "Moderar fóruns", "Fóruns"],
  ["settings.manage", "Gerenciar configurações globais", "Configurações"],
  ["audit.view", "Visualizar auditoria", "Auditoria"]
];

const allPermissions = permissionCatalog.map(([codigo]) => codigo);

const profilePermissions = {
  administrador_geral: allPermissions,
  gestor_labc: allPermissions.filter(
    (permission) =>
      ![
        "roles.create",
        "roles.edit",
        "roles.delete",
        "permissions.manage",
        "settings.manage",
        "invite.create_admin",
        "invite.revoke",
        "invite.manage"
      ].includes(permission)
  ),
  instrutor: [
    "courses.view",
    "classes.view",
    "classes.create",
    "classes.edit",
    "instructor.view_own_classes",
    "instructor.manage_own_lessons",
    "instructor.publish_materials_own_class",
    "instructor.view_students_own_class",
    "instructor.manage_attendance_own_class",
    "instructor.view_progress_own_class",
    "instructor.send_announcements_own_class",
    "instructor.request_certification_own_class",
    "materials.view_own_class",
    "materials.create_own_class",
    "materials.edit_own_class",
    "materials.delete_own_class",
    "materials.publish_own_class",
    "enrollments.view",
    "attendance.view",
    "attendance.manage",
    "certificates.view",
    "progress.view_courses_managed",
    "learning_events.view",
    "forums.view",
    "forums.post",
    "reports.view"
    ,"evaluations.view_own_class"
    ,"evaluations.view_course_feedback_own_class"
    ,"student_assessments.create_own_class"
    ,"student_assessments.edit_own_class"
    ,"quizzes.create_own_class"
    ,"quizzes.edit_own_class"
    ,"quizzes.publish_own_class"
    ,"quizzes.view_results_own_class"
    ,"certification.request_release_own_class"
    ,"certification.view_own_requirements"
    ,"calendar.view_own"
    ,"calendar.create_own"
    ,"calendar.edit_own"
    ,"calendar.delete_own"
    ,"calendar.view_course"
    ,"calendar.view_class"
    ,"calendar.view_institutional"
    ,"calendar.create_class_event"
    ,"calendar.edit_class_event"
    ,"calendar.export"
    ,"calendar.integration_configure"
    ,"calendar.integration_enable"
    ,"calendar.integration_disable"
  ],
  participante: [
    "courses.view",
    "enrollments.create",
    "classes.view",
    "materials.view",
    "attendance.view",
    "certificates.view",
    "certificates.download",
    "progress.view_own",
    "evaluations.respond_course_feedback",
    "evaluations.view_own_results",
    "quizzes.respond",
    "certification.view_own_requirements",
    "forums.view",
    "forums.post"
    ,"calendar.view_own"
    ,"calendar.create_own"
    ,"calendar.edit_own"
    ,"calendar.delete_own"
    ,"calendar.view_course"
    ,"calendar.view_institutional"
    ,"calendar.export"
    ,"calendar.integration_configure"
    ,"calendar.integration_enable"
    ,"calendar.integration_disable"
  ],
  moderador: ["courses.view", "classes.view", "forums.view", "forums.post", "forums.moderate"],
  convidado: ["courses.view"],
  coordenador_curso: [
    "courses.view",
    "courses.create",
    "courses.edit",
    "courses.publish",
    "classes.view",
    "classes.create",
    "classes.edit",
    "enrollments.view",
    "enrollments.manage",
    "attendance.view",
    "reports.view",
    "progress.view_courses_managed",
    "learning_events.view"
  ],
  moderador_forum: ["courses.view", "classes.view", "forums.view", "forums.post", "forums.moderate"],
  gestor_certificados: [
    "certificates.view",
    "certificates.issue",
    "certificates.cancel",
    "reports.view"
  ],
  apoio_administrativo: [
    "users.view",
    "users.create",
    "users.edit",
    "enrollments.view",
    "enrollments.manage",
    "attendance.view"
  ],
  avaliador: [
    "courses.view",
    "classes.view",
    "enrollments.view",
    "attendance.view",
    "reports.view",
    "progress.view_all",
    "learning_events.view"
  ]
};

const demoUsers = [
  {
    key: "admin",
    nome: "Administrador LaBC",
    cpf: "00000000000",
    email: "admin@labc.local",
    senha: "admin123",
    orgaoSecretaria: "Laboratório de Inovação de Balneário Camboriú",
    cargo: "Administrador da plataforma",
    vinculo: "servidor",
    perfil: "administrador_geral"
  },
  {
    key: "gestor",
    nome: "Gestora de Capacitação",
    cpf: "11111111111",
    email: "gestor@labc.local",
    senha: "gestor123",
    orgaoSecretaria: "LaBC",
    cargo: "Gestora de programas formativos",
    vinculo: "servidora",
    perfil: "gestor_labc"
  },
  {
    key: "instrutor",
    nome: "Instrutor LaBC",
    cpf: "22222222222",
    email: "instrutor@labc.local",
    senha: "instrutor123",
    orgaoSecretaria: "LaBC",
    cargo: "Facilitador de aprendizagem",
    lattesUrl: "https://lattes.cnpq.br/1234567890123456",
    vinculo: "servidor",
    perfil: "instrutor"
  },
  {
    key: "instrutor_sem_lattes",
    nome: "Instrutora Convidada",
    cpf: "66666666666",
    email: "instrutora@labc.local",
    senha: "instrutor123",
    orgaoSecretaria: "Escola LaBC de Inovação",
    cargo: "Pesquisadora convidada",
    lattesUrl: null,
    vinculo: "convidada",
    perfil: "instrutor"
  },
  {
    key: "aluno",
    nome: "Aluno LaBC",
    cpf: "33333333333",
    email: "aluno@labc.local",
    senha: "aluno123",
    orgaoSecretaria: "Secretaria Municipal de Administração",
    cargo: "Analista de projetos",
    vinculo: "servidor",
    perfil: "participante"
  },
  {
    key: "aluna",
    nome: "Servidora Convidada",
    cpf: "44444444444",
    email: "servidora@labc.local",
    senha: "aluno123",
    orgaoSecretaria: "Secretaria Municipal de Educação",
    cargo: "Coordenadora pedagógica",
    vinculo: "servidora",
    perfil: "participante"
  }
].concat(
  Array.from({ length: 9 }, (_, index) => {
    const number = String(index + 2).padStart(2, "0");
    return {
      key: `aluno${number}`,
      nome: `Aluno Fictício ${number}`,
      cpf: `555555555${number}`,
      email: `aluno${number}@labc.local`,
      senha: "aluno123",
      orgaoSecretaria:
        index % 2 === 0
          ? "Secretaria Municipal de Administração"
          : "Secretaria Municipal de Planejamento",
      cargo: index % 2 === 0 ? "Assistente administrativo" : "Analista técnico",
      vinculo: "servidor",
      perfil: "participante"
    };
  })
);

const courses = [
  {
    key: "design",
    nome: "Design de Serviços Públicos",
    descricao:
      "Formação prática para mapear jornadas, redesenhar serviços e prototipar melhorias centradas no cidadão.",
    objetivos:
      "Capacitar servidores para diagnosticar problemas, cocriar soluções e testar melhorias em serviços municipais.",
    ementa:
      "Jornada do usuário, mapa de serviço, escuta ativa, ideação, prototipação rápida e validação.",
    cargaHoraria: 12,
    modalidade: "hibrido",
    publicoAlvo: "Servidores municipais envolvidos em melhoria de serviços",
    tema: "Inovação pública",
    status: "publicado",
    criadoPor: "gestor"
  },
  {
    key: "dados",
    nome: "Dados para Gestão Municipal",
    descricao:
      "Curso on-line para apoiar decisões públicas com indicadores, painéis e rotinas de acompanhamento.",
    objetivos:
      "Apoiar equipes na leitura de dados, criação de indicadores e acompanhamento de metas institucionais.",
    ementa:
      "Qualidade de dados, indicadores, visualização, governança da informação e comunicação de evidências.",
    cargaHoraria: 16,
    modalidade: "online",
    publicoAlvo: "Gestores e técnicos da administração municipal",
    tema: "Dados e evidências",
    status: "publicado",
    criadoPor: "gestor"
  },
  {
    key: "facilitacao",
    nome: "Facilitação de Oficinas de Inovação",
    descricao:
      "Turma encerrada para demonstrar histórico, frequência concluída e certificado disponível.",
    objetivos:
      "Preparar servidores para planejar e conduzir oficinas colaborativas com segurança metodológica.",
    ementa:
      "Desenho de oficina, papéis de facilitação, dinâmicas participativas, registro e síntese de encaminhamentos.",
    cargaHoraria: 10,
    modalidade: "presencial",
    publicoAlvo: "Servidores que conduzem reuniões, oficinas e grupos de trabalho",
    tema: "Facilitação",
    status: "publicado",
    criadoPor: "gestor"
  },
  {
    key: "compras",
    nome: "Compras Públicas Inovadoras",
    descricao:
      "Oferta em preparação para contratações públicas voltadas a desafios complexos.",
    objetivos:
      "Apresentar alternativas de compras públicas orientadas a resultado e inovação.",
    ementa:
      "Problemas públicos, pesquisa de mercado, critérios de resultado, riscos e governança contratual.",
    cargaHoraria: 8,
    modalidade: "presencial",
    publicoAlvo: "Equipes de compras, gestores e áreas demandantes",
    tema: "Gestão pública",
    status: "rascunho",
    criadoPor: "admin"
  }
];

const classes = [
  {
    key: "design-2026",
    courseKey: "design",
    nome: "Turma Marco 2026",
    dataInicio: "2026-05-20",
    dataFim: "2026-06-10",
    vagas: 30,
    modalidade: "hibrido",
    local: "Sala de Inovação LaBC",
    linkOnline: "https://labc.local/aula/design-servicos",
    criterio: 75,
    status: "publicada",
    instrutor: "instrutor"
  },
  {
    key: "dados-2026",
    courseKey: "dados",
    nome: "Turma Online 2026",
    dataInicio: "2026-06-08",
    dataFim: "2026-06-29",
    vagas: 40,
    modalidade: "online",
    local: null,
    linkOnline: "https://labc.local/aula/dados-gestao",
    criterio: 75,
    status: "publicada",
    instrutor: "instrutor"
  },
  {
    key: "facilitacao-2025",
    courseKey: "facilitacao",
    nome: "Turma Encerrada 2025",
    dataInicio: "2025-11-05",
    dataFim: "2025-11-19",
    vagas: 25,
    modalidade: "presencial",
    local: "Auditório da Prefeitura",
    linkOnline: null,
    criterio: 75,
    status: "encerrada",
    instrutor: "instrutor_sem_lattes"
  }
];

const meetings = [
  {
    classKey: "design-2026",
    data: "2026-03-10",
    inicio: "09:00",
    fim: "12:00",
    modalidade: "presencial",
    local: "Sala de Inovação LaBC",
    linkOnline: null,
    status: "realizado"
  },
  {
    classKey: "design-2026",
    data: "2026-03-17",
    inicio: "14:00",
    fim: "17:00",
    modalidade: "online",
    local: null,
    linkOnline: "https://labc.local/aula/design-servicos-2",
    status: "previsto"
  },
  {
    classKey: "design-2026",
    data: "2026-03-24",
    inicio: "09:00",
    fim: "12:00",
    modalidade: "hibrido",
    local: "Sala de Inovação LaBC",
    linkOnline: "https://labc.local/aula/design-servicos-3",
    status: "previsto"
  },
  {
    classKey: "dados-2026",
    data: "2026-04-06",
    inicio: "10:00",
    fim: "12:00",
    modalidade: "online",
    local: null,
    linkOnline: "https://labc.local/aula/dados-1",
    status: "previsto"
  },
  {
    classKey: "design-2026",
    data: "2026-06-03",
    inicio: "09:00",
    fim: "11:00",
    modalidade: "hibrido",
    local: "Sala de Inovação LaBC",
    linkOnline: "https://labc.local/aula/design-agenda",
    status: "previsto"
  },
  {
    classKey: "dados-2026",
    data: "2026-04-13",
    inicio: "10:00",
    fim: "12:00",
    modalidade: "online",
    local: null,
    linkOnline: "https://labc.local/aula/dados-2",
    status: "previsto"
  },
  {
    classKey: "facilitacao-2025",
    data: "2025-11-05",
    inicio: "08:30",
    fim: "12:30",
    modalidade: "presencial",
    local: "Auditório da Prefeitura",
    linkOnline: null,
    status: "realizado"
  },
  {
    classKey: "facilitacao-2025",
    data: "2025-11-12",
    inicio: "08:30",
    fim: "12:30",
    modalidade: "presencial",
    local: "Auditório da Prefeitura",
    linkOnline: null,
    status: "realizado"
  },
  {
    classKey: "facilitacao-2025",
    data: "2025-11-19",
    inicio: "08:30",
    fim: "10:30",
    modalidade: "presencial",
    local: "Auditório da Prefeitura",
    linkOnline: null,
    status: "realizado"
  }
];

const materials = [
  {
    classKey: "design-2026",
    lessonKey: "design-2026:2026-03-10:09:00",
    title: "Guia de jornada do usuário",
    descricao: "Leitura orientadora para mapear necessidades de cidadãos e servidores.",
    tipo: "pdf",
    url: "https://labc.local/materiais/guia-jornada-usuario.pdf",
    situacao: "publicado",
    ordem: 1,
    userKey: "instrutor"
  },
  {
    classKey: "design-2026",
    lessonKey: "design-2026:2026-03-10:09:00",
    title: "Vídeo introdutório: serviços públicos centrados no cidadão",
    descricao: "Vídeo complementar para a primeira aula.",
    tipo: "video",
    url: "https://labc.local/materiais/video-design-servicos",
    situacao: "publicado",
    ordem: 2,
    userKey: "instrutor"
  },
  {
    classKey: "design-2026",
    lessonKey: "design-2026:2026-03-17:14:00",
    title: "Modelo de síntese da oficina",
    descricao: "Material em preparação para publicação.",
    tipo: "documento",
    url: "https://labc.local/materiais/modelo-sintese",
    situacao: "rascunho",
    ordem: 1,
    userKey: "instrutor"
  },
  {
    classKey: "design-2026",
    lessonKey: "design-2026:2026-03-24:09:00",
    title: "Apresentação: prototipagem de serviços",
    descricao: "Apresentação ocultada para revisão editorial.",
    tipo: "apresentacao",
    url: "https://labc.local/materiais/prototipagem-servicos",
    situacao: "oculto",
    ordem: 1,
    userKey: "instrutor"
  },
  {
    classKey: "facilitacao-2025",
    lessonKey: "facilitacao-2025:2025-11-05:08:30",
    title: "Roteiro de facilitação de oficina",
    descricao: "Histórico de material publicado em turma concluída.",
    tipo: "pdf",
    url: "https://labc.local/materiais/roteiro-facilitacao.pdf",
    situacao: "publicado",
    ordem: 1,
    userKey: "instrutor_sem_lattes"
  }
];

const calendarEvents = [
  {
    owner: "admin",
    titulo: "Encontro aberto: inovação pública em Balneário Camboriú",
    descricao: "Conexão institucional para compartilhar práticas e resultados formativos da Escola LaBC.",
    tipo: "evento_institucional",
    inicio: "2026-06-04 14:00:00",
    fim: "2026-06-04 16:00:00",
    local: "Auditório da Prefeitura",
    visibility: "institutional",
    source: "institutional",
    status: "scheduled",
    reminder: 1440
  },
  {
    owner: "instrutor",
    classKey: "design-2026",
    titulo: "Prazo: síntese da jornada do usuário",
    descricao: "Entrega formativa da turma de Design de Serviços Públicos.",
    tipo: "prazo",
    inicio: "2026-06-05 17:00:00",
    fim: "2026-06-05 18:00:00",
    visibility: "class",
    source: "activity",
    status: "scheduled",
    reminder: 1440
  },
  {
    owner: "aluno",
    titulo: "Revisar material para o encontro híbrido",
    descricao: "Compromisso pessoal para organizar a jornada de aprendizagem.",
    tipo: "compromisso_pessoal",
    inicio: "2026-06-02 18:30:00",
    fim: "2026-06-02 19:15:00",
    visibility: "private",
    source: "manual",
    status: "scheduled",
    reminder: 60
  },
  {
    owner: "instrutor",
    titulo: "Preparar mediação pedagógica da turma",
    descricao: "Planejamento privado do instrutor, não compartilhado com alunos ou administração.",
    tipo: "compromisso_pessoal",
    inicio: "2026-06-02 08:00:00",
    fim: "2026-06-02 08:40:00",
    visibility: "private",
    source: "manual",
    status: "scheduled",
    reminder: 30
  },
  {
    owner: "admin",
    titulo: "Webinário de governo digital remarcado",
    descricao: "Evento institucional cancelado para demonstrar o histórico da agenda.",
    tipo: "encontro_online",
    inicio: "2026-06-01 10:00:00",
    fim: "2026-06-01 11:00:00",
    visibility: "institutional",
    source: "institutional",
    status: "cancelled",
    reminder: null
  }
];

async function resetDatabase() {
  await pool.query(`
    TRUNCATE TABLE
      usos_convites_cadastro,
      convites_cadastro,
      configuracoes_integracao_agenda,
      eventos_agenda,
      eventos_aprendizagem,
      acessos_aulas,
      progresso_cursos,
      respostas_questionario,
      tentativas_questionario,
      opcoes_questionario,
      questoes_questionario,
      questionarios,
      avaliacoes_aluno_instrutor,
      avaliacoes_turma_aluno,
      requisitos_certificacao,
      comentarios,
      topicos,
      foruns,
      logs_auditoria,
      certificados,
      presencas,
      materiais,
      inscricoes,
      encontros,
      turmas,
      cursos,
      usuario_perfis,
      usuarios,
      perfil_permissoes,
      permissoes,
      perfis
    RESTART IDENTITY CASCADE
  `);
}

async function insertProfile(nome, descricao, sistema) {
  const result = await pool.query(
    `
      INSERT INTO perfis (id, nome, descricao, sistema)
      VALUES (gen_random_uuid(), $1, $2, $3)
      RETURNING id
    `,
    [nome, descricao, sistema]
  );

  return result.rows[0].id;
}

async function insertPermission(codigo, descricao, categoria) {
  const result = await pool.query(
    `
      INSERT INTO permissoes (id, codigo, descricao, categoria)
      VALUES (gen_random_uuid(), $1, $2, $3)
      RETURNING id
    `,
    [codigo, descricao, categoria]
  );

  return result.rows[0].id;
}

async function assignProfilePermissions(profileId, permissionCodes) {
  await pool.query(
    `
      INSERT INTO perfil_permissoes (perfil_id, permissao_id)
      SELECT $1, p.id
      FROM permissoes p
      WHERE p.codigo = ANY($2::text[])
    `,
    [profileId, permissionCodes]
  );
}

async function insertUser(user, profileId) {
  const senhaHash = await bcrypt.hash(user.senha, 10);
  const result = await pool.query(
    `
      INSERT INTO usuarios (
        id, nome, cpf, email, senha_hash, orgao_secretaria, cargo, lattes_url, vinculo,
        status, atualizado_em
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'ativo', now())
      RETURNING id
    `,
    [
      user.nome,
      user.cpf,
      user.email,
      senhaHash,
      user.orgaoSecretaria,
      user.cargo,
      user.lattesUrl ?? null,
      user.vinculo
    ]
  );
  const userId = result.rows[0].id;

  await pool.query(
    "INSERT INTO usuario_perfis (usuario_id, perfil_id) VALUES ($1, $2)",
    [userId, profileId]
  );

  return userId;
}

async function insertCourse(course, userIds) {
  const result = await pool.query(
    `
      INSERT INTO cursos (
        id, nome, descricao, objetivos, ementa, carga_horaria, modalidade,
        publico_alvo, tema, status, criado_por, atualizado_em
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
      RETURNING id
    `,
    [
      course.nome,
      course.descricao,
      course.objetivos,
      course.ementa,
      course.cargaHoraria,
      course.modalidade,
      course.publicoAlvo,
      course.tema,
      course.status,
      userIds[course.criadoPor]
    ]
  );

  return result.rows[0].id;
}

async function insertClass(item, courseIds, userIds) {
  const result = await pool.query(
    `
      INSERT INTO turmas (
        id, curso_id, nome, data_inicio, data_fim, vagas, modalidade, local,
        link_online, criterio_frequencia_minima, status, instrutor_id,
        atualizado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now()
      )
      RETURNING id
    `,
    [
      courseIds[item.courseKey],
      item.nome,
      item.dataInicio,
      item.dataFim,
      item.vagas,
      item.modalidade,
      item.local,
      item.linkOnline,
      item.criterio,
      item.status,
      userIds[item.instrutor]
    ]
  );

  return result.rows[0].id;
}

async function insertInstructorAssignments(classIds, courseIds, userIds) {
  const assignments = [
    {
      classKey: "design-2026",
      courseKey: "design",
      userKey: "instrutor",
      status: "ativo",
      start: "2026-05-20",
      end: "2026-06-10",
      reason: null
    },
    {
      classKey: "dados-2026",
      courseKey: "dados",
      userKey: "instrutor",
      status: "agendado",
      start: "2026-06-08",
      end: "2026-06-29",
      reason: null
    },
    {
      classKey: "facilitacao-2025",
      courseKey: "facilitacao",
      userKey: "instrutor_sem_lattes",
      status: "concluido",
      start: "2025-11-05",
      end: "2025-11-19",
      reason: "Turma concluída"
    }
  ];

  for (const item of assignments) {
    await pool.query(
      `
        INSERT INTO vinculos_instrutoria (
          id, usuario_id, curso_id, turma_id, atribuido_por_usuario_id,
          status, inicio_em, fim_em, desativado_em, motivo_desativacao,
          atualizado_em
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7,
          CASE WHEN $5::varchar IN ('concluido', 'cancelado', 'expirado', 'removido')
            THEN now() ELSE NULL END,
          $8, now()
        )
      `,
      [
        userIds[item.userKey],
        courseIds[item.courseKey],
        classIds[item.classKey],
        userIds.admin,
        item.status,
        item.start,
        item.end,
        item.reason
      ]
    );
  }
}

async function insertMeeting(item, classIds) {
  const result = await pool.query(
    `
      INSERT INTO encontros (
        id, turma_id, data, horario_inicio, horario_fim, modalidade, local,
        link_online, status, atualizado_em
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, now())
      RETURNING id
    `,
    [
      classIds[item.classKey],
      item.data,
      item.inicio,
      item.fim,
      item.modalidade,
      item.local,
      item.linkOnline,
      item.status
    ]
  );

  return result.rows[0].id;
}

async function insertEnrollment({ userId, classId, origem, frequencia, apto }) {
  const result = await pool.query(
    `
      INSERT INTO inscricoes (
        id, usuario_id, turma_id, status, origem, percentual_frequencia,
        apto_certificado, atualizado_em
      )
      VALUES (gen_random_uuid(), $1, $2, 'inscrito', $3, $4, $5, now())
      RETURNING id
    `,
    [userId, classId, origem, frequencia, apto]
  );

  return result.rows[0].id;
}

async function insertAttendance({ enrollmentId, meetingId, status, registeredBy }) {
  await pool.query(
    `
      INSERT INTO presencas (
        id, inscricao_id, encontro_id, status, metodo, registrado_por,
        registrado_em
      )
      VALUES (gen_random_uuid(), $1, $2, $3, 'manual', $4, now())
    `,
    [enrollmentId, meetingId, status, registeredBy]
  );
}

async function insertCertificate({ enrollmentId, code, emittedBy }) {
  const hash = crypto
    .createHash("sha256")
    .update(`${enrollmentId}:${code}`)
    .digest("hex");

  await pool.query(
    `
      INSERT INTO certificados (
        id, inscricao_id, codigo_validacao, status, hash_documento, emitido_por
      )
      VALUES (gen_random_uuid(), $1, $2, 'valido', $3, $4)
    `,
    [enrollmentId, code, hash, emittedBy]
  );
}

async function insertMaterial(item, classIds, meetingIds, userIds) {
  await pool.query(
    `
      INSERT INTO materiais (
        id, curso_id, turma_id, aula_id, titulo, descricao, tipo, url, ordem,
        status_publicacao, visibilidade, publicado_por, atualizado_por,
        atualizado_em
      )
      VALUES (
        gen_random_uuid(), (SELECT curso_id FROM turmas WHERE id = $1),
        $1, $2, $3, $4, $5, $6, $7, $8, 'inscritos', $9, $9, now()
      )
    `,
    [
      classIds[item.classKey],
      meetingIds[item.lessonKey],
      item.title,
      item.descricao,
      item.tipo,
      item.url,
      item.ordem,
      item.situacao,
      userIds[item.userKey]
    ]
  );
}

async function insertCalendarFixtures(classIds, courseIds, userIds) {
  for (const event of calendarEvents) {
    const classId = event.classKey ? classIds[event.classKey] : null;
    const courseId = event.classKey
      ? courseIds[classes.find((item) => item.key === event.classKey).courseKey]
      : null;
    await pool.query(
      `
        INSERT INTO eventos_agenda (
          id, titulo, descricao, tipo, inicio_em, fim_em, local, curso_id,
          turma_id, usuario_responsavel_id, visibilidade, origem, status,
          lembrete_minutos, sincronizar, provedor_externo, atualizado_em
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12, $13, false, 'none', now()
        )
      `,
      [
        event.titulo,
        event.descricao,
        event.tipo,
        event.inicio,
        event.fim,
        event.local ?? null,
        courseId,
        classId,
        userIds[event.owner],
        event.visibility,
        event.source,
        event.status,
        event.reminder
      ]
    );
  }

  await pool.query(
    `
      INSERT INTO configuracoes_integracao_agenda (
        id, usuario_id, provedor, habilitada, direcao_sincronizacao,
        sincronizar_eventos_curso, sincronizar_eventos_pessoais, atualizado_em
      )
      VALUES
        (gen_random_uuid(), $1, 'none', false, 'export_only', true, false, now()),
        (gen_random_uuid(), $2, 'google', true, 'export_only', true, false, now()),
        (gen_random_uuid(), $3, 'ics', true, 'export_only', true, true, now())
    `,
    [userIds.admin, userIds.instrutor, userIds.aluno]
  );
}

function encryptSeedInviteToken(token) {
  const secret = process.env.AUTH_SECRET ?? "dev-secret-change-me";
  const key = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((item) => item.toString("base64url")).join(".");
}

async function insertRegistrationInviteFixtures(userIds, classIds) {
  const cases = [
    {
      role: "participante",
      status: "active",
      maxUses: 1,
      usedCount: 0,
      expiresAt: "2026-06-02 18:00:00",
      notes: "Convite ativo para cadastro de aluno."
    },
    {
      role: "instrutor",
      status: "active",
      maxUses: 1,
      usedCount: 0,
      expiresAt: "2026-05-27 18:00:00",
      notes: "Novo instrutor convidado."
      ,
      classKey: "dados-2026"
    },
    {
      role: "administrador_geral",
      status: "active",
      maxUses: 1,
      usedCount: 0,
      expiresAt: "2026-05-27 12:00:00",
      notes: "Convite administrativo de uso único."
    },
    {
      role: "participante",
      status: "active",
      maxUses: 1,
      usedCount: 0,
      expiresAt: "2026-05-20 18:00:00",
      notes: "Convite expirado para validação."
    },
    {
      role: "participante",
      status: "revoked",
      maxUses: 1,
      usedCount: 0,
      expiresAt: "2026-06-02 18:00:00",
      notes: "Convite revogado para validação."
    },
    {
      role: "participante",
      status: "active",
      maxUses: 1,
      usedCount: 1,
      expiresAt: "2026-06-02 18:00:00",
      notes: "Convite de uso único já utilizado.",
      usedBy: "aluno02"
    },
    {
      role: "participante",
      status: "active",
      maxUses: 3,
      usedCount: 1,
      expiresAt: "2026-06-15 18:00:00",
      notes: "Convite múltiplo com usos disponíveis.",
      usedBy: "aluno03"
    },
    {
      role: "participante",
      status: "active",
      maxUses: 2,
      usedCount: 2,
      expiresAt: "2026-06-15 18:00:00",
      notes: "Convite múltiplo com limite atingido.",
      usedBy: "aluno04",
      secondUsedBy: "aluno05"
    }
  ];

  for (const item of cases) {
    const token = crypto.randomBytes(32).toString("base64url");
    const result = await pool.query(
      `
        INSERT INTO convites_cadastro (
          id, token_hash, token_cifrado, token_prefixo, perfil_atribuido,
          criado_por_usuario_id, max_usos, usos_realizados, expira_em,
          status, observacao, turma_instrutoria_id, revogado_em, revogado_por_usuario_id, atualizado_em
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          CASE WHEN $9::varchar = 'revoked' THEN now() ELSE NULL END,
          CASE WHEN $9::varchar = 'revoked' THEN $5::uuid ELSE NULL END, now()
        )
        RETURNING id
      `,
      [
        crypto.createHash("sha256").update(token).digest("hex"),
        encryptSeedInviteToken(token),
        token.slice(0, 10),
        item.role,
        userIds.admin,
        item.maxUses,
        item.usedCount,
        item.expiresAt,
        item.status,
        item.notes,
        item.classKey ? classIds[item.classKey] : null
      ]
    );
    const inviteId = result.rows[0].id;
    for (const usedBy of [item.usedBy, item.secondUsedBy].filter(Boolean)) {
      await pool.query(
        `
          INSERT INTO usos_convites_cadastro (id, convite_id, usuario_id, ip_address)
          VALUES (gen_random_uuid(), $1, $2, '127.0.0.1')
        `,
        [inviteId, userIds[usedBy]]
      );
    }
  }
}

async function insertForum(classId, authorId, commenterId) {
  const forumResult = await pool.query(
    `
      INSERT INTO foruns (id, turma_id, titulo)
      VALUES (gen_random_uuid(), $1, 'Fórum da turma')
      RETURNING id
    `,
    [classId]
  );
  const forumId = forumResult.rows[0].id;
  const topicResult = await pool.query(
    `
      INSERT INTO topicos (id, forum_id, usuario_id, titulo, conteudo, atualizado_em)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, now())
      RETURNING id
    `,
    [
      forumId,
      authorId,
      "Como aplicar design de serviços na rotina da secretaria?",
      "Compartilhe um serviço municipal que poderia ser redesenhado a partir da jornada do usuário."
    ]
  );

  await pool.query(
    `
      INSERT INTO comentarios (id, topico_id, usuario_id, conteudo, atualizado_em)
      VALUES (gen_random_uuid(), $1, $2, $3, now())
    `,
    [
      topicResult.rows[0].id,
      commenterId,
      "No meu setor, o agendamento de atendimento ao cidadão parece um bom caso para mapearmos."
    ]
  );
}

async function insertLearningProgress({
  enrollmentId,
  userId,
  courseId,
  classId,
  lessonAccesses,
  forumAt,
  materialAt
}) {
  const totalResult = await pool.query(
    "SELECT COUNT(*)::int AS total FROM encontros WHERE turma_id = $1",
    [classId]
  );
  const totalLessons = Number(totalResult.rows[0]?.total ?? 0);
  const accessedLessons = new Set(lessonAccesses.map((item) => item.lessonId)).size;
  const completedLessons = new Set(
    lessonAccesses.filter((item) => item.completedAt).map((item) => item.lessonId)
  ).size;
  const progressPercentage = totalLessons
    ? Number(((completedLessons / totalLessons) * 100).toFixed(2))
    : 0;
  const sortedAccesses = lessonAccesses
    .slice()
    .sort((a, b) => new Date(a.firstAt).getTime() - new Date(b.firstAt).getTime());
  const startedAt = sortedAccesses[0]?.firstAt ?? null;
  const lastAccessAt =
    sortedAccesses
      .map((item) => item.lastAt)
      .concat([forumAt, materialAt])
      .filter(Boolean)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .at(-1) ?? startedAt;
  const completedAt =
    totalLessons > 0 && completedLessons >= totalLessons
      ? lessonAccesses
          .map((item) => item.completedAt)
          .filter(Boolean)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          .at(-1)
      : null;
  const status =
    totalLessons > 0 && completedLessons >= totalLessons
      ? "completed"
      : completedLessons > 0 || accessedLessons > 1
        ? "in_progress"
        : accessedLessons > 0
          ? "started"
          : "not_started";

  await pool.query(
    `
      INSERT INTO progresso_cursos (
        id, usuario_id, curso_id, inscricao_id, status, iniciado_em,
        ultimo_acesso_em, concluido_em, percentual_progresso, total_aulas,
        aulas_concluidas, aulas_acessadas, atualizado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now()
      )
    `,
    [
      userId,
      courseId,
      enrollmentId,
      status,
      startedAt,
      lastAccessAt,
      completedAt,
      progressPercentage,
      totalLessons,
      completedLessons,
      accessedLessons
    ]
  );

  if (startedAt) {
    await pool.query(
      `
        INSERT INTO eventos_aprendizagem (
          id, usuario_id, curso_id, tipo_evento, metadata, criado_em
        )
        VALUES
          (gen_random_uuid(), $1, $2, 'course_started', $3::jsonb, $4),
          (gen_random_uuid(), $1, $2, 'course_opened', $3::jsonb, $4)
      `,
      [userId, courseId, JSON.stringify({ turmaId: classId, origem: "seed" }), startedAt]
    );
  }

  for (const access of lessonAccesses) {
    await pool.query(
      `
        INSERT INTO acessos_aulas (
          id, usuario_id, curso_id, aula_id, primeiro_acesso_em,
          ultimo_acesso_em, quantidade_acessos, concluido_em, concluida,
          atualizado_em
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, now())
      `,
      [
        userId,
        courseId,
        access.lessonId,
        access.firstAt,
        access.lastAt,
        access.count,
        access.completedAt ?? null,
        Boolean(access.completedAt)
      ]
    );

    await pool.query(
      `
        INSERT INTO eventos_aprendizagem (
          id, usuario_id, curso_id, aula_id, tipo_evento, metadata, criado_em
        )
        VALUES (gen_random_uuid(), $1, $2, $3, 'lesson_opened', $4::jsonb, $5)
      `,
      [
        userId,
        courseId,
        access.lessonId,
        JSON.stringify({ turmaId: classId, origem: "seed" }),
        access.firstAt
      ]
    );

    if (access.completedAt) {
      await pool.query(
        `
          INSERT INTO eventos_aprendizagem (
            id, usuario_id, curso_id, aula_id, tipo_evento, metadata, criado_em
          )
          VALUES (gen_random_uuid(), $1, $2, $3, 'lesson_completed', $4::jsonb, $5)
        `,
        [
          userId,
          courseId,
          access.lessonId,
          JSON.stringify({ turmaId: classId, origem: "seed" }),
          access.completedAt
        ]
      );
    }
  }

  for (const [eventType, createdAt] of [
    ["forum_posted", forumAt],
    ["material_opened", materialAt]
  ]) {
    if (!createdAt) {
      continue;
    }

    await pool.query(
      `
        INSERT INTO eventos_aprendizagem (
          id, usuario_id, curso_id, tipo_evento, metadata, criado_em
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4::jsonb, $5)
      `,
      [
        userId,
        courseId,
        eventType,
        JSON.stringify({ turmaId: classId, origem: "seed" }),
        createdAt
      ]
    );
  }

  if (status === "completed") {
    await pool.query(
      `
        INSERT INTO eventos_aprendizagem (
          id, usuario_id, curso_id, tipo_evento, metadata, criado_em
        )
        VALUES (gen_random_uuid(), $1, $2, 'certificate_requested', $3::jsonb, $4)
      `,
      [
        userId,
        courseId,
        JSON.stringify({ turmaId: classId, inscricaoId: enrollmentId, origem: "seed" }),
        completedAt ?? lastAccessAt ?? new Date().toISOString()
      ]
    );
  }
}

async function insertAudit(userIds) {
  await pool.query(
    `
      INSERT INTO logs_auditoria (id, usuario_id, acao, entidade, resumo)
      VALUES
        (gen_random_uuid(), $1, 'demo.seed', 'sistema', 'Massa de demonstração recriada.'),
        (gen_random_uuid(), $2, 'curso.publicado', 'cursos', 'Cursos demonstrativos publicados para validação institucional.'),
        (gen_random_uuid(), $3, 'forum.topico_criado', 'foruns', 'Debate demonstrativo criado para a turma de Design de Serviços.'),
        (gen_random_uuid(), $1, 'instrutoria.concluida_automatica', 'vinculos_instrutoria', 'Turma concluída. O vínculo de instrutoria foi encerrado.')
    `,
    [userIds.admin, userIds.gestor, userIds.instrutor]
  );
}

async function insertEvaluationDemo({ userIds, courseIds, classIds, enrollmentIds }) {
  await pool.query(
    `
      INSERT INTO requisitos_certificacao (
        id, curso_id, turma_id, exigir_frequencia, frequencia_minima,
        exigir_progresso, progresso_minimo, exigir_avaliacao_curso,
        exigir_questionario, nota_minima_questionario,
        exigir_avaliacao_instrutor, exigir_aprovacao_instrutor,
        emissao_automatica, liberacao_manual_admin
      )
      VALUES
        (gen_random_uuid(), $1, $2, true, 75, true, 80, true, true, 70, true, true, false, true),
        (gen_random_uuid(), $3, $4, true, 75, true, 100, false, false, 70, false, false, false, true),
        (gen_random_uuid(), $5, $6, true, 75, true, 100, true, true, 70, true, true, true, false)
      ON CONFLICT (turma_id) DO NOTHING
    `,
    [
      courseIds.design,
      classIds["design-2026"],
      courseIds.dados,
      classIds["dados-2026"],
      courseIds.facilitacao,
      classIds["facilitacao-2025"]
    ]
  );

  await pool.query(
    `
      INSERT INTO avaliacoes_turma_aluno (
        id, curso_id, turma_id, aluno_id, expectativas, relevancia_conteudo,
        metodologia, carga_horaria, materiais, dominio_instrutor,
        clareza_instrutor, participacao_instrutor, exemplos_praticos,
        aplicabilidade_servico_publico, experiencia_plataforma,
        contribuicao_inovacao, nps_nota, nps_motivo, principal_aprendizado,
        sugestao_melhoria, temas_futuros, intencao_aplicacao
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, 5, 5,
        4, 4, 5, 5,
        5, 4, 5,
        5, 4,
        5, 9, 'Formação aplicável ao cotidiano da Administração Pública.',
        'Aprendi a redesenhar jornadas de atendimento com foco no cidadão.',
        'Incluir mais estudos de caso locais.',
        'Laboratórios de dados e governo digital.',
        'Pretendo aplicar em melhorias no atendimento interno.'
      )
      ON CONFLICT (turma_id, aluno_id) DO NOTHING
    `,
    [courseIds.design, classIds["design-2026"], userIds.aluno02]
  );

  await pool.query(
    `
      INSERT INTO avaliacoes_aluno_instrutor (
        id, curso_id, turma_id, inscricao_id, aluno_id, instrutor_id,
        participacao, assiduidade, interesse, compreensao, atividades,
        debates, aplicacao_pratica, colaboracao, evolucao,
        aptidao_certificacao, resultado_final, feedback_publico,
        observacoes_internas, recomendacao
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5,
        5, 5, 5, 4, 5,
        4, 4, 5, 4,
        5, 'apto',
        'Participação consistente e boa aplicação dos conceitos.',
        'Aluno apto para emissão após conclusão dos demais requisitos.',
        'Manter prática em projetos de melhoria de serviços.'
      )
      ON CONFLICT (inscricao_id, instrutor_id) DO NOTHING
    `,
    [
      courseIds.design,
      classIds["design-2026"],
      enrollmentIds.aluno02,
      userIds.aluno02,
      userIds.instrutor
    ]
  );

  const quiz = await pool.query(
    `
      INSERT INTO questionarios (
        id, curso_id, turma_id, titulo, descricao, status,
        max_tentativas, nota_minima, obrigatorio_certificado,
        exibir_gabarito, exibir_feedback, criado_por_usuario_id
      )
      VALUES (
        gen_random_uuid(), $1, $2,
        'Questionário de aprendizagem - Design de Serviços',
        'Verificação objetiva dos conceitos centrais da formação.',
        'publicado', 2, 70, true, true, true, $3
      )
      RETURNING id
    `,
    [courseIds.design, classIds["design-2026"], userIds.instrutor]
  );
  const question = await pool.query(
    `
      INSERT INTO questoes_questionario (
        id, questionario_id, tipo, enunciado, ordem, pontos,
        feedback_correto, feedback_incorreto, obrigatoria
      )
      VALUES (
        gen_random_uuid(), $1, 'single_choice',
        'Qual prática melhor representa inovação pública orientada ao cidadão?',
        1, 10, 'Correto. A escuta ativa orienta soluções públicas melhores.',
        'Revise os conceitos de jornada do usuário e cocriação.', true
      )
      RETURNING id
    `,
    [quiz.rows[0].id]
  );
  await pool.query(
    `
      INSERT INTO opcoes_questionario (id, questao_id, texto, correta, ordem)
      VALUES
        (gen_random_uuid(), $1, 'Mapear a jornada do usuário e cocriar soluções com os envolvidos.', true, 1),
        (gen_random_uuid(), $1, 'Criar um formulário interno sem conversar com usuários do serviço.', false, 2)
    `,
    [question.rows[0].id]
  );
}

async function main() {
  await resetDatabase();

  const profileIds = {};
  for (const [codigo, descricao, categoria] of permissionCatalog) {
    await insertPermission(codigo, descricao, categoria);
  }

  for (const [nome, descricao, sistema] of perfis) {
    profileIds[nome] = await insertProfile(nome, descricao, sistema);
    await assignProfilePermissions(profileIds[nome], profilePermissions[nome] ?? []);
  }

  const userIds = {};
  for (const user of demoUsers) {
    userIds[user.key] = await insertUser(user, profileIds[user.perfil]);
  }

  const courseIds = {};
  for (const course of courses) {
    courseIds[course.key] = await insertCourse(course, userIds);
  }

  const classIds = {};
  for (const item of classes) {
    classIds[item.key] = await insertClass(item, courseIds, userIds);
  }
  await insertInstructorAssignments(classIds, courseIds, userIds);

  const meetingIds = {};
  for (const item of meetings) {
    meetingIds[`${item.classKey}:${item.data}:${item.inicio}`] =
      await insertMeeting(item, classIds);
  }

  const alunoDesignEnrollment = await insertEnrollment({
    userId: userIds.aluno,
    classId: classIds["design-2026"],
    origem: "autoinscricao",
    frequencia: 33.33,
    apto: false
  });
  const alunoFacilitacaoEnrollment = await insertEnrollment({
    userId: userIds.aluno,
    classId: classIds["facilitacao-2025"],
    origem: "gestao",
    frequencia: 100,
    apto: true
  });
  const alunaDadosEnrollment = await insertEnrollment({
    userId: userIds.aluna,
    classId: classIds["dados-2026"],
    origem: "gestao",
    frequencia: 0,
    apto: false
  });
  const enrollmentIds = {
    alunoDesign: alunoDesignEnrollment,
    alunoFacilitacao: alunoFacilitacaoEnrollment,
    alunaDados: alunaDadosEnrollment
  };
  await insertEnrollment({
    userId: userIds.gestor,
    classId: classIds["design-2026"],
    origem: "gestao",
    frequencia: 33.33,
    apto: false
  });
  for (const key of ["aluno02", "aluno03", "aluno04", "aluno05", "aluno06"]) {
    const enrollmentId = await insertEnrollment({
      userId: userIds[key],
      classId: classIds["design-2026"],
      origem: key === "aluno02" ? "autoinscricao" : "gestao",
      frequencia: key === "aluno02" ? 100 : 33.33,
      apto: false
    });
    enrollmentIds[key] = enrollmentId;

    await insertAttendance({
      enrollmentId,
      meetingId: meetingIds["design-2026:2026-03-10:09:00"],
      status: key === "aluno06" ? "justificado" : "presente",
      registeredBy: userIds.instrutor
    });
  }
  for (const key of ["aluno07", "aluno08", "aluno09", "aluno10"]) {
    enrollmentIds[key] = await insertEnrollment({
      userId: userIds[key],
      classId: classIds["dados-2026"],
      origem: "gestao",
      frequencia: 0,
      apto: false
    });
  }

  await insertAttendance({
    enrollmentId: alunoDesignEnrollment,
    meetingId: meetingIds["design-2026:2026-03-10:09:00"],
    status: "presente",
    registeredBy: userIds.instrutor
  });
  for (const key of [
    "facilitacao-2025:2025-11-05:08:30",
    "facilitacao-2025:2025-11-12:08:30",
    "facilitacao-2025:2025-11-19:08:30"
  ]) {
    await insertAttendance({
      enrollmentId: alunoFacilitacaoEnrollment,
      meetingId: meetingIds[key],
      status: "presente",
      registeredBy: userIds.instrutor
    });
  }

  await insertCertificate({
    enrollmentId: alunoFacilitacaoEnrollment,
    code: "LABC-2026-A1B2C3D4",
    emittedBy: userIds.gestor
  });

  for (const material of materials) {
    await insertMaterial(material, classIds, meetingIds, userIds);
  }
  await insertCalendarFixtures(classIds, courseIds, userIds);
  await insertRegistrationInviteFixtures(userIds, classIds);

  await insertForum(classIds["design-2026"], userIds.instrutor, userIds.aluno);
  await insertForum(classIds["dados-2026"], userIds.instrutor, userIds.aluna);
  await insertLearningProgress({
    enrollmentId: enrollmentIds.alunoDesign,
    userId: userIds.aluno,
    courseId: courseIds.design,
    classId: classIds["design-2026"],
    lessonAccesses: [
      {
        lessonId: meetingIds["design-2026:2026-03-10:09:00"],
        firstAt: "2026-03-10 09:15:00",
        lastAt: "2026-03-17 15:20:00",
        count: 3,
        completedAt: "2026-03-17 15:35:00"
      }
    ],
    forumAt: "2026-03-17 16:10:00",
    materialAt: "2026-03-11 10:30:00"
  });
  await insertLearningProgress({
    enrollmentId: enrollmentIds.alunoFacilitacao,
    userId: userIds.aluno,
    courseId: courseIds.facilitacao,
    classId: classIds["facilitacao-2025"],
    lessonAccesses: [
      {
        lessonId: meetingIds["facilitacao-2025:2025-11-05:08:30"],
        firstAt: "2025-11-05 08:35:00",
        lastAt: "2025-11-05 12:10:00",
        count: 2,
        completedAt: "2025-11-05 12:10:00"
      },
      {
        lessonId: meetingIds["facilitacao-2025:2025-11-12:08:30"],
        firstAt: "2025-11-12 08:40:00",
        lastAt: "2025-11-12 12:05:00",
        count: 2,
        completedAt: "2025-11-12 12:05:00"
      },
      {
        lessonId: meetingIds["facilitacao-2025:2025-11-19:08:30"],
        firstAt: "2025-11-19 08:35:00",
        lastAt: "2025-11-19 10:25:00",
        count: 1,
        completedAt: "2025-11-19 10:25:00"
      }
    ],
    forumAt: "2025-11-14 09:00:00",
    materialAt: "2025-11-06 11:00:00"
  });
  await insertLearningProgress({
    enrollmentId: enrollmentIds.aluno02,
    userId: userIds.aluno02,
    courseId: courseIds.design,
    classId: classIds["design-2026"],
    lessonAccesses: [
      {
        lessonId: meetingIds["design-2026:2026-03-10:09:00"],
        firstAt: "2026-03-10 09:10:00",
        lastAt: "2026-03-10 12:00:00",
        count: 2,
        completedAt: "2026-03-10 12:00:00"
      },
      {
        lessonId: meetingIds["design-2026:2026-03-17:14:00"],
        firstAt: "2026-03-17 14:05:00",
        lastAt: "2026-03-17 17:05:00",
        count: 2,
        completedAt: "2026-03-17 17:05:00"
      },
      {
        lessonId: meetingIds["design-2026:2026-03-24:09:00"],
        firstAt: "2026-03-24 09:00:00",
        lastAt: "2026-03-24 12:00:00",
        count: 1,
        completedAt: "2026-03-24 12:00:00"
      }
    ],
    forumAt: "2026-03-20 10:10:00",
    materialAt: "2026-03-12 08:40:00"
  });
  await insertLearningProgress({
    enrollmentId: enrollmentIds.aluno03,
    userId: userIds.aluno03,
    courseId: courseIds.design,
    classId: classIds["design-2026"],
    lessonAccesses: [
      {
        lessonId: meetingIds["design-2026:2026-03-10:09:00"],
        firstAt: "2026-03-10 09:30:00",
        lastAt: "2026-03-10 10:00:00",
        count: 1,
        completedAt: null
      }
    ]
  });
  await insertLearningProgress({
    enrollmentId: enrollmentIds.aluno07,
    userId: userIds.aluno07,
    courseId: courseIds.dados,
    classId: classIds["dados-2026"],
    lessonAccesses: [
      {
        lessonId: meetingIds["dados-2026:2026-04-06:10:00"],
        firstAt: "2026-04-06 10:05:00",
        lastAt: "2026-04-06 12:00:00",
        count: 2,
        completedAt: "2026-04-06 12:00:00"
      }
    ],
    materialAt: "2026-04-07 09:20:00"
  });
  await insertEvaluationDemo({ userIds, courseIds, classIds, enrollmentIds });
  await insertAudit(userIds);

  console.log("Seed LaBC demonstrativo concluido.");
  console.log("Admin: admin@labc.local / admin123");
  console.log("Instrutor: instrutor@labc.local / instrutor123");
  console.log("Aluno: aluno@labc.local / aluno123");
  console.log("Alunos extras: aluno02@labc.local a aluno10@labc.local / aluno123");
}

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
