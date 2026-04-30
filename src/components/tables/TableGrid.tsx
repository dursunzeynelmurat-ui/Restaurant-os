"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import TableCard from "./TableCard";
import type { Table, Area } from "@/types";

async function fetchTables() {
  const res = await fetch("/api/tables");
  if (!res.ok) throw new Error("Failed to fetch tables");
  const json = await res.json();
  return json.data as Table[];
}

interface TableGridProps {
  linkBase?: string; // e.g. "/waiter/table" or "/cashier/table"
  filterStatuses?: Table["status"][];
}

export default function TableGrid({ linkBase, filterStatuses }: TableGridProps) {
  const router = useRouter();
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables,
    refetchInterval: 5000,
  });

  const filtered = filterStatuses
    ? tables.filter((t) => filterStatuses.includes(t.status))
    : tables;

  // Group by area
  const byArea = filtered.reduce((acc: Record<string, { area: Area; tables: Table[] }>, t) => {
    const area = t.area as Area;
    if (!area) return acc;
    if (!acc[area.id]) acc[area.id] = { area, tables: [] };
    acc[area.id].tables.push(t);
    return acc;
  }, {});

  const areas = Object.values(byArea).sort(
    (a, b) => (a.area.sort_order ?? 0) - (b.area.sort_order ?? 0)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading tables...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {areas.map(({ area, tables: areaTables }) => (
        <div key={area.id}>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {area.name}
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {areaTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={
                  linkBase
                    ? () => router.push(`${linkBase}/${table.id}`)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ))}
      {areas.length === 0 && (
        <div className="text-center text-gray-500 py-16">No tables found</div>
      )}
    </div>
  );
}
