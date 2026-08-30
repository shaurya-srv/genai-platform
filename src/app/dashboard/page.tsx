"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Shield, LogOut, Zap, CheckCircle, AlertTriangle, Clock,
  FileText, Send, BarChart3, Lock, Eye, Settings, Link2,
  Image, Video, FileDown, ChevronRight, X
} from "lucide-react";

/* ─────────── Types ─────────── */
interface UserInfo {
  userId: string; username: string; displayName: string;
  role: string; roleLevel: string; email?: string;
}
interface SectionDef {
  id: string; name: string; icon: React.ReactNode;
  color: string; minLevel: number;
}

/* ─────────── Constants ─────────── */
const ALL_SECTIONS: SectionDef[] = [
  { id: "transform", name: "Transform", icon: <Zap className="w-4 h-4" />, color: "#C8442C", minLevel: 1 },
  { id: "approval", name: "Approval", icon: <CheckCircle className="w-4 h-4" />, color: "#8ED7A3", minLevel: 1 },
  { id: "analysis", name: "Analysis", icon: <BarChart3 className="w-4 h-4" />, color: "#4DB8C7", minLevel: 3 },
  { id: "dlp", name: "DLP Scanner", icon: <Shield className="w-4 h-4" />, color: "#8B6CC7", minLevel: 3 },
  { id: "compliance", name: "Compliance", icon: <Lock className="w-4 h-4" />, color: "#D4654A", minLevel: 5 },
  { id: "linkage", name: "Linkage", icon: <Link2 className="w-4 h-4" />, color: "#8ED7A3", minLevel: 1 },
  { id: "generate", name: "Generate", icon: <Image className="w-4 h-4" />, color: "#C8442C", minLevel: 1 },
];

const LEVEL_MAP: Record<string, number> = {
  chairman: 9, distinguished_scientist: 8, outstanding_scientist: 7,
  scientist_g: 6, scientist_f: 5, scientist_e: 4,
  scientist_d: 3, scientist_c: 2, general_scientist: 1,
};

const LEVEL_LABELS: Record<string, { label: string; color: string; tier: string }> = {
  chairman: { label: "Chairman", color: "#C8442C", tier: "Level 1" },
  distinguished_scientist: { label: "Distinguished Scientist", color: "#D4654A", tier: "Level 1" },
  outstanding_scientist: { label: "Outstanding Scientist", color: "#D4654A", tier: "Level 1" },
  scientist_g: { label: "Scientist G", color: "#D4654A", tier: "Level 2" },
  scientist_f: { label: "Scientist F", color: "#C8442C", tier: "Level 2" },
  scientist_e: { label: "Scientist E", color: "#C8442C", tier: "Level 2" },
  scientist_d: { label: "Scientist D", color: "#4DB8C7", tier: "Level 3" },
  scientist_c: { label: "Scientist C", color: "#4DB8C7", tier: "Level 3" },
  general_scientist: { label: "General Scientist", color: "#8ED7A3", tier: "Level 4" },
};

const OUTPUT_TYPES = ["linkedin", "twitter", "advisory", "executive_summary", "presentation", "infographic", "video", "crisis_response"];

/* ─────────── Presentation Viewer ─────────── */
function PresentationViewer({ content }: { content: any }) {
  let parsed: any;
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    return <pre className="text-[12px] text-white/50 whitespace-pre-wrap max-h-80 overflow-auto font-light">{typeof content === "string" ? content : JSON.stringify(content, null, 2)}</pre>;
  }
  const deck = parsed.slideDeck || parsed;
  const slides = deck.slides || [];
  if (slides.length === 0) {
    return <pre className="text-[12px] text-white/50 whitespace-pre-wrap max-h-80 overflow-auto font-light">{JSON.stringify(parsed, null, 2)}</pre>;
  }

  const handleDownloadPptx = async () => {
    try {
      const res = await fetch("/api/generate/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.stringify(parsed), title: deck.title || "Presentation", style: "corporate" }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+?)"/)?.[1] || "presentation.pptx";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[14px] font-medium text-white/80">{deck.title || "Presentation"}</div>
          <div className="text-[11px] text-white/30 mt-0.5">{slides.length} slides &middot; {deck.estimatedDuration || ""} &middot; {deck.theme || ""}</div>
        </div>
        <Button size="sm" variant="outline" className="border-white/[0.1] text-white/60 text-[11px] h-7" onClick={handleDownloadPptx}>
          <FileDown className="w-3 h-3 mr-1" /> Download .pptx
        </Button>
      </div>
      <div className="space-y-2 max-h-80 overflow-auto pr-1">
        {slides.map((slide: any, si: number) => {
          const accent = slide.accentColor || "C8442C";
          const isTitle = slide.layout === "title";
          return (
            <div key={si} className={`rounded-lg border border-white/[0.06] overflow-hidden ${isTitle ? "" : "bg-white/[0.03]"}`}
              style={isTitle ? { background: `linear-gradient(135deg, #${accent}, #${accent}cc)` } : {}}>
              <div className="px-3 py-1.5 text-[9px] font-semibold tracking-wider uppercase" style={{ background: `#${accent}`, color: "rgba(255,255,255,0.8)" }}>
                Slide {slide.slideNumber}
              </div>
              <div className="px-4 py-3">
                <div className={`text-[13px] font-semibold mb-1.5 ${isTitle ? "text-white" : "text-white/80"}`}>{slide.title}</div>
                {Array.isArray(slide.content) && slide.content.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5">
                    {slide.content.filter((c: string) => c).map((line: string, li: number) => (
                      <li key={li} className="text-[11px] text-white/45 font-light leading-relaxed">{line}</li>
                    ))}
                  </ul>
                )}
              </div>
              {slide.notes && (
                <div className="px-4 py-2 bg-white/[0.02] border-t border-white/[0.04]">
                  <span className="text-[10px] text-white/25 italic">📝 {slide.notes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── Video Viewer ─────────── */
function VideoViewer({ content }: { content: any }) {
  const [currentScene, setCurrentScene] = useState(0);
  let parsed: any;
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    return <pre className="text-[12px] text-white/50 whitespace-pre-wrap max-h-80 overflow-auto font-light">{String(content)}</pre>;
  }
  const scenes = parsed?.scenes || parsed?.storyboard?.scenes || [];
  if (scenes.length === 0) {
    return <pre className="text-[12px] text-white/50 whitespace-pre-wrap max-h-80 overflow-auto font-light">{JSON.stringify(parsed, null, 2)}</pre>;
  }
  const scene = scenes[currentScene];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[14px] font-medium text-white/80">🎬 Video Storyboard — {scenes.length} scenes</div>
        <span className="text-[11px] text-white/30">Scene {currentScene + 1} / {scenes.length}</span>
      </div>
      {/* Scene viewer */}
      <div className="relative rounded-lg overflow-hidden bg-black/40 aspect-video mb-3">
        {scene.imageUrl && (
          <img src={scene.imageUrl} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover opacity-90" />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="text-[13px] text-white/80 leading-relaxed">{scene.narration || scene.description || ""}</div>
        </div>
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white/60 font-medium">
          Scene {scene.sceneNumber || currentScene + 1}
        </div>
      </div>
      {/* Scene dots */}
      <div className="flex items-center justify-center gap-1.5">
        {scenes.map((_: any, si: number) => (
          <button key={si} onClick={() => setCurrentScene(si)}
            className={`w-2 h-2 rounded-full transition-all ${si === currentScene ? "bg-[#C8442C] scale-125" : "bg-white/20 hover:bg-white/30"}`} />
        ))}
      </div>
    </div>
  );
}

/* ─────────── Generated Media ─────────── */
function GeneratedMedia({ results, userId }: { results: any[]; userId: string }) {
  const [mediaData, setMediaData] = useState<any>(null);
  useEffect(() => {
    const hasMedia = results.some(r => r.type === "video" || r.type === "infographic");
    if (hasMedia) {
      fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_last_media", userId }),
      }).then(r => r.json()).then(d => { if (d.success && d.media) setMediaData(d.media); }).catch(() => {});
    }
  }, [results, userId]);
  if (!mediaData) return null;
  return (
    <div className="space-y-4">
      {mediaData.image?.url && (
        <Card className="bg-[#1A1A1A] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-normal text-white flex items-center gap-2">
              <Image className="w-4 h-4 text-[#8B6CC7]" /> AI Generated Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img src={mediaData.image.url} alt="AI generated" className="w-full max-w-lg rounded-lg border border-white/[0.08]" />
            <div className="mt-3 flex gap-2">
              <a href={mediaData.image.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/70 transition-all">
                Open Full Size ↗
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─────────── Auto DLP (runs after transform) ─────────── */
function AutoDLPResults({ content }: { content: string }) {
  const findings = scanContent(content);
  const highCount = findings.filter(f => f.severity === "HIGH").length;
  const medCount = findings.filter(f => f.severity === "MEDIUM").length;
  const lowCount = findings.filter(f => f.severity === "LOW").length;
  const severityColor: Record<string, string> = { HIGH: "text-[#C8442C] bg-[#C8442C]/10 border-[#C8442C]/20", MEDIUM: "text-[#D4654A] bg-[#D4654A]/10 border-[#D4654A]/20", LOW: "text-[#4DB8C7] bg-[#4DB8C7]/10 border-[#4DB8C7]/20" };

  return (
    <Card className="bg-[#1A1A1A] border-white/[0.06]">
      <CardHeader className="pb-3">
        <CardTitle className="text-[14px] font-normal flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#8B6CC7]" />
          <span className="text-white/70">DLP Scan</span>
          {findings.length === 0 ? (
            <Badge className="text-[9px] border border-[#8ED7A3]/30 text-[#8ED7A3] bg-[#8ED7A3]/10 ml-2">Clean</Badge>
          ) : (
            <Badge className="text-[9px] border border-[#D4654A]/30 text-[#D4654A] bg-[#D4654A]/10 ml-2">{findings.length} Finding{findings.length !== 1 ? "s" : ""}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-3">
          <div className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="text-lg font-light text-[#C8442C]">{highCount}</div>
            <div className="text-[9px] text-white/25">HIGH</div>
          </div>
          <div className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="text-lg font-light text-[#D4654A]">{medCount}</div>
            <div className="text-[9px] text-white/25">MEDIUM</div>
          </div>
          <div className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="text-lg font-light text-[#4DB8C7]">{lowCount}</div>
            <div className="text-[9px] text-white/25">LOW</div>
          </div>
        </div>
        {findings.length > 0 && (
          <div className="space-y-2">
            {findings.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-white/60">{f.name}</span>
                  <span className="text-[9px] text-white/20">{f.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 font-mono">{f.matches[0]?.length > 30 ? f.matches[0].substring(0, 30) + "..." : f.matches[0]}</span>
                  <Badge className={`text-[9px] border ${severityColor[f.severity]}`}>{f.severity}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────── Auto Analysis (runs after transform) ─────────── */
function AutoAnalysisResults({ results }: { results: any[] }) {
  const analyzed = results.map((r: any) => {
    const content = typeof r.content === "string" ? r.content : JSON.stringify(r.content || "");
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const sentenceCount = content.split(/[.!?]+/).filter(Boolean).length;
    let qualityScore = 50;
    if (wordCount > 50) qualityScore += 10;
    if (wordCount > 200) qualityScore += 10;
    if (sentenceCount > 3) qualityScore += 5;
    if (r.type === "linkedin" && wordCount > 100) qualityScore += 10;
    if (r.type === "twitter" && content.match(/#/g)) qualityScore += 5;
    qualityScore = Math.min(qualityScore, 100);
    return { type: r.type, title: r.title || r.type, wordCount, sentenceCount, qualityScore };
  });
  const avgScore = Math.round(analyzed.reduce((s, r) => s + r.qualityScore, 0) / analyzed.length);
  const totalWords = analyzed.reduce((s, r) => s + r.wordCount, 0);

  return (
    <Card className="bg-[#1A1A1A] border-white/[0.06]">
      <CardHeader className="pb-3">
        <CardTitle className="text-[14px] font-normal flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#4DB8C7]" />
          <span className="text-white/70">Analysis</span>
          <Badge className="text-[9px] border border-[#4DB8C7]/30 text-[#4DB8C7] bg-[#4DB8C7]/10 ml-2">{avgScore}% quality</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-3">
          <div className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="text-lg font-light text-[#4DB8C7]">{avgScore}%</div>
            <div className="text-[9px] text-white/25">Quality</div>
          </div>
          <div className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="text-lg font-light text-white/60">{totalWords}</div>
            <div className="text-[9px] text-white/25">Words</div>
          </div>
          <div className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="text-lg font-light text-white/60">{analyzed.length}</div>
            <div className="text-[9px] text-white/25">Outputs</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {analyzed.map((ar, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[11px] text-white/50 w-28 truncate capitalize">{ar.type?.replace("_", " ")}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${ar.qualityScore}%`, background: ar.qualityScore >= 70 ? "#8ED7A3" : ar.qualityScore >= 50 ? "#D4654A" : "#C8442C" }} />
              </div>
              <span className="text-[10px] text-white/30 w-8 text-right">{ar.qualityScore}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────── Auto Compliance (runs after transform) ─────────── */
function AutoComplianceResults({ content }: { content: string }) {
  const results = checkCompliance(content);
  const triggered = results.filter(r => r.triggered);
  const passCount = triggered.filter(r => r.severity === "PASS").length;
  const warnCount = triggered.filter(r => r.severity === "WARN").length;
  const failCount = triggered.filter(r => r.severity === "FAIL").length;
  const score = results.length > 0 ? Math.round(((results.length - failCount * 2 - warnCount) / results.length) * 100) : 100;

  return (
    <Card className="bg-[#1A1A1A] border-white/[0.06]">
      <CardHeader className="pb-3">
        <CardTitle className="text-[14px] font-normal flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#D4654A]" />
          <span className="text-white/70">Compliance</span>
          <Badge className={`text-[9px] border ml-2 ${failCount > 0 ? "border-[#C8442C]/30 text-[#C8442C] bg-[#C8442C]/10" : warnCount > 0 ? "border-[#D4654A]/30 text-[#D4654A] bg-[#D4654A]/10" : "border-[#8ED7A3]/30 text-[#8ED7A3] bg-[#8ED7A3]/10"}`}>{score}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-3">
          <div className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="text-lg font-light" style={{ color: score >= 70 ? "#8ED7A3" : score >= 40 ? "#D4654A" : "#C8442C" }}>{score}%</div>
            <div className="text-[9px] text-white/25">Score</div>
          </div>
          <div className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="text-lg font-light text-[#8ED7A3]">{passCount}</div>
            <div className="text-[9px] text-white/25">Pass</div>
          </div>
          <div className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="text-lg font-light text-[#D4654A]">{warnCount}</div>
            <div className="text-[9px] text-white/25">Warn</div>
          </div>
          <div className="px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="text-lg font-light text-[#C8442C]">{failCount}</div>
            <div className="text-[9px] text-white/25">Fail</div>
          </div>
        </div>
        {triggered.length > 0 && (
          <div className="space-y-1.5">
            {triggered.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/50">{r.name}</span>
                  <span className="text-[9px] text-white/20">{r.regulation}</span>
                </div>
                <Badge className={`text-[9px] border ${
                  r.severity === "PASS" ? "border-[#8ED7A3]/30 text-[#8ED7A3] bg-[#8ED7A3]/10" :
                  r.severity === "WARN" ? "border-[#D4654A]/30 text-[#D4654A] bg-[#D4654A]/10" :
                  "border-[#C8442C]/30 text-[#C8442C] bg-[#C8442C]/10"
                }`}>{r.severity}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────── DLP Scanner ─────────── */
const DLP_PATTERNS: { name: string; pattern: RegExp; severity: "HIGH" | "MEDIUM" | "LOW"; category: string }[] = [
  { name: "Email Address", pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, severity: "MEDIUM", category: "PII" },
  { name: "Phone Number", pattern: /(?:\+91[\s-]?)?\d{10}|(?:\+91[\s-]?)?\d{5}[\s-]?\d{5}|\(\d{3}\)\s?\d{3}-?\d{4}/g, severity: "MEDIUM", category: "PII" },
  { name: "Aadhaar Number", pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, severity: "HIGH", category: "Govt ID" },
  { name: "PAN Number", pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/g, severity: "HIGH", category: "Govt ID" },
  { name: "Credit Card", pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, severity: "HIGH", category: "Financial" },
  { name: "SSN / Passport", pattern: /\b\d{3}-\d{2}-\d{4}\b|\b[A-Z]\d{7}\b/g, severity: "HIGH", category: "Govt ID" },
  { name: "IP Address", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, severity: "LOW", category: "Network" },
  { name: "Password / Secret", pattern: /(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*["']?\S{8,}["']?/gi, severity: "HIGH", category: "Credentials" },
  { name: "Classified / Secret", pattern: /\b(TOP SECRET|SECRET|CONFIDENTIAL|RESTRICTED|CLASSIFIED|VERIFIED|COSMIC|NATO SECRET)\b/gi, severity: "HIGH", category: "Classification" },
  { name: "Financial Amount", pattern: /(?:₹|INR|USD|EUR|GBP|\$)\s?\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?/g, severity: "LOW", category: "Financial" },
  { name: "Date of Birth", pattern: /\b(?:DOB|Date of Birth|born on)[:\s]+\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/gi, severity: "MEDIUM", category: "PII" },
  { name: "Address Pattern", pattern: /\b\d{1,5}\s[\w\s]{2,40}(?:Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Drive|Dr|Colony|Nagar|Marg)\b/gi, severity: "MEDIUM", category: "PII" },
];

function scanContent(text: string) {
  const findings: { name: string; severity: string; category: string; matches: string[] }[] = [];
  for (const rule of DLP_PATTERNS) {
    const matches = [...new Set((text.match(rule.pattern) || []).map(m => m.trim()))];
    if (matches.length > 0) {
      findings.push({ name: rule.name, severity: rule.severity, category: rule.category, matches });
    }
  }
  return findings;
}

function DLPScannerSection() {
  const [scanInput, setScanInput] = useState("");
  const [findings, setFindings] = useState<ReturnType<typeof scanContent>>([]);
  const [scanned, setScanned] = useState(false);
  const [scanHistory, setScanHistory] = useState<{ input: string; findings: ReturnType<typeof scanContent>; time: string }[]>([]);

  const handleScan = () => {
    if (!scanInput.trim()) return;
    const results = scanContent(scanInput);
    setFindings(results);
    setScanned(true);
    setScanHistory(prev => [{ input: scanInput.substring(0, 100), findings: results, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
  };

  const severityColor: Record<string, string> = { HIGH: "text-[#C8442C] bg-[#C8442C]/10 border-[#C8442C]/20", MEDIUM: "text-[#D4654A] bg-[#D4654A]/10 border-[#D4654A]/20", LOW: "text-[#4DB8C7] bg-[#4DB8C7]/10 border-[#4DB8C7]/20" };
  const highCount = findings.filter(f => f.severity === "HIGH").length;
  const medCount = findings.filter(f => f.severity === "MEDIUM").length;
  const lowCount = findings.filter(f => f.severity === "LOW").length;

  return (
    <div className="space-y-6">
      <Card className="bg-[#1A1A1A] border-white/[0.06]">
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-normal text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#8B6CC7]" /> Data Loss Prevention Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            placeholder="Paste content to scan for sensitive data, PII, classified information, credentials..."
            className="min-h-[140px] bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 font-light text-[13px] resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/30">{scanInput.length} characters &middot; {DLP_PATTERNS.length} detection rules</span>
            <Button onClick={handleScan} disabled={!scanInput.trim()} className="bg-[#8B6CC7] hover:bg-[#7B5CB7] text-white text-[13px] font-medium">
              <Eye className="w-4 h-4 mr-2" /> Scan Content
            </Button>
          </div>
        </CardContent>
      </Card>

      {scanned && (
        <Card className="bg-[#1A1A1A] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-normal flex items-center gap-2">
              {findings.length === 0 ? (
                <><CheckCircle className="w-4 h-4 text-[#8ED7A3]" /><span className="text-[#8ED7A3]">No Sensitive Data Detected</span></>
              ) : (
                <><AlertTriangle className="w-4 h-4 text-[#D4654A]" /><span className="text-[#D4654A]">{findings.length} Finding{findings.length !== 1 ? "s" : ""} Detected</span></>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Summary bar */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-2xl font-light text-[#C8442C]">{highCount}</div>
                <div className="text-[10px] text-white/30 mt-0.5">HIGH</div>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-2xl font-light text-[#D4654A]">{medCount}</div>
                <div className="text-[10px] text-white/30 mt-0.5">MEDIUM</div>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-2xl font-light text-[#4DB8C7]">{lowCount}</div>
                <div className="text-[10px] text-white/30 mt-0.5">LOW</div>
              </div>
            </div>
            {findings.map((f, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-white/80">{f.name}</span>
                    <span className="text-[10px] text-white/30">{f.category}</span>
                  </div>
                  <Badge className={`text-[10px] border ${severityColor[f.severity]}`}>{f.severity}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {f.matches.map((m, mi) => (
                    <span key={mi} className="px-2 py-0.5 rounded bg-black/30 text-[11px] text-white/50 font-mono">{m.length > 40 ? m.substring(0, 40) + "..." : m}</span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {scanHistory.length > 0 && (
        <Card className="bg-[#1A1A1A] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[13px] font-normal text-white/50">Scan History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-[12px] text-white/40 truncate flex-1">{h.input}...</span>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge variant="outline" className={`text-[9px] border ${h.findings.length > 0 ? "border-[#C8442C]/30 text-[#C8442C]" : "border-[#8ED7A3]/30 text-[#8ED7A3]"}`}>
                      {h.findings.length > 0 ? `${h.findings.length} issues` : "Clean"}
                    </Badge>
                    <span className="text-[10px] text-white/20">{h.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─────────── Analysis ─────────── */
function AnalysisSection({ results, showResults }: { results: any[]; showResults: boolean }) {
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);

  useEffect(() => {
    if (showResults && results.length > 0) {
      const analyzed = results.map((r: any) => {
        const content = typeof r.content === "string" ? r.content : JSON.stringify(r.content || "");
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        const sentenceCount = content.split(/[.!?]+/).filter(Boolean).length;
        const paragraphCount = content.split(/\n\n+/).filter(Boolean).length;
        const hasHeaders = /^#{1,6}\s|\*\*[^*]+\*\*/m.test(content) || content.split("\n").some((l: string) => l.length > 0 && l === l.toUpperCase() && l.length < 60);
        const bulletPoints = (content.match(/^[\s]*[-*•]\s/gm) || []).length;
        const links = (content.match(/https?:\/\//g) || []).length;
        const numbers = (content.match(/\d+/g) || []).length;
        const hashtags = (content.match(/#\w+/g) || []).length;
        const mentions = (content.match(/@\w+/g) || []).length;
        const emojis = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;

        let qualityScore = 50;
        if (wordCount > 50) qualityScore += 10;
        if (wordCount > 200) qualityScore += 10;
        if (sentenceCount > 3) qualityScore += 5;
        if (hasHeaders) qualityScore += 5;
        if (bulletPoints > 0) qualityScore += 5;
        if (r.type === "twitter" && hashtags > 0) qualityScore += 5;
        if (r.type === "linkedin" && wordCount > 100) qualityScore += 10;
        qualityScore = Math.min(qualityScore, 100);

        return {
          type: r.type,
          title: r.title || r.type,
          metrics: {
            wordCount, sentenceCount, paragraphCount, bulletPoints,
            links, numbers, hashtags, mentions, emojis, qualityScore,
            estimatedReadTime: Math.max(1, Math.ceil(wordCount / 200)) + " min",
          }
        };
      });
      setAnalysisResults(analyzed);
    }
  }, [results, showResults]);

  if (!showResults || results.length === 0) {
    return (
      <Card className="bg-[#1A1A1A] border-white/[0.06]">
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="text-[14px] text-white/50 mb-1">Analysis & Review</p>
          <p className="text-[12px] text-white/25">Run a transformation first to see quality metrics and consistency analysis.</p>
        </CardContent>
      </Card>
    );
  }

  const avgScore = analysisResults.length > 0 ? Math.round(analysisResults.reduce((s, r) => s + r.metrics.qualityScore, 0) / analysisResults.length) : 0;

  return (
    <div className="space-y-6">
      <Card className="bg-[#1A1A1A] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-normal text-[#4DB8C7] flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Quality Metrics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="text-2xl font-light text-[#4DB8C7]">{avgScore}%</div>
              <div className="text-[10px] text-white/30 mt-0.5">Avg Quality</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="text-2xl font-light text-white/70">{analysisResults.length}</div>
              <div className="text-[10px] text-white/30 mt-0.5">Outputs</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="text-2xl font-light text-white/70">{analysisResults.reduce((s, r) => s + r.metrics.wordCount, 0)}</div>
              <div className="text-[10px] text-white/30 mt-0.5">Total Words</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="text-2xl font-light text-white/70">{analysisResults.reduce((s, r) => s + r.metrics.links, 0)}</div>
              <div className="text-[10px] text-white/30 mt-0.5">Links</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {analysisResults.map((ar, i) => (
          <Card key={i} className="bg-[#1A1A1A] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-white/80">{ar.title}</span>
                  <Badge variant="outline" className="text-[9px] border-white/[0.1] text-white/40 capitalize">{ar.type?.replace("_", " ")}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${ar.metrics.qualityScore}%`, background: ar.metrics.qualityScore >= 70 ? "#8ED7A3" : ar.metrics.qualityScore >= 50 ? "#D4654A" : "#C8442C" }} />
                  </div>
                  <span className="text-[11px] text-white/40 w-8 text-right">{ar.metrics.qualityScore}%</span>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {[{ label: "Words", val: ar.metrics.wordCount }, { label: "Sentences", val: ar.metrics.sentenceCount }, { label: "Paragraphs", val: ar.metrics.paragraphCount }, { label: "Bullets", val: ar.metrics.bulletPoints }, { label: "Read Time", val: ar.metrics.estimatedReadTime }, { label: "Emojis", val: ar.metrics.emojis }].map(m => (
                  <div key={m.label} className="text-center p-2 rounded bg-white/[0.02]">
                    <div className="text-[13px] font-medium text-white/60">{m.val}</div>
                    <div className="text-[9px] text-white/25 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Compliance Checker ─────────── */
const COMPLIANCE_RULES: { name: string; pattern: RegExp; regulation: string; severity: "PASS" | "WARN" | "FAIL"; description: string }[] = [
  { name: "Personal Data Disclosure", pattern: /\b(personal data|personally identifiable|individual's data|citizen's data)\b/gi, regulation: "DPDP Act", severity: "WARN", description: "Content may expose personal data without explicit consent" },
  { name: "Consent Not Mentioned", pattern: /\b(collect|store|process|share|transfer)\b.*\b(data|information|records)\b/gi, regulation: "DPDP Act", severity: "WARN", description: "Data processing mentioned without consent reference" },
  { name: "Cross-Border Transfer", pattern: /\b(transfer|send|share|export)\b.*\b(overseas|foreign|international|abroad|outside India)\b/gi, regulation: "DPDP Act", severity: "FAIL", description: "Cross-border data transfer may violate DPDP Act restrictions" },
  { name: "No Classification Marking", pattern: /^(?!.*\b(TOP SECRET|SECRET|CONFIDENTIAL|RESTRICTED|UNCLASSIFIED|PUBLIC)\b).*$/gm, regulation: "Organizational Policy", severity: "WARN", description: "Content lacks official classification marking" },
  { name: "GDPR Right Reference", pattern: /\b(right to erasure|right to access|right to portability|data subject)\b/gi, regulation: "GDPR", severity: "PASS", description: "GDPR rights correctly referenced" },
  { name: "Encryption Mention", pattern: /\b(encrypt|encryption|TLS|SSL|AES|cipher)\b/gi, regulation: "IT Act", severity: "PASS", description: "Security controls referenced" },
  { name: "Third-Party Sharing", pattern: /\b(third party|3rd party|vendor|partner|subcontractor)\b.*\b(data|access|share|receive)\b/gi, regulation: "DPDP Act", severity: "WARN", description: "Third-party data sharing may require additional safeguards" },
  { name: "Data Breach Notification", pattern: /\b(breach|incident|unauthorized access|data leak|compromise)\b/gi, regulation: "IT Act", severity: "PASS", description: "Incident handling appropriately referenced" },
  { name: "Children's Data", pattern: /\b(child|children|minors|under 18|underage)\b.*\b(data|information|collected)\b/gi, regulation: "DPDP Act", severity: "FAIL", description: "Children's data requires verifiable parental consent" },
  { name: "Data Retention Period", pattern: /\b(retain|retention|archive|storage period|keep for)\b/gi, regulation: "DPDP Act", severity: "PASS", description: "Data retention policy referenced" },
];

function checkCompliance(text: string) {
  return COMPLIANCE_RULES.map(rule => {
    const matches = text.match(rule.pattern);
    return { ...rule, triggered: matches !== null, matchCount: matches?.length || 0 };
  });
}

function ComplianceSection() {
  const [complianceInput, setComplianceInput] = useState("");
  const [complianceResults, setComplianceResults] = useState<ReturnType<typeof checkCompliance>>([]);
  const [checked, setChecked] = useState(false);

  const handleCheck = () => {
    if (!complianceInput.trim()) return;
    setComplianceResults(checkCompliance(complianceInput));
    setChecked(true);
  };

  const passCount = complianceResults.filter(r => r.severity === "PASS" && r.triggered).length;
  const warnCount = complianceResults.filter(r => r.severity === "WARN" && r.triggered).length;
  const failCount = complianceResults.filter(r => r.severity === "FAIL" && r.triggered).length;
  const triggeredCount = complianceResults.filter(r => r.triggered).length;
  const score = complianceResults.length > 0 ? Math.round(((complianceResults.length - failCount * 2 - warnCount) / complianceResults.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="bg-[#1A1A1A] border-white/[0.06]">
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-normal text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#D4654A]" /> Compliance Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={complianceInput}
            onChange={e => setComplianceInput(e.target.value)}
            placeholder="Paste content to check against DPDP Act, GDPR, IT Act, and organizational policies..."
            className="min-h-[140px] bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 font-light text-[13px] resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/30">{COMPLIANCE_RULES.length} compliance rules &middot; DPDP Act, GDPR, IT Act, Org Policy</span>
            <Button onClick={handleCheck} disabled={!complianceInput.trim()} className="bg-[#D4654A] hover:bg-[#C45540] text-white text-[13px] font-medium">
              <Lock className="w-4 h-4 mr-2" /> Run Check
            </Button>
          </div>
        </CardContent>
      </Card>

      {checked && (
        <Card className="bg-[#1A1A1A] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-normal flex items-center gap-2">
              {failCount > 0 ? (
                <><AlertTriangle className="w-4 h-4 text-[#C8442C]" /><span className="text-[#C8442C]">Compliance Issues Found</span></>
              ) : warnCount > 0 ? (
                <><AlertTriangle className="w-4 h-4 text-[#D4654A]" /><span className="text-[#D4654A]">Warnings Detected</span></>
              ) : (
                <><CheckCircle className="w-4 h-4 text-[#8ED7A3]" /><span className="text-[#8ED7A3]">All Checks Passed</span></>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-2xl font-light" style={{ color: score >= 70 ? "#8ED7A3" : score >= 40 ? "#D4654A" : "#C8442C" }}>{score}%</div>
                <div className="text-[10px] text-white/30 mt-0.5">Score</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-2xl font-light text-[#8ED7A3]">{passCount}</div>
                <div className="text-[10px] text-white/30 mt-0.5">Passed</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-2xl font-light text-[#D4654A]">{warnCount}</div>
                <div className="text-[10px] text-white/30 mt-0.5">Warnings</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-2xl font-light text-[#C8442C]">{failCount}</div>
                <div className="text-[10px] text-white/30 mt-0.5">Failures</div>
              </div>
            </div>

            <div className="space-y-2">
              {complianceResults.filter(r => r.triggered).map((r, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-white/80">{r.name}</span>
                      <Badge className={`text-[9px] border ${
                        r.severity === "PASS" ? "border-[#8ED7A3]/30 text-[#8ED7A3] bg-[#8ED7A3]/10" :
                        r.severity === "WARN" ? "border-[#D4654A]/30 text-[#D4654A] bg-[#D4654A]/10" :
                        "border-[#C8442C]/30 text-[#C8442C] bg-[#C8442C]/10"
                      }`}>{r.severity}</Badge>
                    </div>
                    <span className="text-[10px] text-white/25">{r.regulation}</span>
                  </div>
                  <p className="text-[11px] text-white/35 leading-relaxed">{r.description}</p>
                </div>
              ))}
            </div>

            {complianceResults.filter(r => !r.triggered).length > 0 && (
              <div className="pt-3 border-t border-white/[0.04]">
                <p className="text-[11px] text-white/25 mb-2">Not triggered ({complianceResults.filter(r => !r.triggered).length} rules)</p>
                <div className="flex flex-wrap gap-1.5">
                  {complianceResults.filter(r => !r.triggered).map((r, i) => (
                    <span key={i} className="text-[10px] text-white/20 px-2 py-0.5 rounded bg-white/[0.02]">{r.name}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─────────── Dashboard ─────────── */
function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeSection, setActiveSection] = useState("transform");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Transform state
  const [sourceContent, setSourceContent] = useState("");
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(["linkedin"]);
  const [processing, setProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [config, setConfig] = useState({ audience: "general", tone: "formal", language: "en" });

  // Approval state
  const [chainRequests, setChainRequests] = useState<any[]>([]);
  const [finalising, setFinalising] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState("");

  // Linkage state
  const [linkageStatus, setLinkageStatus] = useState<Record<string, any>>({});
  const [linkageLoading, setLinkageLoading] = useState("");

  // Generate state
  const [genPrompt, setGenPrompt] = useState("");
  const [genType, setGenType] = useState<"image" | "video" | "presentation">("image");
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);

  // Notifications
  const [notifications, setNotifications] = useState<{ id: string; msg: string; type: string }[]>([]);

  const addNotification = useCallback((msg: string, type: string = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, msg, type }].slice(-5));
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  // Load user
  useEffect(() => {
    const uid = searchParams.get("userId");
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    } else if (uid) {
      setUser({ userId: uid, username: uid, displayName: "NTRO User", role: searchParams.get("portal") || "OPERATOR", roleLevel: "general_scientist" });
    } else {
      router.push("/login");
    }
  }, [searchParams, router]);

  // Load approval data
  useEffect(() => {
    if (activeSection === "approval" && user) {
      fetch(`/api/approval-chain?action=pending&userId=${user.userId}&userLevel=${user.roleLevel}`)
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setChainRequests(data); }).catch(() => {});
    }
  }, [activeSection, user]);

  // Load linkage data
  useEffect(() => {
    if (activeSection === "linkage" && user) {
      fetch(`/api/linkage?action=status&userId=${user.userId}`)
        .then(r => r.json()).then(data => { if (data && typeof data === "object") setLinkageStatus(data); }).catch(() => {});
    }
  }, [activeSection, user]);

  const userLevel = user ? (LEVEL_MAP[user.roleLevel] || 1) : 1;
  const visibleSections = ALL_SECTIONS.filter(s => s.minLevel <= userLevel);
  const levelInfo = user ? LEVEL_LABELS[user.roleLevel] : null;

  /* ── Transform ── */
  // Transform media state
  const [transformMedia, setTransformMedia] = useState<any>(null);

  const handleTransform = async () => {
    if (!sourceContent.trim()) { addNotification("Enter source content", "error"); return; }
    setProcessing(true); setPipelineStep(0); setShowResults(false); setTransformMedia(null);
    const stepTimer = setInterval(() => setPipelineStep(prev => Math.min(prev + 1, 6)), 900);
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transform", sourceContent, outputTypes: selectedOutputs, config, userId: user?.userId }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setTransformMedia(data.media || null);
        setShowResults(true);
        addNotification("Transformation complete! DLP, Analysis & Compliance auto-checked.", "success");
      } else addNotification(data.error || "Transformation failed", "error");
    } catch { addNotification("Connection error", "error"); }
    clearInterval(stepTimer); setProcessing(false);
  };

  const handleDownloadPptx = () => {
    if (!transformMedia?.presentation?.base64) return;
    const byteChars = atob(transformMedia.presentation.base64);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = transformMedia.presentation.fileName || "presentation.pptx";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification("Presentation downloaded!", "success");
  };

  /* ── Approval ── */
  const handleApprovalDecision = async (requestId: string, decision: "APPROVE" | "REJECT") => {
    if (!user) return;
    try {
      const res = await fetch("/api/approval-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", userId: user.userId, requestId, decision, comments: approvalComment }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification(decision === "APPROVE" ? "Approved!" : "Rejected", decision === "APPROVE" ? "success" : "error");
        setChainRequests(prev => prev.map(r => r.id === requestId ? data.request : r));
      } else addNotification(data.error || "Failed", "error");
    } catch { addNotification("Connection error", "error"); }
    setApprovalComment("");
  };

  /* ── Linkage ── */
  const handleLinkAccount = async (platform: string) => {
    if (!user) return;
    setLinkageLoading(platform);
    try {
      const res = await fetch("/api/linkage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demo_link", userId: user.userId, platform }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification(`Linked ${platform}!`, "success");
        setLinkageStatus(prev => ({ ...prev, [platform]: { linked: true, accountName: data.account.accountName } }));
      } else addNotification(data.error || "Failed", "error");
    } catch { addNotification("Connection error", "error"); }
    setLinkageLoading("");
  };

  /* ── Generate ── */
  const handleGenerate = async () => {
    if (!genPrompt.trim()) { addNotification("Enter a prompt", "error"); return; }
    setGenLoading(true); setGenResult(null);
    try {
      const endpoint = genType === "image" ? "/api/generate/image" : genType === "video" ? "/api/generate/video" : "/api/generate/presentation";
      const body = genType === "presentation"
        ? { content: genPrompt, title: genPrompt.split("\n")[0]?.substring(0, 60) || "Presentation", userId: user?.userId }
        : { prompt: genPrompt, userId: user?.userId };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        const data = genType === "presentation" ? { type: "pptx", downloaded: true } : await res.json();
        setGenResult(data);
        addNotification(`${genType} generated!`, "success");
      } else addNotification(`${genType} generation failed`, "error");
    } catch { addNotification("Connection error", "error"); }
    setGenLoading(false);
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-[#121212] text-white/40">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white flex">
      {processing && <ProcessingOverlay isVisible={true} currentStep={pipelineStep} steps={[
        { id: "ingest", label: "Ingesting", icon: "📄", detail: "Reading source content", status: pipelineStep >= 1 ? "done" : "active" },
        { id: "analyze", label: "Analyzing", icon: "🧠", detail: "Running DLP scan", status: pipelineStep >= 2 ? "done" : pipelineStep === 1 ? "active" : "pending" },
        { id: "transform", label: "Transforming", icon: "⚡", detail: "Generating outputs", status: pipelineStep >= 3 ? "done" : pipelineStep === 2 ? "active" : "pending" },
        { id: "media", label: "Media", icon: "🎨", detail: "Creating visuals", status: pipelineStep >= 4 ? "done" : pipelineStep === 3 ? "active" : "pending" },
        { id: "validate", label: "Validating", icon: "🛡️", detail: "Compliance checks", status: pipelineStep >= 5 ? "done" : pipelineStep === 4 ? "active" : "pending" },
        { id: "finalize", label: "Finalizing", icon: "✅", detail: "Blockchain record", status: pipelineStep >= 6 ? "done" : pipelineStep === 5 ? "active" : "pending" },
      ]} />}

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className={`px-4 py-2.5 rounded-lg text-[13px] font-medium backdrop-blur-md border animate-[slide-in_0.3s_ease-out] ${
            n.type === "success" ? "bg-[#8ED7A3]/10 border-[#8ED7A3]/20 text-[#8ED7A3]" :
            n.type === "error" ? "bg-[#C8442C]/10 border-[#C8442C]/20 text-[#D4654A]" :
            "bg-white/[0.06] border-white/[0.1] text-white/70"
          }`}>
            {n.msg}
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 z-40 bg-[#0E0E0E] border-r border-white/[0.06] transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"} flex flex-col`}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/[0.06]">
          <Shield className="w-6 h-6 text-[#C8442C] stroke-[1.8] shrink-0" />
          {sidebarOpen && <span className="text-sm font-semibold text-white tracking-tight">NTRO Dashboard</span>}
        </div>

        {/* Nav items */}
        <ScrollArea className="flex-1 py-3">
          {visibleSections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                activeSection === s.id
                  ? "text-white bg-white/[0.06] border-r-2"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
              }`}
              style={activeSection === s.id ? { borderColor: s.color, color: s.color } : {}}
            >
              <span style={{ color: activeSection === s.id ? s.color : undefined }}>{s.icon}</span>
              {sidebarOpen && <span>{s.name}</span>}
            </button>
          ))}
          {ALL_SECTIONS.filter(s => s.minLevel > userLevel).map(s => (
            <div key={s.id} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/20 cursor-not-allowed">
              <Lock className="w-4 h-4" />
              {sidebarOpen && <span>{s.name}</span>}
            </div>
          ))}
        </ScrollArea>

        {/* User info at bottom */}
        <div className="border-t border-white/[0.06] p-3">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-white/80 truncate">{user.displayName}</div>
                {levelInfo && (
                  <div className="text-[10px] mt-0.5" style={{ color: levelInfo.color }}>{levelInfo.tier} &middot; {levelInfo.label}</div>
                )}
              </div>
              <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="text-white/30 hover:text-white/60 transition-colors p-1">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="w-full flex justify-center text-white/30 hover:text-white/60">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-60" : "ml-16"}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 h-14 bg-[#121212]/95 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/40 hover:text-white/70 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <Separator orientation="vertical" className="h-4 bg-white/[0.08]" />
            <h1 className="text-sm font-medium text-white/70">
              {visibleSections.find(s => s.id === activeSection)?.name || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {levelInfo && (
              <Badge variant="outline" className="text-[10px] border-white/[0.1] text-white/50 font-medium">
                {levelInfo.tier}
              </Badge>
            )}
            <div className="w-8 h-8 rounded-full bg-[#C8442C]/15 border border-[#C8442C]/20 flex items-center justify-center text-[11px] font-semibold text-[#C8442C]">
              {user.displayName.charAt(0)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-5xl">

          {/* ══════ TRANSFORM ══════ */}
          {activeSection === "transform" && (
            <div className="space-y-6">
              <Card className="bg-[#1A1A1A] border-white/[0.06]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[15px] font-normal text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#C8442C]" /> Source Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={sourceContent}
                    onChange={e => setSourceContent(e.target.value)}
                    placeholder="Paste your source content — text, URLs, prompts, documents..."
                    className="min-h-[140px] bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 font-light text-[13px] resize-y focus-visible:ring-[#C8442C]/30 focus-visible:border-[#C8442C]/30"
                  />

                  <div>
                    <label className="text-[11px] font-semibold text-white/40 tracking-widest uppercase mb-2 block">Output Formats</label>
                    <div className="flex flex-wrap gap-2">
                      {OUTPUT_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => setSelectedOutputs(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                          className={`px-3 py-1.5 rounded-md text-[12px] font-medium border transition-all duration-200 ${
                            selectedOutputs.includes(type)
                              ? "bg-[#C8442C]/15 border-[#C8442C]/30 text-[#C8442C]"
                              : "bg-transparent border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/60"
                          }`}
                        >
                          {type.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries({ audience: ["general", "technical", "executive"], tone: ["formal", "casual", "technical"], language: ["en", "hi"] }).map(([key, opts]) => (
                      <div key={key}>
                        <label className="text-[10px] text-white/30 mb-1 block capitalize">{key}</label>
                        <select
                          value={(config as any)[key]}
                          onChange={e => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] appearance-none outline-none focus:border-[#C8442C]/30"
                        >
                          {opts.map(o => <option key={o} value={o} className="bg-[#1A1A1A]">{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <Button onClick={handleTransform} disabled={processing} className="bg-[#C8442C] hover:bg-[#B83A24] text-white text-[13px] font-medium">
                    <Zap className="w-4 h-4 mr-2" />
                    {processing ? "Transforming..." : "Transform"}
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              {showResults && results.length > 0 && (
                <Card className="bg-[#1A1A1A] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[15px] font-normal text-[#8ED7A3] flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> {results.length} Outputs Generated
                      </CardTitle>
                      {transformMedia?.presentation?.base64 && (
                        <Button size="sm" onClick={handleDownloadPptx} className="bg-[#8ED7A3]/20 hover:bg-[#8ED7A3]/30 text-[#8ED7A3] border border-[#8ED7A3]/20 text-[12px] h-8">
                          <FileDown className="w-3.5 h-3.5 mr-1.5" /> Download .pptx
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {results.map((r: any, i: number) => (
                      <details key={i} className="group" open={r.type === "presentation"}>
                        <summary className="flex items-center justify-between cursor-pointer px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all list-none">
                          <div className="flex items-center gap-3">
                            <ChevronRight className="w-3.5 h-3.5 text-white/30 transition-transform group-open:rotate-90 shrink-0" />
                            <span className="text-[13px] font-medium text-white/80 truncate">{r.title || r.type}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px] border-white/[0.1] text-white/40 capitalize">{r.type?.replace("_", " ")}</Badge>
                          </div>
                        </summary>
                        <div className="mt-2 p-4 rounded-lg bg-black/20 border border-white/[0.04]">
                          {r.type === "presentation" ? (
                            <PresentationViewer content={r.content} />
                          ) : r.type === "video" ? (
                            <VideoViewer content={r.content} />
                          ) : (
                            <div className="text-[13px] text-white/60 leading-relaxed whitespace-pre-wrap max-h-80 overflow-auto font-light">
                              {typeof r.content === "string" ? (() => { try { return JSON.stringify(JSON.parse(r.content), null, 2); } catch { return r.content; } })() : typeof r.content === "object" ? JSON.stringify(r.content, null, 2) : String(r.content)}
                            </div>
                          )}
                          {r.metadata && (
                            <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap gap-2">
                              {Object.entries(r.metadata).map(([k, v]) => (
                                <span key={k} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-white/30">{k}: {String(v)}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* PPTX Download Banner */}
              {showResults && transformMedia?.presentation?.base64 && (
                <Card className="bg-[#1A1A1A] border-[#8ED7A3]/20">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileDown className="w-5 h-5 text-[#8ED7A3]" />
                      <div>
                        <div className="text-[13px] font-medium text-white/80">{transformMedia.presentation.fileName || "presentation.pptx"}</div>
                        <div className="text-[11px] text-white/30">{transformMedia.presentation.slideCount || "?"} slides &middot; PowerPoint (PPTX)</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleDownloadPptx} className="bg-[#8ED7A3] hover:bg-[#7BC08A] text-[#121212] text-[12px] font-medium h-8">
                      <FileDown className="w-3.5 h-3.5 mr-1.5" /> Download
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Auto-generated DLP Scan Results */}
              {showResults && sourceContent.trim() && (
                <AutoDLPResults content={sourceContent} />
              )}

              {/* Auto-generated Analysis */}
              {showResults && results.length > 0 && (
                <AutoAnalysisResults results={results} />
              )}

              {/* Auto-generated Compliance Check */}
              {showResults && sourceContent.trim() && (
                <AutoComplianceResults content={sourceContent} />
              )}

              {/* Generated Media */}
              {showResults && results.length > 0 && (
                <GeneratedMedia results={results} userId={user.userId} />
              )}
            </div>
          )}

          {/* ══════ APPROVAL ══════ */}
          {activeSection === "approval" && (
            <div className="space-y-4">
              {chainRequests.length === 0 ? (
                <Card className="bg-[#1A1A1A] border-white/[0.06]">
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="text-[13px] text-white/30">No pending approvals</p>
                  </CardContent>
                </Card>
              ) : chainRequests.map((req: any) => (
                <Card key={req.id} className="bg-[#1A1A1A] border-white/[0.06]">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-[14px] font-medium text-white/90">{req.title}</h3>
                        <p className="text-[11px] text-white/30 mt-0.5">by {req.submitter} &middot; {req.outputTypes?.join(", ")}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${
                        req.status === "APPROVED" ? "border-[#8ED7A3]/30 text-[#8ED7A3]" :
                        req.status === "REJECTED" ? "border-[#C8442C]/30 text-[#C8442C]" :
                        "border-white/[0.1] text-white/40"
                      }`}>{req.status}</Badge>
                    </div>
                    {req.contentPreview && (
                      <p className="text-[12px] text-white/35 leading-relaxed mb-3 line-clamp-2">{req.contentPreview}</p>
                    )}
                    {req.status === "PENDING" && req.chain?.some((step: any) => step.userId === user?.userId && step.status === "PENDING") && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                        <Input
                          value={approvalComment}
                          onChange={e => setApprovalComment(e.target.value)}
                          placeholder="Comment (optional)"
                          className="flex-1 bg-white/[0.03] border-white/[0.08] text-white text-[12px] h-8"
                        />
                        <Button size="sm" className="bg-[#8ED7A3]/20 hover:bg-[#8ED7A3]/30 text-[#8ED7A3] border border-[#8ED7A3]/20 text-[12px] h-8"
                          onClick={() => handleApprovalDecision(req.id, "APPROVE")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="bg-[#C8442C]/10 hover:bg-[#C8442C]/20 text-[#C8442C] border border-[#C8442C]/20 text-[12px] h-8"
                          onClick={() => handleApprovalDecision(req.id, "REJECT")}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ══════ LINKAGE ══════ */}
          {activeSection === "linkage" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {["email", "linkedin", "twitter"].map(platform => (
                <Card key={platform} className="bg-[#1A1A1A] border-white/[0.06]">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                      <Link2 className="w-5 h-5 text-white/40" />
                    </div>
                    <h3 className="text-[14px] font-medium text-white/80 mb-1 capitalize">{platform}</h3>
                    {linkageStatus[platform]?.linked ? (
                      <div className="flex items-center justify-center gap-1.5 text-[12px] text-[#8ED7A3]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Linked as {linkageStatus[platform].accountName}</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 border-white/[0.1] text-white/60 text-[12px] h-8"
                        disabled={linkageLoading === platform}
                        onClick={() => handleLinkAccount(platform)}
                      >
                        {linkageLoading === platform ? "Linking..." : "Link Account"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ══════ GENERATE ══════ */}
          {activeSection === "generate" && (
            <Card className="bg-[#1A1A1A] border-white/[0.06]">
              <CardHeader className="pb-4">
                <CardTitle className="text-[15px] font-normal text-white flex items-center gap-2">
                  <Image className="w-4 h-4 text-[#C8442C]" /> Content Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={genPrompt}
                  onChange={e => setGenPrompt(e.target.value)}
                  placeholder="Describe what you want to generate..."
                  className="min-h-[100px] bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 font-light text-[13px] resize-y"
                />
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {(["image", "video", "presentation"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setGenType(t)}
                        className={`px-3 py-1.5 rounded-md text-[12px] font-medium border transition-all ${
                          genType === t ? "bg-[#C8442C]/15 border-[#C8442C]/30 text-[#C8442C]" : "border-white/[0.06] text-white/40 hover:text-white/60"
                        }`}
                      >
                        {t === "image" ? "🖼 Image" : t === "video" ? "🎬 Video" : "📊 Presentation"}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleGenerate} disabled={genLoading} className="bg-[#C8442C] hover:bg-[#B83A24] text-white text-[13px] font-medium">
                  <Zap className="w-4 h-4 mr-2" />
                  {genLoading ? "Generating..." : "Generate"}
                </Button>
                {genResult && (
                  <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[13px] text-[#8ED7A3] flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Generation complete
                    </p>
                    {genResult.url && <img src={genResult.url} alt="Generated" className="mt-3 max-w-sm rounded-lg border border-white/[0.08]" />}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ══════ OTHER SECTIONS (Analysis, DLP, Compliance) ══════ */}
          {/* ══════ DLP SCANNER ══════ */}
          {activeSection === "dlp" && <DLPScannerSection />}

          {/* ══════ ANALYSIS ══════ */}
          {activeSection === "analysis" && <AnalysisSection results={results} showResults={showResults} />}

          {/* ══════ COMPLIANCE ══════ */}
          {activeSection === "compliance" && <ComplianceSection />}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#121212] text-white/40">Loading...</div>}>
      <DashboardInner />
    </Suspense>
  );
}
