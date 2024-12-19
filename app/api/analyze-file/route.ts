import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import fs from "fs";
import { AIModel } from "@/app/api/utils/ai-models"; // Importera din AI-modellklass
import mammoth from "mammoth";


export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileType = file.name.split(".").pop()?.toLowerCase();

  let content = "";

  try {
    if (fileType === "pdf") {
      const pdfData = await pdfParse(buffer);
      content = pdfData.text;
    } 
    if (fileType === "docx") {
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
      }
    else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY; // Hämta API-nyckeln från miljövariabler
    if (!apiKey) {
      throw new Error("OpenAI API key is missing");
    }

    // Initiera AI-modellen
    const aiModel = new AIModel(apiKey);
    const assistantId = aiModel.assistants["assistant_4"];
    const analysis = await aiModel.sendPrompt(
      assistantId,
      `Analyze this document:\n${content}`
    );

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("File processing error:", error);
    return NextResponse.json({ error: "Error analyzing file" }, { status: 500 });
  }
}
