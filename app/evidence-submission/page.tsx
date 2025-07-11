"use client"

import Link from "next/link"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"

export default function EvidenceSubmissionPage() {
  const [inProgressMissions, setInProgressMissions] = useState<any[]>([])
  const [selectedMission, setSelectedMission] = useState<any>(null)
  const [proofText, setProofText] = useState("")
  const [proofFileUrl, setProofFileUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { userProfile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchInProgressMissions()
  }, [userProfile])

  const fetchInProgressMissions = async () => {
    if (!userProfile) return

    try {
      // 進行中のミッション（status = 'in_progress'）を取得
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          missions (
            title,
            reward_point,
            required_evidence,
            required_action,
            users (
              company_name,
              email
            )
          ),
          mission_applications (
            proof_text,
            proof_file_url,
            submitted_at
          )
        `)
        .eq("user_id", userProfile.id)
        .eq("status", "in_progress") // 進行中のミッションのみ取得
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching in-progress missions:", error)
        toast({
          title: "エラー",
          description: "進行中ミッションの取得に失敗しました。",
          variant: "destructive",
        })
        return
      }

      console.log("In-progress missions:", data)
      setInProgressMissions(data || [])
    } catch (error) {
      console.error("Unexpected error:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendEvidenceSubmissionEmail = async (mission: any) => {
    try {
      const userName = userProfile.username || userProfile.email
      const submissionDate = new Date().toLocaleDateString("ja-JP")

      // 企業への通知メール
      await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: mission.missions.users.email,
          subject: `【Actify】証拠提出完了通知 - ${mission.missions.title}`,
          message: `
${mission.missions.users.company_name} 様

いつもActifyをご利用いただき、ありがとうございます。

ミッションの証拠提出が完了しました。

■ 提出情報
・ミッション名: ${mission.missions.title}
・参加者: ${userName}
・提出日時: ${submissionDate}
・報酬ポイント: ${mission.missions.reward_point}ポイント

企業ダッシュボードから提出された証拠をご確認いただけます。

今後ともActifyをよろしくお願いいたします。

Actify運営チーム
          `.trim(),
        }),
      })

      // 管理者への通知メール
      await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "joker.lie@icloud.com",
          subject: `【Actify管理者】証拠提出完了通知 - ${mission.missions.title}`,
          message: `
管理者様

ミッションの証拠提出が完了しました。

■ 提出情報
・ミッション名: ${mission.missions.title}
・企業名: ${mission.missions.users.company_name}
・参加者: ${userName}
・参加者メール: ${userProfile.email}
・提出日時: ${submissionDate}
・報酬ポイント: ${mission.missions.reward_point}ポイント

管理者ダッシュボードから詳細をご確認ください。

Actifyシステム
          `.trim(),
        }),
      })
    } catch (error) {
      console.error("Failed to send evidence submission email:", error)
    }
  }

  const handleSubmitEvidence = async () => {
    if (!selectedMission || (!proofText.trim() && !proofFileUrl.trim())) {
      toast({
        title: "エラー",
        description: "証拠テキストまたはファイルURLを入力してください。",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      // mission_applicationsテーブルを更新（証拠情報を追加）
      const { error: updateError } = await supabase
        .from("mission_applications")
        .update({
          proof_text: proofText.trim() || null,
          proof_file_url: proofFileUrl.trim() || null,
          submitted_at: new Date().toISOString(),
        })
        .eq("application_id", selectedMission.id)

      if (updateError) throw updateError

      // applicationsテーブルのステータスを「completed」に更新
      const { error: statusError } = await supabase
        .from("applications")
        .update({ status: "completed" })
        .eq("id", selectedMission.id)

      if (statusError) throw statusError

      // ユーザーにポイントを付与
      const { error: pointsError } = await supabase.from("points_histories").insert({
        user_id: userProfile.id,
        amount: selectedMission.missions.reward_point,
        reason: `ミッション完了: ${selectedMission.missions.title}`,
      })

      if (pointsError) throw pointsError

      // 証拠提出完了メール送信
      sendEvidenceSubmissionEmail(selectedMission).catch(console.error)

      toast({
        title: "証拠提出完了",
        description: `証拠が正常に提出され、${selectedMission.missions.reward_point}ポイントを獲得しました。`,
      })

      setProofText("")
      setProofFileUrl("")
      setSelectedMission(null)
      fetchInProgressMissions()
    } catch (error: any) {
      console.error("Evidence submission error:", error)
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!userProfile) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">証拠提出</h1>
          <p className="text-gray-600">進行中のミッションの証拠を提出してください</p>
        </div>

        {loading ? (
          <div>読み込み中...</div>
        ) : inProgressMissions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 mb-4">進行中のミッションがありません。</p>
              <Button asChild>
                <Link href="/missions">ミッション一覧を見る</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {inProgressMissions.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{application.missions?.title}</CardTitle>
                      <CardDescription>
                        報酬: {application.missions?.reward_point}ポイント • {application.missions?.users?.company_name}
                      </CardDescription>
                    </div>
                    <Badge variant="default">進行中</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {application.missions?.required_action && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">必要なアクション</h4>
                        <p className="text-gray-600 text-sm">{application.missions.required_action}</p>
                      </div>
                    )}

                    {application.missions?.required_evidence && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">必要な証拠</h4>
                        <p className="text-gray-600 text-sm">{application.missions.required_evidence}</p>
                      </div>
                    )}

                    {application.mission_applications &&
                    application.mission_applications.length > 0 &&
                    application.mission_applications[0].submitted_at ? (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-green-800 font-medium">証拠提出済み</p>
                        <p className="text-green-600 text-sm">
                          提出日: {new Date(application.mission_applications[0].submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-medium">証拠を提出する</h4>

                        <div>
                          <Label htmlFor="proof_text">証拠テキスト</Label>
                          <Textarea
                            id="proof_text"
                            placeholder="実行したアクションの詳細を記載してください"
                            value={selectedMission?.id === application.id ? proofText : ""}
                            onChange={(e) => {
                              setProofText(e.target.value)
                              setSelectedMission(application)
                            }}
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="proof_file_url">証拠ファイルURL</Label>
                          <Input
                            id="proof_file_url"
                            placeholder="スクリーンショットやファイルのURLを入力"
                            value={selectedMission?.id === application.id ? proofFileUrl : ""}
                            onChange={(e) => {
                              setProofFileUrl(e.target.value)
                              setSelectedMission(application)
                            }}
                          />
                        </div>

                        <Button
                          onClick={handleSubmitEvidence}
                          disabled={submitting || selectedMission?.id !== application.id}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {submitting ? "提出中..." : "証拠を提出"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
