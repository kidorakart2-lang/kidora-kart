"use client";

import { useEffect, useState } from "react";
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
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import axios from "axios";

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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [btnLoading, setBtnLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const { toast } = useToast();
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetch(`/api/admin/user/findAllUser`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await data.json();
    setUsers(response._data || []);
    setLoading(false);
  };

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
      const res = await axios.delete(
        `/api/admin/user/delete/${userToDelete}`,
        { withCredentials: true }
      );
      if (res.data._status === true) {
        toast({
          title: res.data._message || "User deleted successfully",
          description: "",
        });
        loadUsers();
      } else {
        toast({
          title: res.data._message || "Something went wrong",
          description: "",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Object && error !== null
          ? (error as { response?: { data?: { _message?: string } } }).response
              ?.data?._message
          : "Operation failed";
      toast({
        title: msg,
        description: msg,
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
        const res = await axios.post(
          `/api/admin/user/${editingUser._id}/change-role`,
          { role: formData.role },
          { withCredentials: true }
        );
        if (res.data._status === true) {
          toast({ title: res.data._message || "User role changed" });
          loadUsers();
        } else {
          toast({
            title: res.data._message || "Something went wrong",
            variant: "destructive",
          });
        }
      } else {
        if (!formData.name || !formData.email || !formData.password) {
          toast({ title: "Name, email, and password are required", variant: "destructive" });
          setBtnLoading(false);
          return;
        }
        const res = await axios.post(
          `/api/admin/user/create`,
          {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          },
          { withCredentials: true }
        );
        if (res.data._status === true) {
          toast({ title: "User created successfully" });
          loadUsers();
          setDrawerOpen(false);
          setEditingUser(null);
          setFormData({ name: "", email: "", password: "", role: "user" });
        } else {
          toast({
            title: res.data._message || "Failed to create user",
            variant: "destructive",
          });
        }
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Object && error !== null
          ? (error as { response?: { data?: { _message?: string } } })
              .response?.data?._message || "Operation failed"
          : "Operation failed";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setBtnLoading(false);
    }

    if (!editingUser) return; // drawer already closed in create branch above
    setDrawerOpen(false);
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "user" });
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
            <AvatarImage src={item.avatar || ""} alt={item.name} />
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
                    <SelectItem value="delivery">Delivery</SelectItem>
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
                    <SelectItem value="delivery">Delivery</SelectItem>
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
    </div>
  );
}
