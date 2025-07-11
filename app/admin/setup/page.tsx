"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Shield, CheckCircle, AlertCircle, ArrowLeft, Copy, Database } from "lucide-react"
import Link from "next/link"

export default function AdminSetupPage() {
  const [email, setEmail] = useState("joker.lie@icloud.com")
  const [password, setPassword] = useState("Wg3P42yA")
  const [authUserId, setAuthUserId] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const supabase = createClient()

  const checkCurrentUser = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setAuthUserId(user.id)
        setDebugInfo({
          currentUser: user,
          timestamp: new Date().toISOString(),
        })
        setMessage(`現在のユーザー:\nID: ${user.id}\nEmail: ${user.email}`)
      } else {
        setMessage("ログインしていません。")
      }
    } catch (error: any) {
      setMessage(`エラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createAdminUser = async () => {
    setLoading(true)
    setMessage("")
    setSuccess(false)

    try {
      // 1. 認証ユーザーを作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // メール確認をスキップ
        },
      })

      if (authError) {
        if (authError.message.includes("User already registered")) {
          // 既存ユーザーの場合、ログインを試行
          const { data: existingUser, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (loginError) throw loginError

          if (existingUser.user) {
            await createUserProfile(existingUser.user.id, email)
            await supabase.auth.signOut() // セットアップ後はログアウト
            setSuccess(true)
            setMessage(`既存ユーザーを管理者に更新しました！\nユーザーID: ${existingUser.user.id}`)
            return
          }
        }
        throw authError
      }

      if (authData.user) {
        await createUserProfile(authData.user.id, email)
        await supabase.auth.signOut() // セットアップ後はログアウト
        setSuccess(true)
        setMessage(`管理者アカウントが正常に作成されました！\nユーザーID: ${authData.user.id}`)
      }
    } catch (error: any) {
      console.error("Admin creation error:", error)
      setMessage(`エラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createUserProfile = async (userId: string, userEmail: string) => {
    const { error: profileError } = await supabase.from("users").upsert(
      {
        auth_user_id: userId,
        email: userEmail,
        user_type: "admin",
        username: "システム管理者",
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "auth_user_id",
      },
    )

    if (profileError) throw profileError
  }

  const createManualProfile = async () => {
    if (!authUserId.trim()) {
      setMessage("Auth User IDを入力してください。")
      return
    }

    setLoading(true)
    try {
      await createUserProfile(authUserId, email)
      setSuccess(true)
      setMessage(`手動でプロフィールを作成しました！\nAuth User ID: ${authUserId}`)
    } catch (error: any) {
      setMessage(`プロフィール作成エラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const checkAdminExists = async () => {
    setLoading(true)
    setMessage("")

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, user_type, auth_user_id")
        .eq("user_type", "admin")

      if (error) throw error

      if (data && data.length > 0) {
        setMessage(
          `管理者アカウントが見つかりました:\n${data
            .map((user) => `${user.email} (Auth ID: ${user.auth_user_id})`)
            .join("\n")}`,
        )
        setSuccess(true)
      } else {
        setMessage("管理者アカウントが見つかりませんでした。")
        setSuccess(false)
      }
    } catch (error: any) {
      setMessage(`エラー: ${error.message}`)
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("クリップボードにコピーしました")
  }

  const generateSQLCommand = () => {
    if (!authUserId.trim()) return ""

    return `INSERT INTO users (id, auth_user_id, user_type, email, username, created_at)
VALUES (
    gen_random_uuid(),
    '${authUserId}',
    'admin',
    '${email}',
    'システム管理者',
    NOW()
) ON CONFLICT (auth_user_id) DO UPDATE SET
    user_type = 'admin',
    username = 'システム管理者',
    updated_at = NOW();`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-800">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" />
                管理者アカウント設定
              </CardTitle>
            </div>
            <CardDescription>管理者アカウントを作成または確認します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基本設定 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">管理者メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@actify.com"
                />
              </div>

              <div>
                <Label htmlFor="password">管理者パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="AdminPassword123!"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={createAdminUser} disabled={loading} className="flex-1">
                  {loading ? "作成中..." : "管理者作成"}
                </Button>
                <Button
                  onClick={checkAdminExists}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  {loading ? "確認中..." : "管理者確認"}
                </Button>
              </div>
            </div>

            {/* 手動設定 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">手動設定（上記で失敗した場合）</h3>
              <div className="space-y-4">
                <Button
                  onClick={checkCurrentUser}
                  disabled={loading}
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  現在のユーザー情報を確認
                </Button>

                <div>
                  <Label htmlFor="authUserId">Auth User ID (UUID)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="authUserId"
                      value={authUserId}
                      onChange={(e) => setAuthUserId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    <Button
                      onClick={() => copyToClipboard(authUserId)}
                      variant="outline"
                      size="sm"
                      disabled={!authUserId}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button onClick={createManualProfile} disabled={loading || !authUserId} className="w-full">
                  手動でプロフィール作成
                </Button>
              </div>
            </div>

            {/* SQL生成 */}
            {authUserId && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  SQL コマンド生成
                </h3>
                <div className="space-y-2">
                  <Label>Supabase SQL Editorで実行するコマンド:</Label>
                  <div className="relative">
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{generateSQLCommand()}</pre>
                    <Button
                      onClick={() => copyToClipboard(generateSQLCommand())}
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div
                className={`flex items-start gap-2 text-sm p-3 rounded-md ${
                  success ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                }`}
              >
                {success ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                <pre className="whitespace-pre-wrap">{message}</pre>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">使用方法</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>「管理者確認」で既存の管理者をチェック</li>
                <li>管理者がいない場合は「管理者作成」をクリック</li>
                <li>失敗した場合は「現在のユーザー情報を確認」でUUIDを取得</li>
                <li>取得したUUIDで「手動でプロフィール作成」を実行</li>
                <li>それでも失敗する場合はSQL コマンドをSupabase SQL Editorで実行</li>
              </ol>
            </div>

            <div className="text-center">
              <Link href="/auth/login" className="text-blue-600 hover:underline text-sm">
                ログインページに戻る
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
