"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "./supabase/client"

interface AuthContextType {
  user: User | null
  userProfile: any | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const createUserProfile = async (userId: string, email: string) => {
    try {
      console.log("Creating profile for:", email)

      const { data: newProfile, error: insertError } = await supabase
        .from("users")
        .insert({
          auth_user_id: userId,
          email: email,
          user_type: "user",
          username: email.split("@")[0],
          points: 0,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Profile creation error:", insertError)
        return null
      }

      console.log("Profile created successfully:", newProfile)
      return newProfile
    } catch (error) {
      console.error("Profile creation exception:", error)
      return null
    }
  }

  const fetchUserProfile = async (userId: string, email: string, retryCount = 0) => {
    try {
      console.log("Fetching profile for:", userId, email, "retry:", retryCount)

      // 短い遅延を追加してデータベース接続を安定化
      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
      }

      const { data: profile, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

      if (error) {
        console.error("Profile fetch error:", error)

        if (error.code === "PGRST116") {
          // プロフィールが存在しない場合は作成
          console.log("Profile not found, creating new profile")
          return await createUserProfile(userId, email)
        } else if (error.message?.includes("Failed to fetch") && retryCount < 3) {
          // ネットワークエラーの場合はリトライ
          console.log("Network error, retrying...")
          return await fetchUserProfile(userId, email, retryCount + 1)
        } else {
          return null
        }
      }

      console.log("Profile fetched successfully:", profile)
      return profile
    } catch (error) {
      console.error("Profile fetch exception:", error)

      // ネットワークエラーの場合はリトライ
      if (error instanceof TypeError && error.message.includes("Failed to fetch") && retryCount < 3) {
        console.log("Network error, retrying...")
        return await fetchUserProfile(userId, email, retryCount + 1)
      }

      return null
    }
  }

  const refreshProfile = async () => {
    if (user?.id && user?.email) {
      const profile = await fetchUserProfile(user.id, user.email)
      setUserProfile(profile)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...")

        // セッションを確認
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
        }

        if (!mounted) return

        if (!session) {
          console.log("No active session")
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          return
        }

        console.log("Active session found for:", session.user.email)
        setUser(session.user)

        if (session.user.id && session.user.email) {
          const profile = await fetchUserProfile(session.user.id, session.user.email)
          if (mounted) {
            setUserProfile(profile)
          }
        }
      } catch (error) {
        console.error("Auth initialization exception:", error)
        if (mounted) {
          setUser(null)
          setUserProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state change:", event, session?.user?.email || "no user")

      if (event === "SIGNED_OUT" || !session) {
        setUser(null)
        setUserProfile(null)
        setLoading(false)
        return
      }

      if (session?.user) {
        setUser(session.user)

        if (session.user.id && session.user.email) {
          const profile = await fetchUserProfile(session.user.id, session.user.email)
          if (mounted) {
            setUserProfile(profile)
          }
        }
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
      }
      setUser(null)
      setUserProfile(null)
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
