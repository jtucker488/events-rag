"use client";
import { useState } from "react";
import Lottie from "lottie-react";
import animationData from "../../public/lottie/loading.json";
import SearchIcon from "@mui/icons-material/Search";
import CardSwipe from "./components/card-swipe";
interface Event {
  borough: string;
  date: string;
  info: string;
  name: string;
  url: string;
  venue: string;
  image: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [referencedEvents, setReferencedEvents] = useState<Event[]>([]);
  const [presentedEvents, setPresentedEvents] = useState<Event[]>([]);

  const [moreEvents, setMoreEvents] = useState<Event[]>([]);
  const [loadMore, setLoadMore] = useState(false); // Controls visibility of more events

  const handleSearch = async () => {
    setLoading(true);
    setResponse(""); // Clear previous response
    setReferencedEvents([]);
    setMoreEvents([]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      setResponse(data.response);
      setPresentedEvents(data.referencedEvents);
      setMoreEvents(data.moreEvents);
    } catch (error) {
      console.error("Error fetching data:", error);
      setResponse("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const loadMoreClick = () => {
    setPresentedEvents([...presentedEvents, ...moreEvents]);
    setLoadMore(true);
  };
  return (
    <div
      className="min-h-screen flex justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="flex gap-4 flex-col w-full justify-start items-center mt-4">
        <div className="relative max-w-2xl w-full mx-auto rounded-lg">
          {/* Background Layer */}
          <div className="absolute inset-0 bg-black opacity-50 rounded-lg"></div>

          {/* Content Layer */}
          <div className="relative flex-col justify-start opacity-90 px-6 py-4">
            <div className="flex w-full flex-col items-center gap-4 px-2">
              {/* Input Field */}
              {/* Input Field Section */}
              <div className="flex flex-col w-full">
                {/* Label */}
                <label
                  htmlFor="eventSearch"
                  className="press-start text-[#1fbabf] font-bold mb-2"
                >
                  Search NYC Music Events using AI
                </label>

                <div className="flex w-[100%] h-[76px] gap-2 items-center">
                  <input
                    id="eventSearch"
                    type="text"
                    placeholder="Ask a question..."
                    className="
        rounded-full border-white w-[70%] p-2 pl-4 w-full
        text-white placeholder-gray-400 caret-white
        bg-gray-600 hover:bg-gray-500 focus:bg-gray-500
        h-[50px] focus:border-2 focus:border-white outline-none transition"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <SearchIcon
                    onClick={handleSearch}
                    sx={{ fontSize: 42 }}
                    className="text-white p-2 rounded cursor-pointer hover:text-gray-300 transition"
                  />
                </div>
              </div>

              <div className="max-h-[250px] overflow-y-auto w-full px-4">
                {/* Show Lottie animation while loading */}
                {loading && (
                  <div className="flex justify-center w-full">
                    <Lottie
                      animationData={animationData}
                      style={{ width: 100, height: 100 }}
                      loop
                    />
                  </div>
                )}

                {/* Show OpenAI Response */}
                {!loading && response && (
                  <p
                    className="text-white max-h-[250px]"
                    // dangerouslySetInnerHTML={{
                    //   __html: response.replace(
                    //     /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
                    //     '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">$1</a>'
                    //   ),
                    // }}
                  >
                    {response}{" "}
                  </p>
                )}
              </div>

              {/* Show Referenced Events */}
              {!loading && presentedEvents.length > 0 && (
                <CardSwipe
                  loadMore={loadMore}
                  presentedEvents={presentedEvents}
                  loadMoreClick={loadMoreClick}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
