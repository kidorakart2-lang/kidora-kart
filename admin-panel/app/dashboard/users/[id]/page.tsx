"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { ShoppingCart, Package, Star, Heart, ShoppingCartIcon } from "lucide-react";

export default function page() {
  const { id } = useParams();
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      return api.post<any>(`/api/admin/user/get-full-details/${id}`, {});
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading user details...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-destructive">
        Error loading user details: {error.message}
      </div>
    );
  }

  if (!user?._user) {
    return <div className="p-8 text-muted-foreground">User not found</div>;
  }

  const {
    _user,
    _cart = [],
    _orders = [],
    _wishlist = [],
    _reviews = [],
  } = user;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Name:{" "}
                <span className="font-medium text-foreground">{_user.name}</span>
              </p>
              <p className="text-muted-foreground">
                Email:{" "}
                <span className="font-medium text-foreground">{_user.email}</span>
              </p>
              <p className="text-muted-foreground">
                Phone:{" "}
                <span className="font-medium text-foreground">{_user.mobile}</span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Role:{" "}
                <span className="font-medium text-foreground capitalize">
                  {_user.role}
                </span>
              </p>
              <p className="text-muted-foreground">
                Gender:{" "}
                <span className="font-medium text-foreground capitalize">
                  {_user.gender || "Not specified"}
                </span>
              </p>
              <p className="text-muted-foreground">
                Account Created:{" "}
                <span className="font-medium text-foreground">
                  {new Date(_user.createdAt).toLocaleDateString()}
                </span>
              </p>
              <p className="text-muted-foreground">
                Status:{" "}
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Active
                </Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cart Items Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({_cart.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {_cart.length > 0 ? (
            _cart.map((cart: any) => (
              <div
                key={cart._id}
                className="border border-border rounded-lg p-4 mb-6 last:mb-0"
              >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">
                      Cart ID:{" "}
                      <span className="text-muted-foreground font-normal">
                        {cart._id}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last Updated: {new Date(cart.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {cart.items?.length || 0}{" "}
                    {cart.items?.length === 1 ? "item" : "items"}
                  </Badge>
                </div>

                {cart.items?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">
                      Products in Cart:
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.items.map((item: any, index: number) => (
                          <TableRow key={`${cart._id}-${index}`}>
                            <TableCell>
                              <div className="flex items-center">
                                <Image
                                  src={item.product?.image || ""}
                                  alt={item.product?.name || ""}
                                  width={50}
                                  height={50}
                                  className="rounded"
                                />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-foreground">
                                    {item.product?.name || "Product not found"}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.product?._id || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.color?.name && (
                                <div className="flex items-center">
                                  <span
                                    className="w-4 h-4 rounded-full mr-2 border border-border"
                                    style={{
                                      backgroundColor:
                                        item.color.code || "var(--muted)",
                                    }}
                                    title={item.color.name}
                                  ></span>
                                  <span className="text-sm text-foreground">
                                    {item.color.name}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-foreground">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-sm text-foreground">
                              ₹
                              {item.product?.discount_price
                                ? (
                                    item.product.discount_price * item.quantity
                                  ).toFixed(2)
                                : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">
                            Total:
                          </TableCell>
                          <TableCell className="font-bold">
                            ₹
                            {cart.items
                              .reduce((total: number, item: any) => {
                                return (
                                  total +
                                  (item.product?.discount_price ||
                                    item.product?.price ||
                                    0) *
                                    item.quantity
                                );
                              }, 0)
                              .toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">
                No items in cart
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This user hasn&apos;t added any items to their cart yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders ({_orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {_orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {_orders.map((order: any) => (
                  <TableRow key={order._id}>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {order._id}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {order.status || "Completed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      ₹{order.pricing.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No orders found</p>
          )}
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Reviews ({_reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {_reviews.length > 0 ? (
            <div className="space-y-6">
              {_reviews.map((review: any) => (
                <div
                  key={review._id}
                  className="border-b border-border pb-6 last:border-0"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {review.productId?.name || "Product not found"}
                      </h3>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < (review.rating || 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-muted-foreground">
                          {review.rating}.0 out of 5
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {review.comment && (
                    <div className="mt-3 p-4 bg-muted rounded-lg">
                      <p className="text-foreground">{review.comment}</p>
                    </div>
                  )}

                  {review.images && review.images.length > 0 && (
                    <div className="mt-3 flex space-x-2">
                      {review.images.map((image: string, idx: number) => (
                        <div
                          key={idx}
                          className="w-16 h-16 rounded-md overflow-hidden border border-border"
                        >
                          <img
                            src={image}
                            alt={`Review ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">
                No reviews yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This user hasn&apos;t left any reviews yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wishlist Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Wishlist ({_wishlist.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {_wishlist.length > 0 ? (
            <div className="space-y-6">
              {_wishlist.map((wishlistItem: any) => (
                <div key={wishlistItem._id} className="border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Added on:{" "}
                    {new Date(wishlistItem.createdAt).toLocaleDateString()}
                  </p>
                  <div className="space-y-4">
                    {wishlistItem.products.map((product: any) => (
                      <div
                        key={product._id}
                        className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        <div className="w-20 h-20 flex-shrink-0">
                          <img
                            src={product.image || "/placeholder-product.jpg"}
                            alt={product.name}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-foreground font-medium">
                              ₹{product.discount_price || product.price}
                            </span>
                            {product.discount_price && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{product.price}
                              </span>
                            )}
                            {product.discount_price && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {Math.round(
                                  ((product.price - product.discount_price) /
                                    product.price) *
                                    100
                                )}
                                % OFF
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1">
                            <Badge
                              variant={product.stock > 0 ? "default" : "destructive"}
                              className={product.stock > 0
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : ""
                              }
                            >
                              {product.stock > 0 ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No items in wishlist</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
