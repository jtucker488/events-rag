import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index("events-rag384"); // Ensure index name matches

export async function storeInVectorDB(embedding: number[]) {
  try {
    const response = await index.query({
      vector: embedding,
      topK: 20,
      includeMetadata: true,
    });


    if (!response || !response.matches || !Array.isArray(response.matches)) {
      console.error("Invalid Pinecone response format:", response);
      return { matches: [] }; // Ensure it always returns an object with matches
    }

    return response;
  } catch (error) {
    console.error("Error querying Pinecone:", error);
    return { matches: [] }; // Handle errors gracefully
  }
}
