// app/api/delete-account/route.ts
// API endpoint for iOS account deletion
// Validates the user's Bearer token, deletes all their data, and deletes their account

import { createClient as createAdminClientFn } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
    try {
        // Extract Bearer token
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
        }
        const token = authHeader.split(' ')[1]

        // Verify the user with their token using the anon client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        const { createClient } = await import('@supabase/supabase-js')

        // Verify user identity with their token
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        })
        const { data: { user }, error: userError } = await userClient.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Ungültiger Token' }, { status: 401 })
        }

        // Use admin client to delete data and user
        const adminClient = createAdminClientFn(supabaseUrl, serviceRoleKey)

        // Delete temperature entries
        const { error: tempError } = await adminClient
            .from('temperature_entries')
            .delete()
            .eq('user_id', user.id)

        if (tempError) {
            console.error('Error deleting temperature entries:', tempError)
        }

        // Delete period entries
        const { error: periodError } = await adminClient
            .from('period_entries')
            .delete()
            .eq('user_id', user.id)

        if (periodError) {
            console.error('Error deleting period entries:', periodError)
        }

        // Delete the user account
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

        if (deleteError) {
            console.error('Error deleting user:', deleteError)
            return NextResponse.json(
                { error: 'Konto konnte nicht gelöscht werden' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete account error:', error)
        return NextResponse.json(
            { error: 'Interner Serverfehler' },
            { status: 500 }
        )
    }
}
