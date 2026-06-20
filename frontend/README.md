
# Genoma CRM Frontend

Frontend base gerado a partir do design Figma e preparado para evolucao com React + Vite + Tailwind CSS.

Projeto de origem:
https://www.figma.com/design/X9wG16jhs5v1VG6BUOCtfo/CRM-Web-App-Design

## Tecnologias

- React 18
- Vite 6
- Tailwind CSS 4
- React Router

## Como executar

1. Instalar dependencias

```bash
npm install
```

2. (Opcional) Configurar variaveis de ambiente

```bash
cp .env.example .env
```

3. Executar em desenvolvimento

```bash
npm run dev
```

App frontend: http://localhost:5173

## Ligacao ao backend

- Por padrao, chamadas para `/api` e `/health` sao encaminhadas para `http://localhost:3000` via proxy do Vite.
- Se quiseres URL explicita, define `VITE_API_URL` em `.env`.

## Proximo passo sugerido

Substituir os dados mock de `src/app/context/DataContext.tsx` por chamadas reais usando `src/lib/api.ts`.
  