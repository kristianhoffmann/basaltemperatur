// app/api/delete-account/route.ts
// API endpoint for iOS account deletion
// Validates the user's Bearer token, deletes all their data, and deletes their account

import { createClient as createAdminClientFn } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { USER_DATA_TABLES, idColumnFor } from '@/lib/account-deletion'

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

        // Delete owned rows in FK-safe order. The table list is shared with the
        // web deletion flow (lib/account-deletion.ts) so the two cannot drift.
        for (const table of USER_DATA_TABLES) {
            const { error } = await adminClient
                .from(table)
                .delete()
                .eq(idColumnFor(table), user.id)

            if (error) {
                console.error(`Error deleting ${table}:`, error)
            }
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
