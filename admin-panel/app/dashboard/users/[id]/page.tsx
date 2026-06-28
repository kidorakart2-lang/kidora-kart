"use client";
import React from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function page() {
  const { id } = useParams();
    const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const { data } = await axios.post(
        `/api/admin/user/get-full-details/${id}`,
        {},
        {
          withCredentials: true,
        }
      );
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  if (isLoading) {
    return <div className="p-8">Loading user details...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error loading user details: {error.message}
      </div>
    );
  }

  if (!user?._user) {
    return <div className="p-8">User not found</div>;
  }

  const {
    _user,
    _cart = [],
    _orders = [],
    _wishlist = [],
    _reviews = [],
  } = user;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* User Profile Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">User Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">
              Name:{" "}
              <span className="font-medium text-gray-800">{_user.name}</span>
            </p>
            <p className="text-gray-600">
              Email:{" "}
              <span className="font-medium text-gray-800">{_user.email}</span>
            </p>
            <p className="text-gray-600">
              Phone:{" "}
              <span className="font-medium text-gray-800">{_user.mobile}</span>
            </p>
            <p className="text-gray-600">
              Role:{" "}
              <span className="font-medium text-gray-800 capitalize">
                {_user.role}
              </span>
            </p>
            <p className="text-gray-600">
              Gender:{" "}
              <span className="font-medium text-gray-800 capitalize">
                {_user.gender || "Not specified"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-gray-600">
              Account Created:{" "}
              <span className="font-medium text-gray-800">
                {new Date(_user.createdAt).toLocaleDateString()}
              </span>
            </p>
            <p className="text-gray-600">
              Status: <span className="font-medium text-green-600">Active</span>
            </p>
          </div>
        </div>
      </div>

      {/* Cart Items Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Shopping Cart ({_cart.length} {_cart.length === 1 ? "Cart" : "Carts"})
        </h2>
        {_cart.length > 0 ? (
          _cart.map((cart: any) => (
            <div
              key={cart._id}
              className="border border-gray-200 rounded-lg p-4 mb-6"
            >
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-700">
                    Cart ID:{" "}
                    <span className="text-gray-500 font-normal">
                      {cart._id}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Last Updated: {new Date(cart.updatedAt).toLocaleString()}
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {cart.items?.length || 0}{" "}
                  {cart.items?.length === 1 ? "item" : "items"}
                </span>
              </div>

              {cart.items?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">
                    Products in Cart:
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Color
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cart.items.map((item: any, index: number) => (
                          <tr
                            key={`${cart._id}-${index}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <Image
                                  src={item.product?.images[0] || ""}
                                  alt={item.product?.name || ""}
                                  width={50}
                                  height={50}
                                />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.product?.name || "Product not found"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.product?._id || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                {item.color?.name && (
                                  <div className="flex items-center">
                                    <span
                                      className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                                      style={{
                                        backgroundColor:
                                          item.color.code || "#ccc",
                                      }}
                                      title={item.color.name}
                                    ></span>
                                    <span className="text-sm text-gray-700">
                                      {item.color.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              ₹
                              {item.product?.discount_price
                                ? (
                                    item.product.discount_price * item.quantity
                                  ).toFixed(2)
                                : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-3 text-right text-sm font-medium text-gray-700"
                          >
                            Total:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">
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
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No items in cart
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This user hasn't added any items to their cart yet.
            </p>
          </div>
        )}
      </div>

      {/* Orders Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Orders ({_orders.length})
        </h2>
        {_orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {_orders.map((order: any) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {order.status || "Completed"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{order.pricing.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No orders found</p>
        )}
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Reviews ({_reviews.length})
        </h2>
        {_reviews.length > 0 ? (
          <div className="space-y-6">
            {_reviews.map((review: any) => (
              <div
                key={review._id}
                className="border-b border-gray-100 pb-6 last:border-0"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {review.productId?.name || "Product not found"}
                    </h3>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < (review.rating || 0)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm text-gray-500">
                        {review.rating}.0 out of 5
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {review.comment && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                )}

                {review.images && review.images.length > 0 && (
                  <div className="mt-3 flex space-x-2">
                    {review.images.map((image: string, idx: number) => (
                      <div
                        key={idx}
                        className="w-16 h-16 rounded-md overflow-hidden border border-gray-200"
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
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No reviews yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This user hasn't left any reviews yet.
            </p>
          </div>
        )}
      </div>

      {/* Wishlist Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Wishlist ({_wishlist.length})
        </h2>
        {_wishlist.length > 0 ? (
          <div className="space-y-6">
            {_wishlist.map((wishlistItem: any) => (
              <div key={wishlistItem._id} className="border rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-3">
                  Added on:{" "}
                  {new Date(wishlistItem.createdAt).toLocaleDateString()}
                </p>
                <div className="space-y-4">
                  {wishlistItem.products.map((product: any) => (
                    <div
                      key={product._id}
                      className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="w-20 h-20 flex-shrink-0">
                        <img
                          src={product.images[0] || "/placeholder-product.jpg"}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-900 font-medium">
                            ₹{product.discount_price || product.price}
                          </span>
                          {product.discount_price && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{product.price}
                            </span>
                          )}
                          {product.discount_price && (
                            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                              {Math.round(
                                ((product.price - product.discount_price) /
                                  product.price) *
                                  100
                              )}
                              % OFF
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`text-sm ${
                              product.stock > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {product.stock > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No items in wishlist</p>
        )}
      </div>
    </div>
  );
}
