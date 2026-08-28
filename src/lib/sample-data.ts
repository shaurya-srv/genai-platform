/**
 * Sample Data
 * Pre-loaded cybersecurity advisories and content for demos.
 * Each sample includes source content, expected outputs, and metadata.
 */

export interface SampleData {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  content: string;
  suggestedConfig: {
    audiences: string[];
    tone: string;
    detailLevel: string;
    objective: string;
    language: string;
  };
  suggestedOutputs: string[];
}

export const SAMPLE_DATA: SampleData[] = [
  {
    id: 'crowdstrike-outage',
    title: 'CrowdStrike Global IT Outage (July 2024)',
    category: 'Incident',
    icon: '🚨',
    description: 'A faulty CrowdStrike Falcon update caused widespread Windows BSOD crashes globally, affecting airlines, hospitals, banks, and government agencies.',
    content: `CRITICAL SECURITY ADVISORY — CrowdStrike Falcon Content Update Incident

Date: July 19, 2024
Severity: CRITICAL
Affected Systems: Windows endpoints running CrowdStrike Falcon sensor

INCIDENT SUMMARY:
A defective content update (Channel File 291) deployed by CrowdStrike to its Falcon sensor on Windows systems caused widespread system failures globally. The update contained a logic error that triggered a Windows kernel-mode crash (BSOD) on approximately 8.5 million endpoints worldwide.

IMPACT ASSESSMENT:
- 8.5 million Windows devices affected globally
- Airlines: Delta, United, American Airlines — all grounded flights temporarily
- Hospitals: Multiple healthcare systems reverted to paper records
- Banks: Transaction processing systems disrupted across 10+ countries
- Government: Emergency services, courts, and municipal systems offline
- Estimated economic impact: $10+ billion in damages

TECHNICAL ROOT CAUSE:
The CrowdStrike Falcon sensor update (CS-291) contained a configuration file update that triggered an out-of-bounds memory access in the Windows kernel (csagent.sys). This caused an immediate system crash before the OS could load error handling. The update was deployed to all channels simultaneously without staged rollout.

AFFECTED VERSIONS:
- CrowdStrike Falcon sensor versions 7.11 and above on Windows
- Windows 10, Windows 11, and Windows Server 2016/2019/2022

REMEDIATION STEPS:
1. Boot affected systems into Windows Safe Mode or Recovery Environment
2. Navigate to C:\\Windows\\System32\\drivers\\CrowdStrike\\
3. Delete the file matching "C-00000291*.sys"
4. Reboot the system
5. Prevent automatic sensor updates until CrowdStrike releases a patched version
6. For BitLocker-encrypted systems, have the recovery key available

CROWDSTRIKE RESPONSE:
- Deployed a corrected content update within 78 minutes
- CEO George Kurtz issued public statement confirming the issue is not a cyberattack
- Published remediation guide and script for enterprise customers
- Established a dedicated support portal for affected organizations

PREVENTION RECOMMENDATIONS:
- Implement staged/phased deployment policies for endpoint security updates
- Maintain offline recovery procedures for critical systems
- Test security updates in isolated environments before production deployment
- Ensure backup communication channels for incident response teams
- Review SLA agreements with security vendors for update quality guarantees

REGULATORY IMPLICATIONS:
- SEC reporting requirements for publicly traded companies affected
- GDPR notification may be required for EU entities with service disruptions
- Critical infrastructure sectors must file incident reports per CISA directives

This incident highlights the systemic risk of concentrated endpoint security dependencies and the need for robust update deployment governance.`,
    suggestedConfig: {
      audiences: ['executives', 'employees', 'technical'],
      tone: 'formal',
      detailLevel: 'detailed',
      objective: 'inform',
      language: 'en',
    },
    suggestedOutputs: ['executive_summary', 'advisory', 'crisis_response', 'linkedin', 'presentation'],
  },
  {
    id: 'vpn-vulnerability',
    title: 'Critical VPN Vulnerability — CVE-2024-38816',
    category: 'Threat Intel',
    icon: '🔓',
    description: 'VMware VPAN remote code execution vulnerability allowing unauthorized access to corporate networks.',
    content: `SECURITY ADVISORY: Critical VPN Vulnerability — CVE-2024-38816

Publication Date: August 2024
CVSS Score: 9.8/10 (CRITICAL)
Affected Product: VMware vCenter Server
CWE: CWE-918 (Server-Side Request Forgery)

VULNERABILITY OVERVIEW:
A critical server-side request forgery (SSRF) vulnerability has been identified in VMware vCenter Server that allows a malicious actor with network access to the vCenter Server management port to exploit the flaw and execute arbitrary commands with unrestricted privileges on the underlying operating system.

AFFECTED VERSIONS:
- VMware vCenter Server 8.0 before 8.0 U3
- VMware vCenter Server 7.0 before 7.0 U3s
- VMware Cloud Foundation 5.x before 5.1.1
- VMware Cloud Foundation 4.x before 4.4.1

EXPLOITATION STATUS:
- Proof-of-concept exploit code is publicly available
- Active exploitation observed in the wild by APT groups
- CISA has added CVE-2024-38816 to the Known Exploited Vulnerabilities (KEV) catalog
- Federal agencies must patch within 21 days per CISA BOD 22-01

ATTACK SCENARIOS:
1. Unauthenticated attacker sends crafted HTTP requests to vCenter Server
2. SSRF bypasses network segmentation controls
3. Attacker gains access to internal services and credentials
4. Lateral movement to ESXi hosts and virtual machines
5. Potential compromise of entire virtualized infrastructure

BUSINESS IMPACT:
- Complete compromise of virtualized infrastructure
- Access to all virtual machines hosted on affected vCenter servers
- Potential data exfiltration from thousands of virtual machines
- Ransomware deployment across entire data center
- Estimated remediation cost: $500K-$5M per organization depending on scale

IMMEDIATE ACTIONS REQUIRED:
1. IDENTIFY: Inventory all vCenter Server deployments and versions
2. PATCH: Update to patched versions immediately (8.0 U3, 7.0 U3s)
3. ISOLATE: If patching is delayed, restrict network access to vCenter management ports
4. MONITOR: Deploy detection rules for exploitation attempts
5. HUNT: Check logs for indicators of compromise (IOCs) provided by VMware

DETECTION INDICATORS:
- Unusual HTTP requests to vCenter Server management API
- Unexpected process execution on vCenter Server (bash, powershell)
- Unauthorized SSH connections to vCenter appliance
- Anomalous authentication events from unexpected source IPs

WORKAROUND (if patching is delayed):
- Restrict network access to vCenter management interface (port 443)
- Implement network segmentation between management and production networks
- Enable enhanced logging on vCenter Server
- Deploy WAF rules to block malicious SSRF payloads

VENDOR REFERENCES:
- VMware Security Advisory VMSA-2024-0019
- NIST NVD: CVE-2024-38816
- CISA KEV Catalog Entry

Share this advisory with all IT administrators and security teams immediately.`,
    suggestedConfig: {
      audiences: ['technical', 'employees'],
      tone: 'urgent',
      detailLevel: 'detailed',
      objective: 'alert',
      language: 'en',
    },
    suggestedOutputs: ['advisory', 'linkedin', 'twitter', 'executive_summary', 'video'],
  },
  {
    id: 'dpdp-compliance',
    title: 'India DPDP Act 2023 — Compliance Requirements',
    category: 'Policy',
    icon: '📋',
    description: 'Digital Personal Data Protection Act compliance requirements for Indian organizations handling citizen data.',
    content: `DIGITAL PERSONAL DATA PROTECTION ACT, 2023 — COMPLIANCE GUIDE

Effective Date: August 11, 2023 ( provisions to be notified in phases)
Applicable To: All organizations processing digital personal data of Indian citizens
Regulating Authority: Data Protection Board of India (DPBI)

EXECUTIVE SUMMARY:
The Digital Personal Data Protection Act (DPDP) 2023 establishes a comprehensive framework for protecting individuals' digital personal data rights while enabling lawful data processing. Organizations must comply with consent requirements, data fiduciary obligations, and cross-border transfer restrictions.

KEY DEFINITIONS:
- Data Principal: The individual to whom personal data relates (citizen/resident of India)
- Data Fiduciary: Entity that determines the purpose and means of processing
- Data Processor: Entity that processes data on behalf of a fiduciary
- Consent Manager: SEBI-registered entity that manages consent on behalf of data principals

CORE OBLIGATIONS FOR DATA FIDUCIARIES:

1. CONSENT REQUIREMENTS:
   - Free, specific, informed, unconditional, unambiguous consent
   - Consent must be verifiable and recorded
   - Right to withdraw consent at any time
   - Separate consent for each purpose
   - No consent for children under 18 without verifiable parental consent

2. NOTICE REQUIREMENTS:
   - Clear description of data being collected
   - Purpose of processing
   - Rights available to data principals
   - Grievance redressal mechanism details
   - Language must be clear and plain (available in 22 scheduled languages)

3. DATA MINIMIZATION:
   - Collect only data necessary for the specified purpose
   - Retain data only as long as necessary
   - Erase data after purpose is fulfilled

4. SECURITY SAFEGUARDS:
   - Implement reasonable security practices (ISO 27001, SOC2 recommended)
   - Encrypt personal data at rest and in transit
   - Access controls and authentication mechanisms
   - Regular security audits and penetration testing

5. BREACH NOTIFICATION:
   - Notify Data Protection Board within 72 hours of becoming aware
   - Notify affected data principals without delay
   - Document the nature, scope, and remediation of the breach

PENALTIES:
- Failure to take reasonable security safeguards: Up to ₹250 crore
- Failure to notify the Board and data principals: Up to ₹200 crore
- Non-compliance with obligations regarding children: Up to ₹200 crore
- Failure to comply with Board directions: Up to ₹50 crore

CROSS-BORDER DATA TRANSFER:
- Personal data may be transferred outside India unless restricted by government
- Government may restrict transfer to specific countries via notification
- Certain categories of data may require onshore processing

EXEMPTIONS:
- National security and public order
- Court orders and legal proceedings
- Medical emergencies
- Employment purposes (with safeguards)
- Research and statistics (with anonymization)

COMPLIANCE TIMELINE:
- Phase 1 (0-6 months): Appoint Data Protection Officer, establish grievance mechanism
- Phase 2 (6-12 months): Implement consent management, security safeguards
- Phase 3 (12-18 months): Complete data mapping, cross-border assessment
- Phase 4 (18-24 months): Full operational compliance, audit readiness

RECOMMENDED ACTIONS FOR NTRO:
1. Appoint a Data Protection Officer (DPO) with appropriate authority
2. Conduct a comprehensive data mapping exercise
3. Implement consent management platform for citizen data
4. Review and update data processing agreements with third parties
5. Establish breach notification procedures and timelines
6. Train all personnel on data protection obligations
7. Implement technical safeguards (encryption, access controls, DLP)
8. Conduct regular compliance audits and gap assessments`,
    suggestedConfig: {
      audiences: ['executives', 'employees', 'technical'],
      tone: 'formal',
      detailLevel: 'detailed',
      objective: 'inform',
      language: 'en',
    },
    suggestedOutputs: ['executive_summary', 'presentation', 'linkedin', 'advisory', 'infographic'],
  },
  {
    id: 'colonial-pipeline',
    title: 'Colonial Pipeline Ransomware Attack (2021)',
    category: 'Incident',
    icon: '🛢️',
    description: 'DarkSide ransomware attack that shut down the largest fuel pipeline in the US, causing fuel shortages across the East Coast.',
    content: `INCIDENT REPORT: Colonial Pipeline Ransomware Attack

Date: May 7-14, 2021
Severity: CRITICAL (National Infrastructure)
Attacker: DarkSide ransomware-as-a-service (RaaS)
Ransom Paid: $4.4 million (75 BTC)
Recovery Time: 6 days (pipeline operations), 2 weeks (full restoration)

EXECUTIVE SUMMARY:
On May 7, 2021, Colonial Pipeline, operator of the largest fuel pipeline system in the United States (47% of East Coast fuel supply), suffered a devastating ransomware attack by the DarkSide criminal group. The attack forced a complete shutdown of pipeline operations for 6 days, causing fuel shortages, panic buying, and a state of emergency declaration across 17 states.

ATTACK TIMELINE:
- April 2021: Initial access via compromised VPN credentials (single factor, no MFA)
- May 1, 2021: Lateral movement within IT network
- May 7, 2021: Ransomware deployed, pipeline IT systems encrypted
- May 7, 2021: Pipeline operations proactively shut down as a safety precaution
- May 8, 2021: FBI confirms DarkSide ransomware attack
- May 12, 2021: Ransom of $4.4 million paid (50% recovered by FBI)
- May 13, 2021: Pipeline operations restarted in stages
- May 14, 2021: Fuel delivery resumed to all markets
- May 19, 2021: Full operational restoration confirmed

TECHNICAL ANALYSIS:
- Initial Access: Compromised legacy VPN account credentials (no MFA enforced)
- Lateral Movement: Maze Spider RMM tool used for remote access
- Encryption: DarkSide ransomware (Windows-based, data exfiltration before encryption)
- Data Exfiltration: ~100 GB of data stolen before encryption
- OT/ICS Systems: Pipeline operational technology was NOT directly compromised
- Shutdown Decision: Precautionary — loss of visibility into fuel billing/inventory systems

FINANCIAL IMPACT:
- Ransom paid: $4.4 million (75 BTC at time of payment)
- FBI recovery: $2.3 million (63.75 BTC recovered)
- Revenue loss during 6-day shutdown: ~$25-30 million
- Emergency fuel procurement costs: ~$15 million
- Regulatory fines and investigations: ~$10 million (estimated)
- Total estimated impact: $50-75 million

NATIONAL IMPACT:
- Fuel shortages across 17 East Coast states
- State of emergency declared in 4 states
- Average gas prices rose 7% in one week
- Airline fuel reserves depleted at multiple airports
- 2,000+ gas stations ran out of fuel
- Americans lined up for hours to fill gas tanks

LESSONS LEARNED:
1. Single-factor authentication on internet-facing services is unacceptable
2. Legacy systems without MFA are high-risk entry points
3. Network segmentation between IT and OT environments is critical
4. Incident response plans must be tested and updated regularly
5. Ransomware payments fund criminal operations and may not guarantee recovery
6. Cyber insurance alone is insufficient — proactive defense is essential

RECOMMENDATIONS FOR CRITICAL INFRASTRUCTURE:
1. MANDATORY: Multi-factor authentication on all remote access
2. MANDATORY: Network segmentation between IT and OT/ICS environments
3. MANDATORY: Zero-trust architecture implementation
4. MANDATORY: Regular ransomware simulation exercises
5. RECOMMENDED: Backup and recovery testing (offline, immutable)
6. RECOMMENDED: 24/7 security operations center (SOC) monitoring
7. RECOMMENDED: Threat intelligence sharing with sector ISACs
8. RECOMMENDED: Incident response retainer with qualified IR firm

REGULATORY RESPONSE:
- TSA Security Directive Pipeline-2021-01 (June 2021)
- TSA Security Directive Pipeline-2021-02 (November 2021)
- CISA Colonial Pipeline Response Toolkit
- TSA Cybersecurity Implementation Plan for pipeline operators`,
    suggestedConfig: {
      audiences: ['executives', 'technical', 'employees'],
      tone: 'formal',
      detailLevel: 'detailed',
      objective: 'inform',
      language: 'en',
    },
    suggestedOutputs: ['executive_summary', 'crisis_response', 'advisory', 'presentation', 'linkedin', 'infographic'],
  },
  {
    id: 'covid-communication',
    title: 'COVID-19 Health Communication Strategy',
    category: 'Policy',
    icon: '🏥',
    description: 'Multi-channel government communication strategy for pandemic health guidelines and vaccination drives.',
    content: `NATIONAL COVID-19 COMMUNICATION STRATEGY
Ministry of Health & Family Welfare — Government of India

OBJECTIVE: Enable rapid, consistent, and accessible public health communication across all channels and languages during the pandemic response.

CONTEXT:
The COVID-19 pandemic required governments to communicate rapidly evolving health information to diverse populations across multiple languages, channels, and literacy levels. The same message needed to reach urban tech-savvy citizens and rural communities with limited internet access.

KEY CHALLENGES:
- Information changing daily (guidelines, restrictions, vaccination schedules)
- 22 scheduled languages + hundreds of dialects
- Urban vs rural information access gap
- Misinformation and infodemic management
- Vaccine hesitancy and safety concerns
- Economic impact communication (lockdowns, relief measures)

COMMUNICATION CHANNELS:
1. Digital: Website, mobile app (Aarogya Setu), social media (Twitter, Facebook, WhatsApp, Instagram)
2. Broadcast: TV (Doordarshan), Radio (All India Radio), Cable networks
3. Print: National and regional newspapers, government gazettes
4. Community: ASHA workers, Anganwadi workers, Panchayat officials
5. Emergency: SMS alerts, IVR systems, public address systems

MESSAGING FRAMEWORK:
- Tier 1 (National): Daily press briefings, weekly data dashboards
- Tier 2 (State): State-specific guidelines, local language communications
- Tier 3 (District): Community-level health advisories, vaccination drives
- Tier 4 (Village): Door-to-door awareness, wall paintings, folk media

VACCINATION COMMUNICATION:
Phase 1: Healthcare workers — Direct outreach via hospital networks
Phase 2: Elderly and comorbid — Community worker engagement, family counseling
Phase 3: General population — Mass media, celebrity endorsements, incentive programs
Phase 4: Children (15-18) — School-based communication, parental engagement

MISINFORMATION COUNTER-MEASURES:
- Dedicated fact-checking portal (factcheck.gov.in)
- Social media monitoring and rapid response team
- WhatsApp fact-check helpline
- Regional language myth-busting content
- Celebrity and influencer partnerships for accurate messaging

SUCCESS METRICS:
- Vaccination coverage: 2.1 billion doses administered
- Aarogya Setu downloads: 230+ million
- Daily reach through broadcast: 800+ million viewers
- Community worker engagement: 1+ million ASHA workers
- Social media engagement: 500M+ impressions monthly

LESSONS FOR FUTURE PANDEMICS:
1. Pre-position communication templates in all 22 scheduled languages
2. Establish permanent digital communication infrastructure
3. Train community health workers as first-line communicators
4. Build real-time misinformation monitoring capability
5. Create cross-platform content delivery system
6. Develop accessible formats (sign language, braille, audio) as standard

This communication framework can be adapted for other crisis scenarios including natural disasters, cybersecurity incidents, and public safety emergencies.`,
    suggestedConfig: {
      audiences: ['public', 'employees', 'technical'],
      tone: 'conversational',
      detailLevel: 'standard',
      objective: 'inform',
      language: 'en',
    },
    suggestedOutputs: ['infographic', 'linkedin', 'twitter', 'presentation', 'video', 'executive_summary'],
  },
];

/**
 * Get sample data by ID
 */
export function getSampleById(id: string): SampleData | undefined {
  return SAMPLE_DATA.find(s => s.id === id);
}

/**
 * Get all sample data for a category
 */
export function getSamplesByCategory(category: string): SampleData[] {
  return SAMPLE_DATA.filter(s => s.category.toLowerCase() === category.toLowerCase());
}

/**
 * Get all categories
 */
export function getSampleCategories(): string[] {
  return [...new Set(SAMPLE_DATA.map(s => s.category))];
}
