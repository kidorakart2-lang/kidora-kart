"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import Image from "next/image";

interface Banner {
  _id: string;
  image: string;
  description: string;
}

interface BannersSelectProps {
  value: string;
  onChange: (bannerId: string) => void;
  disabled?: boolean;
}

export default function BannersSelect({ value, onChange, disabled }: BannersSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: response } = useQuery({
    queryKey: ["banners-select"],
    queryFn: () => api.post<{ _data: Banner[]; _total_records: number }>("/api/admin/banner/view", { limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const banners: Banner[] = Array.isArray(response)
    ? response
    : (response as { _data?: Banner[] })?._data ?? [];

  const selected = banners.find((b) => b._id === value);
  const filtered = search.trim()
    ? banners.filter((b) =>
        b.description.toLowerCase().includes(search.toLowerCase())
      )
    : banners;

  return (
    <div className="space-y-2">
      <Label>Category Banner (optional)</Label>

      {/* Selected banner preview */}
      {selected && (
        <div className="relative flex items-center gap-3 rounded-lg border p-2 bg-muted/30">
          <div className="relative w-20 h-12 rounded overflow-hidden shrink-0">
            <Image
              src={selected.image}
              alt={selected.description}
              width={80}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-sm text-muted-foreground flex-1 truncate">
            {selected.description}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Select/dropdown toggle */}
      {!selected && (
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setOpen(!open)}
            disabled={disabled}
          >
            {open ? "Close" : "Select a banner..."}
          </Button>

          {open && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border bg-background shadow-lg">
              {/* Search */}
              <div className="relative p-2 border-b">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search banners..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              {/* Banner list */}
              <div className="max-h-48 overflow-y-auto p-1 space-y-1">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No banners found
                  </p>
                ) : (
                  filtered.map((banner) => (
                    <button
                      key={banner._id}
                      type="button"
                      className="flex items-center gap-3 w-full rounded-md p-2 text-left hover:bg-muted transition-colors"
                      onClick={() => {
                        onChange(banner._id);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <div className="relative w-16 h-10 rounded overflow-hidden shrink-0">
                        <Image
                          src={banner.image}
                          alt={banner.description}
                          width={64}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground truncate">
                        {banner.description}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
