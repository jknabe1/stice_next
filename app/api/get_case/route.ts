import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const caseId = searchParams.get("caseId") || "Unknown";

  const caseDetails = {
    id: caseId,
    domstol: "HD",
    avgorande_datum: "2023-01-01",
    referat_dom: "Exempel på referat.",
    r_lagrum: "Lagrum info",
  };

  return NextResponse.json(caseDetails);
}
