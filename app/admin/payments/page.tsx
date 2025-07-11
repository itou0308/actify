"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CreditCard, ArrowLeft, Building, Calendar, DollarSign } from "lucide-react"
import { checkAdminAuthClient } from "@/lib/admin-auth"

interface Payment {
  id: string
  company_id: string
  amount: number
  status: string
  stripe_payment_id: string
  created_at: string
  company_name: string
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
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
      fetchPayments()
    }

    checkAuth()
  }, [router])

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          company_id,
          amount,
          status,
          stripe_payment_id,
          created_at,
          users!inner(username)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const paymentsWithCompanyName =
        data?.map((payment) => ({
          ...payment,
          company_name: payment.users.username,
        })) || []

      setPayments(paymentsWithCompanyName)
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div>読み込み中...</div>
        </div>
      </div>
    )
  }

  const totalAmount = payments.filter((p) => p.status === "completed").reduce((sum, payment) => sum + payment.amount, 0)
  const completedPayments = payments.filter((p) => p.status === "completed").length
  const pendingPayments = payments.filter((p) => p.status === "pending").length
  const failedPayments = payments.filter((p) => p.status === "failed").length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">完了</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">処理中</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">失敗</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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
              <h1 className="text-3xl font-bold">前払い履歴</h1>
              <p className="text-gray-600">企業の前払い決済履歴</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">総決済額</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">¥{totalAmount.toLocaleString()}</div>
              <p className="text-xs text-gray-600">完了済み決済のみ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">完了</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedPayments}</div>
              <p className="text-xs text-gray-600">件</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">処理中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingPayments}</div>
              <p className="text-xs text-gray-600">件</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">失敗</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedPayments}</div>
              <p className="text-xs text-gray-600">件</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              決済履歴一覧
            </CardTitle>
            <CardDescription>企業による前払い決済の履歴</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{payment.company_name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />¥{payment.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(payment.created_at).toLocaleString("ja-JP")}
                      </div>
                      {payment.stripe_payment_id && (
                        <div className="text-xs text-gray-400">Stripe ID: {payment.stripe_payment_id}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">{getStatusBadge(payment.status)}</div>
                </div>
              ))}
              {payments.length === 0 && <div className="text-center py-8 text-gray-500">決済履歴がありません</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
