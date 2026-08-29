# 🛡️ NTRO | GenAI Content Transformation Platform

> **AI-powered content transformation engine for the National Technical Research Organisation with blockchain verification, 4-tier security hierarchy, dual Google+Org ID authentication, and 8 integrated security modules.**

![Platform](https://img.shields.io/badge/Platform-Next.js_16-black?style=flat-square)
![Auth](https://img.shields.io/badge/Auth-Google%20OAuth%20%2B%20Org%20ID%20%2B%20TOTP-green?style=flat-square)
![Security](https://img.shields.io/badge/Hierarchy-4%20Tiers%20%2F%209%20Ranks-blue?style=flat-square)
![Modules](https://img.shields.io/badge/Modules-8%20Integrated-orange?style=flat-square)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Authentication Flow](#-authentication-flow)
- [4-Tier Security Hierarchy](#-4-tier-security-hierarchy)
- [8 Platform Modules](#-8-platform-modules)
- [Output Plugins](#-output-plugins)
- [Security Pipeline](#-security-pipeline)
- [Blockchain & Hash Chain](#-blockchain--hash-chain)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Development](#-development)

---

## 🎯 Overview

NTRO GenAI Platform transforms source content into multiple communication formats (LinkedIn, Twitter/X, Advisory, Presentation, Infographic, Video, Executive Summary, Crisis Response) with enterprise-grade security.

**Built for Smart India Hackathon 2.0** — Blockchain & Cybersecurity theme.

### Key Features

- **Dual Authentication** — Google OAuth (identity) + Org ID/Password (authorization), both required
- **4-Tier NTRO Hierarchy** — Chairman → Scientist G → Scientist D → General Scientist
- **8 Platform Modules** — Transformation AI, Multi-Sign Approval, Analysis, Threat, Compliance, DLP, Incident Response, External Linkage
- **Rank-Based Access** — Higher ranks see more sections; restricted sections locked for lower ranks
- **Hash-Chain Ledger** — SHA-256 prev_hash linking with per-user RSA keypair signatures
- **Separation of Duties** — Submitters cannot approve their own content
- **Plugin Architecture** — Add new output types without rewriting the core engine
- **SIEM Export** — CEF, JSON, CSV, Syslog formats for ArcSight, QRadar, Splunk, Elasticsearch

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (recommended: v20.x)
- **npm 10+**
- **Git**

### 1. Clone & Install

```bash
git clone https://github.com/shaurya-srv/genai-platform.git
cd genai-platform
npm install
```

> **Note:** If `npm install` fails with engine warnings, use `npm install --force`.

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables section)
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the NTRO landing page.

### 4. Login

**Both Google OAuth AND Org ID credentials are required to sign in.**

| Account | Username | Password | Tier | Rank |
|---------|----------|----------|------|------|
| Chairman | `chairman` | `ntro123` | Level 1 - Executive | Chairman |
| Scientist G | `scientist_g` | `ntro123` | Level 2 - Senior | Scientist G |
| Scientist D | `scientist_d` | `ntro123` | Level 3 - Middle | Scientist D |
| General Scientist | `scientist` | `ntro123` | Level 4 - General | General Scientist |

### 5. Production Build

```bash
npm run build
npm run start
```

---

## 🔐 Authentication Flow

The platform uses a **dual-authentication** model — both steps must be completed to enter:

```
┌─────────────────────────────────────────┐
│         🛡️ NTRO GenAI Platform          │
│           Secure Access Portal           │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  🔗 Sign in with Google            │  │  ← Step 1: Identity verification
│  │     [Google SVG icon]              │  │     Records Google account
│  └────────────────────────────────────┘  │
│                                          │
│  ─── then sign in with ───               │  ← Divider
│       org credentials                    │
│                                          │
│  Organization ID: [______________]       │  ← Step 2: Authorization
│  Password:        [••••••••••••]        │     Server-stored credentials
│                                          │
│  [ Sign In to Platform ]                 │  ← Disabled until Google verified
│                                          │
│  ● Google Pending   ● Creds Pending     │  ← Status indicators
└─────────────────────────────────────────┘
```

**Why dual auth?**
- **Google OAuth** proves *who you are* (identity)
- **Org ID/Password** proves *you belong here* (authorization)
- Together: verified identity + verified organization membership
- TOTP MFA adds a third factor for senior ranks

---

## 🏛️ 4-Tier Security Hierarchy

NTRO's organizational structure mapped to platform access:

### Level 1 — Executive & Scientific Leadership

| Rank | Access |
|------|--------|
| 🏛️ Chairman | Full system access — final approval authority, system configuration, all 8 sections |
| 🏆 Distinguished Scientist | Full system access — same as Chairman |
| ⭐ Outstanding Scientist | Full system access — same as Chairman |

### Level 2 — Senior Management

| Rank | Access |
|------|--------|
| 👔 Scientist G (Senior Director) | Most sections — Compliance, Incident Response, Approval + Level 3 sections |
| 📋 Scientist F (Joint Director) | Same as Scientist G |
| 📊 Scientist E (Deputy Director) | Same as Scientist G |

### Level 3 — Middle Management

| Rank | Access |
|------|--------|
| 📑 Scientist D (Senior Technical Lead) | Core sections — Transform, Approval, Analysis, Threat, DLP |
| 📁 Scientist C (Operational Manager) | Same as Scientist D |

### Level 4 — General Staff

| Rank | Access |
|------|--------|
| 🔬 General Scientist | Basic sections — Transform AI, Multi-Sign Approval, External Linkage only |

> **Higher ranks see everything lower ranks see, plus additional sections.**

---

## 🖥️ 8 Platform Modules

The dashboard presents 8 integrated modules with rank-based visibility:

| # | Module | Icon | Description | Min. Rank |
|---|--------|------|-------------|-----------|
| 1 | **Transformation AI** | 🤖 | Transform any source into multiple output formats | Level 4 |
| 2 | **Multi-Sign Approval** | ✍️ | Review queue with approve/reject before publication | Level 4 |
| 3 | **Analysis & Review** | 📊 | Consistency scoring, source validation, quality metrics | Level 3 |
| 4 | **Threat Analysis** | 🔍 | Misinformation detection, adversarial analysis, STIX/TAXII | Level 3 |
| 5 | **Compliance Check** | 📋 | DPDP Act, GDPR, IT Act automated verification | Level 2 |
| 6 | **DLP Scanner** | 🛡️ | PII detection, classification, auto-redaction | Level 3 |
| 7 | **Incident Response** | 🚨 | Cascading order flow for cyber incidents and data breaches | Level 2 |
| 8 | **External Linkage** | 🔗 | Email, LinkedIn, X (Twitter) integration with validation | Level 4 |

### Transformation AI — Input Sources

- 📝 Raw text / prompts
- 🔗 URL ingestion (fetches page content)
- 🎤 Voice input (browser speech recognition)
- 📁 File upload (PDF, DOCX, images)
- 🎲 Demo prompt generator (pre-loaded cybersecurity advisories)

### Output Formats

- 💼 LinkedIn Post
- 🐦 Twitter/X Thread
- 📋 Security Advisory
- 📊 Infographic (SVG)
- 👔 Executive Summary
- 📽️ Presentation (PPTX)
- 🎬 Video Script / Storyboard
- 🚨 Crisis Response

---

## 🧩 Output Plugins

Each output type is a self-contained plugin with its own transform function:

| Plugin | Category | Description |
|--------|----------|-------------|
| Video Package | media | Script, storyboard, subtitles, narration |
| LinkedIn Post | social | Professional post with hashtags |
| Twitter/X Post | social | Platform-optimized tweets/threads |
| Advisory | document | Structured security advisory (STIX/TAXII) |
| Infographic | media | Layout JSON + SVG visual |
| Executive Summary | document | Concise executive briefing |
| Presentation | document | OOXML PPTX slides with speaker notes |
| Crisis Response | crisis | Crisis communication workflow |

### Adding a New Plugin

```typescript
// In src/lib/output-plugins.ts — just register, no core changes needed
OutputPluginRegistry.register({
  id: 'email_campaign',
  name: 'Email Campaign',
  icon: '📧',
  description: 'HTML email newsletter',
  color: '#f97316',
  category: 'document',
  enabled: true,
  transform: (source, config) => ({
    type: 'email_campaign' as any,
    title: `Email: ${source.substring(0, 60)}`,
    content: generateEmailHTML(source, config),
    metadata: { format: 'HTML Email' },
  }),
});
```

---

## 🔒 Security Pipeline

Every transformation goes through 7 stages:

```
Stage 0: 🛡️ Prompt Injection Defense — Sanitize inputs
Stage 1: 🔍 DLP Scan — Detect PII, credentials, classified data
Stage 2: 🛡️ Threat Analysis — Identify phishing, exfiltration, insider threats
Stage 3: 📋 Compliance Check — Validate IT Act, DPDP, GDPR, SOC2, ISO 27001
Stage 4: ⚡ Content Transformation — Generate all selected outputs
Stage 5: ⛓️ Hash-Chain Record — Immutable blockchain entry
Stage 6: ✍️ Multi-Signature Approval — Role-based sign-off before publication
```

### DLP Scanner Detects

- 🔴 Aadhaar Numbers, PAN Numbers, Credit Cards
- 🔴 Passwords, API Keys, Private Keys, SSH Keys
- 🟡 Email Addresses, Phone Numbers, IP Addresses
- 🟡 Internal URLs, File Paths, Database Connection Strings

### Prompt Injection Defense

- Direct prompt overrides ("ignore previous instructions")
- System prompt leakage attempts
- Persona hijacking
- Data exfiltration patterns
- Code injection in content
- Delimiter attacks and encoding evasion

---

## ⛓️ Blockchain & Hash Chain

### Permissioned Hash-Chain Ledger

Every event is stored as a block with SHA-256 hash chaining:

```json
{
  "blockId": "a1b2c3...",
  "blockNumber": 42,
  "eventType": "APPROVAL",
  "actorId": "chairman",
  "actorName": "Chairman",
  "actorRole": "OPERATOR",
  "contentHash": "sha256...",
  "prevHash": "merkleRoot of previous block",
  "merkleRoot": "sha256 of all block fields",
  "signature": "HMAC-SHA256 using actor's private key",
  "timestamp": 1693000000000
}
```

### Chain Verification

- Auditor portal verifies entire chain integrity
- Recomputes all hashes and checks prev_hash links
- Flags any broken link or tampered block

---

## 📡 API Reference

### Auth API — `/api/auth`

| Method | Action | Description |
|--------|--------|-------------|
| POST | `login` | Org ID + password login |
| POST | `google_login` | Google OAuth (demo mode) |
| POST | `verify_mfa` | Verify TOTP code |
| POST | `start_mfa_enrollment` | Generate TOTP secret + QR code |
| POST | `verify_mfa_enrollment` | Activate TOTP MFA |
| POST | `update_role` | Change user's rank and role |
| GET | `action=users` | List all users |

### Transform API — `/api/transform`

| Method | Action | Description |
|--------|--------|-------------|
| POST | `transform` | Generate all selected outputs |
| POST | `sanitize` | Prompt injection scan |
| POST | `dlp_scan` | Data loss prevention scan |
| POST | `threat_analysis` | Security threat analysis |
| POST | `compliance_check` | Regulatory compliance check |
| POST | `generate_pptx` | Generate PPTX slide data |
| POST | `generate_srt` | Generate SRT subtitle file |
| POST | `generate_infographic` | Generate SVG infographic |
| POST | `generate_stix` | Generate STIX 2.1 bundle |

### Hash Chain API — `/api/hashchain`

| Method | Action | Description |
|--------|--------|-------------|
| POST | `append` | Add new block to chain |
| POST | `verify` | Verify entire chain integrity |
| GET | `action=chain` | Get all blocks |
| GET | `action=stats` | Chain statistics |

### Plugin API — `/api/plugins`

| Method | Action | Description |
|--------|--------|-------------|
| POST | `toggle` | Enable/disable a plugin |
| GET | `action=list` | List all plugins |
| GET | `action=categories` | List categories with counts |

---

## 📥 File Downloads

| Output Type | File Format | Download Button |
|-------------|-------------|-----------------|
| Presentation | PPTX (OOXML ZIP) | 📥 PPTX |
| Video Package | SRT subtitles | 📥 SRT |
| Infographic | SVG visual | 📥 SVG |
| Advisory | STIX 2.1 JSON | 📥 STIX |

---

## 📤 SIEM Integration

Export audit logs in SIEM-compatible formats:

| Format | Compatible SIEMs | Use Case |
|--------|-----------------|----------|
| **JSON** | Elasticsearch, Logstash, Splunk HEC, Sentinel | Structured ingestion |
| **CEF** | ArcSight, QRadar, Splunk (CEF) | Syslog-compatible |
| **CSV** | Compliance reporting, Excel | Spreadsheet analysis |
| **Syslog** | Fluentd, rsyslog, syslog-ng | Log forwarding |

Export endpoint: `GET /api/audit?action=export&format=json&riskLevels=HIGH`

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# ==================== AUTH ====================
JWT_SECRET=your-secret-key-here

# ==================== GOOGLE OAUTH ====================
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# ==================== BLOCKCHAIN (Optional) ====================
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
CONTRACT_ADDRESS=0x...

# ==================== AI SERVICES (Optional) ====================
OPENAI_API_KEY=sk-...
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | No | Auto-generated | Secret key for JWT token signing |
| `GOOGLE_CLIENT_ID` | No | Demo mode | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Demo mode | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | No | `http://localhost:3000/api/auth/google/callback` | OAuth callback URL |
| `ETHEREUM_RPC_URL` | No | Simulated | Ethereum RPC endpoint |
| `CONTRACT_ADDRESS` | No | None | Deployed smart contract address |
| `OPENAI_API_KEY` | No | Rule-based | OpenAI API key for LLM transforms |

> **Note:** The platform works fully without any environment variables. Google OAuth falls back to demo mode, and blockchain uses in-memory simulation.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ LANDING PAGE (/)                                                │
│ NTRO branding + 8 module previews + 4-tier hierarchy            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ LOGIN (/login)                                                  │
│ ┌──────────────────────┐  ┌──────────────────────────────────┐  │
│ │ 🔗 Google OAuth       │  │ 📋 Org ID + Password             │  │
│ │ (Identity verification)│  │ (Authorization + role assignment)│  │
│ └──────────────────────┘  └──────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ 🔐 TOTP MFA (Google Authenticator) — optional for senior ranks││
│ └──────────────────────────────────────────────────────────────┘│
└──────────────────────────┬──────────────────────────────────────┘
                           │ JWT (role + rank + permissions encoded)
┌──────────────────────────▼──────────────────────────────────────┐
│ DASHBOARD (/dashboard) — 8 Sections with Rank-Based Visibility  │
│                                                                  │
│  🤖 Transform AI (all)    │  ✍️ Multi-Sign Approval (all)       │
│  📊 Analysis (L3+)        │  🔍 Threat Analysis (L3+)           │
│  📋 Compliance (L2+)      │  🛡️ DLP Scanner (L3+)              │
│  🚨 Incident Response (L2+)│  🔗 External Linkage (all)         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ API LAYER (9 endpoints)                                         │
│ /api/auth /api/transform /api/blockchain /api/approval          │
│ /api/upload /api/hashchain /api/rbac /api/audit /api/plugins    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ SERVICE LAYER                                                   │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────┐  │
│ │ Auth      │ │ Transform │ │ HashChain │ │ Multi-Sig      │  │
│ │ Google +  │ │ Engine +  │ │ SHA-256   │ │ Approval +     │  │
│ │ Org ID +  │ │ 8 Plugins │ │ prev_hash │ │ Deadlines      │  │
│ │ TOTP MFA  │ │           │ │           │ │                │  │
│ └───────────┘ └───────────┘ └───────────┘ └────────────────┘  │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────┐  │
│ │ RBAC      │ │ DLP +     │ │ SIEM      │ │ File Gen       │  │
│ │ 4 Tiers   │ │ Threat +  │ │ Export    │ │ PPTX SRT SVG   │  │
│ │ 9 Ranks   │ │ Compliance│ │ CEF/JSON  │ │ STIX/TAXII     │  │
│ └───────────┘ └───────────┘ └───────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Development

### Project Structure

```
genai-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page (NTRO overview)
│   │   ├── dashboard/page.tsx          # 8-section dashboard
│   │   ├── login/
│   │   │   ├── page.tsx                # Login entry (Suspense)
│   │   │   └── LoginPage.tsx           # Dual Google+Credentials auth
│   │   ├── verify/page.tsx             # Content verification
│   │   └── api/                        # 9 API endpoints
│   │       ├── auth/route.ts
│   │       ├── transform/route.ts
│   │       ├── blockchain/route.ts
│   │       ├── hashchain/route.ts
│   │       ├── approval/route.ts
│   │       ├── upload/route.ts
│   │       ├── rbac/route.ts
│   │       ├── audit/route.ts
│   │       └── plugins/route.ts
│   ├── components/
│   │   ├── AiPipeline.tsx
│   │   ├── ProcessingOverlay.tsx
│   │   ├── StepIndicator.tsx
│   │   └── ValidationBadges.tsx
│   └── lib/
│       ├── auth.ts                     # NTRO 9-rank hierarchy
│       ├── rbac.ts                     # Section-based permissions
│       ├── transformer.ts              # Content transformation engine
│       ├── output-plugins.ts           # 8 output type plugins
│       ├── context-engine.ts           # AI context extraction
│       ├── sample-data.ts              # 5 pre-loaded demo advisories
│       ├── pptx-generator.ts           # ZIP-based PPTX generation
│       ├── infographic-generator.ts    # SVG infographic renderer
│       ├── threat-analyzer.ts          # Threat analysis engine
│       ├── compliance-checker.ts       # DPDP/GDPR/IT Act checks
│       ├── dlp-scanner.ts              # Data Loss Prevention
│       ├── prompt-guard.ts             # Prompt injection defense
│       ├── hashchain.ts                # SHA-256 hash chain ledger
│       ├── multisig.ts                 # Multi-signature approval
│       ├── blockchain.ts               # On-chain recording
│       ├── siem-export.ts              # CEF/JSON/CSV/Syslog export
│       ├── audit-tracker.ts            # Event audit logging
│       ├── impact-metrics.ts           # Content impact scoring
│       ├── file-generators.ts          # PPTX/SVG/SRT/STIX file gen
│       ├── translation.ts              # Multi-language support
│       ├── qr-code.ts                  # QR code generation
│       └── totp.ts                     # TOTP MFA
├── .github/workflows/ci.yml            # GitHub Actions CI
├── .env.example                        # Environment variables template
├── package.json
├── tsconfig.json
└── next.config.mjs
```

### Scripts

```bash
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Adding New Features

1. **New output type** → Register a plugin in `src/lib/output-plugins.ts`
2. **New API endpoint** → Add route in `src/app/api/<name>/route.ts`
3. **New security check** → Add scanner in `src/lib/` and wire into transform pipeline
4. **New audit event** → Add type to `AuditEventType` in `src/lib/audit-tracker.ts`
5. **New dashboard section** → Add to `NTRO_SECTIONS` in `src/app/dashboard/page.tsx`

---

## 📄 License

MIT — Built for Smart India Hackathon 2.0 (Blockchain & Cybersecurity theme)
