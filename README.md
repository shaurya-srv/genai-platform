# 🛡️ NTRO | GenAI Content Transformation Platform

> **AI-powered content transformation engine with blockchain verification, 4-portal RBAC auth, TOTP MFA, DLP scanning, multi-signature approval, and SIEM integration.**

![Platform](https://img.shields.io/badge/Platform-Next.js_16-black?style=flat-square)
![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20Google%20OAuth%20%2B%20TOTP-green?style=flat-square)
![Blockchain](https://img.shields.io/badge/Blockchain-Hash--Chain-blue?style=flat-square)
![Security](https://img.shields.io/badge/Security-DLP%20%2B%20Threat%20%2B%20Prompt%20Injection-orange?style=flat-square)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Authentication & Portals](#authentication--portals)
- [Output Plugins](#output-plugins)
- [Security Pipeline](#security-pipeline)
- [Blockchain & Hash Chain](#blockchain--hash-chain)
- [API Reference](#api-reference)
- [File Downloads](#file-downloads)
- [SIEM Integration](#siem-integration)
- [Development](#development)

---

## 🎯 Overview

NTRO GenAI Platform transforms source content into multiple communication formats (LinkedIn, Twitter, Advisory, Presentation, Infographic, Video, Executive Summary, Crisis Response) with enterprise-grade security:

- **4-portal RBAC** — Operator, Approver, Admin, Auditor with separate JWT scopes
- **Google OAuth + TOTP MFA** — Two-factor authentication with QR code enrollment
- **Role levels** — Executive, Manager, Lead, Employee, Contractor, Intern
- **Hash-chain ledger** — SHA-256 prev_hash linking with per-user RSA keypair signatures
- **Separation of duties** — Submitters cannot approve their own content
- **Plugin architecture** — Add new output types without rewriting core engine
- **SIEM export** — CEF, JSON, CSV, Syslog formats for ArcSight, QRadar, Splunk, Elasticsearch

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

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables section below)
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the landing page.

### 4. Login

| Portal | URL | Username | Password |
|--------|-----|----------|----------|
| Operator | `/login?portal=operator` | `operator` | `operator123` |
| Approver | `/login?portal=approver` | `approver` | `approver123` |
| Admin | `/login?portal=admin` | `admin` | `admin123` |
| Auditor | `/login?portal=auditor` | `auditor` | `auditor123` |

Or click **"Sign in with Google"** on the login page (works in demo mode).

### 5. Production Build

```bash
npm run build
npm run start
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# ==================== AUTH ====================
# JWT signing secret (auto-generated if not set)
JWT_SECRET=your-secret-key-here

# ==================== GOOGLE OAUTH ====================
# Get these from https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# ==================== BLOCKCHAIN (Optional) ====================
# Ethereum RPC URL for production on-chain recording
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
CONTRACT_ADDRESS=0x...

# ==================== AI SERVICES (Optional) ====================
# For real LLM-powered transformations (currently uses rule-based transforms)
OPENAI_API_KEY=sk-...
```

### Variable Descriptions

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
│                     LANDING PAGE (/)                             │
│              Project overview + portal access                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    LOGIN (/login)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Google OAuth  │  │  Username +  │  │  TOTP MFA (QR Code)  │  │
│  │    Button     │  │   Password   │  │  Google Authenticator│  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ JWT (role + permissions encoded)
┌──────────────────────────▼──────────────────────────────────────┐
│                   DASHBOARD (/dashboard)                         │
│                                                                  │
│  OPERATOR          APPROVER          ADMIN           AUDITOR     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ 📝 Input │    │ 📊 Results│   │ 📝 Input │    │ 🔗 Chain │  │
│  │ 📊 Result│    │ 🛡️ Security│  │ 🔐 RBAC  │    │ 📋 Audit │  │
│  │ 🛡️ Secur │    │ ⛓️ Blockch │ │ 🧩 Plugins│   │ ⛓️ Block │  │
│  │ ⛓️ Block │    │ 📋 Audit  │    │ 📋 Audit │    └──────────┘  │
│  │ ✍️ Apprvl│    │ ✍️ Apprvl │    │ 🔗 Chain │                  │
│  └──────────┘    └──────────┘    │ ✍️ Apprvl │                  │
│                                   └──────────┘                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    API LAYER (9 endpoints)                       │
│  /api/auth  /api/transform  /api/blockchain  /api/approval      │
│  /api/upload  /api/hashchain  /api/rbac  /api/audit  /api/plugins│
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    SERVICE LAYER                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────┐  │
│  │Auth (JWT+ │ │ Transform │ │ HashChain │ │  Multi-Sig     │  │
│  │ Google +  │ │ Engine +  │ │ SHA-256   │ │  Approval      │  │
│  │ TOTP MFA) │ │ 8 Plugins │ │ prev_hash │ │  + Deadlines   │  │
│  └───────────┘ └───────────┘ └───────────┘ └────────────────┘  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────┐  │
│  │  RBAC     │ │ DLP +     │ │ SIEM      │ │  File Gen      │  │
│  │  11 Roles │ │ Threat +  │ │ Export    │ │  PPTX SRT SVG  │  │
│  │  20 Perms │ │ Compliance│ │ CEF/JSON  │ │  STIX/TAXII    │  │
│  └───────────┘ └───────────┘ └───────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Portals

### 4 Portal Roles

| Portal | Permissions | Cannot Do |
|--------|-------------|-----------|
| **Operator** 📝 | Submit content, select outputs, edit drafts | Approve, publish, manage users |
| **Approver** ✍️ | Review, approve/reject, add comments, publish | Submit new content |
| **Admin** 🖥️ | Manage users, roles, audit, plugins, config | Sign approvals (separation of duties) |
| **Auditor** 🔍 | Read-only: view chain, verify, export logs | Submit, edit, approve, modify anything |

### Authentication Methods

1. **Google OAuth** — Click "Sign in with Google" → redirects to Google → returns with user profile
2. **Username + Password** — Traditional credential login
3. **TOTP MFA** — After password, enter 6-digit code from Google Authenticator

### Role Levels

| Level | Access | Icon |
|-------|--------|------|
| Executive | Full system access | 👔 |
| Manager | Approve, manage, audit | 📋 |
| Team Lead | Approve, review | ⭐ |
| Employee | Submit, edit, view | 👤 |
| Contractor | Submit, limited view | 🤝 |
| Intern | Read-only | 🎓 |

### Separation of Duties

The system enforces that **a submitter cannot approve their own content**. If user A submits content, user A cannot also approve it — a different approver identity is required. Violations are recorded on the hash chain.

---

## 🧩 Output Plugins

Each output type is a self-contained plugin with its own transform function and metadata.

| Plugin | Category | Icon | Description |
|--------|----------|------|-------------|
| Video Package | media | 🎬 | Script, storyboard, subtitles, narration |
| LinkedIn Post | social | 💼 | Professional post with hashtags |
| Twitter/X Post | social | 🐦 | Platform-optimized tweets/threads |
| Advisory | document | 📋 | Structured security advisory |
| Infographic | media | 📊 | Layout JSON + SVG visual |
| Executive Summary | document | 👔 | Concise executive briefing |
| Presentation | document | 📽️ | Slides with speaker notes |
| Crisis Response | crisis | 🚨 | Crisis communication workflow |

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
- Direct prompt overrides (`ignore previous instructions`)
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
  "actorId": "ap-001",
  "actorName": "Senior Reviewer",
  "actorRole": "APPROVER",
  "contentHash": "sha256...",
  "prevHash": "merkleRoot of previous block",
  "merkleRoot": "sha256 of all block fields",
  "signature": "HMAC-SHA256 using actor's private key",
  "timestamp": 1693000000000
}
```

### Per-User RSA Keypairs
- Generated at account creation
- Public key stored server-side
- Private key used to sign approvals
- Signatures are HMAC-SHA256 tied to specific identities

### Chain Verification
- Auditor portal verifies entire chain integrity
- Recomputes all hashes and checks prev_hash links
- Flags any broken link or tampered block

---

## 📡 API Reference

### Auth API — `/api/auth`

| Method | Action | Description |
|--------|--------|-------------|
| POST | `login` | Username + password + portal login |
| POST | `google_login` | Google OAuth (demo mode) |
| POST | `verify_mfa` | Verify TOTP code during login |
| POST | `start_mfa_enrollment` | Generate TOTP secret + QR code |
| POST | `verify_mfa_enrollment` | Verify first TOTP code to activate MFA |
| POST | `update_role` | Change user's portal role and level |
| GET | `action=users` | List all users |
| GET | `action=totp_remaining` | Seconds until TOTP code refreshes |

### Transform API — `/api/transform`

| Method | Action | Description |
|--------|--------|-------------|
| POST | `sanitize` | Prompt injection scan |
| POST | `dlp_scan` | Data loss prevention scan |
| POST | `threat_analysis` | Security threat analysis |
| POST | `compliance_check` | Regulatory compliance check |
| POST | `transform` | Generate all selected outputs |
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
| GET | `action=verify` | Run integrity verification |
| GET | `action=stats` | Chain statistics |

### Plugin API — `/api/plugins`

| Method | Action | Description |
|--------|--------|-------------|
| POST | `toggle` | Enable/disable a plugin |
| GET | `action=list` | List all plugins |
| GET | `action=categories` | List categories with counts |
| GET | `action=stats` | Plugin statistics |

---

## 📥 File Downloads

| Output Type | File Format | Download Button |
|-------------|-------------|-----------------|
| Presentation | PPTX (OOXML) | 📥 PPTX |
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

Export endpoint: `GET /api/audit?action=export&format=json|riskLevels=HIGH`

---

## 🛠️ Development

### Project Structure

```
genai-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── dashboard/page.tsx    # Main dashboard (all tabs)
│   │   ├── login/                # Login portal
│   │   ├── verify/               # Content verification
│   │   └── api/                  # 9 API endpoints
│   │       ├── auth/             # Auth (JWT, Google, TOTP)
│   │       ├── transform/        # Content transformation
│   │       ├── blockchain/       # Blockchain operations
│   │       ├── hashchain/        # Hash-chain ledger
│   │       ├── approval/         # Multi-sig approval
│   │       ├── upload/           # File upload + URL fetch
│   │       ├── rbac/             # Role-based access control
│   │       ├── audit/            # Audit trail + SIEM export
│   │       └── plugins/          # Plugin management
│   ├── lib/
│   │   ├── auth.ts               # Auth system (JWT, Google, TOTP)
│   │   ├── totp.ts               # RFC 6238 TOTP implementation
│   │   ├── qr-code.ts            # QR code SVG generator
│   │   ├── hashchain.ts          # Hash-chain ledger
│   │   ├── blockchain.ts         # Blockchain service
│   │   ├── rbac.ts               # RBAC (11 roles, 20 permissions)
│   │   ├── multisig.ts           # Multi-signature approval
│   │   ├── transformer.ts        # Content transformation engine
│   │   ├── output-plugins.ts     # Plugin architecture (8 plugins)
│   │   ├── file-generators.ts    # PPTX, SRT, SVG, STIX generators
│   │   ├── dlp-scanner.ts        # Data loss prevention
│   │   ├── threat-analyzer.ts    # Threat analysis
│   │   ├── compliance-checker.ts # Compliance checking
│   │   ├── prompt-guard.ts       # Prompt injection defense
│   │   ├── siem-export.ts        # SIEM export (CEF/JSON/CSV/Syslog)
│   │   ├── audit-tracker.ts      # Audit logging
│   │   ├── impact-metrics.ts     # Impact metrics
│   │   └── translation.ts        # Translation service
│   └── contracts/
│       └── ContentVerification.sol # Solidity smart contract
├── package.json
├── tsconfig.json
└── .env.local                    # Environment variables (not committed)
```

### Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Features

1. **New output type** → Register a plugin in `src/lib/output-plugins.ts`
2. **New API endpoint** → Add route in `src/app/api/<name>/route.ts`
3. **New security check** → Add scanner in `src/lib/` and wire into transform pipeline
4. **New audit event** → Add type to `AuditEventType` in `src/lib/audit-tracker.ts`

---

## 📄 License

MIT — Built for Smart India Hackathon 2.0 (Blockchain & Cybersecurity theme)
