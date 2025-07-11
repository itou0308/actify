"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { toast } from "@/hooks/use-toast"

export default function PointsPage() {
  const [pointsHistory, setPointsHistory] = useState<any[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const { userProfile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    const fetchPointsData = async () => {
      if (!userProfile) return

      // Fetch points history
      const { data: historyData } = await supabase
        .from("points_histories")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false })

      if (historyData) {
        setPointsHistory(historyData)
        const total = historyData.reduce((sum, point) => sum + point.amount, 0)
        setTotalPoints(total)
      }

      setLoading(false)
    }

    fetchPointsData()
  }, [userProfile, supabase])

  const handleExchange = async (points: number, item: string) => {
    if (!userProfile) return

    if (totalPoints < points) {
      toast({
        title: "ポイント不足",
        description: "交換に必要なポイントが不足しています。",
        variant: "destructive",
      })
      return
    }

    try {
      // Add negative points entry for exchange
      const { error } = await supabase.from("points_histories").insert({
        user_id: userProfile.id,
        amount: -points,
        reason: `${item}と交換`,
      })

      if (error) throw error

      // Refresh data
      const { data: historyData } = await supabase
        .from("points_histories")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false })

      if (historyData) {
        setPointsHistory(historyData)
        const total = historyData.reduce((sum, point) => sum + point.amount, 0)
        setTotalPoints(total)
      }

      toast({
        title: "交換完了",
        description: `${item}と交換しました。`,
      })
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (!userProfile) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ポイント交換</h1>
          <p className="text-gray-600">獲得したポイントを様々な特典と交換できます</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>保有ポイント</CardTitle>
            <CardDescription>現在の保有ポイント数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{totalPoints}</div>
            <p className="text-gray-600 mt-2">ポイント</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>交換可能な特典</CardTitle>
              <CardDescription>ポイントで交換できるアイテム</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Amazonギフト券 500円分</h3>
                  <p className="text-sm text-gray-600">500ポイント</p>
                </div>
                <Button onClick={() => handleExchange(500, "Amazonギフト券 500円分")} disabled={totalPoints < 500}>
                  交換
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Amazonギフト券 1000円分</h3>
                  <p className="text-sm text-gray-600">1000ポイント</p>
                </div>
                <Button onClick={() => handleExchange(1000, "Amazonギフト券 1000円分")} disabled={totalPoints < 1000}>
                  交換
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">スターバックスカード 500円分</h3>
                  <p className="text-sm text-gray-600">500ポイント</p>
                </div>
                <Button
                  onClick={() => handleExchange(500, "スターバックスカード 500円分")}
                  disabled={totalPoints < 500}
                >
                  交換
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">QUOカード 1000円分</h3>
                  <p className="text-sm text-gray-600">1000ポイント</p>
                </div>
                <Button onClick={() => handleExchange(1000, "QUOカード 1000円分")} disabled={totalPoints < 1000}>
                  交換
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ポイント履歴</CardTitle>
              <CardDescription>ポイントの獲得・使用履歴</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>読み込み中...</div>
              ) : pointsHistory.length === 0 ? (
                <p className="text-gray-600">ポイント履歴がありません。</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pointsHistory.map((history) => (
                    <div key={history.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{history.reason || "ポイント獲得"}</p>
                        <p className="text-sm text-gray-600">{new Date(history.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={history.amount > 0 ? "default" : "secondary"}>
                        {history.amount > 0 ? "+" : ""}
                        {history.amount}P
                      </Badge>
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
