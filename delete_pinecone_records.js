import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // Load .env.local explicitly

import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.Index("events-rag384");

async function deleteAllRecords() {
  try {
    console.log("Checking Pinecone index before deletion...");

    // Check if there are vectors in the index
    const stats = await index.describeIndexStats();
    const vectorCount = stats.totalRecordCount;

    if (vectorCount === 0) {
      console.log("Pinecone index is already empty.");
      return;
    }

    console.log(`Deleting ${vectorCount} vectors from Pinecone...`);

    // Delete all records from the index by specifying the namespace
    await index.deleteAll({ namespace: "events-rag384" });

    console.log("Pinecone database cleared!");
  } catch (error) {
    console.error("Error clearing Pinecone:", error);
  }
}

// Run the deletion function
deleteAllRecords();
