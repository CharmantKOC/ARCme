# ARC-Mémoires 🎓

> Plateforme AI-powered de gestion et recherche de mémoires académiques

ARC-Mémoires est une application web moderne permettant aux étudiants et alumni de partager, consulter et rechercher des mémoires de fin d'études de manière intelligente grâce à l'intelligence artificielle.

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan)](https://tailwindcss.com/)

## ✨ Fonctionnalités

### 🔐 Authentification & Profils
- Inscription/Connexion via Supabase Auth
- Gestion de profil avec upload d'avatar
- Statistiques personnelles (documents, sessions, conversations)
- Système de rôles (étudiant, alumni, admin)

### 📚 Gestion de Documents
- Upload de PDF vers Supabase Storage
- Métadonnées complètes (titre, auteur, année, domaine, abstract)
- Visionneuse PDF intégrée (zoom, navigation, téléchargement)
- Système de notes par document

### 🔍 Recherche Avancée
- **RAG (Retrieval Augmented Generation)** avec recherche sémantique
- Recherche par mots-clés (titre, auteur, domaine)
- Recherche hybride (sémantique + keywords)
- Filtres multiples (année, domaine, auteur)

### 🤖 Assistant IA
- Interface conversationnelle
- Recherche contextuelle dans les documents
- Réponses basées sur le contenu réel des mémoires
- Citations de sources avec pages

### 👥 Réseau Alumni
- Annuaire des alumni avec leurs publications
- Filtres par domaine et recherche par nom
- Contact direct via messagerie intégrée
- Statistiques par alumni

### 💬 Messagerie Temps Réel
- Conversations 1-to-1 avec Supabase Realtime
- Historique des messages
- Notifications en temps réel
- Interface de chat moderne

### 📊 Visualisation de Données
- Graphiques interactifs (Recharts)
- Tendances annuelles des dépôts
- Distribution par domaines
- Top keywords et sujets

### 📝 Sessions de Recherche
- Création et gestion de sessions
- Sauvegarde des documents consultés
- Historique de recherche
- Notes associées aux sessions

## 🏗️ Architecture Technique

### Stack Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **React Router** - Navigation
- **Recharts** - Data visualization
- **react-pdf** - PDF viewing

### Backend (Supabase)
- **PostgreSQL** - Database
- **Row Level Security** - Permissions
- **Supabase Auth** - Authentication
- **Supabase Storage** - File storage
- **Supabase Realtime** - WebSocket connections
- **pgvector** - Vector similarity search

### RAG System
- **pdfjs-dist** - PDF text extraction
- **OpenAI Embeddings** - Vector generation
- **pgvector** - Semantic search
- **Hybrid search** - Combining semantic + keywords

## 🚀 Installation

### Prérequis

- Node.js 18+ 
- npm / pnpm / bun
- Compte Supabase
- (Optionnel) Clé API OpenAI pour le RAG

### 1. Cloner le projet

```bash
git clone https://github.com/your-repo/arc-memories.git
cd arc-memories
```

### 2. Installer les dépendances

### 2. Installer les dépendances

```bash
npm install
# ou
pnpm install
# ou
bun install
```

### 3. Configuration

Créer un fichier `.env.local` à la racine :

```env
# Supabase (obligatoire)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (optionnel - pour RAG)
VITE_OPENAI_API_KEY=sk-your-key

# Configuration RAG (optionnel)
VITE_RAG_MOCK_MODE=false
```

### 4. Setup Supabase

#### Via Supabase Dashboard :

1. Créer un nouveau projet Supabase
2. Activer l'extension pgvector : Database → Extensions → `vector`
3. Exécuter les migrations SQL :
   - Copier/coller le contenu de `supabase/migrations/*.sql` dans SQL Editor

#### Via Supabase CLI :

```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Link au projet
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 5. Lancer l'application

```bash
npm run dev
```

Ouvrir [http://localhost:8080](http://localhost:8080)

## 📖 Documentation

- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - État d'avancement du projet (75% complété)
- **[RAG_GUIDE.md](./RAG_GUIDE.md)** - Guide complet du système RAG
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture détaillée (à venir)

## 🗄️ Structure du Projet

```
arc-memories/
├── src/
│   ├── components/          # Composants React
│   │   ├── ui/             # Composants Shadcn/ui
│   │   ├── Header.tsx      # Header de navigation
│   │   ├── Footer.tsx      # Footer
│   │   ├── PDFViewer.tsx   # Visionneuse PDF
│   │   └── RAGAdminPanel.tsx # Admin RAG
│   ├── contexts/           # Contexts React
│   │   └── AuthContext.tsx # Authentification
│   ├── pages/              # Pages de l'application
│   │   ├── Index.tsx       # Page d'accueil
│   │   ├── Auth.tsx        # Connexion/Inscription
│   │   ├── Documentation.tsx # Liste des documents
│   │   ├── Consultation.tsx  # Lecture de documents
│   │   ├── AssistantIA.tsx   # Chat IA
│   │   ├── Alumni.tsx        # Réseau alumni
│   │   ├── Messagerie.tsx    # Chat temps réel
│   │   ├── Profil.tsx        # Profil utilisateur
│   │   └── Visualisation.tsx # Analytics
│   ├── lib/                # Librairies utilitaires
│   │   ├── rag/            # Système RAG
│   │   │   ├── index.ts    # Exports principaux
│   │   │   ├── pdfProcessor.ts   # Extraction PDF
│   │   │   ├── embeddings.ts     # Génération embeddings
│   │   │   ├── vectorSearch.ts   # Recherche sémantique
│   │   │   └── ragService.ts     # Service principal
│   │   └── utils.ts        # Fonctions helper
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts   # Client Supabase
│   │       └── types.ts    # Types générés
│   └── main.tsx            # Point d'entrée
├── supabase/
│   └── migrations/         # Migrations SQL
├── public/                 # Assets statiques
├── .env.local             # Variables d'environnement
└── package.json           # Dépendances
```

## 📊 Base de Données

### Tables Principales

**profiles** - Profils utilisateurs
```sql
id, user_id, full_name, email, avatar_url, bio, created_at
```

**documents** - Documents PDF
```sql
id, title, author, year, domain, abstract, file_path, uploaded_by, created_at
```

**document_chunks** - Chunks vectorisés (RAG)
```sql
id, document_id, chunk_index, page_number, content, embedding[1536], created_at
```

**research_sessions** - Sessions de recherche
```sql
id, user_id, title, description, created_at
```

**conversations** - Conversations messaging
```sql
id, participant_one, participant_two, created_at
```

**messages** - Messages
```sql
id, conversation_id, sender_id, content, created_at
```

**user_roles** - Rôles utilisateurs
```sql
user_id, role (student/alumni/admin)
```

## 🔧 Scripts

```bash
# Développement
npm run dev              # Démarrer le serveur de dev

# Build
npm run build            # Build pour production
npm run preview          # Preview du build

# Linting
npm run lint             # ESLint

# Type checking
npm run type-check       # TypeScript check
```

## 🧪 Système RAG
- `npm run build` — génère la version de production dans le dossier `dist`.
- `npm run build:dev` — build en mode `development` (utile pour débogage de build).
- `npm run preview` — sert le build localement (après `npm run build`).
- `npm run lint` — lance ESLint sur le projet.

Exemples :

```bash
# développement
npm run dev

# build + aperçu
npm run build
npm run preview
```

Avec `pnpm` ou `bun` remplacez `npm run` par `pnpm run` ou `bun run` si vous préférez.

## Accéder à l'application

Après avoir lancé `npm run dev`, ouvrez votre navigateur à l'adresse :

```
http://localhost:5173
```

Vite indique dans la console l'URL exacte si un autre port est utilisé.

## Déploiement

La commande `npm run build` produit des fichiers statiques dans `dist` que vous pouvez déployer vers n'importe quel hébergeur statique (Netlify, Vercel, Surge, GitHub Pages, etc.). Pour une intégration simple avec Vercel ou Netlify, suivez leurs guides et pointez la publication sur le dossier `dist`.

## Configuration Supabase

Si l'application utilise Supabase, fournissez les variables d'environnement (voir plus haut). Les requêtes côté client nécessitent généralement :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Assurez-vous également de vérifier le fichier `supabase/config.toml` et les migrations présentes dans le dossier `supabase/migrations` pour comprendre le schéma attendu.

## Développement et architecture

- Framework : React + TypeScript
- Bundler : Vite
- UI : Tailwind CSS et composants `shadcn`/Radix
- Auth / BDD : Supabase (intégration présente dans `src/integrations/supabase`)

## Contribuer

Contributions bienvenues. Ouvrez une issue pour discuter des changements majeurs, puis un pull request. Respectez les règles de linting et le style TypeScript du projet.

## Licence

Ajoutez ici les informations de licence si nécessaire.

---

Si vous souhaitez que j'ajoute des instructions de déploiement spécifiques (Vercel, Netlify) ou un modèle `.env.example`, dites-le et je l'ajouterai.
