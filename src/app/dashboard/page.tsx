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
  const handleTransform = async () => {
    if (!sourceContent.trim()) { addNotification("Enter source content", "error"); return; }
    setProcessing(true); setPipelineStep(0); setShowResults(false);
    const stepTimer = setInterval(() => setPipelineStep(prev => Math.min(prev + 1, 6)), 900);
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transform", sourceContent, outputTypes: selectedOutputs, config, userId: user?.userId }),
      });
      const data = await res.json();
      if (data.success) { setResults(data.results || []); setShowResults(true); addNotification("Transformation complete!", "success"); }
      else addNotification(data.error || "Transformation failed", "error");
    } catch { addNotification("Connection error", "error"); }
    clearInterval(stepTimer); setProcessing(false);
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

                  {/* Output formats */}
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

                  {/* Config */}
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
                    <CardTitle className="text-[15px] font-normal text-[#8ED7A3] flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> {results.length} Outputs Generated
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {results.map((r: any, i: number) => (
                      <details key={i} className="group">
                        <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all list-none">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-white/30 transition-transform group-open:rotate-90" />
                            <span className="text-[13px] font-medium text-white/80">{r.title || r.type}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-white/[0.1] text-white/40">{r.type}</Badge>
                        </summary>
                        <div className="mt-2 p-4 rounded-lg bg-black/20 border border-white/[0.04]">
                          <pre className="text-[12px] text-white/50 font-light whitespace-pre-wrap max-h-60 overflow-auto">
                            {typeof r.content === "string" ? (() => { try { return JSON.stringify(JSON.parse(r.content), null, 2); } catch { return r.content; } })() : JSON.stringify(r.content, null, 2)}
                          </pre>
                        </div>
                      </details>
                    ))}
                  </CardContent>
                </Card>
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
          {(activeSection === "analysis" || activeSection === "dlp" || activeSection === "compliance") && (
            <Card className="bg-[#1A1A1A] border-white/[0.06]">
              <CardContent className="py-12 text-center">
                <Eye className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-[14px] text-white/50 mb-1">
                  {activeSection === "analysis" ? "Analysis & Review" : activeSection === "dlp" ? "DLP Scanner" : "Compliance Check"}
                </p>
                <p className="text-[12px] text-white/25">This module is accessible at your clearance level. Run a transformation to see analysis results.</p>
              </CardContent>
            </Card>
          )}
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
