"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, XCircle, AlertCircle, Database } from "lucide-react"

interface TestResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

export default function ConnectionDebugPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const runTests = async () => {
    setLoading(true)
    const testResults: TestResult[] = []

    try {
      // 1. データベース接続テスト
      try {
        const { data, error } = await supabase.from("users").select("count").limit(1)
        if (error) {
          testResults.push({
            name: "データベース接続",
            status: "error",
            message: "接続に失敗しました",
            details: error.message,
          })
        } else {
          testResults.push({
            name: "データベース接続",
            status: "success",
            message: "接続成功",
          })
        }
      } catch (error: any) {
        testResults.push({
          name: "データベース接続",
          status: "error",
          message: "接続エラー",
          details: error.message,
        })
      }

      // 2. 認証状態確認
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        if (error) {
          testResults.push({
            name: "認証状態",
            status: "warning",
            message: "認証エラー",
            details: error.message,
          })
        } else if (user) {
          testResults.push({
            name: "認証状態",
            status: "success",
            message: `ログイン中: ${user.email}`,
          })
        } else {
          testResults.push({
            name: "認証状態",
            status: "warning",
            message: "未ログイン",
          })
        }
      } catch (error: any) {
        testResults.push({
          name: "認証状態",
          status: "error",
          message: "認証確認エラー",
          details: error.message,
        })
      }

      // 3. テーブル存在確認
      const tables = ["users", "companies", "missions", "applications"]
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select("count").limit(1)
          if (error) {
            testResults.push({
              name: `テーブル: ${table}`,
              status: "error",
              message: "アクセスエラー",
              details: error.message,
            })
          } else {
            testResults.push({
              name: `テーブル: ${table}`,
              status: "success",
              message: "アクセス可能",
            })
          }
        } catch (error: any) {
          testResults.push({
            name: `テーブル: ${table}`,
            status: "error",
            message: "テーブルエラー",
            details: error.message,
          })
        }
      }

      // 4. RLSポリシー確認
      try {
        const { data, error } = await supabase.from("users").select("email").limit(5)
        if (error) {
          if (error.message.includes("RLS")) {
            testResults.push({
              name: "RLSポリシー",
              status: "warning",
              message: "RLS制限あり",
              details: error.message,
            })
          } else {
            testResults.push({
              name: "RLSポリシー",
              status: "error",
              message: "ポリシーエラー",
              details: error.message,
            })
          }
        } else {
          testResults.push({
            name: "RLSポリシー",
            status: "success",
            message: `${data.length}件のユーザーを取得`,
          })
        }
      } catch (error: any) {
        testResults.push({
          name: "RLSポリシー",
          status: "error",
          message: "ポリシー確認エラー",
          details: error.message,
        })
      }

      // 5. 環境変数確認
      const hasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const hasSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      testResults.push({
        name: "環境変数",
        status: hasSupabaseUrl && hasSupabaseKey ? "success" : "error",
        message: hasSupabaseUrl && hasSupabaseKey ? "設定済み" : "未設定",
        details: `URL: ${hasSupabaseUrl ? "設定済み" : "未設定"}, Key: ${hasSupabaseKey ? "設定済み" : "未設定"}`,
      })
    } catch (error: any) {
      testResults.push({
        name: "全体テスト",
        status: "error",
        message: "予期しないエラー",
        details: error.message,
      })
    }

    setResults(testResults)
    setLoading(false)
  }

  const getIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getAlertVariant = (status: string) => {
    switch (status) {
      case "success":
        return "default"
      case "error":
        return "destructive"
      case "warning":
        return "default"
      default:
        return "default"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Supabase接続診断
            </CardTitle>
            <CardDescription>データベース接続と設定の状態を確認します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runTests} disabled={loading} className="w-full">
              {loading ? "テスト実行中..." : "診断テストを実行"}
            </Button>

            {results.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">診断結果</h3>
                {results.map((result, index) => (
                  <Alert key={index} variant={getAlertVariant(result.status)}>
                    <div className="flex items-start gap-3">
                      {getIcon(result.status)}
                      <div className="flex-1">
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm">{result.message}</div>
                        {result.details && (
                          <div className="text-xs mt-1 font-mono bg-gray-100 p-2 rounded">{result.details}</div>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">トラブルシューティング</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 接続エラーの場合: .env.localファイルの設定を確認してください</li>
                <li>• RLSエラーの場合: SQLスクリプトを実行してポリシーを設定してください</li>
                <li>• テーブルエラーの場合: データベースマイグレーションを実行してください</li>
                <li>• 認証エラーの場合: Supabaseプロジェクトの設定を確認してください</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
