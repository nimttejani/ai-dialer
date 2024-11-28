import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          })),
          setAll: () => {
            // In Next.js app route handlers, we don't need to set cookies
            // They are handled by the middleware
          }
        }
      }
    )

    // Get id from params - properly awaited in Next.js 15
    const { id } = await Promise.resolve(params)
    const updates = await request.json()
    
    const { data, error } = await supabase
      .from('leads')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          })),
          setAll: () => {
            // In Next.js app route handlers, we don't need to set cookies
            // They are handled by the middleware
          }
        }
      }
    )

    // Get id from params - properly awaited in Next.js 15
    const { id } = await Promise.resolve(params)
    
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ message: 'Lead deleted successfully' })
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
