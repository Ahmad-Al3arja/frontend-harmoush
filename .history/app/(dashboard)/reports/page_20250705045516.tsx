"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/app/components/ui/data-table";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useAuthStore } from "@/app/lib/store";
import { api } from "@/app/lib/api";
import { ColumnDef } from "@tanstack/react-table";
import { ReportDialog } from "@/app/components/reports/report-dialog";
import { AlertTriangle, Clock, User, Package, MessageSquare, Filter, RefreshCw, TrendingUp } from "lucide-react";

interface Report {
  id: number;
  reporter_email: string;
  report_type: string;
  reason: string;
  reason_display: string;
  details: string;
  reported_user_email?: string;
  reported_user_name?: string;
  reported_product_title?: string;
  reported_product_id?: number;
  reported_message?: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  admin_notes: string;
  public_response: string;
  action_taken: string;
  action_details: string;
  report_count: number;
  is_duplicate: boolean;
  created_at: string;
  updated_at: string;
  time_since_created: string;
  is_urgent: boolean;
  requires_immediate_action: boolean;
}

interface ReportsResponse {
  reports: Report[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  filters: {
    status?: string;
    type?: string;
    priority?: string;
    reason?: string;
    search?: string;
    urgent_only?: boolean;
    immediate_action?: boolean;
  };
}

const priorityColors = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  reviewing: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  escalated: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    priority: "",
    reason: "",
    search: "",
    urgent_only: false,
    immediate_action: false,
  });
  
  const [sortBy, setSortBy] = useState("priority");
  const [sortOrder, setSortOrder] = useState("desc");
  
  const { accessToken } = useAuthStore();

  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-sm">#{row.getValue("id")}</span>
      ),
    },
    {
      accessorKey: "report_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("report_type") as string;
        const icon = type === 'user' ? <User className="w-4 h-4" /> : 
                    type === 'product' ? <Package className="w-4 h-4" /> : 
                    <MessageSquare className="w-4 h-4" />;
        return (
          <div className="flex items-center gap-2">
            {icon}
            <span className="capitalize">{type}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "priority_display",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.original.priority;
        const isUrgent = row.original.is_urgent;
        return (
          <div className="flex items-center gap-2">
            <Badge className={priorityColors[priority as keyof typeof priorityColors]}>
              {row.getValue("priority_display")}
            </Badge>
            {isUrgent && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
        );
      },
    },
    {
      accessorKey: "reason_display",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("reason_display")}</span>
      ),
    },
    {
      accessorKey: "reporter_email",
      header: "Reporter",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.getValue("reporter_email")}</span>
      ),
    },
    {
      accessorKey: "reported_content",
      header: "Reported",
      cell: ({ row }) => {
        const report = row.original;
        if (report.report_type === 'user' && report.reported_user_name) {
          return (
            <div className="text-sm">
              <div className="font-medium">{report.reported_user_name}</div>
              <div className="text-gray-500">{report.reported_user_email}</div>
            </div>
          );
        } else if (report.report_type === 'product' && report.reported_product_title) {
          return (
            <div className="text-sm">
              <div className="font-medium">{report.reported_product_title}</div>
              <div className="text-gray-500">ID: {report.reported_product_id}</div>
            </div>
          );
        } else if (report.report_type === 'message' && report.reported_message) {
          return (
            <div className="text-sm">
              <div className="font-medium">Message</div>
              <div className="text-gray-500 truncate max-w-32">
                {report.reported_message.substring(0, 30)}...
              </div>
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      accessorKey: "status_display",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const requiresAction = row.original.requires_immediate_action;
        return (
          <div className="flex items-center gap-2">
            <Badge className={statusColors[status as keyof typeof statusColors]}>
              {row.getValue("status_display")}
            </Badge>
            {requiresAction && <Clock className="w-4 h-4 text-orange-500" />}
          </div>
        );
      },
    },
    {
      accessorKey: "report_count",
      header: "Count",
      cell: ({ row }) => {
        const count = row.getValue("report_count") as number;
        const isDuplicate = row.original.is_duplicate;
        return (
          <div className="text-center">
            <span className={`font-bold ${count > 1 ? 'text-red-600' : 'text-gray-600'}`}>
              {count}
            </span>
            {isDuplicate && (
              <div className="text-xs text-gray-500">Duplicate</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "time_since_created",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.getValue("time_since_created")}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedReport(row.original);
            setDialogOpen(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  const fetchReports = async () => {
    try {
      if (!accessToken) {
        setError("No access token available");
        return;
      }
      
      setLoading(true);
      setError("");
      
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        page_size: pagination.page_size.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      
      // Add filters
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.reason) params.append('reason', filters.reason);
      if (filters.search) params.append('search', filters.search);
      if (filters.urgent_only) params.append('urgent_only', 'true');
      if (filters.immediate_action) params.append('immediate_action', 'true');
      
      const data = await api.reports.getAll(accessToken, params.toString());
      console.log("Reports fetched successfully:", data);
      
      setReports((data.reports || []).map((r: any) => ({
        ...r,
        priority: r.priority ?? '',
        priority_display: r.priority_display ?? '',
        public_response: r.public_response ?? '',
        action_taken: r.action_taken ?? '',
        action_details: r.action_details ?? '',
        report_count: r.report_count ?? 0,
        is_duplicate: r.is_duplicate ?? false,
        time_since_created: r.time_since_created ?? '',
        is_urgent: r.is_urgent ?? false,
        requires_immediate_action: r.requires_immediate_action ?? false,
      })));
      setPagination(data.pagination);
    } catch (err: any) {
      console.error("Error fetching reports:", err);
      setError(err.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [accessToken, pagination.page, pagination.page_size, sortBy, sortOrder, filters]);

  const handleUpdateStatus = async (
    id: number,
    status: string,
    admin_notes: string
  ): Promise<boolean> => {
    try {
      if (!accessToken) return false;
      
      await api.reports.updateStatus(id, { status, admin_notes }, accessToken);
      await fetchReports(); // Refresh the list
      return true;
    } catch (err) {
      console.error("Error updating report status:", err);
      return false;
    }
  };

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      type: "",
      priority: "",
      reason: "",
      search: "",
      urgent_only: false,
      immediate_action: false,
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
        <Button onClick={fetchReports} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button onClick={fetchReports} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reports.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reports.filter(r => r.priority === 'urgent').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Requires Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {reports.filter(r => r.requires_immediate_action).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by email, name, or details..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.urgent_only}
                onChange={(e) => handleFilterChange('urgent_only', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Urgent only</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.immediate_action}
                onChange={(e) => handleFilterChange('immediate_action', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Requires immediate action</span>
            </label>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {reports.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No reports found</p>
          <Button onClick={fetchReports} variant="outline" className="mt-4">
            Refresh
          </Button>
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={reports} />
          
          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.page_size) + 1} to{" "}
                {Math.min(pagination.page * pagination.page_size, pagination.total_count)} of{" "}
                {pagination.total_count} reports
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedReport && (
        <ReportDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedReport(null);
          }}
          report={selectedReport}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
