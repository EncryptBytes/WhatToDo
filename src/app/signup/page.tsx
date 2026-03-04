"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-64"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-64"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="bg-black text-white px-4 py-2 w-full"
        >
          Sign Up
        </button>

        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  )
}
