"use client";

export interface ShiprocketTrackingData {
  status?: string;
  EDD?: string;
}

export default function ShiprocketTrackingStatus({
  shiprocketTracking,
  currentStatus,
}: {
  shiprocketTracking: ShiprocketTrackingData | null;
  currentStatus: string;
}) {
  const status = shiprocketTracking?.status || currentStatus || "Pending";
  const isDelivered = status === "Delivered";
  const isInTransit = status === "In Transit" || status === "Out for Delivery";
  const edd = shiprocketTracking?.EDD;

  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-indigo-600">Status:</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isDelivered ? "bg-green-100 text-green-800" : isInTransit ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
          {status}
        </span>
      </div>
      {edd && (
        <p className="text-xs text-indigo-600">EDD: {new Date(edd).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
      )}
    </div>
  );
}
