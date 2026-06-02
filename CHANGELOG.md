# Changelog

## [2.0.0] — 2026-06-02

Segunda versão funcional do GENOMA — redesign completo da interface, processos clínicos avançados e distribuição como aplicação nativa Mac.

### Interface e experiência

- **Novo layout** com sidebar recolhível, breadcrumb, barra superior e área de conteúdo responsiva
- **Dashboard** redesenhado com KPIs, gráficos MudBlazor (processos por estado, evolução de exames) e listas recentes clicáveis
- **Tema visual unificado** (`genoma.css`, `GenomaTheme.cs`) — tipografia Inter, cartões, chips de estado, tabelas e tabs harmonizados
- **Modo escuro** com preferência persistida (`PreferenciasAppService`)
- **Layout mobile** — drawer temporário, top bar adaptada e conteúdo sem sobreposição
- **Pesquisa global** na barra superior com página de resultados (`/pesquisa`)
- **Notificações** com alertas reais da BD (processos pendentes, stock baixo, faturas por pagar)
- **Botões e icon buttons** padronizados em todas as páginas (filled, outlined, ações de tabela, diálogos)
- Cabeçalhos de página, cartões de estatísticas e barras de ferramentas consistentes em todos os módulos

### Processos clínicos

- **`ProcessoEditor`** — componente dedicado com tabs: dados gerais, gravidez, colheita, resultados clínicos, kit, anexos PDF
- **`ProcessoDetalhe`** — ficha de processo existente com ligação ao contacto
- **Pesquisa avançada** — filtros por processo, paciente, teste, kit, tracking, NIF, email, anulados, etc.
- **Anulação de processos** com motivo registado
- **`ProcessoKit`** — gestão de número de kit, tracking, localização e empresa
- **Resultados clínicos** — cromossomas configuráveis por teste (`CromossomaOpcoes`)
- **TesteEmpresa** — associação teste ↔ empresa ↔ tipo de kit em Definições

### Contactos

- Ficha simplificada: tab **Identificação** + tab **Processos** do contacto
- Criação de novo processo a partir da ficha do contacto

### Listagens e exportação

- Exportação **CSV** de contactos, processos e faturação (`genoma.js` → `downloadCsv`)
- Linhas clicáveis com navegação para fichas

### Base de dados

- `migrate_v3.sql` — processo_kit, resultados clínicos, campos expandidos
- `migrate_v4.sql` — informação clínica e colheita enriquecidas
- `migrate_v5.sql` — postos, teste_empresa, cromossomas analisados
- `backfill_processos_v3.sql` — preenchimento de processos antigos

### Branding e distribuição

- Nome comercial **GENOMA** (`ApplicationTitle`, `AssemblyName`)
- **Ícone da aplicação** — logo 3×3 com ligações diagonais (SVG)
- Splash screen alinhado com o ícone
- Build Release Mac Catalyst → `GENOMA.app` + instalador `GENOMA-1.0.pkg`
- Bundle ID: `com.genoma.app`

### Documentação

- README atualizado para v2.0 (módulos, migrações, publish, estrutura)

### Fora de scope v2.0

- Autenticação / login de utilizadores
- Módulo Marketing
- Assinatura/notarização Apple para distribuição externa

---

## [1.0.0] — 2026-06-01

Primeira versão funcional do Genoma — CRM de diagnóstico pré-natal.

### Adicionado

- **Dashboard** com indicadores em tempo real (MariaDB)
- **Contactos** — lista, pesquisa, ficha com 7 tabs
- **Processos** — criação, listagem, ligação a contactos
- **Faturação** — módulo independente com filtros (pendentes/faturadas), edição e campos Multibanco
- **Definições** — CRUD de testes genéticos, empresas e postos de colheita
- **Listagens** — relatórios de contactos, processos e faturação
- **Stocks** — inventário de kits com alerta de stock baixo e ligação a testes
- **Integração Testes → Processos → Faturação** — preço automático ao selecionar teste
- **Anexos PDF** — upload, abertura e eliminação por processo
- **Desconto automático de stock** ao atribuir teste a um processo
- Scripts SQL: `genoma_db.sql` (schema inicial) e `migrate_v2.sql` (teste_id + stocks)

### Ambiente

- Suporte **macOS** (Mac Catalyst) — migração Windows → Mac concluída
- Suporte **Windows** (Visual Studio 2022)
- MariaDB 12.x + Entity Framework Core (Pomelo)

### Fora de scope v1.0

- Autenticação / login de utilizadores
- Módulo Marketing
- Exportação PDF/Excel das listagens
