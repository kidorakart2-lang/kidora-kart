"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ActivityItem {
  _id: string;
  name: string;
  avatar?: string;
  action: string;
  createdAt: string;
}

interface RecentActivityProps {
  activity?: ActivityItem[];
}

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity?.map((item, index) => (
            <div
              key={item._id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 animate-in slide-in-from-left"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage
                  src={item.avatar || "/placeholder.svg"}
                  alt={item.name}
                />
                <AvatarFallback>{item.name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.name}{" "}
                  <span className="text-muted-foreground font-normal">
                    {item.action}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Joined on : {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
