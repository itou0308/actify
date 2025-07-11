"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function PrivacyPage() {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await supabase.from("site_content").select("content").eq("type", "privacy").single()

        if (data?.content) {
          setContent(data.content)
        } else {
          // Fallback to default content
          setContent(getDefaultContent())
        }
      } catch (error) {
        console.error("Error fetching privacy policy:", error)
        setContent(getDefaultContent())
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [supabase])

  const getDefaultContent = () => `# プライバシーポリシー

## 1. 個人情報の定義
本プライバシーポリシーにおいて、「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。

## 2. 個人情報の収集方法
当社は、利用者が利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号、運転免許証番号などの個人情報をお尋ねすることがあります。

## 3. 個人情報を収集・利用する目的
当社が個人情報を収集・利用する目的は、以下のとおりです。
- 当社サービスの提供・運営のため
- 利用者からのお問い合わせに回答するため（本人確認を行うことを含む）
- 利用者が利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため
- メンテナンス、重要なお知らせなど必要に応じたご連絡のため`

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
            <CardTitle className="text-3xl">プライバシーポリシー</CardTitle>
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
