import { NextRequest, NextResponse } from "next/server";
import { OutputPluginRegistry } from "@/lib/output-plugins";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "toggle": {
        const { pluginId } = body;
        if (!pluginId) return NextResponse.json({ error: "pluginId required" }, { status: 400 });
        const result = OutputPluginRegistry.toggle(pluginId);
        if (!result) return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
        return NextResponse.json({ success: true, ...result });
      }

      case "enable": {
        const { pluginId } = body;
        if (!pluginId) return NextResponse.json({ error: "pluginId required" }, { status: 400 });
        const success = OutputPluginRegistry.enable(pluginId);
        if (!success) return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
        return NextResponse.json({ success: true, enabled: true });
      }

      case "disable": {
        const { pluginId } = body;
        if (!pluginId) return NextResponse.json({ error: "pluginId required" }, { status: 400 });
        const success = OutputPluginRegistry.disable(pluginId);
        if (!success) return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
        return NextResponse.json({ success: true, enabled: false });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "list";

  switch (action) {
    case "list":
      return NextResponse.json(OutputPluginRegistry.getPluginSummaries());

    case "enabled":
      return NextResponse.json(OutputPluginRegistry.getEnabled().map(p => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        description: p.description,
        color: p.color,
        category: p.category,
      })));

    case "categories": {
      const all = OutputPluginRegistry.getAll();
      const categories = [...new Set(all.map(p => p.category))];
      return NextResponse.json(categories.map(cat => ({
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        pluginCount: all.filter(p => p.category === cat).length,
        enabledCount: all.filter(p => p.category === cat && p.enabled).length,
      })));
    }

    case "by_category": {
      const category = searchParams.get("category");
      if (!category) return NextResponse.json({ error: "category required" }, { status: 400 });
      const plugins = OutputPluginRegistry.getAll().filter(p => p.category === category);
      return NextResponse.json(plugins.map(p => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        description: p.description,
        color: p.color,
        category: p.category,
        enabled: p.enabled,
        approvalConfig: p.approvalConfig,
      })));
    }

    case "stats": {
      const all = OutputPluginRegistry.getAll();
      return NextResponse.json({
        total: all.length,
        enabled: all.filter(p => p.enabled).length,
        disabled: all.filter(p => !p.enabled).length,
        byCategory: Object.fromEntries(
          [...new Set(all.map(p => p.category))].map(cat => [
            cat,
            { total: all.filter(p => p.category === cat).length, enabled: all.filter(p => p.category === cat && p.enabled).length },
          ])
        ),
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
