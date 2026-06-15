# Casa Freitas — Gerador de Encartes B2B

## Stack Tecnológica

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Framework | Next.js 14 (App Router) | API routes integradas, SSR, routing |
| Estilo | Tailwind CSS | Rapid styling + brand tokens |
| Drag & Drop | @dnd-kit | Acessível, performático, sem jQuery |
| State | Zustand | Leve, sem boilerplate |
| PDF | Puppeteer (backend) | Qualidade profissional — vetores + alta resolução |
| Google | googleapis SDK | Sheets v4 + Drive v3 |
| Imagem | Sharp (proxy) | Bypass de CORS do Google Drive |

## Instalação

```bash
npm install
```

## Configuração Google APIs

### 1. Google Cloud Console

1. Acede a https://console.cloud.google.com
2. Cria um novo projeto (ex: `casa-freitas-catalog`)
3. Activa as APIs:
   - **Google Sheets API**
   - **Google Drive API**

### 2. Service Account

1. IAM & Admin → Service Accounts → Criar
2. Descarrega o ficheiro JSON de credenciais
3. Guarda o `client_email` e a `private_key`

### 3. Partilhar recursos

- Abre o Google Sheet → Partilhar com o email da service account (Leitor)
- Abre a pasta do Drive → Partilhar com o mesmo email (Leitor)

### 4. Variáveis de Ambiente

```bash
cp .env.local.example .env.local
```

Preenche o `.env.local`:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_SHEETS_ID=1Ab2IBTmaHds5u2StUgaQP1siVuYMJTNVyRCQISH8ajU
GOOGLE_DRIVE_FOLDER_ID=1wClR0tYmvYg1nWwWA8tOJ2m_0X2TN44I
```

> ⚠️ A `GOOGLE_PRIVATE_KEY` deve ter os `\n` como literais dentro das aspas duplas.

## Iniciar

```bash
npm run dev
```

Abre http://localhost:3000

## Estrutura do Projeto

```
src/
  app/
    api/
      sheets/route.ts          # Lê dados do Google Sheets
      drive/
        list/route.ts          # Lista imagens do Google Drive → imageMap
        [fileId]/route.ts      # Proxy de imagens (resolve CORS)
      pdf/route.ts             # Gera PDF com Puppeteer
    layout.tsx
    page.tsx                   # Dashboard principal (3 colunas)
    globals.css
  components/
    CampaignForm.tsx           # Formulário: título, praça, pagamento, datas, email
    CoverUpload.tsx            # Upload da imagem de capa (9:16)
    ExportButton.tsx           # Exportação PDF de alta qualidade
    FamilySuggestions.tsx      # Sugestões de agrupamento por família
    FilterBar.tsx              # Filtros rápidos + toggle de ordem
    ImageManager.tsx           # Modal: upload manual + crop 1:1
    LivePreview.tsx            # Preview WYSIWYG com tabs de página
    CatalogPagePreview.tsx     # Página 9:16 com grelha 2×3 + rodapé
    ProductCard.tsx            # Card de produto (modo compacto e lista)
    ProductList.tsx            # Lista com DnD para reordenar
  lib/
    google.ts                  # Cliente Google APIs (JWT service account)
    catalog-logic.ts           # Ordenação, agrupamento, formatação
  store/
    catalog.ts                 # Zustand store — estado global
  types/
    catalog.ts                 # TypeScript interfaces
```

## Lógica de Matching de Imagens

O sistema extrai automaticamente o código do nome do ficheiro no Drive
e faz o match com o código da coluna da spreadsheet.

**Formato suportado:** `CODIGOPRODUTO_descricao.jpg`
- Os primeiros 13 caracteres alfanuméricos do nome do ficheiro são usados como chave
- Exemplo: `ABC1234567890_bola-veludo.jpg` → código `ABC1234567890`

## Exportação PDF

O PDF é gerado pelo Puppeteer no servidor:
- Resolução real: **2160×3840px** (1080×1920 × deviceScaleFactor 2)
- Cada página do catálogo = 1 página PDF (proporção 9:16)
- Fontes vetorizadas, fundos impressos, imagens em alta resolução
- A capa (se existir) é a primeira página

## Funcionalidades

| Feature | Implementado |
|---------|-------------|
| Importar do Google Sheets | ✅ |
| Match automático de imagens do Drive | ✅ |
| Proxy de imagens (resolve CORS) | ✅ |
| Preview WYSIWYG 9:16 | ✅ |
| Grelha 6 produtos por página | ✅ |
| Rodapé com dados da campanha | ✅ |
| Drag & Drop na lista | ✅ |
| Drag & Drop no preview | ✅ |
| Ocultar/mostrar produtos | ✅ |
| Upload manual de imagem | ✅ |
| Crop/recorte de imagem | ✅ |
| Filtro por categoria | ✅ |
| Filtro "ocultar sem imagem" | ✅ |
| Ordenação automática (tipo→nome→preço) | ✅ |
| Sugestões de famílias de produtos | ✅ |
| Upload da imagem de capa | ✅ |
| Exportação PDF alta qualidade | ✅ |
