import { NextResponse } from "next/server";
import { getLiveStations, buildSummary } from "@/lib/stationData";

// Re-export Station type for consumers
export type { Station } from "@/lib/stationData";

export async function GET() {
  const stations = getLiveStations();
  const summary = buildSummary(stations);

  return NextResponse.json(
    { stations, summary, timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
