# Eventos / HTML

[Read in English](./README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) ![Free](https://img.shields.io/badge/price-free-brightgreen)

Plataforma de eventos em HTML + Tailwind: site público (descobrir eventos, comprar ingressos por lote, carrinho/checkout, meus ingressos com QR) e área do organizador com dashboard (vendas, check-in), gestão de eventos e lotes, check-in por QR, participantes e financeiro. i18n pt-BR/en/es, PWA, dark mode.

## Destaques

- Venda de ingressos por lote + carrinho e checkout
- Meus ingressos com QR e check-in por validação
- Gestão de eventos, lotes e participantes
- Dashboard: vendas, receita e taxa de check-in
- i18n pt-BR/en/es, PWA, dark mode

## Telas em destaque

- Eventos: Descobrir e comprar
- Meus ingressos: QR e status
- Check-in: Validação e participantes
- Dashboard: Vendas e check-in

## Stack

- HTML5
- JavaScript
- Tailwind CSS v4
- ApexCharts

## Requisitos

- Node.js 20 ou mais novo, com npm

## Como rodar

```bash
npm install
npm run dev
```

O servidor de desenvolvimento mostra a URL local para abrir.

Conta de demonstração:

- `organizador@eventos.com` / `demo123`

## Build de produção

```bash
npm run build
```

Gera o pacote de produção em `dist/`; para conferir localmente, `npm run preview`. Qualquer hospedagem estática serve; para as rotas no cliente, redirecione caminhos desconhecidos para `index.html`.
Gera as páginas e assets otimizados em `dist/`. Os arquivos HTML também funcionam servidos direto por qualquer servidor estático.

## Estrutura do projeto

```
18 HTML pages at the root
assets/
```

## Outras tecnologias

Este template também existe em outras 4 tecnologias, com as mesmas telas e a mesma identidade visual. Todas são gratuitas:

- React 19: https://github.com/danilo62x/events-react
- Vue 3: https://github.com/danilo62x/events-vue3
- Angular 19: https://github.com/danilo62x/events-angular
- Laravel 11: https://github.com/danilo62x/events-laravel

Mais templates gratuitos (painéis admin, sistemas por segmento e apps Flutter): https://github.com/danilo62x?tab=repositories

## Licença

[MIT](./LICENSE), copyright 2026 Danilo Quinelato.
