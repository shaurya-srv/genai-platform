"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";

interface UserInfo { userId: string; username: string; displayName: string; role: string; roleLevel: string; email?: string; }
interface SectionDef { id: string; name: string; icon: string; color: string; minLevel: number; description: string; }

const ALL_SECTIONS: SectionDef[] = [
  { id: "transform", name: "Transformation AI", icon: "🤖", color: "#3b82f6", minLevel: 1, description: "Multi-source input to multi-format output" },
  { id: "generate", name: "Generation Hub", icon: "🎨", color: "#ec4899", minLevel: 1, description: "AI image, video & presentation generation" },
  { id: "approval", name: "Multi-Sign Approval", icon: "✍️", color: "#10b981", minLevel: 1, description: "Approval chain for content publication" },
  { id: "analysis", name: "Analysis & Review", icon: "📊", color: "#06b6d4", minLevel: 3, description: "Consistency scoring and quality metrics" },
  { id: "threat", name: "Threat Analysis", icon: "🔍", color: "#ef4444", minLevel: 3, description: "STIX/TAXII threat intelligence" },
  { id: "compliance", name: "Compliance Check", icon: "📋", color: "#f59e0b", minLevel: 5, description: "DPDP, GDPR, IT Act compliance" },
  { id: "dlp", name: "DLP Scanner", icon: "🛡️", color: "#8b5cf6", minLevel: 3, description: "Data Loss Prevention scanning" },
  { id: "incident", name: "Incident Response", icon: "🚨", color: "#ec4899", minLevel: 5, description: "Cascading incident response chain" },
  { id: "linkage", name: "External Linkage", icon: "🔗", color: "#0ea5e9", minLevel: 1, description: "Email, LinkedIn, X integration" },
];

const LEVEL_MAP: Record<string, number> = {
  chairman: 9, distinguished_scientist: 8, outstanding_scientist: 7,
  scientist_g: 6, scientist_f: 5, scientist_e: 4,
  scientist_d: 3, scientist_c: 2, general_scientist: 1,
};

const LEVEL_LABELS: Record<string, { label: string; icon: string; color: string; tier: string }> = {
  chairman: { label: "Chairman", icon: "🏛️", color: "#dc2626", tier: "Level 1 - Executive" },
  distinguished_scientist: { label: "Distinguished Scientist", icon: "🏆", color: "#ec4899", tier: "Level 1 - Executive" },
  outstanding_scientist: { label: "Outstanding Scientist", icon: "⭐", color: "#f43f5e", tier: "Level 1 - Executive" },
  scientist_g: { label: "Scientist G", icon: "👔", color: "#f59e0b", tier: "Level 2 - Senior Management" },
  scientist_f: { label: "Scientist F", icon: "📋", color: "#d97706", tier: "Level 2 - Senior Management" },
  scientist_e: { label: "Scientist E", icon: "📊", color: "#b45309", tier: "Level 2 - Senior Management" },
  scientist_d: { label: "Scientist D", icon: "📑", color: "#3b82f6", tier: "Level 3 - Middle Management" },
  scientist_c: { label: "Scientist C", icon: "📁", color: "#2563eb", tier: "Level 3 - Middle Management" },
  general_scientist: { label: "General Scientist", icon: "🔬", color: "#10b981", tier: "Level 4 - General Staff" },
};

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeSection, setActiveSection] = useState("transform");
  const [sourceContent, setSourceContent] = useState("");
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(["linkedin"]);
  const [results, setResults] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [config, setConfig] = useState({ audience: "general", tone: "formal", language: "en", detail: "standard", objective: "inform" });
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>(["image", "video", "presentation"]);
  const [notifications, setNotifications] = useState<{id: string; msg: string; type: string}[]>([]);
  const [transformMedia, setTransformMedia] = useState<any>(null);
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean | 'error'>>({});
  const [pptxDownloading, setPptxDownloading] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  
  // Approval chain state
  const [chainRequests, setChainRequests] = useState<any[]>([]);
  const [finalising, setFinalising] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  
  // Linkage state
  const [linkageStatus, setLinkageStatus] = useState<Record<string, any>>({});
  const [linkageLoading, setLinkageLoading] = useState("");
  
  // Audit state
  const [auditTimeline, setAuditTimeline] = useState<any[]>([]);
  const [auditChainHistory, setAuditChainHistory] = useState<any[]>([]);
  const [auditTab, setAuditTab] = useState<'pending' | 'timeline' | 'chain'>('pending');

  const markImageLoaded = (url: string) => setImageLoadStates(prev => ({ ...prev, [url]: true }));
  const markImageError = (url: string) => setImageLoadStates(prev => ({ ...prev, [url]: 'error' }));

  // Video playback auto-advance
  useEffect(() => {
    if (!videoPlaying || !transformMedia?.video?.scenes?.length) return;
    const scenes = transformMedia.video.scenes;
    const sceneDuration = (scenes[currentSceneIndex]?.duration || 4000);
    const timer = setTimeout(() => {
      if (currentSceneIndex < scenes.length - 1) {
        setCurrentSceneIndex(prev => prev + 1);
      } else {
        setVideoPlaying(false);
        setCurrentSceneIndex(0);
      }
    }, sceneDuration);
    return () => clearTimeout(timer);
  }, [videoPlaying, currentSceneIndex, transformMedia]);

  // Keyboard shortcuts for video playback
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!transformMedia?.video?.scenes?.length) return;
      const scenes = transformMedia.video.scenes;
      if (e.key === 'ArrowRight') {
        setCurrentSceneIndex(prev => Math.min(prev + 1, scenes.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSceneIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === ' ') {
        e.preventDefault();
        setVideoPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [transformMedia]);

  // Load approval chain requests, linkage status, and audit data
  useEffect(() => {
    if (activeSection === 'approval' && user) {
      fetch(`/api/approval-chain?action=pending&userId=${user.userId}&userLevel=${user.roleLevel}`).then(r => r.json()).then(data => {
        if (Array.isArray(data)) setChainRequests(data);
      }).catch(() => {});
      // Load audit timeline
      fetch('/api/audit?action=timeline').then(r => r.json()).then(data => {
        if (Array.isArray(data)) setAuditTimeline(data);
      }).catch(() => {});
      // Load chain history
      fetch('/api/audit?action=chain_history').then(r => r.json()).then(data => {
        if (Array.isArray(data)) setAuditChainHistory(data);
      }).catch(() => {});
    }
  }, [activeSection, user]);

  useEffect(() => {
    if (activeSection === 'linkage' && user) {
      fetch(`/api/linkage?action=status&userId=${user.userId}`).then(r => r.json()).then(data => {
        if (data && typeof data === 'object') setLinkageStatus(data);
      }).catch(() => {});
    }
  }, [activeSection, user]);

  // Generation Hub state
  const [genPrompt, setGenPrompt] = useState("");
  const [genType, setGenType] = useState<"image" | "video" | "presentation">("image");
  const [genStyle, setGenStyle] = useState("cinematic");
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [genImages, setGenImages] = useState<string[]>([]);

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

  const userLevel = user ? (LEVEL_MAP[user.roleLevel] || 1) : 1;
  const visibleSections = ALL_SECTIONS.filter(s => s.minLevel <= userLevel);
  const levelInfo = user ? LEVEL_LABELS[user.roleLevel] : null;

  const addNotification = useCallback((msg: string, type: string = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, msg, type }].slice(-5));
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const handleTransform = async () => {
    if (!sourceContent.trim()) { addNotification("Please enter source content", "error"); return; }
    setProcessing(true); setPipelineStep(0); setShowResults(false); setImageLoadStates({}); const stepTimer = setInterval(() => setPipelineStep(prev => Math.min(prev + 1, 6)), 900);
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transform", sourceContent, outputTypes: selectedOutputs, config, mediaTypes: selectedMediaTypes, userId: user?.userId }),
      });
      const data = await res.json();
      if (data.success) { setResults(data.results || []); setTransformMedia(data.media || null); setShowResults(true); addNotification("Transformation complete!", "success"); }
      else { addNotification(data.error || "Transformation failed", "error"); }
    } catch { addNotification("Connection error", "error"); }
    clearInterval(stepTimer); setProcessing(false);
  };

  const handleFinalise = async (result: any) => {
    if (!user) return;
    setFinalising(result.type);
    try {
      const res = await fetch("/api/approval-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalise",
          userId: user.userId,
          transformationId: result.type + "-" + Date.now(),
          title: result.title || result.type,
          contentPreview: typeof result.content === "string" ? result.content.substring(0, 200) : "",
          outputTypes: selectedOutputs,
          metadata: result.metadata,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification(`Finalised! Chain has ${data.request.chain.length} approval step(s)`, "success");
        setChainRequests(prev => [data.request, ...prev]);
      } else {
        addNotification(data.error || "Failed to finalise", "error");
      }
    } catch { addNotification("Connection error", "error"); }
    setFinalising(null);
  };

  const handleApprovalDecision = async (requestId: string, decision: "APPROVE" | "REJECT") => {
    if (!user) return;
    try {
      const res = await fetch("/api/approval-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          userId: user.userId,
          requestId,
          decision,
          comments: approvalComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification(decision === "APPROVE" ? "Approved!" : "Rejected", decision === "APPROVE" ? "success" : "error");
        setChainRequests(prev => prev.map(r => r.id === requestId ? data.request : r));
        if (data.fullyApproved) {
          addNotification("🎉 All approvals received! Auto-publishing...", "success");
          // Trigger auto-publish
          fetch("/api/linkage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "auto_publish", userId: user.userId, content: data.request.contentPreview, title: data.request.title }),
          });
        }
      } else {
        addNotification(data.error || "Action failed", "error");
      }
    } catch { addNotification("Connection error", "error"); }
    setApprovalComment("");
  };

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
        addNotification(`Linked ${platform} account!`, "success");
        setLinkageStatus(prev => ({ ...prev, [platform]: { linked: true, accountName: data.account.accountName, status: "LINKED" } }));
      } else {
        addNotification(data.error || "Failed to link", "error");
      }
    } catch { addNotification("Connection error", "error"); }
    setLinkageLoading("");
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim()) { addNotification("Please enter a prompt", "error"); return; }
    setGenLoading(true); setGenResult(null); setGenImages([]);
    try {
      if (genType === "image") {
        const res = await fetch("/api/generate/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: genPrompt, width: 1024, height: 1024, userId: user?.userId }),
        });
        const data = await res.json();
        if (data.success) {
          setGenResult(data);
          setGenImages([data.url]);
          addNotification("Image generated!", "success");
        } else { addNotification(data.error || "Image generation failed", "error"); }
      } else if (genType === "video") {
        const res = await fetch("/api/generate/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: genPrompt, sceneCount: 4, style: genStyle, userId: user?.userId }),
        });
        const data = await res.json();
        if (data.success) {
          setGenResult(data.storyboard);
          setGenImages(data.storyboard.scenes.map((s: any) => s.imageUrl));
          addNotification(`Video storyboard: ${data.storyboard.scenes.length} scenes`, "success");
        } else { addNotification(data.error || "Video generation failed", "error"); }
      } else if (genType === "presentation") {
        const res = await fetch("/api/generate/presentation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: genPrompt, title: genPrompt.split("\n")[0]?.substring(0, 60) || "Presentation", style: genStyle === "cinematic" ? "corporate" : genStyle, userId: user?.userId }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = res.headers.get("Content-Disposition")?.match(/filename=\"(.+?)\"/)?.[1] || "presentation.pptx";
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setGenResult({ type: "pptx", downloaded: true, slideCount: res.headers.get("X-Slide-Count") });
          addNotification(`Presentation downloaded (${res.headers.get("X-Slide-Count")} slides)`, "success");
        } else { addNotification("Presentation generation failed", "error"); }
      }
    } catch { addNotification("Connection error", "error"); }
    setGenLoading(false);
  };

  if (!user) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "#94a3b8" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #020617 0%, #0f172a 50%, #0f172a 100%)", color: "#e2e8f0" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      {processing && <ProcessingOverlay isVisible={true} currentStep={pipelineStep} steps={[
  { id: 'ingest', label: 'Ingesting', icon: '📄', detail: 'Reading source content', status: pipelineStep >= 1 ? 'done' : 'active' },
  { id: 'analyze', label: 'Analyzing', icon: '🧠', detail: 'Running DLP scan & threat analysis', status: pipelineStep >= 2 ? 'done' : pipelineStep === 1 ? 'active' : 'pending' },
  { id: 'transform', label: 'Transforming', icon: '⚡', detail: 'Generating text outputs', status: pipelineStep >= 3 ? 'done' : pipelineStep === 2 ? 'active' : 'pending' },
  { id: 'media', label: 'Generating Media', icon: '🎨', detail: 'Creating AI image, video scenes & PPTX', status: pipelineStep >= 4 ? 'done' : pipelineStep === 3 ? 'active' : 'pending' },
  { id: 'validate', label: 'Validating', icon: '🛡️', detail: 'Running compliance checks', status: pipelineStep >= 5 ? 'done' : pipelineStep === 4 ? 'active' : 'pending' },
  { id: 'finalize', label: 'Finalizing', icon: '✅', detail: 'Recording on blockchain', status: pipelineStep >= 6 ? 'done' : pipelineStep === 5 ? 'active' : 'pending' },
]} />}

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(20px)", background: "rgba(2,6,23,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0.75rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>{"🛡️"}</div>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f1f5f9" }}>NTRO Dashboard</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {levelInfo && (
              <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: 6, background: levelInfo.color + "20", color: levelInfo.color, fontWeight: 600 }}>{levelInfo.icon} {levelInfo.label}</span>
            )}
            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{user.displayName}</span>
            <button onClick={() => { localStorage.clear(); router.push("/login"); }} style={{ padding: "0.4rem 0.8rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer" }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem 2rem" }}>
        {/* Welcome Card */}
        <div style={{ padding: "1.5rem 2rem", borderRadius: 16, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.25rem" }}>Welcome, {user.displayName}</h1>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{levelInfo?.tier} • {visibleSections.length} of {ALL_SECTIONS.length} sections accessible</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {ALL_SECTIONS.filter(s => s.minLevel > userLevel).slice(0, 2).map(s => (
              <span key={s.id} style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "#64748b" }}>{"🔒"} {s.name}</span>
            ))}
          </div>
        </div>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {ALL_SECTIONS.map(s => {
            const accessible = s.minLevel <= userLevel;
            return (
              <button key={s.id} onClick={() => accessible && setActiveSection(s.id)} style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid " + (activeSection === s.id ? s.color : "rgba(255,255,255,0.08)"), background: activeSection === s.id ? s.color + "15" : "rgba(15,23,42,0.6)", color: accessible ? (activeSection === s.id ? s.color : "#94a3b8") : "#475569", fontSize: "0.8rem", fontWeight: 600, cursor: accessible ? "pointer" : "not-allowed", transition: "all 0.2s", opacity: accessible ? 1 : 0.5 }}>
                {s.icon} {s.name} {!accessible && "🔒"}
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        <div style={{ padding: "1.5rem 2rem", borderRadius: 16, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", minHeight: 400 }}>

          {/* TRANSFORM SECTION */}
          {activeSection === "transform" && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#3b82f6", marginBottom: "1rem" }}>🤖 Transformation AI</h2>
              <textarea value={sourceContent} onChange={e => setSourceContent(e.target.value)} placeholder="Enter your source content — text, URLs, prompts, or paste content from any source..." style={{ width: "100%", minHeight: 150, padding: "1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#f1f5f9", fontSize: "0.85rem", resize: "vertical", outline: "none" }} />
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 600 }}>Output Formats</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {["linkedin", "twitter", "advisory", "executive_summary", "presentation", "infographic", "video", "crisis_response"].map(type => (
                    <button key={type} onClick={() => setSelectedOutputs(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])} style={{ padding: "0.4rem 0.8rem", borderRadius: 6, border: "1px solid " + (selectedOutputs.includes(type) ? "#3b82f6" : "rgba(255,255,255,0.08)"), background: selectedOutputs.includes(type) ? "rgba(59,130,246,0.15)" : "transparent", color: selectedOutputs.includes(type) ? "#3b82f6" : "#94a3b8", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                      {type.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                {Object.entries({ audience: ["general", "technical", "executive"], tone: ["formal", "casual", "technical"], language: ["en", "hi"], detail: ["brief", "standard", "detailed"], objective: ["inform", "persuade", "instruct"] }).map(([key, opts]) => (
                  <div key={key}>
                    <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "0.25rem", textTransform: "capitalize" }}>{key}</div>
                    <select value={(config as any)[key]} onChange={e => setConfig(prev => ({ ...prev, [key]: e.target.value }))} style={{ width: "100%", padding: "0.4rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: "0.7rem" }}>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 600 }}>Generated Media</div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {[{ id: "image", icon: "🖼️", label: "AI Image", desc: "Pollinations.ai" }, { id: "video", icon: "🎬", label: "Video Scenes", desc: "4-scene storyboard" }, { id: "presentation", icon: "📊", label: "PPTX Deck", desc: "Downloadable .pptx" }].map(m => (
                    <label key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.8rem", borderRadius: 6, border: "1px solid " + (selectedMediaTypes.includes(m.id) ? "#8b5cf6" : "rgba(255,255,255,0.08)"), background: selectedMediaTypes.includes(m.id) ? "rgba(139,92,246,0.12)" : "transparent", cursor: "pointer", transition: "all 0.15s" }}>
                      <input type="checkbox" checked={selectedMediaTypes.includes(m.id)} onChange={() => setSelectedMediaTypes(prev => prev.includes(m.id) ? prev.filter(t => t !== m.id) : [...prev, m.id])} style={{ accentColor: '#8b5cf6', width: 14, height: 14, cursor: 'pointer' }} />
                      <span style={{ fontSize: "0.75rem", color: selectedMediaTypes.includes(m.id) ? '#c4b5fd' : '#94a3b8', fontWeight: 600 }}>{m.icon} {m.label}</span>
                      <span style={{ fontSize: "0.6rem", color: '#64748b' }}>{m.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={handleTransform} style={{ marginTop: "1rem", padding: "0.75rem 2rem", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>⚡ Transform</button>

              {/* Results display */}
              {showResults && results.length > 0 && (
                <div style={{ marginTop: "1.5rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981", marginBottom: "0.75rem" }}>✅ Transformation Complete — {results.length} outputs generated</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {results.map((r: any, i: number) => (
                      <details key={i} style={{ padding: "1rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <summary style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#3b82f6" }}>{r.title || r.type}</span>
                          </div>
                          <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: 4, background: "rgba(59,130,246,0.15)", color: "#3b82f6", fontWeight: 600 }}>{r.type}</span>
                        </summary>
                        <div style={{ marginTop: "0.75rem", borderRadius: 8, background: "rgba(0,0,0,0.2)", overflow: "auto" }}>
                          {r.type === 'presentation' ? (() => {
                            try {
                              const contentObj = typeof r.content === 'string' ? JSON.parse(r.content) : r.content;
                              const deck = contentObj.slideDeck || contentObj;
                              const slides = deck.slides || [];
                              return (
                                <div>
                                  {/* Slide navigator */}
                                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>{deck.title || 'Presentation'}</div>
                                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>{slides.length} slides • {deck.estimatedDuration || ''} • {deck.theme || ''}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                      {slides.map((_: any, si: number) => (
                                        <div key={si} style={{ width: 24, height: 18, borderRadius: 3, background: slides[si]?.accentColor ? '#' + slides[si].accentColor + '40' : 'rgba(59,130,246,0.2)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: '#94a3b8' }}>{si + 1}</div>
                                      ))}
                                    </div>
                                  </div>
                                  {/* Visual slides */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
                                    {slides.map((slide: any, si: number) => {
                                      const accent = slide.accentColor || '3b82f6';
                                      const isTitle = slide.layout === 'title';
                                      const isConclusion = slide.layout === 'conclusion';
                                      return (
                                        <div key={si} style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', background: isTitle ? `linear-gradient(135deg, #${accent}, #${accent}cc)` : isConclusion ? `linear-gradient(135deg, #${accent}, #e94560)` : 'rgba(255,255,255,0.04)' }}>
                                          {/* Slide header bar */}
                                          <div style={{ padding: '0.3rem 0.75rem', background: `#${accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>SLIDE {slide.slideNumber}</span>
                                            <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.6)' }}>{slide.layout}</span>
                                          </div>
                                          {/* Slide body */}
                                          <div style={{ padding: isTitle ? '1.5rem 1.25rem' : '0.75rem 1rem' }}>
                                            <div style={{ fontSize: isTitle ? '1rem' : '0.8rem', fontWeight: 700, color: isTitle || isConclusion ? '#fff' : '#f1f5f9', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                                              {slide.title}
                                            </div>
                                            {Array.isArray(slide.content) && slide.content.length > 0 && (
                                              <ul style={{ margin: 0, padding: '0 0 0 1rem' }}>
                                                {slide.content.filter((c: string) => c).map((line: string, li: number) => (
                                                  <li key={li} style={{ fontSize: '0.7rem', color: isTitle ? 'rgba(255,255,255,0.85)' : '#cbd5e1', lineHeight: 1.5, marginBottom: '0.15rem' }}>{line}</li>
                                                ))}
                                              </ul>
                                            )}
                                          </div>
                                          {/* Speaker notes */}
                                          {slide.notes && (
                                            <div style={{ padding: '0.4rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
                                              <span style={{ fontSize: '0.55rem', color: '#64748b', fontStyle: 'italic' }}>📝 {slide.notes}</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {/* Design guide */}
                                  {contentObj.designGuide && (
                                    <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                      <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>🎨 Design Guide</div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                        {contentObj.designGuide.recommendations?.map((rec: string, ri: number) => (
                                          <span key={ri} style={{ fontSize: '0.55rem', padding: '0.15rem 0.4rem', borderRadius: 3, background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{rec}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            } catch (e) {
                              console.error('Presentation render error:', e);
                              const fallback = typeof r.content === 'string' ? r.content : JSON.stringify(r.content, null, 2);
                              return <pre style={{ margin: 0, padding: '1rem', fontFamily: 'inherit', fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{fallback}</pre>;
                            }
                          })(                          ) : (
                            <div style={{ padding: '1rem', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 400 }}>
                              {typeof r.content === 'string' ? (() => {
                                try {
                                  const parsed = JSON.parse(r.content);
                                  return <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: '0.75rem', color: '#94a3b8' }}>{JSON.stringify(parsed, null, 2)}</pre>;
                                } catch {
                                  return r.content;
                                }
                              })() : typeof r.content === 'object' && r.content !== null ? (
                                <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: '0.75rem', color: '#94a3b8' }}>{JSON.stringify(r.content, null, 2)}</pre>
                              ) : <span>No content</span>}
                            </div>
                          )}
                        </div>
                        {r.metadata && (
                          <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {Object.entries(r.metadata).map(([k, v]) => {
                              if (k === 'slides') return <span key={k} style={{ fontSize: "0.6rem", padding: "0.15rem 0.4rem", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "#64748b" }}>{k}: {Array.isArray(v) ? `${v.length} slides` : String(v)}</span>;
                              return <span key={k} style={{ fontSize: "0.6rem", padding: "0.15rem 0.4rem", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "#64748b" }}>{k}: {Array.isArray(v) ? v.join(', ') : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}</span>;
                            })}
                          </div>
                        )}
                      </details>
                    ))}
                  </div>

                  {/* === GENERATED MEDIA === */}
                  {transformMedia && (() => {
                    const allImageUrls: string[] = [];
                    if (transformMedia.image?.url) allImageUrls.push(transformMedia.image.url);
                    if (transformMedia.video?.scenes) transformMedia.video.scenes.forEach((s: any) => allImageUrls.push(s.imageUrl));
                    const loadedCount = allImageUrls.filter(u => imageLoadStates[u] === true).length;
                    const errorCount = allImageUrls.filter(u => imageLoadStates[u] === 'error').length;
                    const allLoaded = allImageUrls.length > 0 && loadedCount + errorCount === allImageUrls.length;
                    return (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ec4899' }}>🎨 Generated Media</span>
                        {allImageUrls.length > 0 && !allLoaded && (
                          <span style={{ fontSize: '0.7rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            Loading assets... {loadedCount}/{allImageUrls.length}
                          </span>
                        )}
                        {allLoaded && (
                          <span style={{ fontSize: '0.7rem', color: '#10b981' }}>✅ All assets loaded</span>
                        )}
                      </div>
                      {allImageUrls.length > 0 && !allLoaded && (
                        <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: '1rem', overflow: 'hidden' }}>
                          <div style={{ width: `${(loadedCount / allImageUrls.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #ec4899, #8b5cf6)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                        </div>
                      )}

                      {/* AI Image Preview */}
                      {transformMedia.image?.url && (
                        <div style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
                            🖼️ AI Generated Image
                            {!imageLoadStates[transformMedia.image.url] && imageLoadStates[transformMedia.image.url] !== 'error' && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: '#f59e0b' }}>⏳ Generating...</span>
                            )}
                            {imageLoadStates[transformMedia.image.url] === 'error' && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: '#ef4444' }}>⚠️ Failed to load</span>
                            )}
                          </div>
                          {!imageLoadStates[transformMedia.image.url] && imageLoadStates[transformMedia.image.url] !== 'error' ? (
                            <div style={{ width: '100%', maxWidth: 600, height: 338, borderRadius: 10, background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
                              <div style={{ width: 40, height: 40, border: '3px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AI is generating your image...</div>
                              <div style={{ fontSize: '0.6rem', color: '#64748b' }}>This usually takes 5-15 seconds</div>
                            </div>
                          ) : imageLoadStates[transformMedia.image.url] === 'error' ? (
                            <div style={{ width: '100%', maxWidth: 600, height: 200, borderRadius: 10, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ fontSize: '1.5rem' }}>⚠️</div>
                              <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Image generation failed</div>
                              <a href={transformMedia.image.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#3b82f6', textDecoration: 'underline' }}>Try opening URL directly</a>
                            </div>
                          ) : (
                            <img src={transformMedia.image.url} alt="AI generated" onLoad={() => markImageLoaded(transformMedia.image.url)} onError={() => markImageError(transformMedia.image.url)} style={{ width: '100%', maxWidth: 600, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }} />
                          )}
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                            <a href={transformMedia.image.url} target="_blank" rel="noopener noreferrer" style={{ padding: '0.4rem 1rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: '0.75rem', textDecoration: 'none' }}>↗️ Open Full Size</a>
                          </div>
                        </div>
                      )}

                      {/* Video Storyboard Player */}
                      {transformMedia.video?.scenes?.length > 0 && (() => {
                        const scenes = transformMedia.video.scenes;
                        const activeScene = scenes[currentSceneIndex];
                        const totalDuration = scenes.reduce((sum: number, s: any) => sum + (s.duration || 4000), 0);
                        const elapsedBefore = scenes.slice(0, currentSceneIndex).reduce((sum: number, s: any) => sum + (s.duration || 4000), 0);
                        const progress = ((elapsedBefore + ((activeScene?.duration || 4000) / 2)) / totalDuration) * 100;
                        return (
                        <div style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {/* Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>🎬 Video Storyboard — {scenes.length} scenes</div>
                            <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{totalDuration / 1000}s total • Space to play/pause • ← → to navigate</div>
                          </div>

                          {/* Main scene viewer */}
                          <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.3)', aspectRatio: '16/9', maxHeight: 360 }}>
                            {/* Scene image with fade transition */}
                            <img
                              src={activeScene.imageUrl}
                              alt={`Scene ${activeScene.sceneNumber}`}
                              key={currentSceneIndex}
                              onLoad={() => markImageLoaded(activeScene.imageUrl)}
                              onError={() => markImageError(activeScene.imageUrl)}
                              style={{
                                width: '100%', height: '100%', objectFit: 'cover',
                                opacity: imageLoadStates[activeScene.imageUrl] === true ? 1 : 0.3,
                                transition: 'opacity 0.5s ease-in-out',
                              }}
                            />
                            {/* Gradient overlay at bottom */}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }} />
                            {/* Scene number badge */}
                            <div style={{ position: 'absolute', top: 12, left: 12, padding: '0.3rem 0.7rem', borderRadius: 6, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>
                              Scene {activeScene.sceneNumber} / {scenes.length}
                            </div>
                            {/* Narration text overlay */}
                            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                              <div style={{ fontSize: '0.85rem', color: '#f1f5f9', lineHeight: 1.5, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                                {activeScene.narration || ''}
                              </div>
                            </div>
                            {/* Loading spinner for scene image */}
                            {imageLoadStates[activeScene.imageUrl] !== true && imageLoadStates[activeScene.imageUrl] !== 'error' && (
                              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                <div style={{ width: 36, height: 36, border: '3px solid rgba(236,72,153,0.3)', borderTopColor: '#ec4899', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                              </div>
                            )}
                          </div>

                          {/* Playback controls */}
                          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {/* Prev button */}
                            <button onClick={() => { setVideoPlaying(false); setCurrentSceneIndex(prev => Math.max(prev - 1, 0)); }} disabled={currentSceneIndex === 0} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: currentSceneIndex === 0 ? '#475569' : '#f1f5f9', fontSize: '0.8rem', cursor: currentSceneIndex === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏮</button>
                            {/* Play/Pause button */}
                            <button onClick={() => {
                              if (videoPlaying) {
                                setVideoPlaying(false);
                              } else {
                                if (currentSceneIndex === scenes.length - 1) setCurrentSceneIndex(0);
                                setVideoPlaying(true);
                              }
                            }} style={{ width: 40, height: 40, borderRadius: 8, border: 'none', background: videoPlaying ? 'rgba(236,72,153,0.2)' : 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{videoPlaying ? '⏸' : '▶️'}</button>
                            {/* Next button */}
                            <button onClick={() => { setVideoPlaying(false); setCurrentSceneIndex(prev => Math.min(prev + 1, scenes.length - 1)); }} disabled={currentSceneIndex === scenes.length - 1} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: currentSceneIndex === scenes.length - 1 ? '#475569' : '#f1f5f9', fontSize: '0.8rem', cursor: currentSceneIndex === scenes.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏭</button>
                            {/* Time display */}
                            <span style={{ fontSize: '0.65rem', color: '#64748b', minWidth: 60 }}>{(elapsedBefore / 1000).toFixed(1)}s / {(totalDuration / 1000).toFixed(1)}s</span>
                            <div style={{ flex: 1 }} />
                            {/* Scene dots / filmstrip */}
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                              {scenes.map((_: any, si: number) => (
                                <button key={si} onClick={() => { setVideoPlaying(false); setCurrentSceneIndex(si); }} style={{ width: si === currentSceneIndex ? 24 : 10, height: 10, borderRadius: 5, border: 'none', background: si === currentSceneIndex ? '#ec4899' : si < currentSceneIndex ? 'rgba(236,72,153,0.4)' : 'rgba(255,255,255,0.15)', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} title={`Scene ${si + 1}`} />
                              ))}
                            </div>
                          </div>

                          {/* Timeline progress bar */}
                          <div style={{ marginTop: '0.5rem', position: 'relative', height: 28 }}>
                            <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #ec4899, #8b5cf6)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                            </div>
                            {/* Scene markers on timeline */}
                            {scenes.map((scene: any, si: number) => {
                              const sceneStart = scenes.slice(0, si).reduce((sum: number, s: any) => sum + (s.duration || 4000), 0);
                              const pos = (sceneStart / totalDuration) * 100;
                              return (
                                <div key={si} onClick={() => { setVideoPlaying(false); setCurrentSceneIndex(si); }} style={{ position: 'absolute', left: `${pos}%`, top: 4, width: 2, height: 18, background: si <= currentSceneIndex ? '#ec4899' : 'rgba(255,255,255,0.15)', cursor: 'pointer', transition: 'background 0.2s' }} title={`Scene ${si + 1}: ${scene.narration?.substring(0, 40)}`} />
                              );
                            })}
                          </div>

                          {/* Thumbnail strip */}
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                            {scenes.map((scene: any, si: number) => {
                              const isLoaded = imageLoadStates[scene.imageUrl] === true;
                              const isActive = si === currentSceneIndex;
                              return (
                                <div key={si} onClick={() => { setVideoPlaying(false); setCurrentSceneIndex(si); }} style={{ minWidth: 80, cursor: 'pointer', borderRadius: 6, overflow: 'hidden', border: isActive ? '2px solid #ec4899' : '2px solid transparent', opacity: isActive ? 1 : 0.6, transition: 'all 0.2s', flexShrink: 0 }}>
                                  {isLoaded ? (
                                    <img src={scene.imageUrl} alt={`Scene ${scene.sceneNumber}`} style={{ width: 80, height: 45, objectFit: 'cover', display: 'block' }} />
                                  ) : (
                                    <div style={{ width: 80, height: 45, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <div style={{ width: 12, height: 12, border: '2px solid rgba(236,72,153,0.3)', borderTopColor: '#ec4899', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        );
                      })()}

                      {/* Presentation Download */}
                      {transformMedia.presentation && (
                        <div style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ fontSize: '2rem' }}>📊</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{transformMedia.presentation.fileName}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>{transformMedia.presentation.slideCount} slides • Ready to download</div>
                          </div>
                          <button disabled={pptxDownloading} onClick={async () => {
                            setPptxDownloading(true);
                            try {
                              const base64 = transformMedia.presentation.base64;
                              const binary = atob(base64);
                              const bytes = new Uint8Array(binary.length);
                              for (let bi = 0; bi < binary.length; bi++) bytes[bi] = binary.charCodeAt(bi);
                              const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url; a.download = transformMedia.presentation.fileName;
                              document.body.appendChild(a); a.click(); document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } finally {
                              setPptxDownloading(false);
                            }
                          }} style={{ padding: '0.5rem 1.5rem', borderRadius: 8, border: 'none', background: pptxDownloading ? '#475569' : 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: pptxDownloading ? 'not-allowed' : 'pointer', opacity: pptxDownloading ? 0.7 : 1 }}>{pptxDownloading ? '⏳ Preparing...' : '⬇️ Download PPTX'}</button>
                        </div>
                      )}
                    </div>
                    ); })()}

                    {/* Finalise — Submit for approval chain */}
                    {results.length > 0 && (
                      <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: 10, background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.1))', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>✅ Ready to Finalise?</div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>Submit for approval. Routes through command chain based on content risk level, then auto-publishes to linked platforms.</p>
                        <button
                          onClick={async () => { for (const r of results) await handleFinalise(r); }}
                          disabled={finalising !== null}
                          style={{ padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none', background: finalising ? '#475569' : 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: finalising ? 'not-allowed' : 'pointer' }}
                        >{finalising ? '⏳ Submitting...' : '🏁 Finalise & Submit for Approval'}</button>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* GENERATION HUB SECTION */}
          {activeSection === "generate" && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ec4899", marginBottom: "1rem" }}>🎨 Generation Hub</h2>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "1rem" }}>Generate AI images, video storyboards, and presentations from text prompts.</p>

              {/* Generation Type Selector */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                {[{ id: "image" as const, label: "🖼️ Image", desc: "AI-generated image" }, { id: "video" as const, label: "🎬 Video", desc: "Animated storyboard" }, { id: "presentation" as const, label: "📊 Presentation", desc: "Downloadable PPTX" }].map(t => (
                  <button key={t.id} onClick={() => { setGenType(t.id); setGenResult(null); setGenImages([]); }} style={{ padding: "0.75rem 1.25rem", borderRadius: 10, border: "1px solid " + (genType === t.id ? "#ec4899" : "rgba(255,255,255,0.08)"), background: genType === t.id ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.03)", color: genType === t.id ? "#ec4899" : "#94a3b8", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{t.label}</div>
                    <div style={{ fontSize: "0.65rem", opacity: 0.7, marginTop: 2 }}>{t.desc}</div>
                  </button>
                ))}
              </div>

              {/* Prompt Input */}
              <textarea value={genPrompt} onChange={e => setGenPrompt(e.target.value)} placeholder={genType === "image" ? "Describe the image you want to generate..." : genType === "video" ? "Describe the video content — each sentence becomes a scene..." : "Paste your content here — it will be converted to slides..."} style={{ width: "100%", minHeight: 100, padding: "1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#f1f5f9", fontSize: "0.85rem", resize: "vertical", outline: "none" }} />

              {/* Style + Generate Button Row */}
              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "0.25rem" }}>Style</div>
                  <select value={genStyle} onChange={e => setGenStyle(e.target.value)} style={{ padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: "0.8rem" }}>
                    {genType === "image" && <><option value="cinematic">Cinematic</option><option value="professional">Professional</option><option value="animated">Animated</option><option value="futuristic">Futuristic</option></>}
                    {genType === "video" && <><option value="cinematic">Cinematic</option><option value="professional">Professional</option><option value="documentary">Documentary</option><option value="animated">Animated</option><option value="futuristic">Futuristic</option></>}
                    {genType === "presentation" && <><option value="corporate">Corporate</option><option value="modern">Modern</option><option value="academic">Academic</option><option value="creative">Creative</option></>}
                  </select>
                </div>
                <button onClick={handleGenerate} disabled={genLoading} style={{ marginTop: "1rem", padding: "0.75rem 2rem", borderRadius: 10, border: "none", background: genLoading ? "#475569" : "linear-gradient(135deg, #ec4899, #8b5cf6)", color: "#fff", fontSize: "0.9rem", fontWeight: 700, cursor: genLoading ? "not-allowed" : "pointer", opacity: genLoading ? 0.7 : 1 }}>{genLoading ? "⏳ Generating..." : genType === "image" ? "🖼️ Generate Image" : genType === "video" ? "🎬 Generate Video" : "📊 Generate Presentation"}</button>
              </div>

              {/* Results Display */}
              {genImages.length > 0 && (
                <div style={{ marginTop: "1.5rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ec4899", marginBottom: "0.75rem" }}>✅ Generated {genImages.length} {genType === "image" ? "image" : genType === "video" ? "scene(s)" : "slides"}</div>

                  {/* Image results */}
                  {genType === "image" && genImages.map((url, i) => (
                    <div key={i} style={{ marginBottom: "1rem" }}>
                      <img src={url} alt={genPrompt} style={{ width: "100%", maxWidth: 512, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }} />
                      <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ padding: "0.4rem 1rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: "0.75rem", textDecoration: "none" }}>↗️ Open Full Size</a>
                        <button onClick={() => { const a = document.createElement("a"); a.href = url; a.download = `ai-image-${Date.now()}.png`; a.click(); }} style={{ padding: "0.4rem 1rem", borderRadius: 6, border: "1px solid rgba(236,72,153,0.3)", background: "rgba(236,72,153,0.1)", color: "#ec4899", fontSize: "0.75rem", cursor: "pointer" }}>⬇️ Save</button>
                      </div>
                    </div>
                  ))}

                  {/* Video storyboard results */}
                  {genType === "video" && genResult?.scenes && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
                        {genResult.scenes.map((scene: any, i: number) => (
                          <div key={i} style={{ borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <div style={{ position: "relative" }}>
                              <img src={scene.imageUrl} alt={`Scene ${scene.sceneNumber}`} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                              <div style={{ position: "absolute", top: 8, left: 8, padding: "0.2rem 0.5rem", borderRadius: 4, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: "0.65rem", fontWeight: 700 }}>Scene {scene.sceneNumber}</div>
                              <div style={{ position: "absolute", top: 8, right: 8, padding: "0.2rem 0.5rem", borderRadius: 4, background: "rgba(236,72,153,0.8)", color: "#fff", fontSize: "0.6rem" }}>{scene.duration / 1000}s</div>
                            </div>
                            <div style={{ padding: "0.5rem 0.75rem" }}>
                              <p style={{ fontSize: "0.7rem", color: "#94a3b8", lineHeight: 1.4, margin: 0 }}>{scene.narration?.substring(0, 100)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => { if (genResult?.scenes) { genResult.scenes.forEach((s: any, i: number) => { setTimeout(() => window.open(s.imageUrl, "_blank"), i * 500); }); } }} style={{ padding: "0.5rem 1rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer" }}>↗️ Open All Scenes</button>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", display: "flex", alignItems: "center" }}>Total duration: {genResult.totalDuration / 1000}s • {genResult.scenes.length} scenes</div>
                      </div>
                    </div>
                  )}

                  {/* Presentation result */}
                  {genType === "presentation" && genResult?.downloaded && (
                    <div style={{ padding: "1.5rem", borderRadius: 10, background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)", textAlign: "center" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#ec4899" }}>Presentation Downloaded!</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>{genResult.slideCount} slides generated</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RESULTS SECTION */}
          {activeSection === "approval" && (
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#10b981", marginBottom: "0.5rem" }}>✍️ Command Chain Approval</h2>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.75rem" }}>Content goes through role-based approval chain. Higher risk = more approvals needed.</p>
              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                {[{ id: 'pending' as const, label: '⏳ Pending', count: chainRequests.length }, { id: 'timeline' as const, label: '📋 Audit Timeline', count: auditTimeline.length }, { id: 'chain' as const, label: '🔗 Hash Chain', count: auditChainHistory.length }].map(tab => (
                  <button key={tab.id} onClick={() => setAuditTab(tab.id)} style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: `1px solid ${auditTab === tab.id ? '#10b981' : 'rgba(255,255,255,0.08)'}`, background: auditTab === tab.id ? 'rgba(16,185,129,0.12)' : 'transparent', color: auditTab === tab.id ? '#10b981' : '#94a3b8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>{tab.label} ({tab.count})</button>
                ))}
              </div>
              {/* Pending Tab */}
              {auditTab === 'pending' && (chainRequests.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {chainRequests.map((cr: any, i: number) => (
                    <div key={i} style={{ padding: "1rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f1f5f9" }}>{cr.title}</span>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: 4, background: cr.riskLevel === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : cr.riskLevel === 'HIGH' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)', color: cr.riskLevel === 'CRITICAL' ? '#ef4444' : cr.riskLevel === 'HIGH' ? '#f59e0b' : '#3b82f6' }}>{cr.riskLevel}</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: cr.status === 'APPROVED' ? 'rgba(16,185,129,0.15)' : cr.status === 'REJECTED' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: cr.status === 'APPROVED' ? '#10b981' : cr.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }}>{cr.status}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.5rem' }}>Submitted by {cr.submittedByName} • {cr.outputTypes?.join(', ')} • {cr.chain?.length} approval step(s)</div>
                      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        {cr.chain?.map((step: any, si: number) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ padding: '0.3rem 0.6rem', borderRadius: 6, background: step.status === 'COMPLETED' && step.decision === 'APPROVE' ? 'rgba(16,185,129,0.15)' : step.status === 'COMPLETED' && step.decision === 'REJECT' ? 'rgba(239,68,68,0.15)' : step.status === 'ACTIVE' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)', border: step.status === 'ACTIVE' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ fontSize: '0.6rem', color: step.status === 'COMPLETED' && step.decision === 'APPROVE' ? '#10b981' : step.status === 'ACTIVE' ? '#3b82f6' : '#64748b' }}>{step.status === 'COMPLETED' ? (step.decision === 'APPROVE' ? '✅' : '❌') : step.status === 'ACTIVE' ? '🔵' : '⏳'} {step.requiredRoleName}</div>
                              {step.approverName && <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: 2 }}>{step.approverName}</div>}
                            </div>
                            {si < cr.chain.length - 1 && <span style={{ color: '#475569', fontSize: '0.7rem' }}>→</span>}
                          </div>
                        ))}
                      </div>
                      {cr.status !== 'APPROVED' && cr.status !== 'REJECTED' && cr.status !== 'PUBLISHED' && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button onClick={() => handleApprovalDecision(cr.id, 'APPROVE')} style={{ padding: '0.4rem 1rem', borderRadius: 6, border: 'none', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>✅ Approve</button>
                          <button onClick={() => handleApprovalDecision(cr.id, 'REJECT')} style={{ padding: '0.4rem 1rem', borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>❌ Reject</button>
                          <input value={approvalComment} onChange={e => setApprovalComment(e.target.value)} placeholder="Comments..." style={{ flex: 1, padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: '0.75rem', outline: 'none' }} />
                        </div>
                      )}
                      {/* Post-approval actions */}
                      {(cr.status === 'APPROVED' || cr.status === 'PUBLISHED') && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          <button onClick={async () => {
                            const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approval_report', userId: user?.userId, requestId: cr.id }) });
                            if (res.ok) { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `approval-report-${cr.id}.pdf`; a.click(); URL.revokeObjectURL(url); }
                          }} style={{ padding: '0.35rem 0.8rem', borderRadius: 6, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>📄 PDF Report</button>
                          {cr.outputTypes?.filter((t: string) => ['linkedin', 'twitter'].includes(t)).map((platform: string) => (
                            <button key={platform} onClick={async () => {
                              const optimalRes = await fetch(`/api/schedule?action=optimal&platform=${platform}`);
                              const optimal = await optimalRes.json();
                              await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'schedule', userId: user?.userId, title: cr.title, content: cr.contentPreview || cr.title, platform, accountId: 'demo', scheduledAt: optimal.timestamp }) });
                              addNotification(`Scheduled for ${platform} at ${new Date(optimal.timestamp).toLocaleString()}`, 'success');
                            }} style={{ padding: '0.35rem 0.8rem', borderRadius: 6, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#34d399', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>⏰ Schedule {platform}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✍️</div>
                  <p style={{ fontSize: '0.9rem' }}>No approval requests yet</p>
                  <p style={{ fontSize: '0.75rem' }}>Transform content, then click Finalise to start the approval chain</p>
                </div>
              ))}
              {/* Audit Timeline Tab */}
              {auditTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {auditTimeline.length > 0 ? auditTimeline.map((item: any, i: number) => (
                    <div key={i} style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9' }}>{item.title}</span>
                          <span style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem', borderRadius: 4, background: item.riskLevel === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : item.riskLevel === 'HIGH' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)', color: item.riskLevel === 'CRITICAL' ? '#ef4444' : item.riskLevel === 'HIGH' ? '#f59e0b' : '#3b82f6' }}>{item.riskLevel}</span>
                        </div>
                        <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: 4, background: item.status === 'APPROVED' || item.status === 'PUBLISHED' ? 'rgba(16,185,129,0.15)' : item.status === 'REJECTED' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: item.status === 'APPROVED' || item.status === 'PUBLISHED' ? '#10b981' : item.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }}>{item.status}</span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.5rem' }}>By {item.submittedBy} • {new Date(item.submittedAt).toLocaleString()}</div>
                      {/* Timeline steps */}
                      <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                        {item.steps?.map((step: any, si: number) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <div style={{ padding: '0.2rem 0.5rem', borderRadius: 4, background: step.status === 'COMPLETED' && step.decision === 'APPROVE' ? 'rgba(16,185,129,0.1)' : step.status === 'COMPLETED' && step.decision === 'REJECT' ? 'rgba(239,68,68,0.1)' : step.status === 'ACTIVE' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)', fontSize: '0.55rem' }}>
                              <span style={{ color: step.status === 'COMPLETED' && step.decision === 'APPROVE' ? '#10b981' : step.status === 'ACTIVE' ? '#3b82f6' : '#64748b' }}>{step.status === 'COMPLETED' ? (step.decision === 'APPROVE' ? '✅' : '❌') : step.status === 'ACTIVE' ? '🔵' : '⏳'} {step.requiredRole}</span>
                              {step.approver && <span style={{ color: '#94a3b8', marginLeft: 4 }}>by {step.approver}</span>}
                              {step.decisionAt && <span style={{ color: '#475569', marginLeft: 4 }}>{new Date(step.decisionAt).toLocaleTimeString()}</span>}
                            </div>
                            {si < item.steps.length - 1 && <span style={{ color: '#475569', fontSize: '0.6rem' }}>→</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      <p style={{ fontSize: '0.85rem' }}>No audit entries yet</p>
                      <p style={{ fontSize: '0.7rem' }}>Submit and approve content to see the timeline</p>
                    </div>
                  )}
                </div>
              )}
              {/* Hash Chain Tab */}
              {auditTab === 'chain' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                    <button onClick={async () => {
                      const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'audit_report', userId: user?.userId }) });
                      if (res.ok) { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `audit-report-${new Date().toISOString().split('T')[0]}.pdf`; a.click(); URL.revokeObjectURL(url); addNotification('Audit report downloaded', 'success'); }
                    }} style={{ padding: '0.4rem 1rem', borderRadius: 6, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>📄 Download Audit PDF</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {auditChainHistory.length > 0 ? auditChainHistory.map((block: any, i: number) => (
                    <div key={i} style={{ padding: '0.6rem 1rem', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ minWidth: 24, height: 24, borderRadius: 4, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: '#3b82f6', fontWeight: 700 }}>#{block.blockNumber}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', color: '#f1f5f9' }}><span style={{ fontWeight: 600 }}>{block.eventType}</span> <span style={{ color: '#64748b' }}>by</span> {block.actor}</div>
                        <div style={{ fontSize: '0.55rem', color: '#475569' }}>{block.contentHash}</div>
                      </div>
                      <div style={{ fontSize: '0.55rem', color: '#475569' }}>{new Date(block.timestamp).toLocaleString()}</div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      <p style={{ fontSize: '0.85rem' }}>No hash chain blocks yet</p>
                      <p style={{ fontSize: '0.7rem' }}>Actions are recorded on the blockchain as they happen</p>
                    </div>
                  )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ANALYSIS */}
          {activeSection === "analysis" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#06b6d4", marginBottom: "1rem" }}>📊 Analysis & Review</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {[{ l: "Consistency Score", v: results.length > 0 ? "92%" : "—", c: "#10b981" }, { l: "Source Grounding", v: results.length > 0 ? "87%" : "—", c: "#3b82f6" }, { l: "Quality Rating", v: results.length > 0 ? "A" : "—", c: "#8b5cf6" }].map((m, i) => (
                <div key={i} style={{ padding: "1.25rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}><div style={{ fontSize: "1.75rem", fontWeight: 800, color: m.c }}>{m.v}</div><div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{m.l}</div></div>
              ))}
            </div>
          </div>)}

          {/* THREAT */}
          {activeSection === "threat" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ef4444", marginBottom: "1rem" }}>🔍 Threat Analysis</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
              {[{ l: "Misinformation Risk", v: "Low", c: "#10b981", i: "✅" }, { l: "Adversarial Manipulation", v: "None Detected", c: "#10b981", i: "🛡️" }, { l: "Content Integrity", v: "Verified", c: "#3b82f6", i: "🔗" }, { l: "STIX/TAXII Compatible", v: "Yes", c: "#8b5cf6", i: "📋" }].map((t, i) => (
                <div key={i} style={{ padding: "1rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f1f5f9", marginBottom: "0.5rem" }}>{t.i} {t.l}</div><div style={{ fontSize: "0.9rem", fontWeight: 700, color: t.c }}>{t.v}</div></div>
              ))}
            </div>
          </div>)}

          {/* COMPLIANCE */}
          {activeSection === "compliance" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f59e0b", marginBottom: "1rem" }}>📋 Compliance Check</h2>
            {[{ n: "DPDP Act 2023", s: "Compliant", c: "#10b981" }, { n: "GDPR", s: "Compliant", c: "#10b981" }, { n: "IT Act 2000", s: "Compliant", c: "#10b981" }, { n: "Org Policy", s: "Under Review", c: "#f59e0b" }].map((x, i) => (
              <div key={i} style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#f1f5f9" }}>{x.n}</span>
                <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: 4, background: x.c + "15", color: x.c, fontWeight: 600 }}>{x.s}</span>
              </div>))}
          </div>)}

          {/* DLP */}
          {activeSection === "dlp" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "1rem" }}>🛡️ DLP Scanner</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {[{ l: "PII Detected", v: "0 items", c: "#10b981" }, { l: "Classification", v: "Unclassified", c: "#3b82f6" }, { l: "Redaction Needed", v: "None", c: "#10b981" }].map((d, i) => (
                <div key={i} style={{ padding: "1.25rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}><div style={{ fontSize: "1.1rem", fontWeight: 700, color: d.c }}>{d.v}</div><div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{d.l}</div></div>
              ))}
            </div>
          </div>)}

          {/* INCIDENT */}
          {activeSection === "incident" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ec4899", marginBottom: "1rem" }}>🚨 Incident Response Chain</h2>
            {[{ s: 1, t: "Detection", d: "Automated threat detection triggers alert", a: true }, { s: 2, t: "Classification", d: "Security team classifies severity level", a: false }, { s: 3, t: "Containment", d: "Isolate affected systems", a: false }, { s: 4, t: "Eradication", d: "Remove threat and patch vulnerabilities", a: false }, { s: 5, t: "Recovery", d: "Restore systems from clean backups", a: false }, { s: 6, t: "Lessons Learned", d: "Post-incident review and policy updates", a: false }].map((x, i) => (
              <div key={i} style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: x.a ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: x.a ? "#ef4444" : "#64748b" }}>{x.s}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f1f5f9" }}>{x.t}</div><div style={{ fontSize: "0.7rem", color: "#64748b" }}>{x.d}</div></div>
                <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: 4, background: x.a ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", color: x.a ? "#ef4444" : "#64748b" }}>{x.a ? "ACTIVE" : "PENDING"}</span>
              </div>))}
          </div>)}

          {/* LINKAGE */}
          {activeSection === "linkage" && (<div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0ea5e9", marginBottom: "0.5rem" }}>🔗 External Linkage</h2>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "1rem" }}>Link social accounts to auto-publish approved content.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {[{ id: 'linkedin', n: 'LinkedIn', i: '💼', c: '#0A66C2', d: 'Share professional posts and articles' }, { id: 'twitter', n: 'X (Twitter)', i: '🐦', c: '#1DA1F2', d: 'Post tweets and threads' }, { id: 'email', n: 'Email', i: '📧', c: '#EA4335', d: 'Send newsletters and notifications' }].map((x) => {
                const st = linkageStatus[x.id];
                const isLinked = st?.linked;
                return (
                <div key={x.id} style={{ padding: '1.25rem', borderRadius: 10, background: isLinked ? `${x.c}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${isLinked ? `${x.c}40` : 'rgba(255,255,255,0.06)'}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{x.i}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.25rem' }}>{x.n}</div>
                  <div style={{ fontSize: '0.7rem', color: isLinked ? '#10b981' : '#64748b', marginBottom: '0.75rem' }}>{isLinked ? `✅ ${st.accountName}` : 'Not linked'}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.75rem' }}>{x.d}</div>
                  {isLinked ? (
                    <button onClick={() => handleLinkAccount(x.id)} style={{ padding: '0.4rem 1rem', borderRadius: 6, border: `1px solid ${x.c}40`, background: 'transparent', color: x.c, fontSize: '0.75rem', cursor: 'pointer' }}>Unlink</button>
                  ) : (
                    <button disabled={linkageLoading === x.id} onClick={() => handleLinkAccount(x.id)} style={{ padding: '0.4rem 1rem', borderRadius: 6, border: 'none', background: linkageLoading === x.id ? '#475569' : `linear-gradient(135deg, ${x.c}, ${x.c}cc)`, color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: linkageLoading === x.id ? 'not-allowed' : 'pointer' }}>{linkageLoading === x.id ? '⏳ Linking...' : '🔗 Link Account'}</button>
                  )}
                </div>);
              })}
            </div>
          </div>)}

        </div>
      </div>

      {/* Notifications */}
      <div style={{ position: "fixed", top: 80, right: 20, zIndex: 100, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {notifications.map(n => (
          <div key={n.id} style={{ padding: "0.6rem 1rem", borderRadius: 8, background: n.type === "error" ? "rgba(239,68,68,0.9)" : n.type === "success" ? "rgba(16,185,129,0.9)" : "rgba(59,130,246,0.9)", color: "#fff", fontSize: "0.8rem", fontWeight: 600, backdropFilter: "blur(10px)", cursor: "pointer" }} onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}>{n.msg}</div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (<Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "#94a3b8" }}>Loading dashboard...</div>}><DashboardInner /></Suspense>);
}
