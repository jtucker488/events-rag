import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // Load .env.local explicitly
import { pipeline } from "@xenova/transformers";

import axios from "axios";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

// Initialize OpenAI and Pinecone
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const embeddingModel = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2"
);
const index = pinecone.Index("events-rag384");

// NYC boroughs
const boroughs = ["New York", "Brooklyn", "Queens", "Bronx", "Staten Island"];
// const boroughs = [ "Queens"];

// Function to generate date ranges (March 2025 - January 2026)
function generateDateRanges() {
  let dateRanges = [];
  let currentDate = new Date("2025-03-01");

  while (currentDate < new Date("2026-01-01")) {
    let start = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format
    currentDate.setMonth(currentDate.getMonth() + 1);
    let end = currentDate.toISOString().split("T")[0];

    dateRanges.push({ start, end });
  }

  return dateRanges;
}

// Delay function to prevent hitting API rate limits
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to fetch events (ensuring uniqueness)
async function fetchEvents() {
  let allEvents = [];
  let eventIds = new Set(); // Store unique event IDs

  const dateRanges = generateDateRanges();

  for (const borough of boroughs) {
    for (const { start, end } of dateRanges) {
      let events = [];
      let page = 0;
      let totalPages = 1;

      try {
        while (page < totalPages && page * 100 < 1000) {
          const response = await axios.get(
            "https://app.ticketmaster.com/discovery/v2/events.json",
            {
              params: {
                classificationName: "music",
                city: borough,
                stateCode: "NY",
                apikey: process.env.NEXT_PUBLIC_TICKETMASTER_API_TOKEN,
                page: page,
                size: 100,
                startDateTime: `${start}T00:00:00Z`,
                endDateTime: `${end}T23:59:59Z`,
              },
            }
          );

          if (response.data.page) {
            totalPages = response.data.page.totalPages;
          }

          // Extract event details, ensuring uniqueness
          const eventData =
            response.data._embedded?.events
              .map((event) => ({
                id: event.id,
                name: event.name,
                date: event.dates.start.localDate,
                url: event.url,
                venue: event._embedded?.venues[0]?.name || "Unknown Venue",
                info: event.info || "No description available",
                borough: borough,
                image: event.images?.length > 0 ? event.images[0].url : null, // ✅ Fetch first image URL
              }))
              .filter((event) => {
                if (eventIds.has(event.id)) return false; // Skip duplicate
                eventIds.add(event.id); // Mark as seen
                return true;
              }) || [];

          events = [...events, ...eventData];
          page++;

          await delay(500); // Prevent rate limit issues
        }
      } catch (error) {
        console.error(
          `Error fetching events for ${borough} (${start} - ${end}):`,
          error.message
        );
      }

      console.log(
        `Fetched ${events.length} unique events from ${borough} (${start} - ${end})`
      );
      allEvents = [...allEvents, ...events];

      await delay(2000); // Extra delay between boroughs
    }
  }

  return allEvents;
}

async function getEmbeddings(text) {
  if (!text || typeof text !== "string") {
    console.error("Invalid text input for embedding:", text);
    return null;
  }

  try {
    const embedding = await embeddingModel(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(embedding.data); // Convert tensor to array
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return null;
  }
}

// Function to store events into Pinecone
async function storeInPinecone(events) {
  try {
    const batchSize = 50; // Reduce batch size
    let vectors = [];

    for (const event of events) {
      const embedding = await getEmbeddings(
        `${event.name} - ${event.info} - ${event.venue}`
      );

      if (!embedding) continue; // Skip if embedding fails

      vectors.push({
        id: event.id,
        values: embedding,
        metadata: {
          name: event.name,
          date: event.date,
          image: event.image,
          url: event.url,
          venue: event.venue,
          info: event.info,
          borough: event.borough, // Store borough info
        },
      });

      // Upsert in batches
      if (vectors.length >= batchSize) {
        await index.upsert(vectors);
        console.log(`Stored ${vectors.length} events in Pinecone.`);
        vectors = []; // Reset batch
      }
    }

    // Final batch (if any leftover vectors)
    if (vectors.length > 0) {
      await index.upsert(vectors);
      console.log(`Stored remaining ${vectors.length} events in Pinecone.`);
    }
  } catch (error) {
    console.error("Error storing in Pinecone:", error);
  }
}

// Run the script
(async () => {
  const events = await fetchEvents();
  console.log(`Total Unique NYC Music Events: ${events.length}`);

  await storeInPinecone(events);
})();
