"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function TermsPage() {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await supabase.from("site_content").select("content").eq("type", "terms").single()

        if (data?.content) {
          setContent(data.content)
        } else {
          // Fallback to default content
          setContent(getDefaultContent())
        }
      } catch (error) {
        console.error("Error fetching terms:", error)
        setContent(getDefaultContent())
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [supabase])

  const getDefaultContent = () => `# 利用規約

## 第1条（適用）
本規約は、Actify（以下「当サービス」）の利用に関して、当サービスを提供する運営者（以下「当社」）と利用者との間の権利義務関係を定めることを目的とし、利用者と当社との間の当サービスの利用に関わる一切の関係に適用されます。

## 第2条（利用登録）
利用者は、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。

## 第3条（ユーザーIDおよびパスワードの管理）
利用者は、自己の責任において、当サービスのユーザーIDおよびパスワードを適切に管理するものとします。`

  const renderMarkdown = (markdown: string) => {
    return markdown.split("\n").map((line, index) => {
      if (line.startsWith("# ")) {
        return (
          <h1 key={index} className="text-3xl font-bold mb-4">
            {line.substring(2)}
          </h1>
        )
      } else if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-xl font-semibold mt-6 mb-3">
            {line.substring(3)}
          </h2>
        )
      } else if (line.startsWith("- ")) {
        return (
          <li key={index} className="ml-4">
            {line.substring(2)}
          </li>
        )
      } else if (line.trim() === "") {
        return <br key={index} />
      } else {
        return (
          <p key={index} className="mb-3">
            {line}
          </p>
        )
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Button variant="outline" asChild>
            <Link href="/">← ホームに戻る</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">利用規約</CardTitle>
            <p className="text-gray-600">最終更新日: {new Date().toLocaleDateString("ja-JP")}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            {loading ? <div>読み込み中...</div> : <div className="space-y-2">{renderMarkdown(content)}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
