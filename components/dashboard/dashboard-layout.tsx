"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import {
  Home,
  Target,
  Coins,
  User,
  Building2,
  BarChart3,
  CreditCard,
  Users,
  LogOut,
  Menu,
  X,
  FileText,
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  userProfile: any
}

export default function DashboardLayout({ children, userProfile }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { signOut } = useAuth()

  const getNavigationItems = () => {
    const baseItems = [
      { name: "ダッシュボード", href: "/dashboard", icon: Home },
      { name: "プロフィール", href: "/profile", icon: User },
    ]

    switch (userProfile.user_type) {
      case "user":
        return [
          ...baseItems,
          { name: "ミッション一覧", href: "/missions", icon: Target },
          { name: "ポイント交換", href: "/points", icon: Coins },
        ]
      case "company":
        return [
          ...baseItems,
          { name: "ミッション管理", href: "/company/missions", icon: Target },
          { name: "前払い管理", href: "/company/payments", icon: CreditCard },
          { name: "分析レポート", href: "/company/analytics", icon: BarChart3 },
        ]
      case "admin":
        return [
          ...baseItems,
          { name: "ユーザー管理", href: "/admin/users", icon: Users },
          { name: "企業管理", href: "/admin/companies", icon: Building2 },
          { name: "ポイント管理", href: "/admin/points", icon: Coins },
          { name: "前払い履歴", href: "/admin/payments", icon: CreditCard },
          { name: "コンテンツ管理", href: "/admin/content", icon: FileText },
        ]
      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold">Actify</h1>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4">
            <Button variant="outline" className="w-full bg-transparent" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold">Actify</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4">
            <Button variant="outline" className="w-full bg-transparent" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm lg:px-6">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 justify-end">
            <div className="flex items-center gap-x-4">
              <span className="text-sm text-gray-700">{userProfile.username || userProfile.email}</span>
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
