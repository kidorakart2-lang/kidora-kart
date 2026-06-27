import React from "react";
import { Loader } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export default function SimpleLoading({ type }: { type: string }) {
  if (type == "banner") {
    return (
      <Skeleton className="w-full h-[30vh] md:h-[50vh] lg:h-[70vh]  overflow-hidden"></Skeleton>
    );
  }

  if (type == "product") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="w-full"></Skeleton>
        ))}
      </div>
    );
  }
  if (type == "slider") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="w-full"></Skeleton>
        ))}
      </div>
    );
  }
  if (type == "page") {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen">
        {/* header */}
        <Skeleton className="w-screen h-16" />
        {/* content */}
        <Skeleton className="w-screen h-[calc(60vh-80px)]" />
        {/* footer */}
        <Skeleton className="w-screen h-16" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"></div>
  );
}
