"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { CreditCard, ExternalLink, JapaneseYenIcon as Yen } from "lucide-react"

export default function CompanyPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [paymentAmount, setPaymentAmount] = useState<number>(1000)
  const [loading, setLoading] = useState(true)
  const { userProfile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchPayments()
  }, [userProfile])

  const fetchPayments = async () => {
    if (!userProfile) return

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("company_id", userProfile.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching payments:", error)
      return
    }

    setPayments(data || [])
    setLoading(false)
  }

  const handleStripePayment = () => {
    if (paymentAmount < 100) {
      toast({
        title: "エラー",
        description: "最低金額は100円です。",
        variant: "destructive",
      })
      return
    }

    // Stripeの決済リンクを開く（指定されたリンクを使用）
    const stripeUrl = `https://buy.stripe.com/eVq14na4p9JS6Wm6lV3oA01?prefilled_amount=${paymentAmount}`
    window.open(stripeUrl, "_blank")

    // 決済記録を作成（実際の実装では決済完了後に作成）
    handlePaymentRecord(paymentAmount)
  }

  const handlePaymentRecord = async (amount: number) => {
    if (!userProfile) return

    try {
      const { error } = await supabase.from("payments").insert({
        company_id: userProfile.id,
        amount: amount,
        status: "completed", // 実際の実装では決済完了後に更新
      })

      if (error) throw error

      toast({
        title: "前払い処理開始",
        description: `¥${amount.toLocaleString()}の決済処理を開始しました。`,
      })

      fetchPayments()
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getTotalAmount = () => {
    return payments
      .filter((payment) => payment.status === "completed")
      .reduce((sum, payment) => sum + payment.amount, 0)
  }

  const handleQuickAmount = (amount: number) => {
    setPaymentAmount(amount)
  }

  if (!userProfile) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">前払い管理</h1>
          <p className="text-gray-600">ミッション報酬の前払いを管理できます</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>前払い総額</CardTitle>
            <CardDescription>完了した前払いの合計金額</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">¥{getTotalAmount().toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>前払い決済</CardTitle>
            <CardDescription>Stripeを使用して安全に決済できます</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="amount">前払い金額（円）</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Yen className="h-5 w-5 text-gray-500" />
                <Input
                  id="amount"
                  type="number"
                  min="100"
                  step="100"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                  className="flex-1"
                  placeholder="1000"
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">最低金額: ¥100</p>
            </div>

            <div>
              <Label>クイック選択</Label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                {[1000, 3000, 5000, 10000, 30000, 50000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(amount)}
                    className={paymentAmount === amount ? "bg-blue-50 border-blue-300" : ""}
                  >
                    ¥{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleStripePayment} className="w-full" size="lg">
              <CreditCard className="mr-2 h-5 w-5" />¥{paymentAmount.toLocaleString()}を決済する
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>前払い履歴</CardTitle>
            <CardDescription>過去の前払い記録</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>読み込み中...</div>
            ) : payments.length === 0 ? (
              <p className="text-gray-600">まだ前払いを行っていません。</p>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-semibold">¥{payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{new Date(payment.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        payment.status === "completed"
                          ? "default"
                          : payment.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {payment.status === "completed" ? "完了" : payment.status === "failed" ? "失敗" : "処理中"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
