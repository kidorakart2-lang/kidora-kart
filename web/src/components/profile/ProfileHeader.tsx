"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProfileHeaderProps {
  avatar: string | null;
  name: string;
  email: string;
  onEditPhoto: () => void;
}

export default function ProfileHeader({
  avatar,
  name,
  email,
  onEditPhoto,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-end gap-5 p-6 md:p-8 border-b border-border mb-6">
      <div className="relative group shrink-0">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-muted">
          <Avatar className="w-full h-full">
            {avatar && (
              <Image
                src={avatar}
                alt="Profile"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            )}
            <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-lg">
              {name?.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <button
          onClick={onEditPhoto}
          className="absolute -bottom-1 -right-1 bg-foreground hover:bg-foreground/90 text-background p-1.5 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Camera size={14} />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl fw-heading text-foreground truncate">
          {name || "My Account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
      </div>
    </div>
  );
}
