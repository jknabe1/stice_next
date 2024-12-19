import { NextRequest, NextResponse } from "next/server";
import { AIModel } from "@/app/api/utils/ai-models";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is missing");
    }

    const aiModel = new AIModel(apiKey);

    const filePath = path.join(process.cwd(), "public/api/domar.csv");
    await aiModel.loadCSV(filePath);

    const assistantId = aiModel.assistants["assistant_4"];
    const aiResponse = await aiModel.sendPrompt(
      assistantId,
      `Analyze this query: ${message}`
    );

    const filteredCases = aiModel.filterCases(message);

    return NextResponse.json({
      response: aiResponse || "No response from AI",
      filteredCases,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
