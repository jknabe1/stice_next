import { NextRequest, NextResponse } from "next/server";
import { AIModel } from "@/app/api/utils/ai-models";

const aiModel = new AIModel(process.env.OPENAI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { caseId } = await req.json();

    if (!caseId) {
      return NextResponse.json({ error: "No case ID provided" }, { status: 400 });
    }

    // Hämta case från AI-modellen
    const caseData = aiModel.getCase(caseId);

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json(caseData);
  } catch (error) {
    console.error("Error fetching case:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
