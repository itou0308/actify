"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Coins, ArrowLeft, User, Plus, History } from "lucide-react"
import { checkAdminAuthClient } from "@/lib/admin-auth"

interface UserProfile {
  id: string
  username: string
  email: string
  points: number
}

interface PointHistory {
  id: string
  user_id: string
  amount: number
  reason: string
  created_at: string
  username: string
}

export default function AdminPointsPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [pointHistories, setPointHistories] = useState<PointHistory[]>([])
  const [selectedUser, setSelectedUser] = useState("")
  const [pointAmount, setPointAmount] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const authResult = await checkAdminAuthClient()

      if (!authResult.isAuthenticated) {
        router.push("/auth/login")
        return
      }

      if (!authResult.isAdmin) {
        router.push("/dashboard")
        return
      }

      setUserProfile(authResult.userProfile)
      fetchData()
    }

    checkAuth()
  }, [router])

  const fetchData = async () => {
    try {
      // Fetch users with their points from points_histories
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, email")
        .eq("user_type", "user")
        .order("username")

      if (usersError) throw usersError

      // Calculate points for each user
      const usersWithPoints = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: pointsData } = await supabase.from("points_histories").select("amount").eq("user_id", user.id)

          const totalPoints = pointsData?.reduce((sum, point) => sum + point.amount, 0) || 0

          return {
            ...user,
            points: totalPoints,
          }
        }),
      )

      // Fetch point histories
      const { data: historiesData, error: historiesError } = await supabase
        .from("points_histories")
        .select(`
        id,
        user_id,
        amount,
        reason,
        created_at,
        users!inner(username)
      `)
        .order("created_at", { ascending: false })
        .limit(20)

      if (historiesError) throw historiesError

      setUsers(usersWithPoints)
      setPointHistories(
        historiesData?.map((h) => ({
          ...h,
          username: h.users.username,
        })) || [],
      )
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePointGrant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !pointAmount || !reason) return

    setSubmitting(true)
    try {
      const amount = Number.parseInt(pointAmount)

      // Add point history
      const { error: historyError } = await supabase.from("points_histories").insert({
        user_id: selectedUser,
        amount: amount,
        reason: reason,
        type: "grant",
      })

      if (historyError) throw historyError

      // Update user points
      const { error: updateError } = await supabase.rpc("increment_user_points", {
        user_id: selectedUser,
        points_to_add: amount,
      })

      if (updateError) throw updateError

      // Reset form
      setSelectedUser("")
      setPointAmount("")
      setReason("")

      // Refresh data
      fetchData()

      alert("ポイントを付与しました！")
    } catch (error) {
      console.error("Error granting points:", error)
      alert("ポイント付与に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div>読み込み中...</div>
        </div>
      </div>
    )
  }

  const totalPoints = users.reduce((sum, user) => sum + (user.points || 0), 0)
  const totalHistories = pointHistories.length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                ダッシュボードに戻る
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">ポイント管理</h1>
              <p className="text-gray-600">ユーザーへのポイント付与と履歴管理</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                ポイント付与
              </CardTitle>
              <CardDescription>ユーザーにポイントを付与します</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePointGrant} className="space-y-4">
                <div>
                  <Label htmlFor="user">ユーザー選択</Label>
                  <select
                    id="user"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">ユーザーを選択してください</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.points || 0} ポイント)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="amount">付与ポイント数</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={pointAmount}
                    onChange={(e) => setPointAmount(e.target.value)}
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reason">付与理由</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="ミッション完了報酬"
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "付与中..." : "ポイント付与"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                ポイント統計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
                    <div className="text-sm text-gray-600">総ポイント数</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{totalHistories}</div>
                    <div className="text-sm text-gray-600">付与回数</div>
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {users.length > 0 ? Math.round(totalPoints / users.length) : 0}
                  </div>
                  <div className="text-sm text-gray-600">平均ポイント</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              ポイント付与履歴
            </CardTitle>
            <CardDescription>最近のポイント付与履歴</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pointHistories.map((history) => (
                <div key={history.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{history.username}</div>
                      <div className="text-sm text-gray-600">{history.reason}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(history.created_at).toLocaleString("ja-JP")}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-green-600">
                    +{history.amount} ポイント
                  </Badge>
                </div>
              ))}
              {pointHistories.length === 0 && (
                <div className="text-center py-8 text-gray-500">ポイント付与履歴がありません</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
