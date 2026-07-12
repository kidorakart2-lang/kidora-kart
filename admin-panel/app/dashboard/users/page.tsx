"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { BaseItem, Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { Drawer } from "@/components/drawer";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import { Plus, Loader2, ShieldCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";

interface AdminUser extends BaseItem {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  role?: string;
  avatar?: string;
  updatedAt?: string;
  createdAt?: string;
}

export default function UsersPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [btnLoading, setBtnLoading] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const { toast } = useToast();
  const [deletedFilter, setDeletedFilter] = useState<string>("active");

  const { data: users = [], isLoading: loading, refetch } = useQuery<AdminUser[]>({
    queryKey: ["users", deletedFilter],
    queryFn: async () => {
      const data = await api.post<AdminUser[]>("/api/admin/user/findAllUser", {
        isDeletedAt: deletedFilter === "active" ? undefined : deletedFilter,
      });
      return data || [];
    },
  });

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role ?? "",
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    setUserToDelete(String(id));
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.post(`/api/admin/user/delete/${userToDelete}`, {});
      toast({ title: "User deleted successfully" });
      refetch();
    } catch (error) {
      toast({
        title: error instanceof ApiClientError ? error.message : "Operation failed",
        description: error instanceof ApiClientError ? error.message : "Operation failed",
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBtnLoading(true);

    try {
      if (editingUser) {
        setVerifyDialogOpen(true);
        setBtnLoading(false);
        return;
      } else {
        if (!formData.name || !formData.email || !formData.password) {
          toast({ title: "Name, email, and password are required", variant: "destructive" });
          setBtnLoading(false);
          return;
        }
        await api.post("/api/admin/user/create", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
        toast({ title: "User created successfully" });
        refetch();
        setDrawerOpen(false);
        setEditingUser(null);
        setFormData({ name: "", email: "", password: "", role: "user" });
      }
    } catch (error) {
      toast({ title: error instanceof ApiClientError ? error.message : "Operation failed", variant: "destructive" });
    } finally {
      setBtnLoading(false);
    }

    if (!editingUser) return;
  };

  const handleVerifyAndChangeRole = async () => {
    if (!editingUser) return;
    setVerifyLoading(true);
    try {
      await api.post("/api/admin/user/verify-password", { password: verifyPassword });
      await api.post(`/api/admin/user/${editingUser._id}/change-role`, { role: formData.role });
      toast({ title: "User role changed" });
      setVerifyDialogOpen(false);
      setVerifyPassword("");
      setDrawerOpen(false);
      setEditingUser(null);
      setFormData({ name: "", email: "", password: "", role: "user" });
      refetch();
    } catch (error) {
      toast({
        title: error instanceof ApiClientError ? error.message : "Verification failed",
        variant: "destructive",
      });
    } finally {
      setVerifyLoading(false);
    }
  };
  const router = useRouter();
  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      label: "User",
      render: (item) => (
        <div
          onClick={() => router.push(`/dashboard/users/${item._id}`)}
          className="flex items-center gap-3 cursor-pointer"
        >
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarImage src={item.avatar || "/placeholder.svg"} alt={item.name} />
            <AvatarFallback>{item.name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (item) => (
        <Badge
          variant={
            item.role === "admin"
              ? "default"
              : item.role === "delivery"
              ? "destructive"
              : "outline"
          }
          className="capitalize"
        >
          {item.role}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      key: "updatedAt",
      label: "Last Updated",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.updatedAt
            ? new Date(item.updatedAt).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={deletedFilter}
            onValueChange={setDeletedFilter}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="all">All (incl. deleted)</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
            </SelectContent>
          </Select>
          <ExportButtons data={users as unknown as Record<string, unknown>[]} filename="users" />
          <Button
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: "", email: "", password: "", role: "user" });
              setDrawerOpen(true);
            }}
            className="transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <DataTable
        data={users}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search users..."
      />

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingUser ? "Edit User" : "Add User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {editingUser ? (
            <>
              <h4 className="text-sm font-medium">Change Role for {editingUser.name}</h4>
              <p className="text-xs text-muted-foreground">
                {editingUser.email}
              </p>
              <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2 animate-in slide-in-from-right duration-300">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-50">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-75">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  placeholder="Min. 6 characters"
                />
              </div>
              <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={btnLoading}
            className="w-full animate-in slide-in-from-bottom duration-300 delay-150"
          >
            {btnLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : editingUser ? (
              "Update Role"
            ) : (
              "Create User"
            )}
          </Button>
        </form>
      </Drawer>

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
      />

      <AlertDialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Verify Password
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please enter your password to confirm changing{" "}
              <strong>{editingUser?.email}</strong> role to{" "}
              <strong>{formData.role}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter your password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !verifyLoading && verifyPassword) {
                  handleVerifyAndChangeRole();
                }
              }}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setVerifyPassword("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVerifyAndChangeRole}
              disabled={verifyLoading || !verifyPassword}
            >
              {verifyLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
