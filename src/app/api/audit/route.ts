import { NextRequest, NextResponse } from "next/server";
import { AuditTracker, AuditEventType } from "@/lib/audit-tracker";
import { exportAuditLogs, SIEMFormat } from "@/lib/siem-export";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "records";

  switch (action) {
    case "records": {
      const minutes = parseInt(searchParams.get("minutes") || "60");
      const records = AuditTracker.getInTimeWindow(minutes);
      return NextResponse.json({ records, count: records.length });
    }

    case "all": {
      return NextResponse.json(AuditTracker.getAll());
    }

    case "stats": {
      return NextResponse.json(AuditTracker.getStats());
    }

    case "high_risk": {
      return NextResponse.json(AuditTracker.getHighRisk());
    }

    case "for_actor": {
      const actor = searchParams.get("actor");
      if (!actor) return NextResponse.json({ error: "actor required" }, { status: 400 });
      return NextResponse.json(AuditTracker.getForActor(actor));
    }

    case "compliance_report": {
      const startDate = parseInt(searchParams.get("startDate") || String(Date.now() - 7 * 24 * 60 * 60 * 1000));
      const endDate = parseInt(searchParams.get("endDate") || String(Date.now()));
      return NextResponse.json(AuditTracker.generateComplianceReport(startDate, endDate));
    }

    case "export": {
      // SIEM export
      const format = (searchParams.get("format") || "json") as SIEMFormat;
      const startDate = searchParams.get("startDate") ? parseInt(searchParams.get("startDate")!) : undefined;
      const endDate = searchParams.get("endDate") ? parseInt(searchParams.get("endDate")!) : undefined;
      const eventTypes = searchParams.get("eventTypes")?.split(",") as AuditEventType[] | undefined;
      const riskLevels = searchParams.get("riskLevels")?.split(",");
      const actors = searchParams.get("actors")?.split(",");

      const allRecords = AuditTracker.getAll();
      const result = exportAuditLogs(allRecords, format, {
        startDate, endDate, eventTypes, riskLevels, actors,
      });

      return new NextResponse(result.content, {
        headers: {
          'Content-Type': result.mimeType,
          'Content-Disposition': `attachment; filename="${result.fileName}"`,
          'X-SIEM-Format': result.format,
          'X-Record-Count': String(result.recordCount),
        },
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
