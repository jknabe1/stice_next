import { OpenAI } from "openai";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

export class AIModel {
  private openai: OpenAI;
  public assistants: Record<string, string>;
  private domarData: any[];

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.assistants = {
      assistant_1: "asst_H3aOLOyRbc0EtDaCyFlJ9SXH",
      assistant_2: "asst_qErraLsKdRwbr36EoCxMV4q6",
      assistant_3: "asst_SzIEcriyFRQmCeVE8mipCmyG",
      assistant_4: "asst_CatYmZyKf7hDmqvJwcOjxcTH",
      assistant_5: "asst_T4N445YGJfx5gqBk8uQ0hApN",
      assistant_6: "asst_9icQL0mbZvTg8J5pDXrYQaek",
    };
    this.domarData = [];
  }

  async loadCSV(filePath: string): Promise<void> {
    const results: any[] = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => {
          this.domarData = results;
          resolve();
        })
        .on("error", reject);
    });
  }

  async sendPrompt(assistantId: string, prompt: string): Promise<string> {
    const thread = await this.openai.beta.threads.create();
    await this.openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt,
    });

    const run = await this.openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    let runStatus = await this.openai.beta.threads.runs.retrieve(
      thread.id,
      run.id
    );
    while (runStatus.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await this.openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
    }

    const messages = await this.openai.beta.threads.messages.list(thread.id);
    return messages.data
      .flatMap((msg) => msg.content)
      .filter((content) => content.type === "text")
      .map((content) => content.text.value)
      .join("\n");
  }

  filterCases(message: string): any[] {
    return this.domarData.filter(
      (row) =>
        row &&
        row.rubrik &&
        row.rubrik.toLowerCase().includes(message.toLowerCase())
    );
  }

  async analyzeMessage(input: string): Promise<{ finalResponse: string; matchedCases: any[] }> {
    try {
      // Steg 1: Analysera frågan med assistent 1
      let currentInput = `Analysera följande fråga: ${input}`;
      let assistantOrder = Object.keys(this.assistants);

      for (let i = 0; i < assistantOrder.length; i++) {
        const assistantId = this.assistants[assistantOrder[i]];
        console.log(`Processing with ${assistantOrder[i]}...`);

        currentInput = await this.sendPrompt(assistantId, currentInput);
        console.log(`Output from ${assistantOrder[i]}:`, currentInput);
      }

      // Steg 2: Filtrera rättsfall från CSV baserat på input
      const matchedCases = this.filterCases(input);

      return { finalResponse: currentInput, matchedCases };
    } catch (error) {
      console.error("Error during analysis:", error);
      throw new Error("Failed to analyze the message");
    }
  }
}
