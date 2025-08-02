import { NextResponse } from "next/server"
import crypto from "crypto"

// Webhook secret from Shopify (you'll need to set this in your environment variables)
const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || "your-webhook-secret"

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256")
    const topicHeader = request.headers.get("x-shopify-topic")
    const shopHeader = request.headers.get("x-shopify-shop-domain")

    console.log(`Webhook received: ${topicHeader} from ${shopHeader}`)

    // Verify webhook signature (optional but recommended for security)
    if (WEBHOOK_SECRET !== "your-webhook-secret") {
      const expectedHmac = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(body, "utf8")
        .digest("base64")

      if (hmacHeader !== expectedHmac) {
        console.error("Webhook signature verification failed")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // Parse the webhook payload
    let payload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      console.error("Failed to parse webhook payload:", error)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // Handle different webhook topics
    switch (topicHeader) {
      case "orders/create":
        console.log("New order created:", payload.id)
        // Handle new order
        break

      case "orders/updated":
        console.log("Order updated:", payload.id)
        // Handle order update
        break

      case "products/create":
        console.log("New product created:", payload.id)
        // Handle new product
        break

      case "products/update":
        console.log("Product updated:", payload.id)
        // Handle product update
        break

      case "app/uninstalled":
        console.log("App uninstalled from shop:", shopHeader)
        // Handle app uninstallation
        break

      default:
        console.log(`Unhandled webhook topic: ${topicHeader}`)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: Request) {
  return NextResponse.json({ 
    message: "Shopify webhook endpoint is active",
    status: "ok"
  })
} 