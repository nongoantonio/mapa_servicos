# 🗺️ Mapa de Serviços

Mapa colaborativo de serviços locais em **Luanda, Angola**. Mostra farmácias e bombas de combustível no mapa, com o objectivo de a comunidade poder partilhar o estado actual de cada local (aberto, fechado, sem stock) e avaliá-lo.

> Projecto individual de portfolio, construído passo a passo.

## 🎯 O problema

Saber se uma farmácia está aberta ou se uma bomba tem combustível obriga muitas vezes a ligar, ir ao local ou perguntar em grupos de WhatsApp. Este projecto centraliza essa informação num mapa simples, actualizado pela própria comunidade.

## ✨ Funcionalidades

**Já disponíveis**
- Mapa interactivo de Luanda com **366 locais reais** (246 farmácias e 120 bombas)
- Dados importados do OpenStreetMap através da Overpass API
- Filtros por categoria (Todos, Farmácias, Bombas) e legenda de cores
- Balão com nome, tipo e morada ao clicar num ponto

**Em desenvolvimento**
- Autenticação de utilizadores (email e palavra-passe)
- Reporte do estado actual de um local (aberto, fechado, sem stock)
- Avaliações e comentários
- Pesquisa "perto de mim"
- Fotos enviadas pelos utilizadores
- PWA com cache offline, a pensar em quem tem dados móveis limitados

## 🧱 Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Estilos | Tailwind CSS |
| Mapa | Leaflet, react-leaflet, OpenStreetMap |
| Backend e base de dados | Supabase (PostgreSQL + PostGIS) |
| Segurança | Row Level Security (RLS) |
| Dados | Overpass API (OpenStreetMap) |

## 🧠 Decisões técnicas

- **O estado é um histórico, não um campo editável.** Cada actualização é guardada como um reporte na tabela `status_reports`, e o estado actual é o mais recente. Isto permite mostrar "confirmado há X minutos" e, no futuro, medir a fiabilidade da informação.
- **Segurança na base de dados.** Todos podem ler os dados, mas só utilizadores autenticados escrevem, e apenas em nome próprio. As regras vivem no PostgreSQL (RLS), não só no frontend.
- **Pesquisa geográfica com PostGIS.** Os locais guardam coordenadas num tipo geográfico com índice espacial, pronto para consultas por distância.
- **Dados reais desde o primeiro dia.** Um script importa os locais do OpenStreetMap, por isso o mapa nunca começa vazio.

## 🗄️ Modelo de dados

- `places`: locais (nome, categoria, localização, morada, contacto)
- `status_reports`: histórico de estados reportados por utilizadores
- `reviews`: avaliações de 1 a 5, uma por utilizador em cada local
- `places_with_status` (vista): cada local com o último estado e a média de avaliações

## 🚀 Como correr localmente

**Requisitos:** Node.js 18+ e uma conta gratuita no [Supabase](https://supabase.com).

```bash
git clone https://github.com/nongoantonio/mapa_servicos.git
cd mapa_servicos
npm install
```

Cria um ficheiro `.env.local` na raiz com as chaves do teu projecto Supabase:

```
VITE_SUPABASE_URL=https://O_TEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=a_tua_chave_publishable
```

Depois:

```bash
npm run dev
```

> Use apenas a chave **publishable**. A chave `secret` nunca deve aparecer no frontend nem no repositório.

### Importar os locais de Luanda

```bash
node scripts/import-osm.mjs
```

O script gera `scripts/places.sql`. Cola o conteúdo no **SQL Editor** do Supabase e executa.

## 🗺️ Próximos passos

1. Autenticação de utilizadores
2. Reportar estado de um local
3. Avaliações e comentários
4. Pesquisa por proximidade
5. Upload de fotos
6. PWA e modo offline
7. Deploy público

## 📄 Dados e licenças

Os dados dos locais vêm do [OpenStreetMap](https://www.openstreetmap.org/copyright) © OpenStreetMap contributors, disponíveis sob a licença ODbL.

## 👤 Autor

**Nongo António**, desenvolvedor.
[GitHub](https://github.com/nongoantonio)