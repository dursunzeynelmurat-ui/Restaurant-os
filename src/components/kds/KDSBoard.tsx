"use client";
import { useQuery } from "@tanstack/react-query";
import TicketCard from "./TicketCard";
import type { Ticket } from "@/types";

interface KDSBoardProps {
  station: "kitchen" | "bar";
}

async function fetchTickets(station: string) {
  const res = await fetch(`/api/tickets?station=${station}`);
  const json = await res.json();
  return json.data as Ticket[];
}

export default function KDSBoard({ station }: KDSBoardProps) {
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets", station],
    queryFn: () => fetchTickets(station),
    refetchInterval: 3000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading tickets...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-6xl">✅</p>
        <p className="text-gray-400 text-xl font-medium">All caught up!</p>
        <p className="text-gray-600 text-sm">No pending tickets</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 overflow-x-auto h-full items-start">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket as Parameters<typeof TicketCard>[0]["ticket"]}
          stationKey={station}
        />
      ))}
    </div>
  );
}
