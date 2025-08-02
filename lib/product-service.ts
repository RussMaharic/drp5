import { supabase } from './supabase'
import { Product, CreateProductData, UpdateProductData } from './types/product'

export class ProductService {
  // Get all approved products (for sellers)
  static async getApprovedProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching approved products:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getApprovedProducts:', error)
      return []
    }
  }

  // Get all pending products (for admin approval)
  static async getPendingProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching pending products:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPendingProducts:', error)
      return []
    }
  }

  // Get all products (for admin)
  static async getAllProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all products:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllProducts:', error)
      return []
    }
  }

  // Get products for current supplier
  static async getSupplierProducts(): Promise<Product[]> {
    try {
      console.log('🔍 PRODUCT SERVICE - Getting supplier products...')
      
      // Try to refresh session first if it's missing
      let user = null
      let userError = null
      
      try {
        const authResult = await supabase.auth.getUser()
        user = authResult.data.user
        userError = authResult.error
      } catch (error) {
        console.log('⚠️ Initial auth check failed, trying session refresh...')
        try {
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshData.user) {
            user = refreshData.user
            userError = null
            console.log('✅ Session refreshed successfully')
          } else {
            userError = refreshError
          }
        } catch (refreshErr) {
          console.log('❌ Session refresh also failed:', refreshErr)
          userError = refreshErr
        }
      }
      
      console.log('🔐 PRODUCT SERVICE - Auth check:', { 
        hasUser: !!user, 
        email: user?.email, 
        error: userError?.message 
      })
      
      if (userError || !user) {
        console.error('❌ Error getting authenticated user:', userError)
        // Fallback to localStorage for compatibility
        console.log('🔄 Falling back to localStorage authentication...')
        const supplierName = localStorage.getItem('supplierName')
        if (supplierName) {
          console.log('📦 PRODUCT SERVICE - Querying products with localStorage supplier_id:', supplierName)
          
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('supplier_id', supplierName)
            .order('created_at', { ascending: false })

          console.log('📊 PRODUCT SERVICE - Query result (localStorage):', { 
            error: error?.message,
            productCount: data?.length || 0,
            products: data?.map(p => ({ id: p.id, title: p.title, supplier_id: p.supplier_id, status: p.status })) || []
          })

          if (error) {
            console.error('❌ Error fetching products with localStorage fallback:', error)
            return []
          }

          return data || []
        }
        return []
      }

      // Get supplier data from suppliers table using user email
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('username')
        .eq('email', user.email)
        .single()

      console.log('👤 PRODUCT SERVICE - Supplier lookup:', { 
        email: user.email,
        supplierData, 
        error: supplierError?.message 
      })

      let supplierId: string
      if (supplierError || !supplierData) {
        // Fallback to localStorage for backwards compatibility
        supplierId = localStorage.getItem('supplierName') || 'Unknown User'
        console.log('⚠️ PRODUCT SERVICE - Using localStorage fallback:', supplierId)
      } else {
        // Use the actual username from suppliers table
        supplierId = supplierData.username
        console.log('✅ PRODUCT SERVICE - Using DB supplier ID:', supplierId)
      }

      console.log('📦 PRODUCT SERVICE - Querying products for supplier_id:', supplierId)
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })

      console.log('📊 PRODUCT SERVICE - Query result:', { 
        error: error?.message,
        productCount: data?.length || 0,
        products: data?.map(p => ({ id: p.id, title: p.title, supplier_id: p.supplier_id, status: p.status })) || []
      })

      if (error) {
        console.error('❌ Error fetching supplier products:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getSupplierProducts:', error)
      return []
    }
  }

  // Create a new product (now defaults to pending status)
  static async createProduct(productData: CreateProductData): Promise<Product | null> {
    try {
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting authenticated user:', userError)
        return null
      }

      // Get supplier data from suppliers table using user email
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('username, name')
        .eq('email', user.email)
        .single()

      let supplierId: string
      let supplierName: string
      if (supplierError || !supplierData) {
        // Fallback to localStorage for backwards compatibility
        supplierId = localStorage.getItem('supplierName') || 'Unknown User'
        supplierName = localStorage.getItem('supplierName') || 'Unknown User'
      } else {
        // Use the actual data from suppliers table
        supplierId = supplierData.username
        supplierName = supplierData.name || supplierData.username
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          supplier_id: supplierId,
          supplier_name: supplierName,
          status: 'pending', // Changed from 'approved' to 'pending'
          images: productData.images || []
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating product:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createProduct:', error)
      return null
    }
  }

  // Approve a product (admin only)
  static async approveProduct(productId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) {
        console.error('Error approving product:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in approveProduct:', error)
      return false
    }
  }

  // Reject a product (admin only)
  static async rejectProduct(productId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) {
        console.error('Error rejecting product:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in rejectProduct:', error)
      return false
    }
  }

  // Update a product
  static async updateProduct(productId: string, updateData: UpdateProductData): Promise<Product | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .eq('supplier_id', user.id) // Ensure user owns the product
        .select()
        .single()

      if (error) {
        console.error('Error updating product:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateProduct:', error)
      return null
    }
  }

  // Delete a product
  static async deleteProduct(productId: string): Promise<boolean> {
    try {
      const supplierName = localStorage.getItem('supplierName') || 'Unknown Supplier'
      const supplierId = supplierName // Use name as ID for simplicity

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('supplier_id', supplierId) // Ensure supplier owns the product

      if (error) {
        console.error('Error deleting product:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteProduct:', error)
      return false
    }
  }

  // Get a single product by ID
  static async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getProductById:', error)
      return null
    }
  }

  // Upload image to Supabase Storage
  static async uploadImage(file: File): Promise<string | null> {
    try {
      const supplierName = localStorage.getItem('supplierName') || 'unknown'
      const fileExt = file.name.split('.').pop()
      const fileName = `${supplierName}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (error) {
        console.error('Error uploading image:', error)
        return null
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error in uploadImage:', error)
      return null
    }
  }
} 