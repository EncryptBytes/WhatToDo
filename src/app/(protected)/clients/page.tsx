"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) setClients(data)
  }

  const generateClientCode = () => {
    const count = clients.length + 1
    return `CL-${String(count).padStart(3, "0")}`
  }

  const handleAddClient = async () => {
    if (!name) return alert("Client name required")

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: orgData } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", user?.id)
      .single()

    const { error } = await supabase.from("clients").insert({
      organization_id: orgData?.organization_id,
      client_code: generateClientCode(),
      name,
      email,
      phone,
    })

    if (error) {
      alert(error.message)
    } else {
      setName("")
      setEmail("")
      setPhone("")
      fetchClients()
    }

    setLoading(false)
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8 tracking-tight">Clients</h1>

      <div className="space-y-3 mb-8">
        <input
          className="border p-2 w-64"
          placeholder="Client Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border p-2 w-64"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-2 w-64"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button
          onClick={handleAddClient}
          className="bg-black text-white px-4 py-2"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Client"}
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Client List</h2>
        <table className="min-w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <thead>
            <tr className="hover:bg-gray-50 transition">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="px-6 py-4 text-sm text-gray-700">{client.client_code}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{client.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{client.email}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{client.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}