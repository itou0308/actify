"use client"

import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import UserDashboard from "@/components/dashboard/user-dashboard"
import CompanyDashboard from "@/components/dashboard/company-dashboard"
import AdminDashboard from "@/components/dashboard/admin-dashboard"

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchOrCreateProfile = async () => {
      if (!user) {
        setProfileLoading(false)
        return
      }

      try {
        console.log("Fetching profile for user:", user.id)

        // まずプロフィールの存在を確認
        const { data: existingProfile, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", user.id)
          .single()

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            // プロフィールが存在しない場合は作成
            console.log("Profile not found, creating new profile")

            const { data: newProfile, error: createError } = await supabase
              .from("users")
              .insert({
                auth_user_id: user.id,
                email: user.email!,
                username: user.email!.split("@")[0],
                user_type: "user",
                points: 0,
              })
              .select()
              .single()

            if (createError) {
              console.error("Profile creation error:", createError)
              setError("プロフィールの作成に失敗しました")
              return
            }

            console.log("Profile created:", newProfile)
            setProfile(newProfile)
          } else {
            console.error("Profile fetch error:", fetchError)
            setError("プロフィールの取得に失敗しました")
            return
          }
        } else {
          console.log("Profile found:", existingProfile)
          setProfile(existingProfile)
        }
      } catch (error) {
        console.error("Profile operation error:", error)
        setError("プロフィール処理中にエラーが発生しました")
      } finally {
        setProfileLoading(false)
      }
    }

    if (user && !userProfile) {
      fetchOrCreateProfile()
    } else if (userProfile) {
      setProfile(userProfile)
      setProfileLoading(false)
    }
  }, [user, userProfile, supabase])

  // 認証チェック
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-red-800 font-semibold mb-2">エラーが発生しました</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">プロフィールが見つかりません</p>
        </div>
      </div>
    )
  }

  // ユーザータイプに応じてダッシュボードを表示
  switch (profile.user_type) {
    case "admin":
      return <AdminDashboard userProfile={profile} />
    case "company":
      return <CompanyDashboard userProfile={profile} />
    case "user":
    default:
      return <UserDashboard userProfile={profile} />
  }
}
