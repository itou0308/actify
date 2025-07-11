import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 認証が必要なルートの保護
  if (
    !user &&
    (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/profile") ||
      request.nextUrl.pathname.startsWith("/missions") ||
      request.nextUrl.pathname.startsWith("/points") ||
      request.nextUrl.pathname.startsWith("/evidence-submission") ||
      request.nextUrl.pathname.startsWith("/company") ||
      request.nextUrl.pathname.startsWith("/admin"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // 管理者ルートの保護
  if (user && request.nextUrl.pathname.startsWith("/admin")) {
    // /admin/setup は除外（管理者アカウント作成用）
    if (!request.nextUrl.pathname.startsWith("/admin/setup")) {
      try {
        const { data: userProfile, error } = await supabase
          .from("users")
          .select("user_type")
          .eq("auth_user_id", user.id)
          .single()

        if (error || !userProfile || userProfile.user_type !== "admin") {
          console.log("Admin access denied:", {
            error: error?.message,
            userProfile,
            userId: user.id,
            path: request.nextUrl.pathname,
          })
          const url = request.nextUrl.clone()
          url.pathname = "/dashboard"
          return NextResponse.redirect(url)
        }
      } catch (error) {
        console.error("Error checking admin access:", error)
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        return NextResponse.redirect(url)
      }
    }
  }

  // 認証済みユーザーを認証ページから離す
  if (
    user &&
    (request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/signup"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
