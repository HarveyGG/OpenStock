'use server';

import {auth} from "@/lib/better-auth/auth";
import {welcomeEmailQueue} from "@/lib/queue/client";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if(response) {
            await welcomeEmailQueue.add('send-welcome-email', {
                email,
                name: fullName,
                country,
                investmentGoals,
                riskTolerance,
                preferredIndustry
            }).catch((err) => {
                console.error('Failed to queue welcome email:', err)
            })
        }

        return { success: true, data: response }
    } catch (e) {
        console.error('Sign up failed', e)
        const errorMessage = e instanceof Error ? e.message : 'Sign up failed'
        return { success: false, error: errorMessage }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e) {
        console.error('Sign in failed', e)
        const errorMessage = e instanceof Error ? e.message : 'Sign in failed'
        return { success: false, error: errorMessage }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}

