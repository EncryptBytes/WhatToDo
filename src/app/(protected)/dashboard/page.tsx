"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function Dashboard() {
  const [stats, setStats] = useState<any>({
    total: 0,
    totalValue: 0,
    totalReceived: 0,
    totalPending: 0,
    overdue: 0,
    overdueAmount: 0,
  })
  const [statusData, setStatusData] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState("all")
  const [overdueProjects, setOverdueProjects] = useState<any[]>([])

  useEffect(() => {
    fetchClients()
    fetchStats(filter, selectedClient)
    fetchMonthlyRevenue()
    fetchStatusBreakdown()
    fetchOverdueProjects()
  }, [filter, selectedClient])  
  
  const fetchOverdueProjects = async () => {
    const todayStr = new Date().toISOString().split("T")[0]

    const { data: projects } = await supabase
      .from("projects")
      .select(`
        id,
        title,
        due_date,
        amount,
        advance_amount,
        clients(name)
      `)
      .lt("due_date", todayStr)

    if (!projects) return

    const filtered = projects.filter((p: any) => {
      const balance = (p.amount || 0) - (p.advance_amount || 0)
      return balance > 0
    })

    setOverdueProjects(filtered)
  }

  const fetchStatusBreakdown = async () => {
    const { data: projects } = await supabase
      .from("projects")
      .select(`
        project_status(name)
      `)

    if (!projects) return

    const grouped: any = {}

    projects.forEach((p: any) => {
      const status = p.project_status?.name || "Unknown"

      if (!grouped[status]) {
        grouped[status] = 0
      }

      grouped[status]++
    })

    const formatted = Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key],
    }))

    setStatusData(formatted)
  }

  const fetchClients = async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name")

      if (data) setClients(data)
    }
    const fetchStats = async (selectedFilter = "all" , clientFilter = "all") => {
      let query = supabase
        .from("projects")
        .select(`
          id,
          amount,
          advance_amount,
          due_date,
          start_date,
          client_id
        `)
    
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]

      if (selectedFilter === "today") {
        query = query.eq("start_date", todayStr)
      }
      if (clientFilter !== "all") {
        query = query.eq("client_id", clientFilter)
      }

      if (selectedFilter === "month") {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0]
        query = query.gte("start_date", firstDay)
      }

      if (selectedFilter === "year") {
        const firstDayYear = new Date(today.getFullYear(), 0, 1)
          .toISOString()
          .split("T")[0]
        query = query.gte("start_date", firstDayYear)
      }

      const { data: projects } = await query

      if (!projects) return

      let totalProjects = projects.length
      let totalValue = 0
      let totalReceived = 0
      let totalPending = 0
      let overdueCount = 0
      let overdueAmount = 0

      projects.forEach((p: any) => {
        const total = p.amount || 0
        const received = p.advance_amount || 0
        const balance = total - received

        totalValue += total
        totalReceived += received
        totalPending += balance

        if (p.due_date && p.due_date < todayStr && balance > 0) {
          overdueCount++
          overdueAmount += balance
        }
      })

      setStats({
        total: totalProjects,
        totalValue,
        totalReceived,
        totalPending,
        overdue: overdueCount,
        overdueAmount,
      })
    }

    const [monthlyData, setMonthlyData] = useState<any[]>([])

    const fetchMonthlyRevenue = async () => {
      const { data: projects } = await supabase
        .from("projects")
        .select("advance_amount, start_date")

      if (!projects) return

      const grouped: any = {}

      projects.forEach((p: any) => {
        if (!p.start_date) return

        const date = new Date(p.start_date)
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`

        if (!grouped[monthKey]) {
          grouped[monthKey] = 0
        }

        grouped[monthKey] += p.advance_amount || 0
      })

      const formatted = Object.keys(grouped).map(key => ({
        month: key,
        revenue: grouped[key]
      }))

      setMonthlyData(formatted)
    }  

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        <div className="mb-4">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 mb-6">
          <button onClick={() => setFilter("all")}
            className="px-3 py-2 bg-gray-200 rounded">
            All
          </button>

          <button onClick={() => setFilter("today")}
            className="px-3 py-2 bg-gray-200 rounded">
            Today
          </button>

          <button onClick={() => setFilter("month")}
            className="px-3 py-2 bg-gray-200 rounded">
            This Month
          </button>

          <button onClick={() => setFilter("year")}
            className="px-3 py-2 bg-gray-200 rounded">
            This Year
          </button>
        </div>
        <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
          <Card title="Total Projects" value={stats.total} />
          <Card title="Total Value" value={`₹ ${stats.totalValue}`} />
          <Card title="Total Received" value={`₹ ${stats.totalReceived}`} />
          <Card title="Total Pending" value={`₹ ${stats.totalPending}`} />
          <Card title="Overdue Projects" value={stats.overdue} />
          <Card title="Overdue Amount" value={`₹ ${stats.overdueAmount}`} />
        </div>
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">
            Project Status Distribution
          </h2>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Monthly Revenue</h2>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">
            Overdue Projects
          </h2>

          {overdueProjects.length === 0 ? (
            <p>No overdue projects 🎉</p>
          ) : (
            <table className="min-w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <thead>
                <tr className="hover:bg-gray-50 transition">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Amount</th>
                </tr>
              </thead>
              <tbody>
                {overdueProjects.map((p) => {
                  const balance =
                    (p.amount || 0) - (p.advance_amount || 0)

                  return (
                    <tr key={p.id}>
                      <td className="px-6 py-4 text-sm text-gray-700">{p.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {p.clients?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {p.due_date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        ₹ {balance}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
    </div>
  )
}

function Card({ title, value }: any) {
  return (
    <div className="border p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-3xl mt-2">{value}</p>
    </div>
  )
}

