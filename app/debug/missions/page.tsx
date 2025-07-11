"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { Trash2 } from "lucide-react"

export default function DebugMissionsPage() {
  const [missions, setMissions] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const { userProfile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchDebugData()
  }, [userProfile])

  const fetchDebugData = async () => {
    if (!userProfile) return

    try {
      // Fetch missions
      const { data: missionsData, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .eq("company_id", userProfile.id)

      // Fetch applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("applications")
        .select(`
          *,
          missions!inner(title, company_id)
        `)
        .eq("missions.company_id", userProfile.id)

      // Get user info
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setMissions(missionsData || [])
      setApplications(applicationsData || [])
      setDebugInfo({
        user,
        userProfile,
        missionsError,
        applicationsError,
      })

      console.log("Debug data:", {
        missions: missionsData,
        applications: applicationsData,
        user,
        userProfile,
      })
    } catch (error) {
      console.error("Debug fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const testDelete = async (missionId: string) => {
    console.log("Testing delete for mission:", missionId)
    console.log("User profile:", userProfile)

    try {
      // Test delete with detailed logging
      const { data, error } = await supabase
        .from("missions")
        .delete()
        .eq("id", missionId)
        .eq("company_id", userProfile.id)

      console.log("Delete result:", { data, error })

      if (error) {
        console.error("Delete error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        alert(`削除エラー: ${error.message}`)
      } else {
        console.log("Delete successful")
        alert("削除成功！")
        fetchDebugData()
      }
    } catch (error) {
      console.error("Unexpected delete error:", error)
      alert(`予期しないエラー: ${error}`)
    }
  }

  if (loading) {
    return <div className="p-6">読み込み中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ミッション削除デバッグ</h1>
          <p className="text-gray-600">削除機能のテストとデバッグ情報</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>デバッグ情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>ユーザーID:</strong> {debugInfo.user?.id}
              </p>
              <p>
                <strong>プロフィールID:</strong> {userProfile?.id}
              </p>
              <p>
                <strong>ユーザータイプ:</strong> {userProfile?.user_type}
              </p>
              <p>
                <strong>企業名:</strong> {userProfile?.company_name}
              </p>
              <p>
                <strong>ミッション数:</strong> {missions.length}
              </p>
              <p>
                <strong>応募数:</strong> {applications.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ミッション一覧（削除テスト）</CardTitle>
            <CardDescription>各ミッションの削除をテストできます</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {missions.map((mission) => {
                const missionApplications = applications.filter((app) => app.missions.title === mission.title)
                return (
                  <div key={mission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{mission.title}</h3>
                      <p className="text-sm text-gray-600">ID: {mission.id}</p>
                      <p className="text-sm text-gray-600">作成日: {new Date(mission.created_at).toLocaleString()}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">応募: {missionApplications.length}件</Badge>
                        <Badge variant="secondary">{mission.reward_point}P</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" onClick={() => testDelete(mission.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        削除テスト
                      </Button>
                    </div>
                  </div>
                )
              })}
              {missions.length === 0 && <p className="text-gray-600 text-center py-8">ミッションがありません</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>関連応募データ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{app.missions.title}</p>
                    <p className="text-sm text-gray-600">ステータス: {app.status}</p>
                  </div>
                  <Badge variant="outline">{new Date(app.created_at).toLocaleDateString()}</Badge>
                </div>
              ))}
              {applications.length === 0 && <p className="text-gray-600">関連応募データがありません</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
