import { NextResponse } from "next/server";
import { TokenManager } from "@/lib/token-manager";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { product, shop } = await request.json();
    if (!product || !shop) {
      return NextResponse.json({ error: "Missing shop or product data" }, { status: 400 });
    }
    // Validate required fields
    if (!product.title || !product.variants || !Array.isArray(product.variants) || !product.variants[0]?.price) {
      return NextResponse.json({ error: "Product must have a title and at least one variant with a price" }, { status: 400 });
    }

    // Get supplier product ID from headers
    const supplierProductId = request.headers.get('X-Supplier-Product-ID');
    console.log('Supplier Product ID from headers:', supplierProductId);

    let headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // First try to get direct API credentials
    const { data: storeConfig } = await supabase
      .from('store_configs')
      .select('*')
      .eq('store_url', shop)
      .eq('is_active', true)
      .single();

    if (storeConfig) {
      // Use direct API credentials
      if (storeConfig.access_token) {
        headers['X-Shopify-Access-Token'] = storeConfig.access_token;
      } else if (storeConfig.api_key && storeConfig.api_secret) {
        const credentials = Buffer.from(`${storeConfig.api_key}:${storeConfig.api_secret}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      } else {
        return NextResponse.json({ error: "No valid credentials found for direct API store" }, { status: 401 });
      }
    } else {
      // Fallback to OAuth token
      const accessToken = await TokenManager.getToken(shop);
      if (!accessToken) {
        return NextResponse.json({ error: "Missing access token. Please connect to Shopify first." }, { status: 401 });
      }
      headers['X-Shopify-Access-Token'] = accessToken;
    }

    // Log what we're sending to Shopify
    console.log(`Pushing product to ${shop}:`, JSON.stringify(product, null, 2));

    // Call Shopify API
    const response = await fetch(`https://${shop}/admin/api/2023-10/products.json`, {
      method: "POST",
      headers,
      body: JSON.stringify({ product }),
    });
    const data = await response.json();
    
    console.log(`Push response status: ${response.status}`);
    console.log(`Shopify response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error("Shopify API error:", data);
      return NextResponse.json({ error: data.errors || data || "Shopify error" }, { status: response.status });
    }
    
    console.log(`Successfully pushed product: "${data.product?.title}" with ID: ${data.product?.id}`);
    
    // Store the mapping between supplier product and Shopify product
    if (data.product && data.product.id && supplierProductId) {
      try {
        console.log('Storing product mapping:', {
          supplier_product_id: supplierProductId,
          shopify_product_id: data.product.id.toString(),
          shopify_store_url: shop
        });
        
        const { error: mappingError } = await supabase
          .from('product_shopify_mappings')
          .insert({
            supplier_product_id: supplierProductId,
            shopify_product_id: data.product.id.toString(),
            shopify_store_url: shop,
            pushed_at: new Date().toISOString()
          });
        
        if (mappingError) {
          console.error('Error storing product mapping:', mappingError);
        } else {
          console.log('Product mapping stored successfully');
        }
      } catch (mappingError) {
        console.error('Error in mapping storage:', mappingError);
      }
    } else {
      console.log('No mapping stored - missing data:', {
        hasProduct: !!data.product,
        hasProductId: !!data.product?.id,
        hasSupplierProductId: !!supplierProductId
      });
    }
    
    return NextResponse.json({ success: true, product: data.product });
  } catch (error) {
    console.error("Internal server error:", error);
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 });
  }
}
