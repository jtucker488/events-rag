import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // Load .env.local explicitly

import axios from "axios";

// List of NYC boroughs
const boroughs = ["New York", "Brooklyn", "Queens", "Bronx", "Staten Island"];

// Function to generate date ranges: Starts March 1, 2025, and stops January 1, 2026
function generateDateRanges() {
  let dateRanges = [];
  let currentDate = new Date("2025-03-01");

  while (currentDate < new Date("2026-01-01")) {
    let start = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format
    currentDate.setMonth(currentDate.getMonth() + 1); // Move to next month
    let end = currentDate.toISOString().split("T")[0];

    dateRanges.push({ start, end });
  }

  return dateRanges;
}

// Function to delay between API calls (to avoid 429 errors)
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to fetch events from Ticketmaster, ensuring uniqueness
async function fetchEvents() {
  let allEvents = [];
  let eventIds = new Set(); // **Store unique event IDs**

  const dateRanges = generateDateRanges(); // Date range: March 2025 - January 1, 2026

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
                size: 100, // Max events per request
                startDateTime: `${start}T00:00:00Z`,
                endDateTime: `${end}T23:59:59Z`,
              },
            }
          );

          // Set total pages based on API response
          if (response.data.page) {
            totalPages = response.data.page.totalPages;
          }

          // Extract event details and filter for unique events
          // Extract event details and filter for unique events
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
                if (eventIds.has(event.id)) {
                  return false; // **Skip duplicate event**
                }
                eventIds.add(event.id); // **Mark event as seen**
                return true;
              }) || [];

          events = [...events, ...eventData];
          page++;

          // **Delay Between API Calls to Avoid 429 Errors (Rate Limits)**
          await delay(500); // 500ms delay (adjust if needed)
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

      // **Extra Delay Between Boroughs to Reduce Rate Limit Issues**
      await delay(2000); // 2-second delay after each borough's requests
    }
  }

  return allEvents;
}

// Run the script
(async () => {
  const events = await fetchEvents();
  console.log(
    `Total Unique NYC Music Events (March 2025 - Jan 2026): ${events.length}`
  );
})();
