# 🏗️ DraftDeckAI System Architecture

## High-Level Architecture Overview

```mermaid
flowchart TD
  subgraph Client["Client Layer"]
    A[Web Browser]
    B[Mobile Device]
    C[Desktop App]
  end

  subgraph Edge["Edge Layer"]
    D[CDN<br/>Static Assets]
    E[Vercel/Netlify<br/>Edge Functions]
    F[Load Balancer]
  end

  subgraph App["Application Layer"]
    G[Next.js App<br/>Server Components]
    H[API Routes<br/>REST Endpoints]
    I[Middleware<br/>Auth & Routing]
  end

  subgraph Services["Services Layer"]
    J[AI Generation Service<br/>Qwen/Mistral/Gemini]
    K[Document Service<br/>PDF/PPTX/DOCX]
    L[Image Service<br/>Flux/NEBIUS]
    M[Stripe Service<br/>Payments]
  end

  subgraph Data["Data Layer"]
    N[(Supabase<br/>PostgreSQL)]
    O[(Redis Cache<br/>Sessions)]
    P[(S3 Storage<br/>Documents)]
  end

  A & B & C --> D
  D --> E
  E --> F
  F --> G & H & I
  H --> J & K & L & M
  G & H --> N & O & P

  classDef client fill:#3b82f6,stroke:#1e40af,color:#fff,stroke-width:2px
  classDef edge fill:#10b981,stroke:#047857,color:#fff,stroke-width:2px
  classDef app fill:#8b5cf6,stroke:#6d28d9,color:#fff,stroke-width:2px
  classDef services fill:#f59e0b,stroke:#b45309,color:#fff,stroke-width:2px
  classDef data fill:#ef4444,stroke:#991b1b,color:#fff,stroke-width:2px

  class A,B,C client
  class D,E,F edge
  class G,H,I app
  class J,K,L,M services
  class N,O,P data
```

## Component Architecture

```mermaid
flowchart LR
  subgraph Frontend["Frontend Components"]
    A[Pages<br/>/presentation<br/>/documents<br/>/dashboard]
    B[Components<br/>UI Library<br/>shadcn/ui]
    C[State Management<br/>Zustand<br/>React Query]
  end

  subgraph Backend["Backend Services"]
    D[API Routes<br/>/api/generate/*<br/>/api/export/*]
    E[AI Integrations<br/>Qwen<br/>Mistral<br/>Gemini]
    F[Export Engine<br/>PDF<br/>PPTX<br/>DOCX]
  end

  subgraph Database["Database Schema"]
    G[users<br/>profiles<br/>subscriptions]
    H[documents<br/>presentations<br/>versions]
    I[audit_logs<br/>usage_metrics]
  end

  Frontend --> Backend
  Backend --> Database

  classDef frontend fill:#3b82f6,stroke:#1e40af,color:#fff
  classDef backend fill:#10b981,stroke:#047857,color:#fff
  classDef database fill:#f59e0b,stroke:#b45309,color:#fff

  class A,B,C frontend
  class D,E,F backend
  class G,H,I database
```

## Data Flow Architecture

### Document Generation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API Route
    participant AI as AI Service
    participant DB as Database
    participant S3 as Storage

    U->>FE: Create Document Request
    FE->>API: POST /api/generate/presentation
    API->>AI: Generate with Qwen/Mistral
    AI-->>API: Return Generated Content
    API->>DB: Save Document Metadata
    API->>S3: Store Document File
    S3-->>API: Return Storage URL
    API-->>FE: Return Document ID
    FE-->>U: Display Generated Document

    Note over U,S3: Total Time: ~15-30 seconds
    Note over AI: Models: Qwen, Mistral,<br/>Gemini, DeepSeek
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant Auth as Supabase Auth
    participant DB as Database
    participant Stripe as Stripe

    U->>FE: Sign Up / Login
    FE->>Auth: Authenticate Credentials
    Auth-->>FE: Return Session Token
    FE->>DB: Create/Update User Profile
    DB-->>FE: User Data
    FE->>Stripe: Check Subscription Status
    Stripe-->>FE: Subscription Data
    FE-->>U: Logged In Dashboard

    Note over U,Stripe: JWT Token stored<br/>in httpOnly cookie
    Note over DB: Row Level Security<br/>enabled
```

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ DOCUMENTS : creates
    USERS ||--o{ SUBSCRIPTIONS : has
    USERS ||--o{ AUDIT_LOGS : generates
    DOCUMENTS ||--o{ DOCUMENT_VERSIONS : has_versions
    DOCUMENTS ||--o{ SHARED_LINKS : can_share
    SUBSCRIPTIONS ||--o{ PAYMENT_HISTORY : has_transactions
    TEAMS ||--o{ TEAM_MEMBERS : contains
    TEAMS ||--o{ DOCUMENTS : owns

    USERS {
        uuid id PK
        string email
        string full_name
        timestamp created_at
    }

    DOCUMENTS {
        uuid id PK
        uuid user_id FK
        string title
        string type
        jsonb content
        timestamp created_at
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        string plan_type
        string stripe_customer_id
        timestamp created_at
    }

    TEAMS {
        uuid id PK
        string name
        uuid owner_id FK
    }
```

## AI Integration Architecture

```mermaid
flowchart TD
    subgraph Client["Client Request"]
        A[User Prompt]
        B[Generation Settings]
    end

    subgraph Orchestrator["AI Orchestrator"]
        C[Request Validator]
        D[Model Router]
        E[Rate Limiter]
    end

    subgraph Models["AI Models"]
        F[Qwen/Qwen3-Coder<br/>480B - Architecture]
        G[Mistral Large<br/>- Text Generation]
        H[Gemini Pro<br/>- Multi-modal]
        I[DeepSeek V3<br/>- Code Generation]
    end

    subgraph PostProcessing["Post Processing"]
        J[Response Parser]
        K[Content Validator]
        L[Format Normalizer]
    end

    A & B --> C
    C --> D
    D --> E
    E --> F & G & H & I
    F & G & H & I --> J
    J --> K
    K --> L

    classDef client fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef orchestrator fill:#10b981,stroke:#047857,color:#fff
    classDef models fill:#8b5cf6,stroke:#6d28d9,color:#fff
    classDef post fill:#f59e0b,stroke:#b45309,color:#fff

    class A,B client
    class C,D,E orchestrator
    class F,G,H,I models
    class J,K,L post
```

## Security Architecture

```mermaid
flowchart TD
    subgraph Perimeter["Security Perimeter"]
        A[WAF<br/>Web Application Firewall]
        B[DDoS Protection]
        C[Rate Limiting]
    end

    subgraph Auth["Authentication"]
        D[JWT Validation]
        E[Session Management]
        F[API Key Verification]
    end

    subgraph Authorization["Authorization"]
        G[RBAC<br/>Role-Based Access]
        H[RLS<br/>Row Level Security]
        I[Resource Ownership]
    end

    subgraph Data["Data Protection"]
        J[Encryption at Rest<br/>AES-256]
        K[Encryption in Transit<br/>TLS 1.3]
        L[Secrets Management<br/>Vault]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L

    classDef perimeter fill:#ef4444,stroke:#991b1b,color:#fff
    classDef auth fill:#f59e0b,stroke:#b45309,color:#fff
    classDef authz fill:#10b981,stroke:#047857,color:#fff
    classDef data fill:#3b82f6,stroke:#1e40af,color:#fff

    class A,B,C perimeter
    class D,E,F auth
    class G,H,I authorization
    class J,K,L data
```

## Deployment Architecture

```mermaid
flowchart LR
    subgraph CDN["Global CDN"]
        A[Cloudflare<br/>Edge Network]
        B[Static Assets<br/>Cached]
    end

    subgraph Compute["Compute Platform"]
        C[Vercel<br/>Serverless Functions]
        D[Netlify<br/>Edge Functions]
    end

    subgraph Database["Managed Database"]
        E[Supabase<br/>PostgreSQL]
        F[Read Replicas]
    end

    subgraph Storage["Object Storage"]
        G[AWS S3<br/>Documents]
        H[Image CDN<br/>Media Files]
    end

    subgraph Monitoring["Monitoring"]
        I[Vercel Analytics<br/>Performance]
        J[Sentry<br/>Error Tracking]
        K[Log Management<br/>Audit Logs]
    end

    A --> B
    B --> C & D
    C & D --> E & F
    C & D --> G & H
    C & D --> I & J & K

    classDef cdn fill:#10b981,stroke:#047857,color:#fff
    classDef compute fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef db fill:#f59e0b,stroke:#b45309,color:#fff
    classDef storage fill:#8b5cf6,stroke:#6d28d9,color:#fff
    classDef monitoring fill:#ef4444,stroke:#991b1b,color:#fff

    class A,B cdn
    class C,D compute
    class E,F db
    class G,H storage
    class I,J,K monitoring
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 18 + shadcn/ui
- **State**: Zustand + TanStack Query
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Diagrams**: Mermaid.js

### Backend
- **Runtime**: Node.js 20
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis (Upstash)
- **Storage**: AWS S3
- **Auth**: Supabase Auth

### AI/ML
- **Primary**: Qwen (Nebius)
- **Text**: Mistral Large
- **Multi-modal**: Gemini Pro
- **Code**: DeepSeek V3
- **Images**: Flux.1 (Nebius)

### DevOps
- **Hosting**: Vercel + Netlify
- **CDN**: Cloudflare
- **Monitoring**: Vercel Analytics + Sentry
- **CI/CD**: GitHub Actions

## Scalability Considerations

### Horizontal Scaling
- ✅ Stateless API functions
- ✅ Database connection pooling
- ✅ CDN for static assets
- ✅ Read replicas for database

### Vertical Scaling
- ✅ Serverless auto-scaling
- ✅ Database instance upgrades
- ✅ Cache layer for hot data

### Performance Optimization
- ✅ Edge caching
- ✅ Query optimization
- ✅ Lazy loading
- ✅ Code splitting

---

**Last Updated**: February 2026  
**Architecture Version**: 2.0.0
