# Galeria-de-Arte-Acervo-do-Art-Institute-of-Chicago


# Galeria de Arte — Acervo do Art Institute of Chicago

Aplicação web full-stack (Next.js + React + SQLite) desenvolvida para a **2ª Avaliação da disciplina de Programação Web** — Curso de Tecnologia em Sistemas de Computação, Universidade Estadual do Piauí (UESPI), professor Eyder Rios. Corresponde ao **Problema 08 — Galeria de Arte**.

A aplicação permite buscar obras do acervo do [Art Institute of Chicago](https://api.artic.edu/docs/), filtrar por domínio público, consultar os detalhes de cada obra e montar uma **coleção pessoal** (com anotações) persistida localmente em SQLite.

## Integrantes

- **João Pedro Aguiar Teixeira (2025012506)**
- **Marcos Vinícius Mendes de Carvalho (2025031790)**


## Principais funcionalidades

- **Busca paginada de obras** por termo (título, artista, tema), com opção de exibir **somente obras em domínio público**. Obras sem imagem são descartadas pelo backend.
- **Detalhes da obra** (`/artworks/[id]`): imagem, título, artista, data, técnica, origem, dimensões, situação de domínio público e descrição convertida de HTML para texto simples.
- **Coleção pessoal** (`/collection`): listar, adicionar (a partir da página de detalhes), **editar a anotação** (até 500 caracteres) e **remover** obras. Uma mesma obra não pode ser adicionada duas vezes.
- **Estados de interface**: carregamento, lista vazia, entradas inválidas e erros de comunicação (com botão "Tentar novamente").
- **Navegação que preserva o contexto**: o termo de busca, a página e o filtro ficam na URL (`/?q=monet&page=3&is_public_domain=true`). Ao abrir uma obra e voltar (botão do navegador ou "← Voltar ao acervo"), a listagem reaparece na mesma página e **na mesma posição de rolagem**. Ao clicar em "Anterior"/"Próxima", a tela volta ao topo.
- **Acessibilidade e responsividade**: HTML semântico, *skip link*, rótulos em todos os controles, foco visível, `aria-live`/`role="alert"` nas mensagens e layout em grade adaptável a qualquer largura.

## API externa utilizada

| Item | Valor |
|---|---|
| Nome | Art Institute of Chicago API |
| URL base | `https://api.artic.edu/api/v1` |
| Documentação | <https://api.artic.edu/docs/> |
| Cabeçalho de identificação | `AIC-User-Agent: ArtGalleryApp (aluno@uespi.br)` — enviado pelo backend em **todas** as requisições (definido em `lib/artic.ts`) |
| Limite | 60 requisições por minuto por IP (acesso anônimo) |

Regras de consumo (todas no backend, em `lib/artic.ts` e nos Route Handlers):

- Somente o backend acessa a API externa; o frontend usa apenas `/api/...`.
- Apenas os campos necessários são solicitados (parâmetro `fields`): `id, title, artist_display, image_id, is_public_domain, date_display, medium_display` e, no detalhe, `description, place_of_origin, dimensions`.
- A URL da imagem segue o padrão IIIF: `{config.iiif_url}/{image_id}/full/843,/0/default.jpg`, usando o `iiif_url` informado na própria resposta da API.
- Obras sem `image_id` são descartadas na listagem.
- A `description` (que pode conter HTML) é convertida em texto simples.
- Sem filtro nem termo a listagem usa `GET /artworks`; com termo e/ou filtro usa `GET /artworks/search` (a API limita a busca a 1000 resultados, e o backend ajusta o total de páginas a esse limite).
- As imagens são servidas por `/api/image`, que as baixa no servidor para enviar o `AIC-User-Agent`.

## Endpoints do backend

Todas as respostas são JSON (exceto `204` e a imagem de `/api/image`). Erros seguem **sempre** o formato:

```json
{ "error": "Mensagem descritiva em português" }
```

### Obras (consulta à API externa)

| Método | Rota | Parâmetros | Finalidade | Status |
|---|---|---|---|---|
| `GET` | `/api/artworks` | Query (todos opcionais): `q` (termo de busca), `page` (inteiro ≥ 1, padrão `1`), `limit` (1 a 100, padrão `12`), `is_public_domain` (`true` ou `false`) | Busca paginada de obras, com filtro opcional de domínio público. Retorna `{ data: Artwork[], pagination: { page, limit, total, total_pages } }` | 200, 400, 502, 500 |
| `GET` | `/api/artworks/[id]` | Rota: `id` = ID da obra na API externa (inteiro positivo) | Detalhes de uma obra (inclui `description` em texto simples, `date`, `medium`, `place_of_origin`, `dimensions`) | 200, 400, 404, 502, 500 |
| `GET` | `/api/image` | Query: `url` (URL IIIF de `www.artic.edu`) | Rota auxiliar: baixa a imagem no servidor (com `AIC-User-Agent`) e a repassa ao navegador. Rejeita qualquer outra URL | 200, 400, 502, 500 |

### Coleção (banco SQLite)

O `[id]` das rotas abaixo é o **identificador local** do registro (`collection.id`), e não o ID da obra na API.

| Método | Rota | Parâmetros / corpo (JSON) | Finalidade | Status |
|---|---|---|---|---|
| `GET` | `/api/collection` | — | Lista os registros da coleção (mais recentes primeiro) | 200, 500 |
| `POST` | `/api/collection` | `artwork_id` (inteiro > 0, obrigatório), `title`, `artist`, `image_url` (textos, obrigatórios), `note` (texto até 500 caracteres, opcional) | Cria um registro. `created_at` é preenchido pelo backend | 201, 400, 409, 500 |
| `PATCH` | `/api/collection/[id]` | Corpo: `{ "note": "texto" }` ou `{ "note": null }` para limpar (até 500 caracteres). **Qualquer outro campo é rejeitado** | Atualiza somente o campo editável (`note`) | 200, 400, 404, 500 |
| `DELETE` | `/api/collection/[id]` | — | Remove o registro | 204, 400, 404, 500 |

### Códigos de status usados

| Código | Situação |
|---|---|
| `200 OK` | Consulta ou atualização realizada com sucesso |
| `201 Created` | Registro criado na coleção |
| `204 No Content` | Registro removido |
| `400 Bad Request` | Parâmetro ausente ou inválido (ID não numérico, `limit` > 100, JSON inválido, `note` acima de 500 caracteres, campo não editável no PATCH etc.) |
| `404 Not Found` | Obra inexistente na API (ou sem imagem), ou registro inexistente na coleção |
| `409 Conflict` | Obra já cadastrada na coleção (`artwork_id` duplicado) |
| `502 Bad Gateway` | Falha de comunicação com a API externa (indisponível, tempo esgotado ou resposta inválida) |
| `500 Internal Server Error` | Erro interno inesperado |

## Banco de dados (SQLite)

- **Arquivo:** `data/app.db` (na raiz do projeto). A pasta e o arquivo são criados **automaticamente** quando o backend acessa o banco pela primeira vez (por exemplo, ao abrir "Minha coleção" ou salvar uma obra).
- **Biblioteca:** `better-sqlite3`, com SQL puro e *prepared statements* (nenhum valor do usuário é concatenado ao SQL).
- **Modo WAL desativado:** o `journal_mode` permanece no padrão (`DELETE`), então todo o banco fica em um único arquivo, sem `*.db-wal` nem `*.db-shm`.
- **Versionamento:** o arquivo `.db` está no `.gitignore` e **não** é enviado ao GitHub.
- O banco guarda somente o que o usuário produziu (a coleção). Dados completos das obras continuam vindo da API externa; ficam salvos apenas o ID da obra e os poucos campos necessários para a listagem resumida (título, artista e URL da imagem).

### Tabela `collection`

| Campo | Tipo SQLite | Restrições | Editável? | Descrição |
|---|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | — | Identificador local do registro |
| `artwork_id` | `INTEGER` | `NOT NULL UNIQUE` | Não | ID da obra na API do Art Institute of Chicago |
| `title` | `TEXT` | `NOT NULL` | Não | Título da obra |
| `artist` | `TEXT` | `NOT NULL` | Não | Artista |
| `image_url` | `TEXT` | `NOT NULL` | Não | URL da imagem (padrão IIIF) |
| `note` | `TEXT` | opcional (`NULL`), até 500 caracteres (validado no backend) | **Sim** | Comentário/anotação pessoal |
| `created_at` | `TEXT` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — | Data de inclusão (UTC), preenchida automaticamente |

```sql
CREATE TABLE IF NOT EXISTS collection (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  artwork_id INTEGER NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  artist     TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Registros iniciais (seed)

Definidos em um único local, `lib/db.ts` (constante `SEEDS`). São **7 registros**, referenciando IDs reais da API: `27992`, `28560`, `111628`, `16568`, `20684`, `6565` e `129884`.

- **Valores variados:** 4 registros têm anotação preenchida (`27992`, `111628`, `20684`, `129884`) e 3 ficam sem anotação (`28560`, `16568`, `6565`).
- Título, artista e imagem de cada obra são obtidos da API no momento da criação do banco. **Por isso a primeira execução precisa de internet.** Se a API estiver indisponível, o arquivo é descartado e a criação é tentada de novo na próxima requisição.
- A inserção ocorre **somente quando o banco é criado**: reiniciar o servidor ou recarregar o `next dev` não duplica registros.

### Restaurar o banco ao estado inicial

Pare o servidor, apague o arquivo `data/app.db` e rode `npm run dev` novamente. O banco é recriado com os registros iniciais.

## Tecnologias utilizadas

- **Next.js 14** com **App Router** (páginas) e **Route Handlers** (backend em `app/api/`)
- **React 18** (componentes, props, `useState`/`useEffect`)
- **TypeScript em modo estrito** (`"strict": true` no `tsconfig.json`)
- **CSS puro** (`app/globals.css`)
- **SQLite** via **better-sqlite3**
- **`fetch` nativo** para toda a comunicação frontend → backend e backend → API externa

Não são usados: Server Actions, ORMs/query builders, servidor backend separado, bancos em nuvem ou autenticação.

## Versão do Node.js

Desenvolvido com **Node.js v20 (LTS)**. O Next.js 14 exige Node.js 18.17 ou superior.

## Como executar localmente

Requisitos: Node.js e npm instalados, com acesso à internet (para a API do museu e para o *seed* da primeira execução).

```bash
git clone <URL-DO-REPOSITORIO>
cd galeria-de-arte
npm install
npm run dev
```

Abra <http://localhost:3000>. Nenhuma configuração manual é necessária: o banco é criado sozinho, com os registros iniciais.

## Estrutura do projeto

```
app/
  page.tsx                      # busca paginada (estado na URL)
  artworks/[id]/page.tsx        # detalhe da obra (rota dinâmica)
  collection/page.tsx           # gerenciamento da coleção
  layout.tsx, globals.css
  api/
    artworks/route.ts           # GET  /api/artworks
    artworks/[id]/route.ts      # GET  /api/artworks/[id]
    collection/route.ts         # GET, POST /api/collection
    collection/[id]/route.ts    # PATCH, DELETE /api/collection/[id]
    image/route.ts              # GET  /api/image (proxy de imagens)
components/                     # Navbar, ArtworkCard, CollectionCard, Frame, Pagination, FeedbackMessage
lib/
  db.ts                         # conexão SQLite, schema e registros iniciais
  artic.ts                      # acesso à API externa e conversão dos dados
  http.ts                       # HttpError, respostas de erro e validação de números
  api.ts                        # fetch do frontend para /api/...
  listState.ts                  # cache da listagem e restauração de rolagem
  types.ts
data/app.db                     # criado automaticamente (ignorado pelo Git)
```
