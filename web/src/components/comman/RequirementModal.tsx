"use client";
import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { closeRequirementModal } from "@/redux/features/uiSlice";
import { useDispatch } from "react-redux";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogClose,
} from "@/components/ui/dialog";


export default function RequirementModal() {
  const user = useSelector((state: RootState) => state.auth.details);
  const isOpen = useSelector((state: RootState) => state.ui.isRequirementModalOpen);
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(closeRequirementModal());
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      modal={false}
    >
      <div
        onClick={handleClose}
        className={`bg-black/50 fixed w-screen h-screen top-0 left-0 z-[1499] ${
          isOpen ? "block" : "hidden"
        }`}
      ></div>
      <DialogPortal>
        <DialogContent className="fixed left-1/2 top-1/2 z-[1500] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out sm:rounded-lg px-6 md:px-3">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-foreground">
                Complete Your Profile
              </DialogTitle>
             
            </div>
          </DialogHeader>

          <DialogDescription className="text-sm text-muted-foreground">
            To proceed, please complete your profile by adding your address and
            contact details. This information helps us serve you better.
          </DialogDescription>

          <div className="bg-brand-50 border-l-4 border-brand-400 p-4 rounded-md">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-brand-500 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-3 text-sm text-brand-700">
                Your profile information is required to continue.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {!user ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full" />
                <span className="ml-3 text-sm text-muted-foreground">Loading profile information...</span>
              </div>
            ) : (
              <>
                {!user.isEmailVerified && (
                  <div className="bg-brand-50 border-l-4 border-brand-400 p-4 rounded-md">
                    <div className="flex items-start">
                      <svg
                        className="h-5 w-5 text-brand-500 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm text-brand-700">
                          Please verify your email address to continue.
                        </p>
                        <div className="mt-2">
                          <Link
                            href="/profile?tab=settings"
                            onClick={handleClose}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-brand-700 bg-brand-100 rounded-md hover:bg-brand-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                          >
                            Verify Email
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(!user.address || Object.keys(user.address).length === 0) && (
                  <div className="bg-brand-50 border-l-4 border-brand-400 p-4 rounded-md">
                    <div className="flex items-start">
                      <svg
                        className="h-5 w-5 text-brand-500 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm text-brand-700">
                          Please add your delivery address to continue.
                        </p>
                        <div className="mt-2">
                          <Link
                            href="/profile"
                            onClick={handleClose}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-brand-700 bg-brand-100 rounded-md hover:bg-brand-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                          >
                            Add Address
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <DialogClose asChild>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                Close
              </button>
            </DialogClose>
            <Link
              href="/profile"
              onClick={handleClose}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-background bg-brand-600 border border-transparent rounded-md shadow-sm hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              Go to Profile
            </Link>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
