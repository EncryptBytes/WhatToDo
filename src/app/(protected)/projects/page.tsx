"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [projectTypes, setProjectTypes] = useState<any[]>([])
  const [projectStatus, setProjectStatus] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [editingProject, setEditingProject] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [clientId, setClientId] = useState("")
  const [typeId, setTypeId] = useState("")
  const [statusId, setStatusId] = useState("")
  const [amount, setAmount] = useState("")
  const [advanceAmount, setAdvanceAmount] = useState("")
  const [startDate, setStartDate] = useState("")
  const [dueDate, setDueDate] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const handleEdit = (project: any) => {
    setEditingProject(project)

    setTitle(project.title)
    setClientId(project.client_id)
    setTypeId(project.project_type_id)
    setStatusId(project.status_id)
    setAmount(project.amount)
    setAdvanceAmount(project.advance_amount)
    setStartDate(project.start_date)
    setDueDate(project.due_date)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: projectsData } = await supabase
      .from("projects")
      .select(`
        *,
        clients(name),
        project_status(name),
        payment_status(name)
      `)
      .order("created_at", { ascending: false })

    const { data: clientsData } = await supabase.from("clients").select("*")
    const { data: typeData } = await supabase.from("project_types").select("*")
    const { data: statusData } = await supabase.from("project_status").select("*")

    if (projectsData) setProjects(projectsData)
    if (clientsData) setClients(clientsData)
    if (typeData) setProjectTypes(typeData)
    if (statusData) setProjectStatus(statusData)
  }

  const handleCreateProject = async () => {
    if (!title || !clientId || !amount) {
      alert("Title, Client & Amount required")
      return
    }

    setLoading(true)

    const total = Number(amount)
    const received = Number(advanceAmount || 0)

    let paymentStatusName = "Advance"
    if (received === 0) paymentStatusName = "Advance"
    else if (received < total) paymentStatusName = "Partial"
    else paymentStatusName = "Completed"

    const { data: paymentStatusData } = await supabase
      .from("payment_status")
      .select("id")
      .eq("name", paymentStatusName)
      .single()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: orgData } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", user?.id)
      .single()

    const { error } = await supabase.from("projects").insert({
      organization_id: orgData?.organization_id,
      title,
      client_id: clientId,
      project_type_id: typeId,
      status_id: statusId,
      amount: total,
      advance_amount: received,
      payment_status_id: paymentStatusData?.id,
      start_date: startDate,
      due_date: dueDate,
      assigned_user_id: user?.id,
    })

    if (error) {
      alert(error.message)
    } else {
      resetForm()
      fetchData()
    }

    setLoading(false)
  }
  const handleUpdateProject = async () => {
    if (!editingProject) return

    const total = Number(amount)
    const received = Number(advanceAmount || 0)

    let paymentStatusName = "Partial"

    if (received === 0) paymentStatusName = "Partial"
    else if (received >= total) paymentStatusName = "Completed"

    const { data: paymentStatusData } = await supabase
      .from("payment_status")
      .select("id")
      .eq("name", paymentStatusName)
      .single()

    const { error } = await supabase
      .from("projects")
      .update({
        title,
        client_id: clientId,
        project_type_id: typeId,
        status_id: statusId,
        amount: total,
        advance_amount: received,
        payment_status_id: paymentStatusData?.id,
        start_date: startDate,
        due_date: dueDate,
      })
      .eq("id", editingProject.id)

    if (error) {
      alert(error.message)
    } else {
      setEditingProject(null)
      resetForm()
      fetchData()
    }
  }

  const resetForm = () => {
    setTitle("")
    setClientId("")
    setTypeId("")
    setStatusId("")
    setAmount("")
    setAdvanceAmount("")
    setStartDate("")
    setDueDate("")
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8 tracking-tight">Projects</h1>

      <div className="space-y-3 mb-8">
        <input className="border p-2 w-64" placeholder="Title"
          value={title} onChange={(e) => setTitle(e.target.value)} />

        <select className="border p-2 w-64"
          onChange={(e) => setClientId(e.target.value)}>
          <option value="">Select Client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select className="border p-2 w-64"
          onChange={(e) => setTypeId(e.target.value)}>
          <option value="">Project Type</option>
          {projectTypes.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select className="border p-2 w-64"
          onChange={(e) => setStatusId(e.target.value)}>
          <option value="">Project Status</option>
          {projectStatus.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <input type="number" className="border p-2 w-64"
          placeholder="Total Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)} />

        <input type="number" className="border p-2 w-64"
          placeholder="Amount Received"
          value={advanceAmount}
          onChange={(e) => setAdvanceAmount(e.target.value)} />

        <input type="date" className="border p-2 w-64"
          onChange={(e) => setStartDate(e.target.value)} />

        <input type="date" className="border p-2 w-64"
          onChange={(e) => setDueDate(e.target.value)} />

        <button
          onClick={editingProject ? handleUpdateProject : handleCreateProject}
          className="bg-black text-white px-4 py-2"
        >
          {editingProject ? "Update Project" : "Create Project"}
        </button>
      </div>
      
      <h2 className="text-xl font-semibold mb-3">Project List</h2>
      <div className="relative w-full md:w-96 mb-6">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
        />
        <span className="absolute left-4 top-3.5 text-gray-400">
          🔍
        </span>
      </div>
      <table className="min-w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <thead>
          <tr className="hover:bg-gray-50 transition">
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects
            .filter((p) => {
              const term = searchTerm.toLowerCase()

              return (
                p.title?.toLowerCase().includes(term) ||
                p.clients?.name?.toLowerCase().includes(term)
              )
            })
            .map((p) => {
            const balance = p.amount - (p.advance_amount || 0)

            return (
              <tr key={p.id}>
                <td className="px-6 py-4 text-sm text-gray-700">{p.title}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{p.clients?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{p.amount}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{p.advance_amount}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{balance}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{p.project_status?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{p.payment_status?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <button
                    onClick={() => handleEdit(p)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}