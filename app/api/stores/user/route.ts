import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'
import { SellerStoreService } from '@/lib/services/seller-store-service'
import { TokenManager } from '@/lib/token-manager'

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify session and get user info
    const sessionResult = await AuthService.verifySession(sessionToken)
    if (!sessionResult.success || !sessionResult.user || sessionResult.user.userType !== 'seller') {
      return NextResponse.json({ error: 'Seller authentication required' }, { status: 401 })
    }

    const username = sessionResult.user.username

    // Get user's store connections from both sources
    const sellerConnections = await SellerStoreService.getSellerStoreConnections(username)
    const tokenStores = await TokenManager.getUserStores(username)

    // Combine and deduplicate stores
    const storeMap = new Map()

    // Add from seller connections (primary source)
    sellerConnections.forEach(conn => {
      storeMap.set(conn.storeUrl, {
        shop: conn.storeUrl,
        name: conn.storeName,
        connectedAt: conn.connectedAt,
        lastUpdated: conn.updatedAt,
        type: conn.connectionType,
        source: 'seller_connections'
      })
    })

    // Add from token stores (fallback for legacy data)
    tokenStores.forEach(store => {
      if (!storeMap.has(store.shop)) {
        storeMap.set(store.shop, {
          shop: store.shop,
          name: store.shop, // Use shop URL as name if no name available
          connectedAt: store.created_at,
          lastUpdated: store.updated_at,
          type: 'legacy',
          source: 'shopify_tokens'
        })
      }
    })

    const stores = Array.from(storeMap.values())

    return NextResponse.json({ 
      stores,
      username,
      totalStores: stores.length
    })
  } catch (error) {
    console.error('Error in GET /api/stores/user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}