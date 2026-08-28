# 🛡️ Freebuff | GenAI Content Transformation Platform

> **AI-powered content transformation engine with blockchain verification, DLP scanning, multi-signature approval, and compliance checking.**

![Platform](https://img.shields.io/badge/Platform-Next.js-black?style=flat-square)
![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-blue?style=flat-square)
![Security](https://img.shields.io/badge/Security-DLP%20%2B%20Threat%20Analysis-green?style=flat-square)
![Compliance](https://img.shields.io/badge/Compliance-DPDP%20%2B%20IT%20Act%20%2B%20GDPR-orange?style=flat-square)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [API Reference](#api-reference)
- [Output Formats](#output-formats)
- [Security Pipeline](#security-pipeline)
- [Blockchain Integration](#blockchain-integration)
- [Usage Examples](#usage-examples)

---

## 🎯 Overview

Freebuff is an intelligent platform that transforms source content into various communication deliverables through a configurable interface. Designed for organizations like NTRO that handle sensitive data requiring secure, auditable content transformation.

### Problem It Solves
- Manual content transformation is time-consuming and error-prone
- No centralized tracking of who accessed what content
- Risk of sensitive data leaks during transformation
- Need for multi-party approval before publishing

### Solution
An AI-powered platform that automates content transformation while ensuring security through blockchain verification, DLP scanning, compliance checking, and multi-signature approval workflows.

---

## ✨ Key Features

### Content Transformation
| Output Type | Description |
|-------------|-------------|
| 🎬 **Video Package** | Complete video script, storyboard, scene descriptions, narration, subtitles, visual recommendations |
| 💼 **LinkedIn Post** | Professional post with hashtags, engagement tips, and audience targeting |
| 🐦 **Twitter/X Post** | Platform-optimized tweets and tweet threads |
| 📋 **Advisory** | Structured security advisory document |
| 📊 **Infographic** | Infographic content, layout recommendations, key messaging |
| 👔 **Executive Summary** | Concise executive briefing |
| 📽️ **Presentation** | Presentation slides with speaker notes |
| 🚨 **Crisis Response** | Crisis communication workflow automation |

### Security & Compliance
- 🔍 **DLP Scanner** - Detects PII, credentials, classified data, financial info
- 🛡️ **Threat Analysis** - Identifies phishing, data exfiltration, insider threats
- 📋 **Compliance Checker** - Validates against IT Act 2000, DPDP Act 2023, GDPR, SOC2, ISO 27001
- ⛓️ **Blockchain Verification** - Immutable transformation records on Ethereum
- ✍️ **Multi-Signature Approval** - Role-based sign-off workflow
- 📊 **Audit Trail** - Complete centralized tracking of all activities
- 🎤 **Voice Input** - Speak content instead of typing
- 🌐 **Translation** - Multi-language transformation (24+ languages)
- 📈 **Impact Metrics** - Measure communication effectiveness

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (Next.js)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Input   │ │ Results  │ │ Security │ │  Blockchain  │  │
│  │ Dashboard│ │  Panel   │ │  Panel   │ │  Verification│  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
└───────┼──────────────┼──────────────┼──────────────┼─────────┘
        │              │              │              │
   ┌────▼──────────────▼──────────────▼──────────────▼────────┐
   │                 API LAYER (Next.js Routes)                │
   │  /api/transform  /api/blockchain  /api/audit  /api/approval│
   └────┬──────────────┬──────────────┬──────────────┬────────┘
        │              │              │              │
   ┌────▼────┐  ┌──────▼──────┐  ┌───▼────┐  ┌─────▼──────┐
   │Content  │  │  Security   │  │Blockchain│  │ Multi-Sig  │
   │Transform│  │  Pipeline   │  │  Engine  │  │  Approval  │
   │ Engine  │  │             │  │         │  │  Workflow  │
   └─────────┘  │• DLP Scan   │  │• Record │  │            │
                │• Threat     │  │• Verify │  │• Request   │
                │  Analysis   │  │• Audit  │  │• Vote      │
                │• Compliance │  │• Publish│  │• Approve   │
                └─────────────┘  └─────────┘  └────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Node.js |
| Blockchain | Ethereum (Solidity Smart Contracts), Ethers.js |
| Security | Custom DLP Scanner, Threat Analyzer, Compliance Checker |
| Styling | Custom CSS (Dark Cybersecurity Theme) |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ (recommended: v20.x)
- npm 10+
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/genai-platform.git
cd genai-platform

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

### Development Server
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Environment Variables (Optional)
Create a `.env.local` file:
```env
# Ethereum RPC URL (for production blockchain integration)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY

# Smart Contract Address (deployed contract)
CONTRACT_ADDRESS=0x...

# API Keys (for translation, AI services)
OPENAI_API_KEY=sk-...
GOOGLE_TRANSLATE_KEY=...
```

---

## 📡 API Reference

### POST `/api/transform`
Content transformation and security scanning.

**Actions:**
- `dlp_scan` - Scan content for sensitive data
- `threat_analysis` - Analyze content for security threats
- `compliance_check` - Check regulatory compliance
- `transform` - Transform content to selected formats
- `translate` - Translate content to target language
- `impact_metrics` - Generate impact metrics

**Example:**
```json
POST /api/transform
{
  "action": "transform",
  "content": "Your source content here...",
  "config": {
    "outputTypes": ["linkedin", "twitter", "presentation"],
    "targetAudience": "CISOs",
    "tone": "formal",
    "language": "en",
    "detailLevel": "standard"
  }
}
```

### POST `/api/blockchain`
Blockchain operations.

**Actions:**
- `record` - Record transformation on-chain
- `verify` - Verify transformation authenticity
- `add_badge` - Add compliance badge
- `approval` - Record approval vote
- `publish` - Mark output as published

### GET `/api/audit`
Audit trail and compliance reporting.

**Actions:**
- `all` - Get all audit records
- `stats` - Get statistics
- `target` - Get records for target
- `high-risk` - Get high-risk records
- `alerts` - Get active alerts
- `compliance-report` - Generate compliance report

### POST `/api/approval`
Multi-signature approval workflow.

**Actions:**
- `create` - Create approval request
- `approve` - Submit approval vote

---

## 📤 Output Formats

### 🎬 Video Package
Generates:
- Complete video script with scene breakdowns
- Storyboard descriptions
- Narration text
- Subtitles with timecodes
- Visual recommendations

### 💼 LinkedIn Post
Generates:
- Professional post content
- Relevant hashtags
- Engagement tips
- Best posting times

### 🐦 Twitter/X Thread
Generates:
- Thread-optimized tweets
- Character count management
- Hashtag suggestions
- Engagement strategies

### 📋 Advisory
Generates:
- Structured advisory document
- Executive summary
- Key findings
- Impact assessment
- Recommended actions

### 📊 Infographic
Generates:
- Layout recommendations
- Section-by-section content
- Color scheme suggestions
- Data visualization tips

### 👔 Executive Summary
Generates:
- Concise briefing format
- Key findings
- Recommendations
- Impact analysis

### 📽️ Presentation
Generates:
- Slide-by-slide content
- Speaker notes
- Design guide
- Layout recommendations

### 🚨 Crisis Response
Generates:
- Situation overview
- Stakeholder notification matrix
- Escalation matrix
- Media talking points
- Communication templates

---

## 🔒 Security Pipeline

Every content transformation goes through a 6-stage security pipeline:

```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  DLP    │───▶│ Threat  │───▶│Compliance│───▶│Content   │───▶│Blockchain│───▶│Multi-Sig │
│ Scanner │    │Analysis │    │ Checker  │    │Transform │    │ Record   │    │ Approval │
└─────────┘    └─────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
  Detect         Identify       Validate        Generate        Immutable      Require
  sensitive      security       regulatory      output          verification   authorized
  data           threats        compliance      formats         on-chain       sign-off
```

### DLP Scanner Detects:
- 🔴 Aadhaar Numbers, PAN Numbers
- 🔴 Credit Card Numbers, Bank Accounts
- 🔴 Passwords, API Keys, Private Keys
- 🟡 Email Addresses, Phone Numbers
- 🟡 Internal URLs, IP Addresses
- 🟡 TOP SECRET, SECRET, RESTRICTED classifications

### Threat Analysis Detects:
- Phishing language patterns
- Data exfiltration indicators
- Privileged access abuse
- Social engineering tactics
- Compliance risks
- Reputational risks

### Compliance Frameworks:
- 🇮🇳 IT Act 2000 (India)
- 🛡️ DPDP Act 2023 (Digital Personal Data Protection)
- 🇪🇺 GDPR (EU General Data Protection)
- 🔒 SOC 2 Trust Service Criteria
- 📋 ISO 27001 Annex A Controls
- ✅ Content Safety Standards

---

## ⛓️ Blockchain Integration

### Smart Contract Features
- **Content Hash Recording** - SHA-256 hashes of source and output
- **Compliance Badges** - On-chain compliance certifications
- **Approval Chain** - Multi-party sign-off on-chain
- **Audit Trail** - Complete immutable activity log
- **Publish Prevention** - Prevents duplicate publication
- **Verification** - Verify transformation authenticity

### Verification Page
Navigate to `/verify` to verify any transformation's authenticity by entering its ID.

---

## 🔐 Multi-Signature Approval

| Output Type | Required Approvals | Deadline |
|-------------|-------------------|----------|
| LinkedIn/Twitter/Infographic | 1 (Content Manager) | 24 hours |
| Video/Presentation | 2 (Security + Content) | 48 hours |
| Executive Summary | 2 (Security + Executive) | 48 hours |
| Advisory | 3 (Security + Compliance + Executive) | 72 hours |
| Crisis Response | 4 (Security + Compliance + Executive + Legal) | 4 hours |

### Approval Roles:
- ✍️ Content Creator
- 🛡️ Security Officer
- 📋 Compliance Officer
- 📝 Content Manager
- 👔 Executive
- ⚖️ Legal Counsel
- 🔐 Data Protection Officer
- 🖥️ System Admin

---

## 📊 Impact Metrics

The platform generates impact reports including:
- **Content Quality** - Readability score, word count, reading level
- **Reach Potential** - Estimated impressions, best posting times
- **Engagement Prediction** - Engagement rate, virality score
- **SEO Metrics** - Keyword density, heading structure
- **Accessibility Score** - Content accessibility rating

---

## 📁 Project Structure

```
genai-platform/
├── src/
│   ├── app/                      # Next.js pages
│   │   ├── page.tsx             # Main dashboard
│   │   ├── layout.tsx           # Root layout
│   │   ├── globals.css          # Global styles
│   │   ├── verify/              # Blockchain verification page
│   │   │   └── page.tsx
│   │   └── api/                 # API routes
│   │       ├── transform/       # Content transformation
│   │       ├── blockchain/      # Blockchain operations
│   │       ├── audit/           # Audit trail
│   │       └── approval/        # Multi-sig approval
│   ├── lib/                     # Core libraries
│   │   ├── transformer.ts      # Content transformation engine
│   │   ├── blockchain.ts       # Blockchain verification service
│   │   ├── dlp-scanner.ts      # Data Loss Prevention scanner
│   │   ├── threat-analyzer.ts  # Threat analysis engine
│   │   ├── compliance-checker.ts # Compliance validation
│   │   ├── multisig.ts         # Multi-signature approval
│   │   ├── audit-tracker.ts    # Centralized audit trail
│   │   ├── translation.ts      # Multi-language support
│   │   └── impact-metrics.ts   # Impact measurement
│   └── contracts/               # Smart contracts
│       └── ContentVerification.sol
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 🎬 Demo Workflow

1. **Input Content** → Paste source text, select output formats, configure options
2. **Security Scan** → DLP detects sensitive data, threat analysis checks for risks
3. **Compliance Check** → Validates against IT Act, DPDP, GDPR regulations
4. **Transformation** → Generates all selected output formats
5. **Blockchain Record** → Transformation recorded with hashes on-chain
6. **Approval** → Multi-signature approval from required roles
7. **Publish** → After verification and approval, safe to publish externally

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🏢 Organization

**National Technical Research Organisation (NTRO)**
- Problem Statement: Gen AI Platform for Automated Content Transformation
- Category: Software
- Theme: Blockchain & Cybersecurity
- PS Number: SIH26154

---

*Built with ❤️ for Smart India Hackathon 2.0*
