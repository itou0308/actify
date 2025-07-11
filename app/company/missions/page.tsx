"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Calendar, Users, MapPin, AlertTriangle } from "lucide-react"

const CATEGORIES = ["SNS投稿", "来店", "購入", "体験・レビュー", "招待", "SNS登録・フォロー", "アンケート"]

const TARGET_REGIONS = ["全国", "オンライン", "北海道", "東北", "関東", "中部", "関西", "中国・四国", "九州・沖縄"]

const DIFFICULTIES = ["簡単", "普通", "難しい"]

export default function CompanyMissionsPage() {
  const [missions, setMissions] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingMission, setEditingMission] = useState<any>(null)
  const [deletingMission, setDeletingMission] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    overview: "",
    reward_point: 0,
    max_participants: 0,
    required_action: "",
    required_evidence: "",
    target_audience: "",
    categories: [] as string[],
    target_region: "全国",
    difficulty: "普通",
    end_date: "",
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { userProfile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchMissions()
  }, [userProfile])

  const fetchMissions = async () => {
    if (!userProfile) return

    try {
      const { data, error } = await supabase
        .from("missions")
        .select(`
          *,
          applications (
            id,
            status
          )
        `)
        .eq("company_id", userProfile.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching missions:", error)
        toast({
          title: "エラー",
          description: "ミッションの取得に失敗しました。",
          variant: "destructive",
        })
        return
      }

      console.log("Fetched missions:", data)
      setMissions(data || [])
    } catch (error) {
      console.error("Unexpected error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    // バリデーション
    if (!formData.title.trim()) {
      toast({
        title: "エラー",
        description: "タイトルを入力してください。",
        variant: "destructive",
      })
      return
    }

    if (formData.reward_point < 0) {
      toast({
        title: "エラー",
        description: "付与ポイントは0以上で入力してください。",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const missionData = {
        title: formData.title.trim(),
        overview: formData.overview.trim() || null,
        reward_point: formData.reward_point,
        max_participants: formData.max_participants,
        required_action: formData.required_action.trim() || null,
        required_evidence: formData.required_evidence.trim() || null,
        target_audience: formData.target_audience.trim() || null,
        categories: formData.categories.length > 0 ? formData.categories : null,
        target_region: formData.target_region,
        difficulty: formData.difficulty,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        company_id: userProfile.id,
      }

      console.log("Submitting mission data:", missionData)

      if (editingMission) {
        // Update existing mission
        const { error } = await supabase.from("missions").update(missionData).eq("id", editingMission.id)

        if (error) {
          console.error("Update error:", error)
          throw error
        }

        toast({
          title: "ミッション更新完了",
          description: "ミッションが正常に更新されました。",
        })
      } else {
        // Create new mission
        const { data, error } = await supabase.from("missions").insert([missionData]).select()

        if (error) {
          console.error("Insert error:", error)
          throw error
        }

        console.log("Mission created successfully:", data)

        toast({
          title: "ミッション作成完了",
          description: "新しいミッションが作成されました。",
        })
      }

      resetForm()
      await fetchMissions()
    } catch (error: any) {
      console.error("Submit error:", error)
      toast({
        title: "エラー",
        description: error.message || "ミッションの保存に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      overview: "",
      reward_point: 0,
      max_participants: 0,
      required_action: "",
      required_evidence: "",
      target_audience: "",
      categories: [],
      target_region: "全国",
      difficulty: "普通",
      end_date: "",
    })
    setShowCreateForm(false)
    setEditingMission(null)
  }

  const handleEdit = (mission: any) => {
    setEditingMission(mission)
    setFormData({
      title: mission.title || "",
      overview: mission.overview || mission.description || "",
      reward_point: mission.reward_point || 0,
      max_participants: mission.max_participants || 0,
      required_action: mission.required_action || "",
      required_evidence: mission.required_evidence || "",
      target_audience: mission.target_audience || "",
      categories: mission.categories || [],
      target_region: mission.target_region || "全国",
      difficulty: mission.difficulty || "普通",
      end_date: mission.end_date ? new Date(mission.end_date).toISOString().split("T")[0] : "",
    })
    setShowCreateForm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingMission) return

    setDeleting(true)

    try {
      console.log("Deleting mission:", deletingMission.id)
      console.log("Applications to be deleted:", getApplicationCount(deletingMission))

      // ミッションを削除（ON DELETE CASCADE設定により関連するapplicationsとmission_applicationsも自動削除される）
      const { error } = await supabase
        .from("missions")
        .delete()
        .eq("id", deletingMission.id)
        .eq("company_id", userProfile.id) // 安全のため企業IDも確認

      if (error) {
        console.error("Delete error:", error)
        throw error
      }

      console.log("Mission and related data deleted successfully via CASCADE")

      toast({
        title: "ミッション削除完了",
        description: `「${deletingMission.title}」と関連する応募データが削除されました。`,
      })

      setDeletingMission(null)

      // 削除完了後に画面をリロードして最新状態を表示
      setTimeout(() => {
        window.location.reload()
      }, 1000) // トーストメッセージを表示してからリロード
    } catch (error: any) {
      console.error("Delete operation failed:", error)
      toast({
        title: "削除エラー",
        description: error.message || "ミッションの削除に失敗しました。",
        variant: "destructive",
      })
      setDeleting(false) // エラー時のみsetDeletingをfalseに戻す
    }
  }

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, categories: [...formData.categories, category] })
    } else {
      setFormData({ ...formData, categories: formData.categories.filter((c) => c !== category) })
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

  const getApplicationCount = (mission: any) => {
    return mission?.applications?.length || 0
  }

  const hasApplications = (mission: any) => {
    return mission ? getApplicationCount(mission) > 0 : false
  }

  if (!userProfile) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">ミッション管理</h1>
            <p className="text-gray-600">ミッションの作成・編集・削除ができます</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} disabled={showCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            新しいミッション
          </Button>
        </div>

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingMission ? "ミッション編集" : "新しいミッション作成"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">タイトル *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="ミッションのタイトルを入力"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reward_point">付与ポイント *</Label>
                    <Input
                      id="reward_point"
                      type="number"
                      value={formData.reward_point}
                      onChange={(e) => setFormData({ ...formData, reward_point: Number.parseInt(e.target.value) || 0 })}
                      min="0"
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="overview">概要</Label>
                  <Textarea
                    id="overview"
                    value={formData.overview}
                    onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                    rows={3}
                    placeholder="ミッションの詳細な説明を入力してください"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_participants">最大参加者数</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) =>
                        setFormData({ ...formData, max_participants: Number.parseInt(e.target.value) || 0 })
                      }
                      min="0"
                      placeholder="0 = 無制限"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">終了期日</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="required_action">必要なアクション</Label>
                  <Textarea
                    id="required_action"
                    value={formData.required_action}
                    onChange={(e) => setFormData({ ...formData, required_action: e.target.value })}
                    rows={2}
                    placeholder="参加者が実行すべき具体的なアクションを記載"
                  />
                </div>

                <div>
                  <Label htmlFor="required_evidence">必要な証拠</Label>
                  <Textarea
                    id="required_evidence"
                    value={formData.required_evidence}
                    onChange={(e) => setFormData({ ...formData, required_evidence: e.target.value })}
                    rows={2}
                    placeholder="提出が必要な証拠（スクリーンショット、レシートなど）"
                  />
                </div>

                <div>
                  <Label htmlFor="target_audience">ターゲット層</Label>
                  <Input
                    id="target_audience"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    placeholder="例: 20-30代女性、学生、ファミリー層など"
                  />
                </div>

                <div>
                  <Label>カテゴリ（複数選択可）</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {CATEGORIES.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={formData.categories.includes(category)}
                          onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                        />
                        <Label htmlFor={category} className="text-sm">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_region">対象地域</Label>
                    <Select
                      value={formData.target_region}
                      onValueChange={(value) => setFormData({ ...formData, target_region: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_REGIONS.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="difficulty">難易度</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty}>
                            {difficulty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "保存中..." : editingMission ? "更新" : "作成"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    キャンセル
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-600">読み込み中...</div>
            </div>
          ) : missions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-600">まだミッションを作成していません。</p>
                <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                  最初のミッションを作成
                </Button>
              </CardContent>
            </Card>
          ) : (
            missions.map((mission) => (
              <Card key={mission.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{mission.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="secondary">{mission.reward_point}ポイント</Badge>
                        <Badge variant="outline">応募者: {getApplicationCount(mission)}人</Badge>
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
                            最大{mission.max_participants}人
                          </Badge>
                        )}
                        {mission.end_date && (
                          <Badge variant="outline">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(mission.end_date).toLocaleDateString()}まで
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{new Date(mission.created_at).toLocaleDateString()}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mission.overview && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">概要</h4>
                        <p className="text-gray-600 text-sm">{mission.overview}</p>
                      </div>
                    )}

                    {mission.categories && mission.categories.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">カテゴリ</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
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

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(mission)}>
                      <Edit className="mr-2 h-4 w-4" />
                      編集
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingMission(mission)}
                          disabled={deleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            ミッションを削除しますか？
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            {deletingMission && (
                              <>
                                <div>「{deletingMission.title}」を削除しようとしています。</div>
                                {hasApplications(deletingMission) && (
                                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <div className="text-yellow-800 text-sm font-medium">
                                      ⚠️ このミッションには{getApplicationCount(deletingMission)}件の応募があります
                                    </div>
                                    <div className="text-yellow-700 text-sm">
                                      削除すると、関連する応募データ（applications、mission_applications）もすべて自動削除されます。
                                    </div>
                                  </div>
                                )}
                                <div className="text-red-600 font-medium">この操作は取り消せません。</div>
                              </>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeletingMission(null)}>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                          >
                            {deleting ? "削除中..." : "削除する"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
