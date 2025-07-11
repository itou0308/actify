import { createClient } from "@/lib/supabase/client"
import { redirect } from "next/navigation"

export interface AdminAuthResult {
  user: any
  userProfile: any
  isAdmin: boolean
}

export async function checkAdminAuth(): Promise<AdminAuthResult> {
  const supabase = createClient()

  try {
    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("No authenticated user found")
      redirect("/auth/login")
    }

    // ユーザープロフィールを取得
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      console.log("User profile not found:", profileError?.message)
      redirect("/auth/login")
    }

    // 管理者権限をチェック
    if (userProfile.user_type !== "admin") {
      console.log("User is not admin:", {
        userId: user.id,
        userType: userProfile.user_type,
      })
      redirect("/dashboard")
    }

    return {
      user,
      userProfile,
      isAdmin: true,
    }
  } catch (error) {
    console.error("Admin auth check failed:", error)
    redirect("/auth/login")
  }
}

// クライアントサイド用の認証チェック
export async function checkAdminAuthClient() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { isAuthenticated: false, isAdmin: false, user: null, userProfile: null }
    }

    const { data: userProfile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

    if (!userProfile) {
      return { isAuthenticated: false, isAdmin: false, user: null, userProfile: null }
    }

    return {
      isAuthenticated: true,
      isAdmin: userProfile.user_type === "admin",
      user,
      userProfile,
    }
  } catch (error) {
    console.error("Client admin auth check failed:", error)
    return { isAuthenticated: false, isAdmin: false, user: null, userProfile: null }
  }
}
