"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import DashboardLayout from "./dashboard-layout"

interface AdminDashboardProps {
  userProfile: any
}

export default function AdminDashboard({ userProfile }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalMissions: 0,
    totalApplications: 0,
    totalPoints: 0,
    totalPayments: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch user counts
      const { count: userCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("user_type", "user")

      const { count: companyCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("user_type", "company")

      // Fetch mission count
      const { count: missionCount } = await supabase.from("missions").select("*", { count: "exact", head: true })

      // Fetch application count
      const { count: applicationCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })

      // Fetch total points
      const { data: pointsData } = await supabase.from("points_histories").select("amount")

      const totalPoints = pointsData?.reduce((sum, point) => sum + point.amount, 0) || 0

      // Fetch total payments
      const { data: paymentsData } = await supabase.from("payments").select("amount").eq("status", "completed")

      const totalPayments = paymentsData?.reduce((sum, payment) => sum + payment.amount, 0) || 0

      setStats({
        totalUsers: userCount || 0,
        totalCompanies: companyCount || 0,
        totalMissions: missionCount || 0,
        totalApplications: applicationCount || 0,
        totalPoints,
        totalPayments,
      })

      setLoading(false)
    }

    fetchStats()
  }, [supabase])

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div>読み込み中...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>
          <p className="text-gray-600">システム全体の統計情報</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>総ユーザー数</CardTitle>
              <CardDescription>登録済みの一般ユーザー</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
              <p className="text-sm text-gray-600 mt-2">人</p>
              <Button asChild className="mt-4">
                <Link href="/admin/users">ユーザー管理</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>総企業数</CardTitle>
              <CardDescription>登録済みの企業アカウント</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalCompanies}</div>
              <p className="text-sm text-gray-600 mt-2">社</p>
              <Button asChild className="mt-4">
                <Link href="/admin/companies">企業管理</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>総ミッション数</CardTitle>
              <CardDescription>作成されたミッション</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.totalMissions}</div>
              <p className="text-sm text-gray-600 mt-2">件</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>総応募数</CardTitle>
              <CardDescription>全ミッションへの応募</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.totalApplications}</div>
              <p className="text-sm text-gray-600 mt-2">件</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>総ポイント数</CardTitle>
              <CardDescription>発行されたポイント</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.totalPoints}</div>
              <p className="text-sm text-gray-600 mt-2">ポイント</p>
              <Button asChild className="mt-4">
                <Link href="/admin/points">ポイント管理</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>総前払い額</CardTitle>
              <CardDescription>完了した前払い金額</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">¥{stats.totalPayments.toLocaleString()}</div>
              <p className="text-sm text-gray-600 mt-2">円</p>
              <Button asChild className="mt-4">
                <Link href="/admin/payments">前払い履歴</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>コンテンツ管理</CardTitle>
              <CardDescription>利用規約・プライバシーポリシー</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">📝</div>
              <p className="text-sm text-gray-600 mt-2">編集</p>
              <Button asChild className="mt-4">
                <Link href="/admin/content">コンテンツ編集</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
