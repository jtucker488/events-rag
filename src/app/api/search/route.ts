import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { storeInVectorDB } from "../../../../utils/pinecone";
import { pipeline } from "@xenova/transformers";

// Load embedding model
const embeddingModel = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2"
);

export async function POST(req: Request) {

  try {
    const { query } = await req.json();

    // Generate embeddings for the user query
    const queryEmbedding = await embeddingModel(query, {
      pooling: "mean",
      normalize: true,
    });

    const embeddingArray = Array.from(queryEmbedding.data);

    // Validate embedding
    if (!embeddingArray || !Array.isArray(embeddingArray)) {
      console.error("Embedding extraction failed:", queryEmbedding);
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 }
      );
    }

    // Fetch relevant events from Pinecone
    const results = await storeInVectorDB(embeddingArray);

    // Extract relevant events with metadata
    const relevantEvents = results.matches.map((match) => match.metadata);

    // Format event data for Ollama
    const eventContext = relevantEvents
      .map(
        (event) =>
          `Event: ${event?.name}\nDate: ${event?.date}\nVenue: ${event?.venue}\nURL: ${event?.url}`
      )
      .join("\n\n");

    const full_query = `
      You are an AI assistant answering questions based on event data.
      
      You **MUST** output your response in two clearly separated sections:  
      1️⃣ **"Response:"** section with fun descriptions of exactly 2-3 events.  
      2️⃣ **"Data:"** section listing ONLY the URLs of events mentioned in the Response section.
      
      ⚠️ **STRICT RULES (DO NOT DEVIATE)**:
      - **DO NOT list more than 3 events.**  
      - **DO NOT include extra commentary before or after the two sections.**  
      - **Failure to include the "Data:" section with URLs will be considered an invalid response.**
      
      📌 **EXAMPLE OUTPUT FORMAT** (DO NOT CHANGE):
**Response:**  
[Write an engaging summary that includes 2-3 specific events with their names, dates, venues.]. Give some fun and exciting details about each of the events. keep response under 700 characters.

**Data:**  
[List of the URLs of events mentioned in the response, each on a new line.]  

---  
**Event Data:**  
${eventContext}

**Query:**  
${query}
`;

    // **🟢 Execute Ollama with `execSync`**
    console.log("Executing Ollama...");
    const ollamaResponse = execSync(`ollama run llama3 "${full_query}"`, {
      encoding: "utf-8",
    }).trim();

    const responseRegex =
      /(?<=\*\*Response:\*\*\s)([\s\S]+?)(?=\n\s*\*\*Data:\*\*)/;
    const responseMatch = ollamaResponse.match(responseRegex);
    const friendlyBlurb = responseMatch ? responseMatch[1].trim() : "";

    // **🔍 Extract URLs from Data Section**
    const dataRegex = /(?<=\*\*Data:\*\*\s)([\s\S]+)/;
    const dataMatch = ollamaResponse.match(dataRegex);
    let urls: string[] = [];

    if (dataMatch) {
      urls = dataMatch[1]
        .trim()
        .split("\n")
        .map((url) => url.trim().replace(/[>,]$/, "")); // Remove unwanted characters
    }

   

    // **🔎 Find Referenced Events**
    const referencedEvents = relevantEvents.filter((event) =>
      urls.includes(event.url)
    );

    // **💡 Determine "More Events" (those not referenced)**
    const moreEvents = relevantEvents.filter(
      (event) => !referencedEvents.includes(event)
    );

    // Return JSON response
    return NextResponse.json({
      response: friendlyBlurb,
      referencedEvents,
      moreEvents,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: error },
      { status: 500 }
    );
  }
}
