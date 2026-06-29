"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowRight, LogIn } from "lucide-react"

export default function NotFound() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(document.cookie.includes("adminToken="))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground">
            Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex justify-center">
          <Button asChild className="group">
            <Link href={isLoggedIn ? "/dashboard" : "/login"} className="flex items-center gap-2">
              {isLoggedIn ? <Home className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {isLoggedIn ? "Go to Dashboard" : "Go to Login"}
              <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
