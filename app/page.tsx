import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Actify</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">あなたの行動が、報酬になる。</p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signup">今すぐ始める</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/login">ログイン</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">ミッション応募</h3>
            <p className="text-gray-600">
              SNS投稿や購入、体験・レビューなどの様々なカテゴリからミッションに応募しましょう。
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">証拠提出</h3>
            <p className="text-gray-600">ミッションごとに設定された証拠を提出しましょう。</p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💎</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">ポイント獲得</h3>
            <p className="text-gray-600">ミッションを達成すると、ポイントが付与されて様々な報酬と交換できます。</p>
          </div>
        </div>

        {/* よくある質問セクション */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">よくある質問</h2>
            <p className="text-gray-600">Actifyについてよくお寄せいただく質問をまとめました</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Q1. Actifyとは？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  企業(広告主)がミッションという広告を出し、それを「来店」「SNS投稿」「購入」「体験・レビュー」などの形で達成し、報酬を得る次世代オファーウォール広告プラットフォームです。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Q2. 登録は無料ですか？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  ユーザー登録は無料です。企業の方は登録後、管理者よりご連絡をさせていただき、本登録となります。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Q3. どんなミッションがありますか？</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-700">
                  <p className="mb-2">例）</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>飲食店で特定の時間に来店し、飲食をするだけでポイントが付与</li>
                    <li>新サービスのアプリに登録し、UIを確認してレビューを提出してポイントが付与</li>
                    <li>美容室で初回来店＆口コミ投稿をしてポイント付与</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Q4. 現在の報酬は何がありますか？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  申し訳ございません。現在のポイント交換対象はAmazonギフト券のみとさせていただきます。サービス拡大後、様々な報酬をご用意させていただきます。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="mt-16 py-8 bg-black text-white rounded-lg">
          <div className="flex flex-wrap justify-center gap-6">
            <Button variant="ghost" size="sm" asChild className="text-white hover:text-gray-300 hover:bg-gray-800">
              <Link href="/auth/signup">新規会員登録</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-white hover:text-gray-300 hover:bg-gray-800">
              <Link href="/auth/login">ログイン</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-white hover:text-gray-300 hover:bg-gray-800">
              <Link href="/terms">利用規約</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-white hover:text-gray-300 hover:bg-gray-800">
              <Link href="/privacy">プライバシーポリシー</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-white hover:text-gray-300 hover:bg-gray-800">
              <a href="https://forms.gle/5Z2F7dRDXJtiwAUE6" target="_blank" rel="noopener noreferrer">
                お問い合わせ
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-white hover:text-gray-300 hover:bg-gray-800">
              <Link href="/auth/admin-login">管理者ログイン</Link>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
