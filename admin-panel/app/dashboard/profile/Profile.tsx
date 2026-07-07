import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone, User, Shield } from "lucide-react";

export default function Profile({ details }: { details: any }) {
  if (!details) return <div>Loading profile...</div>;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-32 relative">
            <div className="absolute -bottom-16 left-8">
              <Avatar className="h-32 w-32 border-4 border-gray-800 bg-white">
                {details.avatar ? (
                  <AvatarImage src={details.avatar} alt={details.name} />
                ) : (
                  <AvatarFallback className="text-3xl bg-gray-100">
                   {details.name?.[0] ?? "U"}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
          </div>

          <CardHeader className="pt-20 px-8">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold">
                  {details.name || "No Name"}
                </CardTitle>
                <div className="flex items-center text-muted-foreground mt-1">
                  <Shield className="h-4 w-4 mr-2" />
                  <span className="capitalize">{details.role || "User"}</span>
                  <Badge
                    variant={details.status ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {details.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {/* <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Member since {formatDate(details.createdAt)}</span>
                </div> */}
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-muted-foreground mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{details.email || "N/A"}</p>
                      {details.isEmailVerified ? (
                        <Badge
                          variant="outline"
                          className="text-green-600 mt-1"
                        >
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-600 mt-1"
                        >
                          Not Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* <div className="flex items-center">
                    <Phone className="h-5 w-5 text-muted-foreground mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{details.mobile || "N/A"}</p>
                      {details.mobile && (
                        <Badge
                          variant="outline"
                          className={
                            details.isMobileVerified
                              ? "text-green-600"
                              : "text-amber-600 mt-1"
                          }
                        >
                          {details.isMobileVerified
                            ? "Verified"
                            : "Not Verified"}
                        </Badge>
                      )}
                    </div>
                  </div> */}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm">{details._id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="capitalize">
                      {details.gender || "Not specified"}
                    </p>
                  </div>
                  {/* <div>
                    <p className="text-sm text-muted-foreground">
                      Last Updated
                    </p>
                    <p>{formatDate(details.updatedAt)}</p>
                  </div> */}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Account Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Account Status
                  </p>
                  <p className="font-medium">
                    {details.status ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Email Status</p>
                  <p className="font-medium">
                    {details.isEmailVerified ? "Verified" : "Not Verified"}
                  </p>
                </div>
                {/* <div className="p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Phone Status</p>
                  <p className="font-medium">
                    {details.mobile
                      ? details.isMobileVerified
                        ? "Verified"
                        : "Not Verified"
                      : "Not Provided"}
                  </p>
                </div> */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
