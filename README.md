# GENOMA

CRM para área de saúde / diagnóstico pré-natal (testes genéticos).

Aplicação desktop multiplataforma construída com **.NET MAUI Blazor Hybrid**, **MudBlazor** e **MariaDB**.

---

## Stack

| Tecnologia | Versão |
|------------|--------|
| .NET | 9.0 |
| .NET MAUI | 9.x |
| MudBlazor | 9.4.0 |
| Entity Framework Core | 9.0 (Pomelo MySQL) |
| MariaDB | 12.x |

---

## Funcionalidades (v2.0)

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | KPIs, gráficos (processos por estado, evolução de exames), listas recentes |
| **Contactos** | Lista com pesquisa, ficha (Identificação + tab Processos) |
| **Processos** | Pesquisa avançada, ficha completa (`ProcessoEditor`), kits, colheita, resultados, anexos PDF, anulação |
| **Faturação** | Listagem, filtros, edição e ligação a processos/contactos |
| **Stocks** | Inventário com alertas de stock baixo e ajuste rápido (+/−) |
| **Listagens** | Relatórios com exportação **CSV** (contactos, processos, faturação) |
| **Definições** | Testes (cromossomas, empresas/kit), empresas e postos de colheita |
| **Pesquisa global** | Barra superior — pesquisa unificada em contactos e processos |

### Interface

- Layout com **sidebar** recolhível, breadcrumb e barra superior
- **Modo escuro** e layout responsivo (desktop / telemóvel)
- **Notificações** (processos pendentes, stock baixo, faturas por pagar)
- Tema visual unificado (`genoma.css` + `GenomaTheme`)

> **Marketing** e **Login/Autenticação** estão planeados para versões futuras.

---

## Requisitos

### Mac

- macOS 15+ com Xcode (Mac Catalyst)
- .NET 9 SDK + workload MAUI
- MariaDB 12.x (Homebrew ou instalador)

### Windows

- Visual Studio 2022 (workloads: ASP.NET, .NET MAUI, Desktop .NET)
- MariaDB 12.x

---

## Instalação

### 1. Clonar repositório

```bash
git clone https://github.com/rAg0903/Genoma.git
cd Genoma
```

### 2. .NET 9 + MAUI

```bash
dotnet workload install maui
```

### 3. Base de dados

**Instalação nova:**

```bash
mysql -u root -p < scripts/genoma_db.sql
```

**Atualização (bases existentes)** — executar por ordem:

```bash
mysql -u root -p genoma_db < scripts/migrate_v2.sql
mysql -u root -p genoma_db < scripts/migrate_v3.sql
mysql -u root -p genoma_db < scripts/migrate_v4.sql
mysql -u root -p genoma_db < scripts/migrate_v5.sql
mysql -u root -p genoma_db < scripts/backfill_processos_v3.sql
```

### 4. Connection string

Editar `MauiProgram.cs`:

```csharp
Server=127.0.0.1;Port=3306;Database=genoma_db;User=root;Password=SUA_PASSWORD;
```

### 5. Executar (desenvolvimento)

**Mac:**

```bash
dotnet build -f net9.0-maccatalyst -t:Run
```

**Windows:**

Abrir `Genoma.sln` no Visual Studio 2022 e executar (Windows / Android / etc.).

### 6. Criar aplicação instalável (Mac)

Gera `GENOMA.app` e instalador `.pkg`:

```bash
dotnet publish -f net9.0-maccatalyst -c Release
```

Saída principal:

- App: `bin/Release/net9.0-maccatalyst/GENOMA.app`
- Instalador: `bin/Release/net9.0-maccatalyst/publish/GENOMA-1.0.pkg`

> A app **não inclui** o MariaDB — a base de dados tem de estar a correr localmente.

---

## Estrutura do projeto

```
Genoma/
├── Components/
│   ├── Layout/           # MainLayout (sidebar, topbar, tema)
│   ├── Pages/            # Páginas Blazor
│   └── ProcessoEditor.razor
├── Data/                 # GenomaContext (EF Core)
├── Models/               # Entidades C#
├── Services/             # AnexoService, StockService, PreferenciasAppService
├── scripts/              # SQL (schema + migrations v2–v5)
├── wwwroot/css/genoma.css
├── wwwroot/js/genoma.js
├── GenomaTheme.cs
└── MauiProgram.cs
```

---

## Fluxo clínico típico

1. Configurar **Testes** e **Postos** em Definições
2. Criar **Contacto** (paciente)
3. Criar **Processo** — escolher teste, posto, kit e dados clínicos
4. Registar **Colheita** e **Resultados** na ficha do processo
5. Anexar **PDF** de resultados
6. Gerir **Faturação** e **Stock** (desconto automático ao atribuir teste)

---

## Histórico de versões

Ver [CHANGELOG.md](CHANGELOG.md).

---

## Licença

Projeto privado — uso interno.
