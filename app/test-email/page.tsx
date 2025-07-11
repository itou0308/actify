"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Mail, Send } from "lucide-react"

export default function TestEmailPage() {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("Actify テストメール")
  const [message, setMessage] = useState(
    "これはActifyからのテストメールです。\n\nメール送信機能が正常に動作しています。",
  )
  const [sending, setSending] = useState(false)

  const handleSendTestEmail = async () => {
    if (!to.trim() || !subject.trim() || !message.trim()) {
      toast({
        title: "エラー",
        description: "すべての項目を入力してください。",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "メール送信に失敗しました")
      }

      toast({
        title: "送信完了",
        description: "テストメールが正常に送信されました。",
      })

      // フォームをリセット
      setTo("")
      setSubject("Actify テストメール")
      setMessage("これはActifyからのテストメールです。\n\nメール送信機能が正常に動作しています。")
    } catch (error: any) {
      console.error("Email send error:", error)
      toast({
        title: "送信エラー",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              メール送信テスト
            </CardTitle>
            <CardDescription>SendGrid HTTP APIを使用したメール送信機能をテストできます</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="to">送信先メールアドレス</Label>
              <Input
                id="to"
                type="email"
                placeholder="test@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="subject">件名</Label>
              <Input
                id="subject"
                placeholder="メールの件名"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="message">メッセージ</Label>
              <Textarea
                id="message"
                placeholder="メールの本文"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button onClick={handleSendTestEmail} disabled={sending} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              {sending ? "送信中..." : "テストメール送信"}
            </Button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">使用方法</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 送信先に有効なメールアドレスを入力してください</li>
                <li>• SendGrid APIキーが正しく設定されている必要があります</li>
                <li>• 送信者メールアドレス（noreply@actify.com）が認証済みである必要があります</li>
                <li>• メール送信後、受信トレイまたは迷惑メールフォルダを確認してください</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">注意事項</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 本番環境では認証済みドメインからのメール送信が推奨されます</li>
                <li>• SendGridの送信制限にご注意ください</li>
                <li>• テスト用途以外では使用しないでください</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
