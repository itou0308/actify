"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { BarChart3, TrendingUp, Users, Target } from "lucide-react"

export default function CompanyAnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalMissions: 0,
    totalApplications: 0,
    inProgressApplications: 0,
    completedApplications: 0,
    pendingApplications: 0,
    totalRewardPoints: 0,
    missionStats: [] as any[],
  })
  const [loading, setLoading] = useState(true)
  const { userProfile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [userProfile])

  const fetchAnalytics = async () => {
    if (!userProfile) return

    try {
      // Fetch missions with application counts
      const { data: missionsData } = await supabase
        .from("missions")
        .select(`
          *,
          applications (
            id,
            status
          )
        `)
        .eq("company_id", userProfile.id)

      if (missionsData) {
        const totalMissions = missionsData.length
        const totalRewardPoints = missionsData.reduce((sum, mission) => sum + mission.reward_point, 0)

        let totalApplications = 0
        let inProgressApplications = 0
        let completedApplications = 0
        let pendingApplications = 0

        const missionStats = missionsData.map((mission) => {
          const applications = mission.applications || []
          const inProgress = applications.filter((app) => app.status === "in_progress").length
          const completed = applications.filter((app) => app.status === "completed").length
          const pending = applications.filter((app) => app.status === "pending").length

          totalApplications += applications.length
          inProgressApplications += inProgress
          completedApplications += completed
          pendingApplications += pending

          return {
            ...mission,
            applicationCount: applications.length,
            inProgressCount: inProgress,
            completedCount: completed,
            pendingCount: pending,
          }
        })

        setAnalytics({
          totalMissions,
          totalApplications,
          inProgressApplications,
          completedApplications,
          pendingApplications,
          totalRewardPoints,
          missionStats,
        })
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setLoading(false)
    }
  }

  if (!userProfile) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">分析レポート</h1>
          <p className="text-gray-600">ミッションのパフォーマンスと応募状況を確認できます</p>
        </div>

        {loading ? (
          <div>読み込み中...</div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">総ミッション数</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalMissions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">総応募数</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalApplications}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">完了率</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.totalApplications > 0
                      ? Math.round((analytics.completedApplications / analytics.totalApplications) * 100)
                      : 0}
                    %
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">総報酬ポイント</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalRewardPoints}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>応募ステータス</CardTitle>
                  <CardDescription>応募の進行状況</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>進行中</span>
                    <Badge variant="default">{analytics.inProgressApplications}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>終了済</span>
                    <Badge className="bg-green-100 text-green-800">{analytics.completedApplications}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>確認中</span>
                    <Badge variant="secondary">{analytics.pendingApplications}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>ミッション別応募状況</CardTitle>
                  <CardDescription>各ミッションの詳細な応募データ</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.missionStats.length === 0 ? (
                    <p className="text-gray-600">データがありません。</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.missionStats.map((mission) => (
                        <div key={mission.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{mission.title}</h3>
                            <Badge variant="outline">{mission.reward_point}P</Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            <div className="text-center">
                              <div className="font-medium">{mission.applicationCount}</div>
                              <div className="text-gray-600">総応募</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-blue-600">{mission.inProgressCount}</div>
                              <div className="text-gray-600">進行中</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-green-600">{mission.completedCount}</div>
                              <div className="text-gray-600">終了済</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-yellow-600">{mission.pendingCount}</div>
                              <div className="text-gray-600">確認中</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
