"use client"

import { useState, useRef, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusCircle, Upload } from 'lucide-react'

interface Lead {
  id: number
  companyName: string
  phone: string
  email: string
  status: "pending" | "scheduled" | "no_answer" | "not_interested"
  callAttempts: number
  lastCalledAt: string | null
}

const initialLeads: Lead[] = [
  {
    id: 1,
    companyName: "ABC HVAC",
    phone: "123-456-7890",
    email: "info@abchvac.com",
    status: "pending",
    callAttempts: 0,
    lastCalledAt: null,
  },
  {
    id: 2,
    companyName: "Cool Air Services",
    phone: "987-654-3210",
    email: "contact@coolair.com",
    status: "scheduled",
    callAttempts: 1,
    lastCalledAt: "2023-06-15T11:30:00",
  },
  {
    id: 3,
    companyName: "Comfort Zone HVAC",
    phone: "555-123-4567",
    email: "sales@comfortzone.com",
    status: "no_answer",
    callAttempts: 2,
    lastCalledAt: "2023-06-14T15:45:00",
  },
  {
    id: 4,
    companyName: "Frosty Tech",
    phone: "111-222-3333",
    email: "support@frostytech.com",
    status: "not_interested",
    callAttempts: 1,
    lastCalledAt: "2023-06-13T10:15:00",
  },
]

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
  scheduled: "bg-green-100 text-green-800 hover:bg-green-100/80",
  no_answer: "bg-gray-100 text-gray-800 hover:bg-gray-100/80",
  not_interested: "bg-red-100 text-red-800 hover:bg-red-100/80",
}

export function LeadTable() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [selectedLeads, setSelectedLeads] = useState<number[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<{ id: number; field: keyof Lead } | null>(null)
  const [isAddingLead, setIsAddingLead] = useState(false)
  const [newLead, setNewLead] = useState<Partial<Lead>>({})
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCell])

  const toggleAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(lead => lead.id))
    }
  }

  const toggleLead = (id: number) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(leadId => leadId !== id))
    } else {
      setSelectedLeads([...selectedLeads, id])
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleString()
  }

  const handleDelete = () => {
    setLeads(leads.filter(lead => !selectedLeads.includes(lead.id)))
    setSelectedLeads([])
    setIsDeleteDialogOpen(false)
    toast({
      title: "Leads deleted",
      description: `${selectedLeads.length} lead(s) have been deleted.`,
    })
  }

  const handleCellClick = (id: number, field: keyof Lead) => {
    if (field !== 'callAttempts' && field !== 'lastCalledAt') {
      setEditingCell({ id, field })
    }
  }

  const handleCellBlur = () => {
    setEditingCell(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, id: number, field: keyof Lead) => {
    const updatedLeads = leads.map(lead =>
      lead.id === id ? { ...lead, [field]: e.target.value } : lead
    )
    setLeads(updatedLeads)
  }

  const handleStatusChange = (value: Lead['status'], id: number) => {
    const updatedLeads = leads.map(lead =>
      lead.id === id ? { ...lead, status: value } : lead
    )
    setLeads(updatedLeads)
    setEditingCell(null)
  }

  const handleAddLead = () => {
    if (newLead.companyName && newLead.phone && newLead.email) {
      const newLeadWithDefaults: Lead = {
        id: leads.length + 1,
        companyName: newLead.companyName,
        phone: newLead.phone,
        email: newLead.email,
        status: "pending",
        callAttempts: 0,
        lastCalledAt: null,
        ...newLead,
      }
      setLeads([...leads, newLeadWithDefaults])
      setNewLead({})
      setIsAddingLead(false)
      toast({
        title: "Lead added",
        description: "New lead has been added successfully.",
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const rows = content.split('\n')
        const headers = rows[0].split(',')
        const newLeads: Lead[] = rows.slice(1).map((row, index) => {
          const values = row.split(',')
          return {
            id: leads.length + index + 1,
            companyName: values[headers.indexOf('companyName')] || '',
            phone: values[headers.indexOf('phone')] || '',
            email: values[headers.indexOf('email')] || '',
            status: (values[headers.indexOf('status')] as Lead['status']) || 'pending',
            callAttempts: parseInt(values[headers.indexOf('callAttempts')]) || 0,
            lastCalledAt: values[headers.indexOf('lastCalledAt')] || null,
          }
        })
        setLeads([...leads, ...newLeads])
        toast({
          title: "CSV imported",
          description: `${newLeads.length} lead(s) have been imported.`,
        })
      }
      reader.readAsText(file)
    }
  }

  const renderCell = (lead: Lead, field: keyof Lead) => {
    const isEditable = field !== 'callAttempts' && field !== 'lastCalledAt'
    const isEditing = editingCell?.id === lead.id && editingCell?.field === field

    if (isEditing) {
      if (field === 'status') {
        return (
          <Select
            value={lead[field]}
            onValueChange={(value) => handleStatusChange(value as Lead['status'], lead.id)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{lead[field]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="no_answer">No Answer</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
            </SelectContent>
          </Select>
        )
      } else {
        return (
          <Input
            ref={inputRef}
            value={lead[field] as string}
            onChange={(e) => handleInputChange(e, lead.id, field)}
            onBlur={handleCellBlur}
            className="w-full h-full p-0 border-none focus:ring-0"
          />
        )
      }
    } else {
      if (field === 'status') {
        return (
          <Badge className={statusStyles[lead.status]}>
            {lead.status.replace("_", " ")}
          </Badge>
        )
      } else if (field === 'lastCalledAt') {
        return formatDate(lead[field])
      } else {
        return lead[field]
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button onClick={() => setIsAddingLead(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileUpload}
          />
        </div>
        {selectedLeads.length > 0 && (
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Selected
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete {selectedLeads.length} selected lead(s).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedLeads.length === leads.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Call Attempts</TableHead>
              <TableHead>Last Called At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAddingLead && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Company Name"
                      value={newLead.companyName || ''}
                      onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
                    />
                    <Input
                      placeholder="Phone"
                      value={newLead.phone || ''}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    />
                    <Input
                      placeholder="Email"
                      value={newLead.email || ''}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    />
                    <Button onClick={handleAddLead}>Add</Button>
                    <Button variant="outline" onClick={() => setIsAddingLead(false)}>Cancel</Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => toggleLead(lead.id)}
                  />
                </TableCell>
                {(Object.keys(lead) as Array<keyof Lead>).map((field) => {
                  if (field !== 'id') {
                    const isEditable = field !== 'callAttempts' && field !== 'lastCalledAt'
                    return (
                      <TableCell
                        key={field}
                        onClick={() => handleCellClick(lead.id, field)}
                        className={`${isEditable ? "cursor-text" : "cursor-not-allowed"} p-0`}
                      >
                        <div className="px-4 py-2 min-h-[2.5rem] flex items-center">
                          {renderCell(lead, field)}
                        </div>
                      </TableCell>
                    )
                  }
                  return null
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

