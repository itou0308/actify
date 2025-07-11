"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, ArrowLeft, Calendar, Mail } from "lucide-react"
import { checkAdminAuthClient } from "@/lib/admin-auth"

interface UserProfile {
  id: string
  username: string
  email: string
  user_type: string
  created_at: string
  points: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
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
      fetchUsers()
    }

    checkAuth()
  }, [router])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_type", "user")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Calculate points for each user
      const usersWithPoints = await Promise.all(
        (data || []).map(async (user) => {
          const { data: pointsData } = await supabase.from("points_histories").select("amount").eq("user_id", user.id)

          const totalPoints = pointsData?.reduce((sum, point) => sum + point.amount, 0) || 0

          return {
            ...user,
            points: totalPoints,
          }
        }),
      )

      setUsers(usersWithPoints)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
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
              <h1 className="text-3xl font-bold">ユーザー管理</h1>
              <p className="text-gray-600">登録済みの一般ユーザー一覧</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ユーザー統計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                  <div className="text-sm text-gray-600">総ユーザー数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {users.reduce((sum, user) => sum + (user.points || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">総ポイント数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(users.reduce((sum, user) => sum + (user.points || 0), 0) / users.length) || 0}
                  </div>
                  <div className="text-sm text-gray-600">平均ポイント</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ユーザー一覧</CardTitle>
              <CardDescription>登録済みの一般ユーザー</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(user.created_at).toLocaleDateString("ja-JP")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{user.points || 0} ポイント</Badge>
                      <Badge variant="outline">{user.user_type}</Badge>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">登録されたユーザーがありません</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
