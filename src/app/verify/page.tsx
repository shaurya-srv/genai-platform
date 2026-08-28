"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function VerifyPage() {
  const [transformationId, setTransformationId] = useState("");
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    record?: Record<string, unknown>;
    auditTrail?: Array<{ action: string; actor: string; timestamp: number; metadata: string }>;
    error?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!transformationId.trim()) return;
    setIsVerifying(true);

    try {
      const [recordRes, auditRes] = await Promise.all([
        fetch(`/api/blockchain?action=record&id=${transformationId}`),
        fetch(`/api/blockchain?action=audit&id=${transformationId}`),
      ]);

      if (!recordRes.ok) {
        setVerifyResult({ verified: false, error: "Transformation not found on blockchain" });
        return;
      }

      const record = await recordRes.json();
      const auditTrail = await auditRes.json();

      setVerifyResult({
        verified: record.verified || false,
        record,
        auditTrail,
      });
    } catch {
      setVerifyResult({ verified: false, error: "Verification failed" });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(10,14,26,0.95) 100%)",
        borderBottom: "1px solid var(--border-color)",
        padding: "1rem 2rem",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>← </span>
            <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--accent-blue)" }}>NTRO</span>
          </Link>
          <span className="badge badge-purple">⛓️ Blockchain Verification</span>
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              Verify Transformation
            </h1>
            <p style={{ color: "var(--text-muted)" }}>
              Enter a transformation ID to verify its authenticity on the blockchain
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              className="input"
              placeholder="Enter Transformation ID (UUID)"
              value={transformationId}
              onChange={(e) => setTransformationId(e.target.value)}
              style={{ fontFamily: "monospace" }}
            />
            <button
              className="btn-primary"
              onClick={handleVerify}
              disabled={!transformationId.trim() || isVerifying}
              style={{ whiteSpace: "nowrap" }}
            >
              {isVerifying ? "⏳ Verifying..." : "🔍 Verify"}
            </button>
          </div>
        </div>

        {verifyResult && (
          <div className="card animate-slide-up">
            {verifyResult.error ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>❌</div>
                <h3 style={{ color: "var(--accent-red)", marginBottom: "0.5rem" }}>Verification Failed</h3>
                <p style={{ color: "var(--text-muted)" }}>{verifyResult.error}</p>
              </div>
            ) : (
              <>
                <div style={{
                  textAlign: "center",
                  padding: "2rem",
                  background: verifyResult.verified ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                }}>
                  <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                    {verifyResult.verified ? "✅" : "⚠️"}
                  </div>
                  <h2 style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: verifyResult.verified ? "var(--accent-green)" : "var(--accent-red)",
                  }}>
                    {verifyResult.verified ? "VERIFIED" : "NOT VERIFIED"}
                  </h2>
                  <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    This transformation has {verifyResult.verified ? "been" : "not been"} verified on the blockchain
                  </p>
                </div>

                {verifyResult.record && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>📋 Record Details</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      {[
                        { label: "Content Hash", value: String(verifyResult.record.contentHash || "").substring(0, 32) + "..." },
                        { label: "Output Hash", value: String(verifyResult.record.outputHash || "").substring(0, 32) + "..." },
                        { label: "Output Type", value: String(verifyResult.record.outputType || "N/A") },
                        { label: "Threat Level", value: String(verifyResult.record.threatLevel || "N/A") },
                        { label: "Operator", value: String(verifyResult.record.operator || "N/A") },
                        { label: "Timestamp", value: new Date(Number(verifyResult.record.timestamp || 0)).toISOString() },
                      ].map((item, i) => (
                        <div key={i} style={{ padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{item.label}</div>
                          <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-primary)" }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {verifyResult.auditTrail && verifyResult.auditTrail.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>📜 Audit Trail</h3>
                    {verifyResult.auditTrail.map((entry, i) => (
                      <div key={i} style={{
                        padding: "0.75rem",
                        background: "var(--bg-secondary)",
                        borderRadius: "8px",
                        marginBottom: "0.5rem",
                        borderLeft: `3px solid ${
                          entry.action.includes("VERIFIED") ? "var(--accent-green)" :
                          entry.action === "CREATED" ? "var(--accent-blue)" :
                          "var(--accent-purple)"
                        }`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{entry.action}</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Actor: {entry.actor} • {entry.metadata}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
