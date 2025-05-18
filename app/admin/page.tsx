"use client";

import { useEffect, useState, useMemo } from "react";
import { utils, writeFile } from "xlsx";

type Request = {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    selections: Record<string, string>;
    notes: string | null;
    total_price: number;
    created_at: string;
};

function formatSelections(selections: any): string {
    if (!selections || typeof selections !== "object") return "";
    return Object.entries(selections)
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ");
}

function exportToCSV(data: Request[]) {
    const formatted = data.map((r) => ({
        ...r,
        selections: formatSelections(r.selections),
    }));
    const ws = utils.json_to_sheet(formatted);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "ServiceRequests");
    writeFile(wb, "service_requests.csv");
}

function exportToXLSX(data: Request[]) {
    const formatted = data.map((r) => ({
        ...r,
        selections: formatSelections(r.selections),
    }));
    const ws = utils.json_to_sheet(formatted);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "ServiceRequests");
    writeFile(wb, "service_requests.xlsx");
}

export default function AdminPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<keyof Request>("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("/api/admin");
            const data = await res.json();
            setRequests(data.requests || []);
        };
        fetchData();
    }, []);

    const filtered = useMemo(() => {
        return requests
            .filter((r) =>
                [r.name, r.phone, r.email, formatSelections(r.selections), r.notes]
                    .join(" ")
                    .toLowerCase()
                    .includes(search.toLowerCase())
            )
            .sort((a, b) => {
                const aVal = a[sortField];
                const bVal = b[sortField];
                if (aVal == null || bVal == null) return 0;

                if (typeof aVal === "string") {
                    return sortOrder === "asc"
                        ? aVal.localeCompare(bVal as string)
                        : (bVal as string).localeCompare(aVal);
                }

                if (typeof aVal === "number") {
                    return sortOrder === "asc"
                        ? aVal - (bVal as number)
                        : (bVal as number) - aVal;
                }

                return 0;
            });
    }, [requests, search, sortField, sortOrder]);

    const paginated = filtered.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const totalPages = Math.ceil(filtered.length / pageSize);

    return (
        <div className="max-w-7xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">Admin Panel</h1>

            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
                <input
                    type="text"
                    placeholder="Search..."
                    className="p-2 border rounded w-full md:w-1/3"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="flex gap-2">
                    <button
                        onClick={() => exportToCSV(filtered)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => exportToXLSX(filtered)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Export XLSX
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full table-auto border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            {[
                                "ID",
                                "Name",
                                "Phone",
                                "Email",
                                "Selections",
                                "Notes",
                                "Total Price",
                                "Created At",
                            ].map((label, index) => (
                                <th
                                    key={index}
                                    className="p-2 border cursor-pointer"
                                    onClick={() => {
                                        const field = [
                                            "id",
                                            "name",
                                            "phone",
                                            "email",
                                            "selections",
                                            "notes",
                                            "total_price",
                                            "created_at",
                                        ][index] as keyof Request;

                                        if (sortField === field) {
                                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                                        } else {
                                            setSortField(field);
                                            setSortOrder("asc");
                                        }
                                    }}
                                >
                                    {label}{" "}
                                    {sortField ===
                                        ([
                                            "id",
                                            "name",
                                            "phone",
                                            "email",
                                            "selections",
                                            "notes",
                                            "total_price",
                                            "created_at",
                                        ][index] as keyof Request) &&
                                        (sortOrder === "asc" ? "▲" : "▼")}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                                <td className="p-2 border">{r.id}</td>
                                <td className="p-2 border">{r.name}</td>
                                <td className="p-2 border">{r.phone}</td>
                                <td className="p-2 border">{r.email || "-"}</td>
                                <td className="p-2 border whitespace-pre-wrap">
                                    {formatSelections(r.selections)}
                                </td>
                                <td className="p-2 border">{r.notes || "-"}</td>
                                <td className="p-2 border">₹{r.total_price}</td>
                                <td className="p-2 border">
                                    {new Date(r.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-4 gap-2 flex-wrap">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-1 rounded border ${currentPage === i + 1
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700"
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}
