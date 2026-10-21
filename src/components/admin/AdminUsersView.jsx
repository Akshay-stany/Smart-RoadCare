import { useState, useMemo } from "react";
import { useUsersAndPresence } from "@/hooks/useUsersAndPresence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Activity,
  UserCheck,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  HardHat,
  Shield,
  Clock,
} from "lucide-react";
import StatCard from "@/components/common/StatCard";

export default function AdminUsersView() {
  const {
    users,
    isLoading,
    refetch,
    totalRegistered,
    activeOnline,
    citizenCount,
    officerCount,
    adminCount,
  } = useUsersAndPresence();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== "all" && u.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === "online" && !u.isOnline) return false;
      if (statusFilter === "offline" && u.isOnline) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchRole = u.role?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchRole) return false;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs gap-1">
            <Shield className="w-3 h-3 text-purple-600" />
            Admin
          </Badge>
        );
      case "officer":
        return (
          <Badge className="bg-sky-50 text-sky-700 border border-sky-200 font-bold text-xs gap-1">
            <HardHat className="w-3 h-3 text-sky-600" />
            Field Officer
          </Badge>
        );
      default:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs gap-1">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            Citizen
          </Badge>
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recent";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* 4 Overview Statistics Cards for Users */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Registered Users"
          value={totalRegistered.toString()}
          icon={Users}
          iconBg="bg-blue-50 text-blue-600"
          trend="Database Verified"
          trendDirection="up"
        />

        <StatCard
          title="Active / Online Now"
          value={activeOnline.toString()}
          icon={Activity}
          iconBg="bg-emerald-50 text-emerald-600"
          trend={`${activeOnline} connected sessions`}
          trendDirection="up"
          className="border-emerald-300 ring-1 ring-emerald-200"
        />

        <StatCard
          title="Registered Citizens"
          value={citizenCount.toString()}
          icon={UserCheck}
          iconBg="bg-teal-50 text-teal-600"
          trend="Civic Reporters"
          trendDirection="up"
        />

        <StatCard
          title="Municipal Staff & Admins"
          value={(officerCount + adminCount).toString()}
          icon={ShieldAlert}
          iconBg="bg-purple-50 text-purple-600"
          trend={`${officerCount} Officers, ${adminCount} Admins`}
          trendDirection="up"
        />
      </div>

      {/* Main Users Table Card */}
      <Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Registered Platform Users & Real-time Presence
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Distinguishing registered user accounts from currently online active sessions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs rounded-xl border-slate-200 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-32 text-xs font-semibold rounded-xl border-slate-200">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="citizen">Citizens</SelectItem>
                <SelectItem value="officer">Officers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            {/* Online/Offline Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-32 text-xs font-semibold rounded-xl border-slate-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Presence</SelectItem>
                <SelectItem value="online">Online Only</SelectItem>
                <SelectItem value="offline">Offline Only</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-9 border-slate-200 text-slate-700 hover:text-emerald-600 rounded-xl text-xs font-bold"
              title="Refresh User List"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Current Presence</th>
                  <th className="py-3.5 px-5 text-right">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                        <span>Loading registered users...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                      No users match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const initials = u.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "U";

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs">
                                {initials}
                              </div>
                              {/* Presence Dot indicator */}
                              <span
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-2xs ${
                                  u.isOnline ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-300"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                                ID: {u.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 text-xs font-mono">{u.email}</td>

                        <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                        <td className="py-3.5 px-4">
                          {u.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              Offline
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-right text-xs text-slate-500 font-medium">
                          {formatDate(u.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
