"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { User, api, Mark } from "../../lib/api";
import { X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../../lib/store";

interface UserMarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onSuccess: () => void;
}

const MARK_TYPES = {
  VERIFIED: "General verification status",
  PHONE_VERIFIED: "Phone number verification",
  IDENTITY_VERIFIED: "Identity document verification",
  NOT_TRUSTED: "User flagged as not trustworthy",
  TRUSTED: "Trusted user status",
  PREMIUM: "Premium member status",
  GOLD: "Gold member status",
  TOP_SELLER: "Top seller badge",
  VIP: "VIP member status",
} as const;

type MarkType = keyof typeof MARK_TYPES;

export function UserMarksDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserMarksDialogProps) {
  const { accessToken } = useAuthStore();
  const [selectedMark, setSelectedMark] = useState<MarkType | "">("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isAssigningMark, setIsAssigningMark] = useState(false);
  const [error, setError] = useState("");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedMarkId, setSelectedMarkId] = useState<number | null>(null);

  useEffect(() => {
    const fetchMarks = async () => {
      if (!user?.id || !accessToken) return;

      try {
        const fetchedMarks = await api.users.listMarks(
          user.id.toString(),
          accessToken
        );
        setMarks(fetchedMarks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch marks");
      }
    };

    if (open) {
      setSelectedMark("");
      setExpiresAt("");
      setReason("");
      setError("");
      fetchMarks();
    }
  }, [open, user?.id, accessToken]);

  const availableMarkTypes = useMemo(() => {
    const existingMarkTypes = new Set(marks.map((mark) => mark.mark_type));

    return Object.entries(MARK_TYPES).reduce(
      (acc, [type, description]) => {
        if (!existingMarkTypes.has(type)) {
          return { ...acc, [type]: description };
        }
        return acc;
      },
      {} as Record<MarkType, string>
    );
  }, [marks]);

  const handleMarkAssignment = async () => {
    if (!user?.id || !selectedMark || !accessToken) return;

    setIsAssigningMark(true);
    setError("");

    try {
      await api.users.assignMark(
        user.id.toString(),
        {
          mark_type: selectedMark,
          expires_at: expiresAt || undefined,
          reason: reason || undefined,
        },
        accessToken
      );

      onSuccess();
      setSelectedMark("");
      setExpiresAt("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign mark");
    } finally {
      setIsAssigningMark(false);
    }
  };

  const handleRemoveMark = async (markId: number) => {
    if (!user?.id || !accessToken) return;

    try {
      await api.users.deleteMark(
        user.id.toString(),
        markId.toString(),
        accessToken
      );
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove mark");
    }
  };

  const openUpdateDialog = (mark: Mark) => {
    setExpiresAt(mark.expires_at || "");
    setReason(mark.reason || "");
    setSelectedMarkId(mark.id);
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateMark = async () => {
    if (!user?.id || !accessToken || selectedMarkId === null) return;

    try {
      const updatedMark = await api.users.updateMark(
        user.id.toString(),
        selectedMarkId.toString(),
        {
          expires_at: expiresAt || undefined,
          reason: reason || undefined,
          is_active: true,
        },
        accessToken
      );

      setMarks((prevMarks) =>
        prevMarks.map((mark) =>
          mark.id === selectedMarkId ? { ...mark, ...updatedMark } : mark
        )
      );

      onSuccess();
      setIsUpdateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update mark");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>User Marks - {user?.name}</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        {marks.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Active Marks
            </h3>
            <div className="space-y-2">
              {marks.map((mark) => (
                <div
                  key={mark.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="font-medium">{mark.mark_type}</p>
                    <p className="text-sm text-gray-500">
                      {mark.reason && `Reason: ${mark.reason}`}
                    </p>
                    {mark.expires_at && (
                      <p className="text-sm text-gray-500">
                        Expires:{" "}
                        {new Date(mark.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openUpdateDialog(mark)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleRemoveMark(mark.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            No active marks for this user
          </div>
        )}

        {Object.keys(availableMarkTypes).length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Add New Mark</h3>
            <div>
              <select
                value={selectedMark}
                onChange={(e) => setSelectedMark(e.target.value as MarkType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Select a mark type</option>
                {Object.entries(availableMarkTypes).map(
                  ([type, description]) => (
                    <option key={type} value={type}>
                      {type} - {description}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Expiration Date (Optional)"
              />
            </div>

            <div>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Reason (Optional)"
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <button
              onClick={handleMarkAssignment}
              disabled={!selectedMark || isAssigningMark}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isAssigningMark ? "Assigning..." : "Assign Mark"}
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            All available marks have been assigned to this user
          </div>
        )}
      </DialogContent>

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Update Mark</DialogTitle>
              <button
                onClick={() => setIsUpdateDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Expiration Date (Optional)"
            />
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Reason (Optional)"
            />
            <button
              onClick={handleUpdateMark}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Update Mark
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
