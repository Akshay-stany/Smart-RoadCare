import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useComplaintById, useMyComplaints } from "@/hooks/useComplaints";
import ComplaintCard from "@/components/ComplaintCard";
import StatsCards from "@/components/StatsCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: userComplaints, isLoading: userLoading } = useMyComplaints(user?.id);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const isComplaintIdSearch = /^RC-[A-Z0-9-]+$/i.test(debouncedSearch);
  const normalizedComplaintId = isComplaintIdSearch ? debouncedSearch.toUpperCase() : undefined;

  const { data: complaintById, isFetching: isComplaintLookupLoading } = useComplaintById(normalizedComplaintId);

  const filtered = useMemo(() => {
    const source = userComplaints || [];

    if (isComplaintIdSearch) {
      const idMatchesStatus = complaintById
        ? statusFilter === "all" || complaintById.status === statusFilter
        : false;
      return complaintById && idMatchesStatus ? [complaintById] : [];
    }

    const term = debouncedSearch.toLowerCase();
    return source.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!term) return true;
      return c.complaint_id.toLowerCase().includes(term) || c.title.toLowerCase().includes(term);
    });
  }, [userComplaints, complaintById, isComplaintIdSearch, statusFilter, debouncedSearch]);

  const isLoading = userLoading || (isComplaintIdSearch && isComplaintLookupLoading);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track your reported issues</p>
        </div>
        <Link to="/report">
          <Button><Plus className="mr-1 h-4 w-4" />Report Issue</Button>
        </Link>
      </div>

      <StatsCards />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by ID (e.g. RC-123456) or title..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isComplaintIdSearch && debouncedSearch && (
        <p className="text-xs text-muted-foreground">Searching complaint ID in database...</p>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card p-4 space-y-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{search ? "No matching complaints found" : "No complaints found"}</p>
          {!search && <Link to="/report"><Button variant="outline" className="mt-3">Report your first issue</Button></Link>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
        </div>
      )}
    </div>
  );
}
