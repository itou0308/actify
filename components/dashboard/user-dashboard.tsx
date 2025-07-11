"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import DashboardLayout from "./dashboard-layout"

interface UserDashboardProps {
  userProfile: any
}

export default function UserDashboard({ userProfile }: UserDashboardProps) {
  const [applications, setApplications] = useState<any[]>([])
  const [inProgressMissions, setInProgressMissions] = useState<any[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return

      try {
        setError(null)

        // Fetch user applications with mission details
        const { data: applicationsData, error: applicationsError } = await supabase
          .from("applications")
          .select(`
            id,
            status,
            created_at,
            updated_at,
            missions (
              id,
              title,
              reward_point,
              required_action,
              required_evidence,
              users (
                company_name
              )
            )
          `)
          .eq("user_id", userProfile.id)
          .order("created_at", { ascending: false })

        if (applicationsError) {
          console.error("Error fetching applications:", applicationsError)
          setError(`応募データの取得に失敗しました: ${applicationsError.message}`)
        } else if (applicationsData) {
          setApplications(applicationsData)

          // 進行中のミッションを分離（statusが'in_progress'のもの）
          const inProgress = applicationsData.filter((app) => app.status === "in_progress")
          setInProgressMissions(inProgress)

          console.log("Applications data:", applicationsData)
          console.log("In progress missions:", inProgress)
        }

        // Fetch total points
        const { data: pointsData, error: pointsError } = await supabase
          .from("points_histories")
          .select("amount")
          .eq("user_id", userProfile.id)

        if (pointsError) {
          console.error("Error fetching points:", pointsError)
          setError(`ポイントデータの取得に失敗しました: ${pointsError.message}`)
        } else if (pointsData) {
          const total = pointsData.reduce((sum, point) => sum + point.amount, 0)
          setTotalPoints(total)
        }
      } catch (error) {
        console.error("Error in fetchData:", error)
        setError(`データの取得中にエラーが発生しました: ${error}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userProfile, supabase])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="default">進行中</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">終了済</Badge>
      case "pending":
        return <Badge variant="secondary">確認中</Badge>
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800">承認済</Badge>
      case "rejected":
        return <Badge variant="destructive">却下</Badge>
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
      case "approved":
        return "承認済"
      case "rejected":
        return "却下"
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("ja-JP")
    } catch (error) {
      return "日付不明"
    }
  }

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">エラーが発生しました</h3>
          <p className="text-red-700">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
            再読み込み
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-gray-600">ようこそ、{userProfile.username || userProfile.email}さん</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>保有ポイント</CardTitle>
              <CardDescription>獲得したポイントの合計</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{totalPoints}</div>
              <p className="text-sm text-gray-600 mt-2">ポイント</p>
              <Button asChild className="mt-4">
                <Link href="/points">ポイント交換</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>進行中ミッション</CardTitle>
              <CardDescription>現在進行中のミッション数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{inProgressMissions.length}</div>
              <p className="text-sm text-gray-600 mt-2">件</p>
              <Button asChild className="mt-4">
                <Link href="/evidence-submission">証拠提出ページ</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>進行中ミッション</CardTitle>
              <CardDescription>証拠提出が必要なミッション</CardDescription>
            </CardHeader>
            <CardContent>
              {inProgressMissions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">進行中のミッションがありません。</p>
                  <Button asChild>
                    <Link href="/missions">ミッション一覧を見る</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {inProgressMissions.slice(0, 3).map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{application.missions?.title || "タイトル不明"}</h3>
                        <p className="text-sm text-gray-600">報酬: {application.missions?.reward_point || 0}ポイント</p>
                        <p className="text-sm text-gray-500">
                          企業: {application.missions?.users?.company_name || "企業名不明"}
                        </p>
                      </div>
                      <Badge variant="default">進行中</Badge>
                    </div>
                  ))}
                  {inProgressMissions.length > 3 && (
                    <div className="text-center pt-2">
                      <Button variant="outline" asChild>
                        <Link href="/evidence-submission">すべて見る</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近の応募履歴</CardTitle>
              <CardDescription>最新の応募状況</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">まだ応募したミッションがありません。</p>
                  <Button asChild>
                    <Link href="/missions">ミッション一覧を見る</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.slice(0, 5).map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{application.missions?.title || "タイトル不明"}</h3>
                        <p className="text-sm text-gray-600">報酬: {application.missions?.reward_point || 0}ポイント</p>
                        <p className="text-sm text-gray-500">
                          {application.created_at ? formatDate(application.created_at) : "日付不明"}
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
