import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ladda CSV-filen
function loadCSV(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

// Funktion för att välja assistent
function getAssistantId(input: string): string {
  const assistants = {
    assistant_1: "asst_H3aOLOyRbc0EtDaCyFlJ9SXH",
    assistant_2: "asst_qErraLsKdRwbr36EoCxMV4q6",
    assistant_3: "asst_SzIEcriyFRQmCeVE8mipCmyG",
    assistant_4: "asst_CatYmZyKf7hDmqvJwcOjxcTH",
  };

  if (input.includes("arbetsrätt")) return assistants.assistant_1;
  if (input.includes("fastighetsrätt")) return assistants.assistant_2;
  if (input.includes("tvist")) return assistants.assistant_3;
  return assistants.assistant_4;
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // Läs CSV-filen
    const filePath = path.join(process.cwd(), "public/api/domar.csv");
    const domarData = await loadCSV(filePath);

    // Välj rätt assistent
    const assistantId = getAssistantId(message);

    // Skapa en thread
    const thread = await openai.beta.threads.create();

    // Lägg till meddelande i thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // Starta en run med rätt assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // Polling för att hämta svar från OpenAI
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    const messages = await openai.beta.threads.messages.list(thread.id);

    // Extrahera text från content
    const aiResponse = messages.data
    .flatMap((msg) => msg.content) // Samla alla content
    .filter((content) => content.type === "text") // Filtrera text-typer
    .map((content) => content.text.value) // Extrahera textens värde
    .join("\n"); // Slå ihop flera rader av text

    // Filtrera data från CSV
    const filteredCases = domarData.filter((row) => {
    // Kontrollera att row är definierad och att rubrik existerar
    return row && row.rubrik && row.rubrik.toLowerCase().includes(message.toLowerCase());
  });

  

  return NextResponse.json({
    response: aiResponse || "No response",
    filteredCases,
  });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
