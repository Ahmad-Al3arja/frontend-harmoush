"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { Clock, User, Package, MessageSquare, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";

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

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  report: Report;
  onUpdateStatus: (id: number, status: string, admin_notes: string) => Promise<boolean>;
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

export function ReportDialog({ open, onClose, report, onUpdateStatus }: ReportDialogProps) {
  const [status, setStatus] = useState(report.status);
  const [priority, setPriority] = useState(report.priority);
  const [adminNotes, setAdminNotes] = useState(report.admin_notes);
  const [publicResponse, setPublicResponse] = useState(report.public_response);
  const [actionTaken, setActionTaken] = useState(report.action_taken);
  const [actionDetails, setActionDetails] = useState(report.action_details);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError("");
    
    try {
      const success = await onUpdateStatus(report.id, status, adminNotes);
      if (success) {
        onClose();
      } else {
        setError("Failed to update report status");
      }
    } catch (err) {
      setError("An error occurred while updating the report");
    } finally {
      setIsUpdating(false);
    }
  };

  const getReportTypeIcon = () => {
    switch (report.report_type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusIcon = () => {
    switch (report.status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewing':
        return <Eye className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getReportTypeIcon()}
            Report #{report.id} - {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={priorityColors[report.priority as keyof typeof priorityColors]}>
                  {report.priority_display}
                </Badge>
                {report.is_urgent && (
                  <div className="mt-2 text-xs text-red-600 font-medium">
                    ⚠️ Requires immediate attention
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={statusColors[report.status as keyof typeof statusColors]}>
                  {getStatusIcon()}
                  <span className="ml-1">{report.status_display}</span>
                </Badge>
                {report.requires_immediate_action && (
                  <div className="mt-2 text-xs text-orange-600 font-medium">
                    ⏰ Action required
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Report Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.report_count}</div>
                <div className="text-xs text-gray-500">
                  {report.is_duplicate ? "Duplicate report" : "Unique report"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Details */}
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Reporter</label>
                  <p className="text-sm text-gray-600">{report.reporter_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Reason</label>
                  <p className="text-sm text-gray-600">{report.reason_display}</p>
                </div>
              </div>

              {report.details && (
                <div>
                  <label className="text-sm font-medium">Additional Details</label>
                  <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded-md">
                    {report.details}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Reported Content</label>
                {report.report_type === 'user' && report.reported_user_email && (
                  <div className="mt-1 p-3 bg-red-50 rounded-md">
                    <p className="text-sm font-medium text-red-800">
                      User: {report.reported_user_name} ({report.reported_user_email})
                    </p>
                  </div>
                )}
                {report.report_type === 'product' && report.reported_product_title && (
                  <div className="mt-1 p-3 bg-red-50 rounded-md">
                    <p className="text-sm font-medium text-red-800">
                      Product: {report.reported_product_title} (ID: {report.reported_product_id})
                    </p>
                  </div>
                )}
                {report.report_type === 'message' && report.reported_message && (
                  <div className="mt-1 p-3 bg-red-50 rounded-md">
                    <p className="text-sm font-medium text-red-800">Message:</p>
                    <p className="text-sm text-red-700 mt-1">{report.reported_message}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p className="text-sm text-gray-600">{report.time_since_created}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Updated</label>
                  <p className="text-sm text-gray-600">
                    {new Date(report.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="reviewing">Under Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Action Taken</label>
                <Input
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g., user_warned, product_removed"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Action Details</label>
                <Textarea
                  value={actionDetails}
                  onChange={(e) => setActionDetails(e.target.value)}
                  placeholder="Details about the action taken..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Internal Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes for admins..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Public Response</label>
                <Textarea
                  value={publicResponse}
                  onChange={(e) => setPublicResponse(e.target.value)}
                  placeholder="Response visible to the reporter..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
