# Changelog

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
