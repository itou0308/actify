import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    // SendGrid HTTP APIを直接使用
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject,
          },
        ],
        from: {
          email: "noreply@actify.com",
          name: "Actify",
        },
        content: [
          {
            type: "text/plain",
            value: message,
          },
          {
            type: "text/html",
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                  <h2 style="color: #333; margin-bottom: 20px;">Actify 通知</h2>
                  <div style="background-color: white; padding: 20px; border-radius: 4px; border-left: 4px solid #007bff;">
                    <p style="color: #555; line-height: 1.6; margin: 0; white-space: pre-line;">${message}</p>
                  </div>
                  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; font-size: 12px; margin: 0;">
                      このメールはActifyシステムから自動送信されています。<br>
                      返信は不要です。
                    </p>
                  </div>
                </div>
              </div>
            `,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("SendGrid API error:", errorData)
      throw new Error(`SendGrid API error: ${response.status}`)
    }

    console.log("Email sent successfully:", {
      to,
      subject,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to send notification:", error)

    return NextResponse.json(
      {
        error: "Failed to send notification",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
