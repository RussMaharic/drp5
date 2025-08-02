import { NextResponse } from "next/server"
import { ProductService } from "@/lib/product-service"

export async function GET() {
  try {
    const products = await ProductService.getSupplierProducts()
    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching supplier products:', error)
    return NextResponse.json(
      { error: "Failed to fetch supplier products" },
      { status: 500 }
    )
  }
} 