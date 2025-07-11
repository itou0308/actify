"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { Calendar, Users, MapPin, Search, Filter } from "lucide-react"

interface Mission {
  id: string
  title: string
  overview: string
  description: string
  reward_point: number
  max_participants: number
  required_action: string
  required_evidence: string
  target_audience: string
  categories: string[]
  target_region: string
  difficulty: string
  end_date: string
  created_at: string
  users: {
    company_name: string
    email: string
  }
  applications: any[]
}

const CATEGORIES = ["SNS投稿", "来店", "購入", "体験・レビュー", "招待", "SNS登録・フォロー", "アンケート"]

const TARGET_REGIONS = ["全国", "オンライン", "北海道", "東北", "関東", "中部", "関西", "中国・四国", "九州・沖縄"]

const DIFFICULTIES = ["簡単", "普通", "難しい"]

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([])
  const [userApplications, setUserApplications] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("全て")
  const [selectedRegion, setSelectedRegion] = useState("全て")
  const [selectedDifficulty, setSelectedDifficulty] = useState("全て")
  const { userProfile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchMissions()
  }, [userProfile])

  useEffect(() => {
    filterMissions()
  }, [missions, searchTerm, selectedCategory, selectedRegion, selectedDifficulty])

  const fetchMissions = async () => {
    if (!userProfile) return

    // Fetch all missions
    const { data: missionsData, error: missionsError } = await supabase
      .from("missions")
      .select(`
        *,
        users!missions_company_id_fkey (
          company_name,
          email
        ),
        applications (
          id,
          user_id
        )
      `)
      .order("created_at", { ascending: false })

    if (missionsError) {
      console.error("Error fetching missions:", missionsError)
      return
    }

    // Fetch user's applications
    const { data: applicationsData } = await supabase
      .from("applications")
      .select("mission_id")
      .eq("user_id", userProfile.id)

    if (missionsData) setMissions(missionsData)
    if (applicationsData) {
      setUserApplications(applicationsData.map((app) => app.mission_id))
    }

    setLoading(false)
  }

  const filterMissions = () => {
    let filtered = missions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (mission) =>
          mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (mission.overview || mission.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          mission.users?.company_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Category filter
    if (selectedCategory !== "全て") {
      filtered = filtered.filter((mission) => mission.categories && mission.categories.includes(selectedCategory))
    }

    // Region filter
    if (selectedRegion !== "全て") {
      filtered = filtered.filter((mission) => mission.target_region === selectedRegion)
    }

    // Difficulty filter
    if (selectedDifficulty !== "全て") {
      filtered = filtered.filter((mission) => mission.difficulty === selectedDifficulty)
    }

    // Filter out expired missions
    filtered = filtered.filter((mission) => {
      if (!mission.end_date) return true
      return new Date(mission.end_date) > new Date()
    })

    // Filter out full missions
    filtered = filtered.filter((mission) => {
      if (!mission.max_participants || mission.max_participants === 0) return true
      return (mission.applications?.length || 0) < mission.max_participants
    })

    setFilteredMissions(filtered)
  }

  const sendNotificationEmail = async (mission: Mission) => {
    try {
      const userName = userProfile.username || userProfile.email
      const applicationDate = new Date().toLocaleDateString("ja-JP")

      // 企業への通知メール
      const companyEmailResponse = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: mission.users.email,
          subject: `【Actify】新しい応募通知 - ${mission.title}`,
          message: `
${mission.users.company_name} 様

いつもActifyをご利用いただき、ありがとうございます。

あなたが作成したミッションに新しい応募がありました。

■ 応募情報
・ミッション名: ${mission.title}
・応募者: ${userName}
・応募日時: ${applicationDate}
・報酬ポイント: ${mission.reward_point}ポイント
・ステータス: 進行中

応募者は既にミッションを開始しており、証拠提出をお待ちください。
進捗状況は企業ダッシュボードからご確認いただけます。

今後ともActifyをよろしくお願いいたします。

Actify運営チーム
          `.trim(),
        }),
      })

      // 管理者への通知メール
      const adminEmailResponse = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "joker.lie@icloud.com",
          subject: `【Actify管理者】新しい応募通知 - ${mission.title}`,
          message: `
管理者様

新しいミッション応募がありました。

■ 応募情報
・ミッション名: ${mission.title}
・企業名: ${mission.users.company_name}
・企業メール: ${mission.users.email}
・応募者: ${userName}
・応募者メール: ${userProfile.email}
・応募日時: ${applicationDate}
・報酬ポイント: ${mission.reward_point}ポイント
・ステータス: 進行中

管理者ダッシュボードから詳細をご確認ください。

Actifyシステム
          `.trim(),
        }),
      })

      if (!companyEmailResponse.ok || !adminEmailResponse.ok) {
        console.error("Failed to send one or more notification emails")
      }
    } catch (error) {
      console.error("Failed to send notification email:", error)
      // メール送信失敗してもアプリケーションの処理は続行
    }
  }

  const handleApply = async (missionId: string) => {
    if (!userProfile) return

    try {
      // applicationsテーブルに応募データを挿入（ステータスを「in_progress」に設定）
      const { data: applicationData, error: applicationError } = await supabase
        .from("applications")
        .insert({
          user_id: userProfile.id,
          mission_id: missionId,
          status: "in_progress", // 進行中ステータスに設定
        })
        .select()
        .single()

      if (applicationError) throw applicationError

      // mission_applicationsテーブルにも初期データを作成（証拠提出用）
      if (applicationData) {
        const { error: missionAppError } = await supabase.from("mission_applications").insert({
          application_id: applicationData.id,
          proof_text: null,
          proof_file_url: null,
          submitted_at: null, // まだ提出されていない
        })

        if (missionAppError) {
          console.error("Error creating mission application:", missionAppError)
          // エラーが発生してもメインの応募処理は続行
        }
      }

      setUserApplications([...userApplications, missionId])

      // 通知メール送信（非同期で実行、エラーがあっても処理を続行）
      const mission = missions.find((m) => m.id === missionId)
      if (mission) {
        sendNotificationEmail(mission).catch(console.error)
      }

      toast({
        title: "応募完了",
        description:
          "ミッションに応募しました。進行中ステータスになりました。証拠提出ページから証拠を提出してください。",
      })

      // Refresh missions to update application count
      fetchMissions()
    } catch (error: any) {
      console.error("Application error:", error)
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "簡単":
        return "bg-green-100 text-green-800"
      case "普通":
        return "bg-yellow-100 text-yellow-800"
      case "難しい":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isApplicationFull = (mission: Mission) => {
    if (!mission.max_participants || mission.max_participants === 0) return false
    return (mission.applications?.length || 0) >= mission.max_participants
  }

  const isExpired = (mission: Mission) => {
    if (!mission.end_date) return false
    return new Date(mission.end_date) <= new Date()
  }

  if (!userProfile) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ミッション一覧</h1>
          <p className="text-gray-600">参加可能なミッションを探してみましょう</p>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              検索・フィルター
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ミッションを検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全て">全てのカテゴリ</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="地域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全て">全ての地域</SelectItem>
                    {TARGET_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="難易度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全て">全ての難易度</SelectItem>
                    {DIFFICULTIES.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div>読み込み中...</div>
        ) : (
          <div className="grid gap-6">
            {filteredMissions.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-600">条件に合うミッションが見つかりませんでした。</p>
                </CardContent>
              </Card>
            ) : (
              filteredMissions.map((mission) => (
                <Card key={mission.id} className={isExpired(mission) ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{mission.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="secondary">{mission.reward_point}ポイント</Badge>
                          <Badge className={getDifficultyColor(mission.difficulty || "普通")}>
                            {mission.difficulty || "普通"}
                          </Badge>
                          <Badge variant="outline">
                            <MapPin className="mr-1 h-3 w-3" />
                            {mission.target_region || "全国"}
                          </Badge>
                          {mission.max_participants > 0 && (
                            <Badge variant="outline">
                              <Users className="mr-1 h-3 w-3" />
                              {mission.applications?.length || 0}/{mission.max_participants}人
                            </Badge>
                          )}
                          {mission.end_date && (
                            <Badge variant="outline">
                              <Calendar className="mr-1 h-3 w-3" />
                              {new Date(mission.end_date).toLocaleDateString()}まで
                            </Badge>
                          )}
                          {isExpired(mission) && <Badge variant="destructive">期限切れ</Badge>}
                          {isApplicationFull(mission) && <Badge variant="destructive">募集終了</Badge>}
                        </div>
                        <CardDescription>
                          {mission.users?.company_name} • {new Date(mission.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-gray-700">{mission.overview || mission.description}</p>

                      {mission.categories && mission.categories.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">カテゴリ</h4>
                          <div className="flex flex-wrap gap-1">
                            {mission.categories.map((category: string) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {mission.target_audience && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">ターゲット層</h4>
                          <p className="text-gray-600 text-sm">{mission.target_audience}</p>
                        </div>
                      )}

                      {mission.required_action && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">必要なアクション</h4>
                          <p className="text-gray-600 text-sm">{mission.required_action}</p>
                        </div>
                      )}

                      {mission.required_evidence && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">必要な証拠</h4>
                          <p className="text-gray-600 text-sm">{mission.required_evidence}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end mt-4">
                      {userApplications.includes(mission.id) ? (
                        <Badge variant="outline">応募済み</Badge>
                      ) : isExpired(mission) ? (
                        <Badge variant="destructive">期限切れ</Badge>
                      ) : isApplicationFull(mission) ? (
                        <Badge variant="destructive">募集終了</Badge>
                      ) : (
                        <Button onClick={() => handleApply(mission.id)}>応募する</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
