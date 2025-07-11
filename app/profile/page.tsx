"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import DashboardLayout from "@/components/dashboard/dashboard-layout"

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    company_name: "",
    phone: "",
    address: "",
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileLoading(false)
        return
      }

      try {
        console.log("Fetching profile for user:", user.id)

        const { data: profileData, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", user.id)
          .single()

        if (fetchError) {
          console.error("Profile fetch error:", fetchError)
          setError("プロフィールの取得に失敗しました")
          return
        }

        console.log("Profile loaded:", profileData)
        setProfile(profileData)
        setFormData({
          username: profileData.username || "",
          company_name: profileData.company_name || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
        })
      } catch (error) {
        console.error("Profile fetch exception:", error)
        setError("プロフィールの取得中にエラーが発生しました")
      } finally {
        setProfileLoading(false)
      }
    }

    if (user && !userProfile) {
      fetchProfile()
    } else if (userProfile) {
      setProfile(userProfile)
      setFormData({
        username: userProfile.username || "",
        company_name: userProfile.company_name || "",
        phone: userProfile.phone || "",
        address: userProfile.address || "",
      })
      setProfileLoading(false)
    }
  }, [user, userProfile, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          username: formData.username,
          company_name: formData.company_name,
          phone: formData.phone,
          address: formData.address,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_user_id", user!.id)

      if (updateError) {
        console.error("Profile update error:", updateError)
        setError("プロフィールの更新に失敗しました")
        return
      }

      setSuccess("プロフィールが正常に更新されました")

      // プロフィールを再取得
      const { data: updatedProfile } = await supabase.from("users").select("*").eq("auth_user_id", user!.id).single()

      if (updatedProfile) {
        setProfile(updatedProfile)
      }
    } catch (error) {
      console.error("Profile update exception:", error)
      setError("プロフィールの更新中にエラーが発生しました")
    } finally {
      setUpdating(false)
    }
  }

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case "admin":
        return "管理者"
      case "company":
        return "企業"
      case "user":
      default:
        return "一般ユーザー"
    }
  }

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case "admin":
        return <Badge variant="destructive">管理者</Badge>
      case "company":
        return <Badge variant="default">企業</Badge>
      case "user":
      default:
        return <Badge variant="secondary">一般ユーザー</Badge>
    }
  }

  if (loading || profileLoading) {
    return (
      <DashboardLayout userProfile={profile || { username: "読み込み中...", user_type: "user" }}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  if (error && !profile) {
    return (
      <DashboardLayout userProfile={{ username: "エラー", user_type: "user" }}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">エラーが発生しました</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">プロフィール</h1>
          <p className="text-gray-600">アカウント情報を管理できます</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>アカウントの基本情報です</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>メールアドレス</Label>
                <Input value={user.email || ""} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>ユーザータイプ</Label>
                <div className="mt-1">{getUserTypeBadge(profile?.user_type || "user")}</div>
              </div>
              <div>
                <Label>登録日</Label>
                <Input
                  value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString("ja-JP") : "不明"}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              {profile?.user_type === "user" && (
                <div>
                  <Label>保有ポイント</Label>
                  <Input value={`${profile?.points || 0} ポイント`} disabled className="bg-gray-50" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>プロフィール編集</CardTitle>
              <CardDescription>プロフィール情報を更新できます</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username">ユーザー名</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ユーザー名を入力"
                  />
                </div>

                {profile?.user_type === "company" && (
                  <div>
                    <Label htmlFor="company_name">会社名</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="会社名を入力"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="phone">電話番号</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="電話番号を入力"
                  />
                </div>

                <div>
                  <Label htmlFor="address">住所</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="住所を入力"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={updating} className="w-full">
                  {updating ? "更新中..." : "プロフィールを更新"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
