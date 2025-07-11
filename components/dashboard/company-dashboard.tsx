"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import DashboardLayout from "./dashboard-layout"

interface CompanyDashboardProps {
  userProfile: any
}

export default function CompanyDashboard({ userProfile }: CompanyDashboardProps) {
  const [missions, setMissions] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [totalPayments, setTotalPayments] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch company missions
      const { data: missionsData } = await supabase
        .from("missions")
        .select("*")
        .eq("company_id", userProfile.id)
        .order("created_at", { ascending: false })

      if (missionsData) {
        setMissions(missionsData)
      }

      // Fetch applications for company missions
      const { data: applicationsData } = await supabase
        .from("applications")
        .select(`
          *,
          missions!inner (
            title,
            company_id
          ),
          users (
            username,
            email
          )
        `)
        .eq("missions.company_id", userProfile.id)
        .order("created_at", { ascending: false })

      if (applicationsData) {
        setApplications(applicationsData)
      }

      // Fetch total payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("amount")
        .eq("company_id", userProfile.id)
        .eq("status", "completed")

      if (paymentsData) {
        const total = paymentsData.reduce((sum, payment) => sum + payment.amount, 0)
        setTotalPayments(total)
      }

      setLoading(false)
    }

    fetchData()
  }, [userProfile.id, supabase])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="default">進行中</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">終了済</Badge>
      case "pending":
        return <Badge variant="secondary">確認中</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "in_progress":
        return "進行中"
      case "completed":
        return "終了済"
      case "pending":
        return "確認中"
      default:
        return status
    }
  }

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
          <h1 className="text-3xl font-bold">企業ダッシュボード</h1>
          <p className="text-gray-600">ようこそ、{userProfile.company_name}さん</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>作成したミッション</CardTitle>
              <CardDescription>公開中のミッション数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{missions.length}</div>
              <p className="text-sm text-gray-600 mt-2">件</p>
              <Button asChild className="mt-4">
                <Link href="/company/missions">ミッション管理</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>応募者数</CardTitle>
              <CardDescription>全ミッションの応募者数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{applications.length}</div>
              <p className="text-sm text-gray-600 mt-2">人</p>
              <Button asChild className="mt-4">
                <Link href="/company/analytics">分析レポート</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>前払い総額</CardTitle>
              <CardDescription>完了した前払い金額</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">¥{totalPayments.toLocaleString()}</div>
              <p className="text-sm text-gray-600 mt-2">円</p>
              <Button asChild className="mt-4">
                <Link href="/company/payments">前払い管理</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>最新のミッション</CardTitle>
              <CardDescription>最近作成したミッション</CardDescription>
            </CardHeader>
            <CardContent>
              {missions.length === 0 ? (
                <p className="text-gray-600">まだミッションを作成していません。</p>
              ) : (
                <div className="space-y-4">
                  {missions.slice(0, 3).map((mission) => (
                    <div key={mission.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{mission.title}</h3>
                        <p className="text-sm text-gray-600">報酬: {mission.reward_point}ポイント</p>
                      </div>
                      <Badge variant="secondary">{new Date(mission.created_at).toLocaleDateString()}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最新の応募</CardTitle>
              <CardDescription>最近の応募状況</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-gray-600">まだ応募がありません。</p>
              ) : (
                <div className="space-y-4">
                  {applications.slice(0, 3).map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{application.missions?.title}</h3>
                        <p className="text-sm text-gray-600">
                          応募者: {application.users?.username || application.users?.email}
                        </p>
                      </div>
                      {getStatusBadge(application.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
