# Genoma

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

## Módulos (v1.0)

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | KPIs: contactos, processos, faturas pendentes, total faturado |
| **Contactos** | Lista de pacientes + ficha com tabs (Identificação, Gravidez, Colheita, Faturação, Notas, Anexos) |
| **Processos** | Gestão de processos clínicos ligados a contactos e testes |
| **Faturação** | Módulo independente com filtros, edição e Multibanco |
| **Definições** | Testes genéticos, empresas e postos de colheita |
| **Listagens** | Relatórios de contactos, processos e faturação |
| **Stocks** | Inventário de kits/reagentes ligado aos testes |

> **Marketing** e **Login/Autenticação** estão planeados para versões futuras.

---

## Requisitos

### Mac
- macOS com Xcode (Mac Catalyst)
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

**Atualização (bases existentes):**

```bash
mysql -u root -p genoma_db < scripts/migrate_v2.sql
```

### 4. Connection string

Editar `MauiProgram.cs`:

```csharp
Server=127.0.0.1;Port=3306;Database=genoma_db;User=root;Password=SUA_PASSWORD;
```

### 5. Executar

**Mac:**

```bash
dotnet build -f net9.0-maccatalyst -t:Run
```

**Windows:**

Abrir `Genoma.sln` no Visual Studio 2022 e executar (Windows / Android / etc.).

---

## Estrutura do projeto

```
Genoma/
├── Components/Pages/     # Páginas Blazor (UI)
├── Components/Layout/    # MainLayout, sidebar
├── Data/                 # GenomaContext (EF Core)
├── Models/               # Entidades C#
├── Services/             # AnexoService, StockService
├── scripts/              # SQL (schema + migrations)
└── MauiProgram.cs        # Configuração DI + BD
```

---

## Fluxo clínico típico

1. Criar **Contacto** (paciente)
2. Criar **Processo** e escolher **Teste genético** (ex.: NIPT)
3. Preencher tabs **Gravidez**, **Colheita**, **Faturação**
4. Anexar **PDF** de resultados na tab Anexos
5. Gerir **Stock** de kits (desconto automático ao atribuir teste)

---

## Licença

Projeto privado — uso interno.
