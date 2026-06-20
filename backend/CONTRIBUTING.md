# 🤝 Guia de Contribuição

## Bem-vindo ao Projeto!

Obrigado por considerar contribuir para API Genoma. Este documento fornece diretrizes e informações para que você tenha sucesso ao contribuir.

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Começar](#como-começar)
3. [Padrões de Código](#padrões-de-código)
4. [Processo de Commit](#processo-de-commit)
5. [Pull Requests](#pull-requests)
6. [Reporte de Bugs](#reporte-de-bugs)
7. [Sugestões de Melhorias](#sugestões-de-melhorias)

## 📖 Código de Conduta

Esperamos que todos os contribuidores sejam respeitosos e profissionais. Comportamento abusivo, assédio ou discriminação não serão tolerados.

## 🚀 Como Começar

### 1. Fork o Repositório
```bash
# Clone seu fork
git clone https://github.com/seu-usuario/app_genoma.git
cd app_genoma/backend
```

### 2. Criar Branch de Desenvolvimento
```bash
# Atualizar main
git checkout main
git pull origin main

# Criar branch para sua feature/fix
git checkout -b feature/sua-feature
# ou
git checkout -b fix/seu-bug
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Configurar Ambiente
```bash
cp .env.example .env
# Editar .env com suas credenciais de teste
npm run migrate
```

## 💻 Padrões de Código

### Nomenclatura

#### Arquivos
- Controllers: `recurso.controller.js` (ex: `pacientes.controller.js`)
- Services: `recurso.service.js` (ex: `pacientes.service.js`)
- Repositories: `recurso.repository.js` (ex: `pacientes.repository.js`)
- Routes: `recurso.routes.js` (ex: `pacientes.routes.js`)
- Middlewares: `recurso.middleware.js` (ex: `auth.middleware.js`)

#### Variáveis e Funções
```javascript
// ✅ BOM
const pacientesRepository = require('./pacientes.repository');
function getPatientById(id) { }
const MAX_RETRIES = 3;

// ❌ RUIM
const PR = require('./pacientes.repository');
function getpatient(id) { }
const maxRetries = 3;
```

#### Constantes
```javascript
// ✅ BOM
const STATUS_ENUM = ['Pendente', 'Colhido', 'Concluído'];
const MAX_PAGE_SIZE = 100;

// ❌ RUIM
const statusEnum = ['Pendente', 'Colhido', 'Concluído'];
const max_page_size = 100;
```

### Estilo de Código

#### Indentação
- Use 2 espaços (não tabs)
- Configure no `.editorconfig` e VSCode

#### Linha em branco
```javascript
// ✅ BOM - Separar logicamente grupos de código
const { pacientesService } = require('../services');
const { asyncHandler } = require('../middleware');

exports.list = asyncHandler(async (req, res) => {
  const pacientes = await pacientesService.listAll();
  
  res.json({
    success: true,
    data: pacientes
  });
});

// ❌ RUIM - Sem separação lógica
const { pacientesService } = require('../services');
const { asyncHandler } = require('../middleware');
exports.list = asyncHandler(async (req, res) => {
  const pacientes = await pacientesService.listAll();
  res.json({
    success: true,
    data: pacientes
  });
});
```

### Comentários

```javascript
// ✅ BOM - Comentários explicativos
/**
 * Busca paciente por ID
 * @param {string} id - ID do paciente
 * @returns {Promise<Object>} Paciente encontrado ou null
 */
exports.findById = async (id) => {
  // Verificar se ID é válido
  if (!id || id.length !== 36) {
    return null;
  }
  
  // Query com soft-delete
  const [rows] = await connection.execute(
    'SELECT * FROM pacientes WHERE id = ? AND ativo = TRUE',
    [id]
  );
  
  return rows[0] || null;
};

// ❌ RUIM - Comentários óbvios
// Buscar paciente
const result = await db.query('SELECT * FROM pacientes WHERE id = ?', [id]);
return result; // Retornar resultado
```

### Tratamento de Erros

```javascript
// ✅ BOM - Erros específicos e informativos
if (!paciente) {
  const error = new Error('Paciente não encontrado');
  error.statusCode = 404;
  throw error;
}

// ❌ RUIM - Erros genéricos
if (!paciente) {
  throw new Error('Erro');
}
```

### Async/Await

```javascript
// ✅ BOM
exports.create = asyncHandler(async (req, res) => {
  try {
    const paciente = await pacientesService.create(req.body);
    res.status(201).json({ success: true, data: paciente });
  } catch (error) {
    next(error);
  }
});

// ❌ RUIM - Callbacks ou .then() desnecessários
exports.create = (req, res, next) => {
  pacientesService.create(req.body).then(paciente => {
    res.status(201).json({ success: true, data: paciente });
  }).catch(error => {
    next(error);
  });
};
```

## 📝 Processo de Commit

### Mensagens de Commit

Siga o padrão Conventional Commits:

```
<tipo>[escopo]: <descrição>

[corpo opcional]

[rodapé opcional]
```

#### Tipos
- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Mudanças em documentação
- **style**: Formatação, indentação
- **refactor**: Refatoração de código
- **perf**: Melhoria de performance
- **test**: Adicionar/modificar testes
- **chore**: Dependências, configuração

#### Exemplos

```bash
# ✅ BOM
git commit -m "feat(pacientes): adicionar validação de NIF único"
git commit -m "fix(pedidos): corrigir cálculo de desconto"
git commit -m "docs(readme): atualizar instruções de setup"
git commit -m "refactor(repositories): centralizar queries SQL"

# ❌ RUIM
git commit -m "Adicionar coisa"
git commit -m "Arrumar"
git commit -m "Update"
```

### Commits Atômicos

Cada commit deve ser auto-contido e fazer uma coisa:

```bash
# ✅ BOM - Múltiplos commits focados
git commit -m "feat(validators): adicionar validador de NIF"
git commit -m "feat(pacientes): usar validador de NIF"
git commit -m "test(pacientes): adicionar testes para NIF"

# ❌ RUIM - Um commit gigante com tudo
git commit -m "feat: adicionar pacientes com validação, testes e docs"
```

## 🔄 Pull Requests

### Antes de Submeter

1. **Atualizar Main**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Executar Testes**
   ```bash
   npm test
   ```

3. **Verificar Lint**
   ```bash
   npm run lint
   ```

4. **Formatar Código**
   ```bash
   npm run format
   ```

5. **Testar Manualmente**
   - Abrir Swagger em `http://localhost:3000/api-docs`
   - Testar endpoints relacionados
   - Verificar edge cases

### Template de PR

```markdown
## Descrição
Breve descrição do que foi feito.

## Tipo de Mudança
- [ ] Bug fix (correção que não quebra features)
- [ ] New feature (nova funcionalidade)
- [ ] Breaking change (altera API existente)
- [ ] Documentation update

## Como Testar
Passos para verificar as mudanças:
1. ...
2. ...

## Checklist
- [ ] Código segue padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Sem lint errors
- [ ] Testado manualmente

## Screenshots
Se aplicável, adicione screenshots das mudanças.
```

## 🐛 Reporte de Bugs

### Template de Issue

```markdown
## Descrição do Bug
Descrição clara do problema.

## Como Reproduzir
Passos específicos para reproduzir:
1. ...
2. ...
3. ...

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que está acontecendo.

## Environment
- SO: [Windows/Mac/Linux]
- Node: [versão]
- MariaDB: [versão]

## Logs/Stack Trace
Inclua erros relevantes.

## Screenshots
Se aplicável.
```

## 💡 Sugestões de Melhorias

### Template de Feature Request

```markdown
## Descrição
Descrição clara da feature solicitada.

## Caso de Uso
Por que isso é importante? Quem se beneficiaria?

## Possível Solução
Sua ideia de como implementar (opcional).

## Alternativas
Outras abordagens (opcional).
```

## 📚 Documentação

Ao adicionar features, atualize:

1. **README.md** - Mudanças principais de uso
2. **ARCHITECTURE.md** - Mudanças estruturais
3. **Swagger** - Novos endpoints
4. **JSDoc** - Comentários em funções

## 🧪 Testes

```bash
# Executar testes
npm test

# Cobertura
npm test -- --coverage

# Modo watch
npm run test:watch
```

## 📞 Comunicação

- **Issues**: Para bugs e sugestões
- **Discussions**: Para perguntas e discussões
- **Email**: support@genoma.lab

---

**Obrigado por contribuir!** 🎉

Última atualização: Março 2026
