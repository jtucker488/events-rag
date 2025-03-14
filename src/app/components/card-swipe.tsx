import React from "react";
import EventCard from "./event-card";
import LoadMoreButton from "./load-more-button";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

// Define the event type
interface EventType {
  borough: string;
  date: string;
  info: string;
  name: string;
  url: string;
  venue: string;
  image: string;
}

// Define props type
interface CardSwipeProps {
  presentedEvents: EventType[];
  loadMore: boolean;
  loadMoreClick: () => void;
}

const CardSwipe: React.FC<CardSwipeProps> = ({
  loadMore,
  presentedEvents,
  loadMoreClick,
}) => {
  return (
    <div
      className="rounded-lg flex overflow-x-auto no-scrollbar py-4 w-full"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} // Hides scrollbar
    >
      {presentedEvents?.map((event) => (
        <div className="p-2 rounded-lg" key={`${event.url} - ${event.name}`}>
          <EventCard event={event} />
        </div>
      ))}
      {!loadMore && (
        <div className="p-2 rounded-lg">
          <LoadMoreButton
            onClick={() => {
              loadMoreClick();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CardSwipe;
