"use client";

import React from "react";

// Define Event Type
interface EventType {
  borough: string;
  date: string;
  info: string;
  name: string;
  url: string;
  venue: string;
  image: string;
}

// Define Props Type
interface EventCardProps {
  event: EventType;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  // Handle click to open in a new tab
  const handleClick = () => {
    if (event.url) {
      window.open(event.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative w-[280px] h-[280px] rounded-lg overflow-hidden shadow-md bg-white cursor-pointer transform transition-all duration-300"
    >
      {/* Image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={event.image || "https://via.placeholder.com/400x300"}
          alt={event.name}
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Title and Date */}
      <div className="absolute bottom-0 w-full bg-white bg-opacity-90 px-4 py-3">
        <h3 className="text-lg font-semibold text-neutral-800 line-clamp-1 mb-1">
          {event.name}
        </h3>
        <p className="text-sm text-neutral-500">{event.date}</p>
      </div>
    </div>
  );
};

export default EventCard;
