"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileText, ArrowLeft, Save, AlertCircle, RefreshCw, Database, CheckCircle } from "lucide-react"
import { checkAdminAuthClient } from "@/lib/admin-auth"

export default function AdminContentPage() {
  const [termsContent, setTermsContent] = useState("")
  const [privacyContent, setPrivacyContent] = useState("")
  const [originalTermsContent, setOriginalTermsContent] = useState("")
  const [originalPrivacyContent, setOriginalPrivacyContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [lastSaveTime, setLastSaveTime] = useState<string>("")
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
      await fetchDebugInfo()
      await fetchContent()
    }

    checkAuth()
  }, [router])

  const fetchDebugInfo = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Test database connection and permissions
      const { data: testData, error: testError } = await supabase.from("site_content").select("*").limit(1)

      // Test write permissions
      const testId = `test_${Date.now()}`
      const { data: writeTestData, error: writeTestError } = await supabase
        .from("site_content")
        .upsert({
          type: testId,
          content: "test content",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      // Clean up test data
      if (!writeTestError) {
        await supabase.from("site_content").delete().eq("type", testId)
      }

      setDebugInfo({
        authUser: user,
        userProfile,
        canReadTable: !testError,
        canWriteTable: !writeTestError,
        readError: testError?.message,
        writeError: writeTestError?.message,
        timestamp: new Date().toISOString(),
      })

      console.log("Debug info:", {
        authUser: user,
        userProfile,
        canReadTable: !testError,
        canWriteTable: !writeTestError,
        readError: testError?.message,
        writeError: writeTestError?.message,
      })
    } catch (error) {
      console.error("Debug info error:", error)
    }
  }

  const fetchContent = async () => {
    try {
      console.log("Fetching content...")

      // Fetch all content with detailed logging
      const { data: allContent, error: allError } = await supabase.from("site_content").select("*").order("type")

      console.log("Fetch result:", { allContent, allError })

      if (allError) {
        console.error("Error fetching content:", allError)
        // Set default content if fetch fails
        const defaultTerms = getDefaultTermsContent()
        const defaultPrivacy = getDefaultPrivacyContent()
        setTermsContent(defaultTerms)
        setPrivacyContent(defaultPrivacy)
        setOriginalTermsContent(defaultTerms)
        setOriginalPrivacyContent(defaultPrivacy)
        return
      }

      const termsData = allContent?.find((item) => item.type === "terms")
      const privacyData = allContent?.find((item) => item.type === "privacy")

      console.log("Found data:", { termsData, privacyData })

      const termsText = termsData?.content || getDefaultTermsContent()
      const privacyText = privacyData?.content || getDefaultPrivacyContent()

      setTermsContent(termsText)
      setPrivacyContent(privacyText)
      setOriginalTermsContent(termsText)
      setOriginalPrivacyContent(privacyText)

      console.log("Content set:", {
        termsLength: termsText.length,
        privacyLength: privacyText.length,
      })
    } catch (error) {
      console.error("Error in fetchContent:", error)
      const defaultTerms = getDefaultTermsContent()
      const defaultPrivacy = getDefaultPrivacyContent()
      setTermsContent(defaultTerms)
      setPrivacyContent(defaultPrivacy)
      setOriginalTermsContent(defaultTerms)
      setOriginalPrivacyContent(defaultPrivacy)
    } finally {
      setLoading(false)
    }
  }

  const saveContent = async (type: "terms" | "privacy", content: string) => {
    setSaving(true)
    try {
      console.log("=== SAVE OPERATION START ===")
      console.log("Saving content:", {
        type,
        contentLength: content.length,
        contentPreview: content.substring(0, 100) + "...",
        timestamp: new Date().toISOString(),
      })

      // Step 1: Try to update existing record
      console.log("Step 1: Attempting UPDATE...")
      const { data: updateData, error: updateError } = await supabase
        .from("site_content")
        .update({
          content: content,
          updated_at: new Date().toISOString(),
        })
        .eq("type", type)
        .select()

      console.log("Update result:", { updateData, updateError })

      // Step 2: If no rows were updated, try INSERT
      if (!updateError && (!updateData || updateData.length === 0)) {
        console.log("Step 2: No rows updated, attempting INSERT...")
        const { data: insertData, error: insertError } = await supabase
          .from("site_content")
          .insert({
            type: type,
            content: content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()

        console.log("Insert result:", { insertData, insertError })

        if (insertError) {
          throw insertError
        }
      } else if (updateError) {
        console.log("Step 2: Update failed, attempting UPSERT...")
        // Step 3: If update failed, try UPSERT
        const { data: upsertData, error: upsertError } = await supabase
          .from("site_content")
          .upsert({
            type: type,
            content: content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()

        console.log("Upsert result:", { upsertData, upsertError })

        if (upsertError) {
          throw upsertError
        }
      }

      // Step 4: Verify the save by fetching the data back
      console.log("Step 4: Verifying save...")
      const { data: verifyData, error: verifyError } = await supabase
        .from("site_content")
        .select("*")
        .eq("type", type)
        .single()

      console.log("Verification result:", { verifyData, verifyError })

      if (verifyError) {
        throw new Error(`保存の検証に失敗しました: ${verifyError.message}`)
      }

      if (!verifyData || verifyData.content !== content) {
        throw new Error("保存されたデータが一致しません")
      }

      // Update original content to track changes
      if (type === "terms") {
        setOriginalTermsContent(content)
      } else {
        setOriginalPrivacyContent(content)
      }

      const saveTime = new Date().toLocaleString("ja-JP")
      setLastSaveTime(saveTime)

      console.log("=== SAVE OPERATION SUCCESS ===")
      alert(`${type === "terms" ? "利用規約" : "プライバシーポリシー"}を保存しました！\n保存時刻: ${saveTime}`)

      // Refresh content to ensure consistency
      await fetchContent()
    } catch (error: any) {
      console.error("=== SAVE OPERATION FAILED ===")
      console.error("Save error:", error)

      const errorDetails = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        authUser: debugInfo.authUser?.id,
        userType: userProfile?.user_type,
        timestamp: new Date().toISOString(),
      }

      console.error("Detailed error:", errorDetails)

      alert(`保存に失敗しました: ${error.message}\n\n詳細なエラー情報はコンソールを確認してください。`)
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    try {
      console.log("=== CONNECTION TEST START ===")

      const {
        data: { user },
      } = await supabase.auth.getUser()
      console.log("Current user:", user)

      // Test read
      const { data: readData, error: readError } = await supabase.from("site_content").select("*").limit(1)

      console.log("Read test:", { readData, readError })

      // Test write
      const testId = `test_${Date.now()}`
      const { data: writeData, error: writeError } = await supabase
        .from("site_content")
        .upsert({
          type: testId,
          content: "test content for connection",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      console.log("Write test:", { writeData, writeError })

      // Clean up
      if (!writeError) {
        await supabase.from("site_content").delete().eq("type", testId)
        console.log("Test data cleaned up")
      }

      console.log("=== CONNECTION TEST END ===")

      alert(`接続テスト結果:
ユーザー: ${user?.email || "未認証"}
読み取り: ${readError ? "失敗 - " + readError.message : "成功"}
書き込み: ${writeError ? "失敗 - " + writeError.message : "成功"}`)

      // Refresh debug info
      await fetchDebugInfo()
    } catch (error) {
      console.error("Connection test error:", error)
      alert(`接続テストエラー: ${error}`)
    }
  }

  const hasUnsavedChanges = () => {
    return termsContent !== originalTermsContent || privacyContent !== originalPrivacyContent
  }

  const getDefaultTermsContent = () => `# 利用規約

## 第1条（適用）
本規約は、Actify（以下「当サービス」）の利用に関して、当サービスを提供する運営者（以下「当社」）と利用者との間の権利義務関係を定めることを目的とし、利用者と当社との間の当サービスの利用に関わる一切の関係に適用されます。

## 第2条（利用登録）
利用者は、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。

## 第3条（ユーザーIDおよびパスワードの管理）
利用者は、自己の責任において、当サービスのユーザーIDおよびパスワードを適切に管理するものとします。`

  const getDefaultPrivacyContent = () => `# プライバシーポリシー

## 1. 個人情報の定義
本プライバシーポリシーにおいて、「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報を指します。

## 2. 個人情報の収集方法
当社は、利用者が利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレスなどの個人情報をお尋ねすることがあります。

## 3. 個人情報を収集・利用する目的
当社が個人情報を収集・利用する目的は、以下のとおりです。
- 当社サービスの提供・運営のため
- 利用者からのお問い合わせに回答するため
- メンテナンス、重要なお知らせなど必要に応じたご連絡のため`

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <div>読み込み中...</div>
            </div>
          </div>
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
              <h1 className="text-3xl font-bold">コンテンツ管理</h1>
              <p className="text-gray-600">利用規約・プライバシーポリシーの編集</p>
              {lastSaveTime && <p className="text-sm text-green-600">最終保存: {lastSaveTime}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={testConnection} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              接続テスト
            </Button>
            <Button onClick={fetchContent} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              再読み込み
            </Button>
          </div>
        </div>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              システム状態
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <strong>認証ユーザー:</strong>
                {debugInfo.authUser?.email || "未認証"}
                {debugInfo.authUser && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
              <div className="flex items-center gap-2">
                <strong>ユーザータイプ:</strong>
                {userProfile?.user_type || "不明"}
                {userProfile?.user_type === "admin" && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
              <div className="flex items-center gap-2">
                <strong>読み取り権限:</strong>
                {debugInfo.canReadTable ? (
                  <>
                    <span className="text-green-600">✓ 成功</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </>
                ) : (
                  <span className="text-red-600">✗ 失敗: {debugInfo.readError}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <strong>書き込み権限:</strong>
                {debugInfo.canWriteTable ? (
                  <>
                    <span className="text-green-600">✓ 成功</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </>
                ) : (
                  <span className="text-red-600">✗ 失敗: {debugInfo.writeError}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <strong>未保存の変更:</strong>
                {hasUnsavedChanges() ? (
                  <span className="text-yellow-600">あり</span>
                ) : (
                  <>
                    <span className="text-green-600">なし</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </>
                )}
              </div>
              <div>
                <strong>最終更新:</strong>{" "}
                {debugInfo.timestamp ? new Date(debugInfo.timestamp).toLocaleString("ja-JP") : "不明"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              サイトコンテンツ編集
            </CardTitle>
            <CardDescription>
              利用規約とプライバシーポリシーを編集できます。保存すると、トップページの各ページも自動的に更新されます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="terms" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="terms" className="relative">
                  利用規約
                  {termsContent !== originalTermsContent && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="privacy" className="relative">
                  プライバシーポリシー
                  {privacyContent !== originalPrivacyContent && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="terms" className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">利用規約の内容</label>
                    <span className="text-xs text-gray-500">
                      文字数: {termsContent.length}
                      {termsContent !== originalTermsContent && <span className="text-yellow-600 ml-2">• 未保存</span>}
                    </span>
                  </div>
                  <Textarea
                    value={termsContent}
                    onChange={(e) => setTermsContent(e.target.value)}
                    className="min-h-[500px] font-mono text-sm"
                    placeholder="利用規約の内容をMarkdown形式で入力してください..."
                  />
                </div>
                <Button
                  onClick={() => saveContent("terms", termsContent)}
                  disabled={saving || !debugInfo.canWriteTable}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "保存中..." : "利用規約を保存"}
                </Button>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">プライバシーポリシーの内容</label>
                    <span className="text-xs text-gray-500">
                      文字数: {privacyContent.length}
                      {privacyContent !== originalPrivacyContent && (
                        <span className="text-yellow-600 ml-2">• 未保存</span>
                      )}
                    </span>
                  </div>
                  <Textarea
                    value={privacyContent}
                    onChange={(e) => setPrivacyContent(e.target.value)}
                    className="min-h-[500px] font-mono text-sm"
                    placeholder="プライバシーポリシーの内容をMarkdown形式で入力してください..."
                  />
                </div>
                <Button
                  onClick={() => saveContent("privacy", privacyContent)}
                  disabled={saving || !debugInfo.canWriteTable}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "保存中..." : "プライバシーポリシーを保存"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 保存前の警告 */}
        {hasUnsavedChanges() && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">未保存の変更があります</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">変更を保存するまで、サイトには反映されません。</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
