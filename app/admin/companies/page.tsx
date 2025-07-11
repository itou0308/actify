"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building, ArrowLeft, Calendar, Mail, Target } from "lucide-react"
import { checkAdminAuthClient } from "@/lib/admin-auth"

interface CompanyProfile {
  id: string
  username: string
  email: string
  user_type: string
  created_at: string
  mission_count?: number
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
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
      fetchCompanies()
    }

    checkAuth()
  }, [router])

  const fetchCompanies = async () => {
    try {
      const { data: companiesData, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_type", "company")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Fetch mission counts for each company
      const companiesWithMissions = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count } = await supabase
            .from("missions")
            .select("*", { count: "exact", head: true })
            .eq("company_id", company.id)

          return {
            ...company,
            mission_count: count || 0,
          }
        }),
      )

      setCompanies(companiesWithMissions)
    } catch (error) {
      console.error("Error fetching companies:", error)
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

  const totalMissions = companies.reduce((sum, company) => sum + (company.mission_count || 0), 0)
  const avgMissions = companies.length > 0 ? Math.round(totalMissions / companies.length) : 0

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
              <h1 className="text-3xl font-bold">企業管理</h1>
              <p className="text-gray-600">登録済みの企業アカウント一覧</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                企業統計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{companies.length}</div>
                  <div className="text-sm text-gray-600">総企業数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalMissions}</div>
                  <div className="text-sm text-gray-600">総ミッション数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{avgMissions}</div>
                  <div className="text-sm text-gray-600">平均ミッション数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>企業一覧</CardTitle>
              <CardDescription>登録済みの企業アカウント</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Building className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{company.username}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {company.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(company.created_at).toLocaleDateString("ja-JP")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {company.mission_count || 0} ミッション
                      </Badge>
                      <Badge variant="outline">{company.user_type}</Badge>
                    </div>
                  </div>
                ))}
                {companies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">登録された企業がありません</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
