"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { supabase } from "../../lib/supabase"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      }
    }

    checkUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }
  function SidebarLink({ href, label }: any) {
        return (
          <Link
            href={href}
            className="px-4 py-2 rounded-xl hover:bg-gray-100 transition"
          >
            {label}
          </Link>
        )
    }
    function Card({ title, value }: any) {
        return (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-3xl font-semibold text-gray-800 mt-2">
              {value}
            </p>
          </div>
        )
      }
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Sidebar */}
      <div className="w-64 bg-white/80 backdrop-blur-xl border-r shadow-sm p-6 flex flex-col">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-800 mb-10">
          EncryptBytes
        </h1>

        <nav className="flex flex-col gap-2 text-gray-600">
          <SidebarLink href="/dashboard" label="Dashboard" />
          <SidebarLink href="/clients" label="Clients" />
          <SidebarLink href="/projects" label="Projects" />
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto bg-gray-900 hover:bg-black transition text-white py-2 rounded-xl"
        >
          Logout
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </div>
    </div>
  )
}
