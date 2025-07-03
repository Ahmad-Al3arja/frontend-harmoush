"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/app/components/ui/data-table";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Pencil,
  Trash2,
  Lock,
  Unlock,
  Star,
  Eye,
  AlertCircle,
  Badge,
} from "lucide-react";
import { useAuthStore } from "@/app/lib/store";
import { api } from "@/app/lib/api";
import { ColumnDef } from "@tanstack/react-table";
import { UserDialog } from "@/app/components/users/user-dialog";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import { Input } from "@/app/components/ui/input";
import { UserMarksDialog } from "@/app/components/users/user-marks-dialog";

interface User {
  id: number;
  email: string;
  name: string;
  is_seller: boolean;
  phone: string;
  password: string;
  bio: string;
  is_email_verified: boolean;
  is_whatsapp: boolean;
  show_phone: boolean;
  profile_picture: string;
  is_admin_blocked?: boolean;
  phone_info: {
    number: string;
    is_whatsapp: boolean;
  };
  created_at: string;
  updated_at: string;
  active_marks: any[];
}

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
  created_at: string;
  author?: string;
  subject?: string;
}

interface CreateReview {
  rating: number;
  comment: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState(
    "Violation of terms of service"
  );
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [unblockLoading, setUnblockLoading] = useState(false);
  const [userToUnblock, setUserToUnblock] = useState<User | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [userToReview, setUserToReview] = useState<User | null>(null);
  const [viewReviewsDialogOpen, setViewReviewsDialogOpen] = useState(false);
  const [selectedUserReviews, setSelectedUserReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [marksDialogOpen, setMarksDialogOpen] = useState(false);
  const [userForMarks, setUserForMarks] = useState<User | undefined>();
  const [reviewData, setReviewData] = useState<CreateReview>({
    rating: 5,
    comment: "",
  });
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState<Partial<User>>({
    email: "",
    name: "",
    phone: "",
    password: "",
    bio: "",
    is_whatsapp: false,
    show_phone: false,
  });
  const { accessToken, user: currentUser } = useAuthStore();

  const handleMarksClick = (user: User) => {
    setUserForMarks(user);
    setMarksDialogOpen(true);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const hasMarks = row.original.active_marks?.length > 0;
        return (
          <div className="flex items-center gap-2">
            <span>{row.original.email}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarksClick(row.original);
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
              title={hasMarks ? "View/Manage User Marks" : "Assign Marks"}
            >
              {hasMarks ? (
                <Badge className="w-4 h-4 text-blue-600 fill-current" />
              ) : (
                <Badge className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.phone}
          {row.original.is_whatsapp && (
            <span className="ml-2 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              WhatsApp
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "is_seller",
      header: "Role",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.getValue("is_seller")
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {row.getValue("is_seller") ? "Seller" : "Buyer"}
        </span>
      ),
    },
    {
      accessorKey: "is_admin_blocked",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.original.is_admin_blocked
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {row.original.is_admin_blocked ? "Blocked" : "Active"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: ({ row }) =>
        new Date(row.getValue("created_at")).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const isCurrentUser = currentUser?.id === row.original.id;
        const isBlocked = row.original.is_admin_blocked;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original)}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewReviews(row.original)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View Reviews
            </Button>
            {!isCurrentUser && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => handleDeleteClick(row.original)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
                {!isBlocked ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-600"
                    onClick={() => handleBlockClick(row.original)}
                  >
                    <Lock className="w-4 h-4 mr-1" />
                    Block
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600"
                    onClick={() => handleUnblockClick(row.original)}
                  >
                    <Unlock className="w-4 h-4 mr-1" />
                    Unblock
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReviewClick(row.original)}
                >
                  <Star className="w-4 h-4 mr-1" />
                  Review
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const mapApiUserToUser = (apiUser: any): User => ({
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name || "",
    is_seller: apiUser.is_seller || false,
    phone: apiUser.phone || "",
    bio: apiUser.bio || "",
    is_email_verified: apiUser.is_email_verified || false,
    is_whatsapp: apiUser.is_whatsapp || false,
    show_phone: apiUser.show_phone || false,
    profile_picture: apiUser.profile_picture || "",
    is_admin_blocked: apiUser.is_admin_blocked || false,
    phone_info: {
      number: apiUser.phone_info?.number || "",
      is_whatsapp: apiUser.phone_info?.is_whatsapp || false,
    },
    created_at: apiUser.created_at || "",
    updated_at: apiUser.updated_at || "",
    password: apiUser.password || "0000",
    active_marks: apiUser.active_marks || [],
  });

  const fetchUsers = async () => {
    try {
      if (!accessToken) return;
      const data = await api.users.getAll(accessToken);
      const mappedUsers = data.map(mapApiUserToUser);
      setUsers(mappedUsers);
    } catch (err) {
      setError("Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [accessToken]);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!accessToken || !userToDelete?.id) return;

    setDeleteLoading(true);
    try {
      await api.users.delete(userToDelete.id, accessToken);
      await fetchUsers();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBlockClick = (user: User) => {
    setUserToBlock(user);
    setBlockDialogOpen(true);
  };

  const handleBlock = async () => {
    if (!accessToken || !userToBlock?.id) return;

    setBlockLoading(true);
    try {
      await api.users.block(userToBlock.id, blockReason, accessToken);
      await fetchUsers();
      setBlockDialogOpen(false);
      setUserToBlock(null);
    } catch (err) {
      console.error(err);
      setError("Failed to block user");
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblockClick = (user: User) => {
    setUserToUnblock(user);
    setUnblockDialogOpen(true);
  };

  const handleUnblock = async () => {
    if (!accessToken || !userToUnblock?.id) return;

    setUnblockLoading(true);
    try {
      await api.users.unblock(userToUnblock.id, accessToken);
      await fetchUsers();
      setUnblockDialogOpen(false);
      setUserToUnblock(null);
    } catch (err) {
      console.error(err);
      setError("Failed to unblock user");
    } finally {
      setUnblockLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleReviewClick = (user: User) => {
    setUserToReview(user);
    setReviewDialogOpen(true);
    setReviewData({ rating: 5, comment: "" });
  };

  const handleCreateReview = async () => {
    if (!userToReview?.id || !accessToken) return;

    try {
      await api.users.createReview(userToReview.id, reviewData, accessToken);
      setReviewDialogOpen(false);
      setUserToReview(null);
      setReviewData({ rating: 5, comment: "" });
    } catch (error) {
      console.error("Failed to create review:", error);
      setError("Failed to create review");
    }
  };

  const handleViewReviews = async (user: User) => {
    if (!user.id || !accessToken) return;

    setReviewsLoading(true);
    try {
      const reviews = await api.users.getReviews(user.id, accessToken);
      setSelectedUserReviews(reviews);
      setViewReviewsDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setError("Failed to fetch reviews");
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!accessToken) return;

    try {
      await api.users.create(newUserData, accessToken);
      setAddUserDialogOpen(false);
      setNewUserData({
        email: "",
        name: "",
        phone: "",
        bio: "",
        is_whatsapp: false,
        show_phone: false,
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to add user:", error);
      setError("Failed to add user");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between p-2 items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setAddUserDialogOpen(true)} variant="outline">
          Add User
        </Button>
      </div>
      <DataTable columns={columns} data={users} />

      {/* User Edit Dialog */}
      <div className="overflow-auto">
        <UserDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          user={selectedUser}
          onSuccess={fetchUsers}
        />
      </div>

      {/* Marks Management Dialog */}
      <UserMarksDialog
        open={marksDialogOpen}
        onOpenChange={setMarksDialogOpen}
        user={userForMarks}
        onSuccess={() => {
          fetchUsers();
          setMarksDialogOpen(false);
        }}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.email}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-2">
            <AlertCircle className="h-14 w-14 text-gray-400" />
          </div>
          <DialogFooter className="flex justify-center gap-4 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              No, cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Yes, I'm sure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block User Modal */}
      <ConfirmDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        title="Block User"
        description={`Are you sure you want to block ${userToBlock?.email}?`}
        onConfirm={handleBlock}
        loading={blockLoading}
        confirmText="Block"
        loadingText="Blocking..."
        customContent={
          <div className="space-y-2 mt-4">
            <label htmlFor="blockReason" className="text-sm font-medium">
              Reason for blocking:
            </label>
            <Input
              id="blockReason"
              value={blockReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBlockReason(e.target.value)
              }
              placeholder="Enter reason for blocking"
            />
          </div>
        }
      />

      {/* Unblock User Modal */}
      <ConfirmDialog
        open={unblockDialogOpen}
        onOpenChange={setUnblockDialogOpen}
        title="Unblock User"
        description={`Are you sure you want to unblock ${userToUnblock?.email}?`}
        onConfirm={handleUnblock}
        loading={unblockLoading}
        confirmText="Unblock"
        loadingText="Unblocking..."
      />

      {/* Create Review Modal */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Review for {userToReview?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rating (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={reviewData.rating}
                onChange={(e) =>
                  setReviewData((prev) => ({
                    ...prev,
                    rating: parseInt(e.target.value),
                  }))
                }
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Comment
              </label>
              <textarea
                value={reviewData.comment}
                onChange={(e) =>
                  setReviewData((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                rows={4}
                className="mt-1 p-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateReview}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Reviews Modal */}
      <Dialog
        open={viewReviewsDialogOpen}
        onOpenChange={setViewReviewsDialogOpen}
      >
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>User Reviews</DialogTitle>
          </DialogHeader>
          {reviewsLoading ? (
            <div className="text-center py-4">Loading reviews...</div>
          ) : selectedUserReviews.length === 0 ? (
            <div className="text-center py-4">No reviews found</div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedUserReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{review.author}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1">{review.rating}/5</span>
                    </div>
                  </div>
                  <p className="mt-2">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewReviewsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={newUserData.email}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, email: e.target.value })
                }
                className="mt-1 block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={newUserData.name}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, name: e.target.value })
                }
                className="mt-1 block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="New Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="text"
                value={newUserData.phone}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, phone: e.target.value })
                }
                className="mt-1 block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="+201234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="text"
                value={newUserData.password}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, password: e.target.value })
                }
                className="mt-1 block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="********"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                value={newUserData.bio}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, bio: e.target.value })
                }
                className="mt-1 p-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="New bio"
                rows={4}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newUserData.show_phone}
                onChange={(e) =>
                  setNewUserData({
                    ...newUserData,
                    show_phone: e.target.checked,
                  })
                }
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Show Phone
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newUserData.is_whatsapp}
                onChange={(e) =>
                  setNewUserData({
                    ...newUserData,
                    is_whatsapp: e.target.checked,
                  })
                }
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Is WhatsApp
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="default" onClick={handleAddUser}>
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
