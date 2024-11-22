"use client";

import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Upload } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Lead } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
  scheduled: "bg-green-100 text-green-800 hover:bg-green-100/80",
  no_answer: "bg-gray-100 text-gray-800 hover:bg-gray-100/80",
  not_interested: "bg-red-100 text-red-800 hover:bg-red-100/80",
};

// First, let's define a mapping of display fields to database fields
const FIELD_MAPPINGS = {
  company_name: "Company Name",
  phone: "Phone",
  email: "Email",
  status: "Status",
  call_attempts: "Call Attempts",
  last_called_at: "Last Called At",
} as const;

export function LeadTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: keyof Lead;
  } | null>(null);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({});
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching leads",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setLeads(data);
  };

  const toggleAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((lead) => lead.id.toString()));
    }
  };

  const toggleLead = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter((leadId) => leadId !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return formatDateTime(date);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("leads")
      .delete()
      .in("id", selectedLeads);

    if (error) {
      toast({
        title: "Error deleting leads",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    await fetchLeads();
    setSelectedLeads([]);
    setIsDeleteDialogOpen(false);
    toast({
      title: "Leads deleted",
      description: `${selectedLeads.length} lead(s) have been deleted.`,
    });
  };

  const handleCellClick = (id: string, field: keyof Lead) => {
    if (
      !["call_attempts", "last_called_at", "created_at", "updated_at"].includes(
        field
      )
    ) {
      setEditingCell({ id, field });
    }
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
    field: keyof Lead
  ) => {
    const value = e.target.value;
    const updatedLeads = leads.map((lead) =>
      lead.id === id ? { ...lead, [field]: value } : lead
    );
    setLeads(updatedLeads);
  };

  const handleInputBlur = async (
    id: string,
    field: keyof Lead,
    value: string
  ) => {
    const { error } = await supabase
      .from("leads")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error updating lead",
        description: error.message,
        variant: "destructive",
      });
      await fetchLeads();
      return;
    }

    setEditingCell(null);
  };

  const handleStatusChange = async (value: Lead["status"], id: string) => {
    const { error } = await supabase
      .from("leads")
      .update({
        status: value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const updatedLeads = leads.map((lead) =>
      lead.id === id ? { ...lead, status: value } : lead
    );
    setLeads(updatedLeads);
    setEditingCell(null);
  };

  const handleAddLead = async () => {
    if (newLead.company_name && newLead.phone && newLead.email) {
      const newLeadData = {
        company_name: newLead.company_name,
        phone: newLead.phone,
        email: newLead.email,
        status: "pending" as const,
        call_attempts: 0,
        last_called_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("leads").insert([newLeadData]);

      if (error) {
        toast({
          title: "Error adding lead",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      await fetchLeads();
      setNewLead({});
      setIsAddingLead(false);
      toast({
        title: "Lead added",
        description: "New lead has been added successfully.",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const rows = content.split("\n");
        const headers = rows[0].split(",");
        const newLeads: Lead[] = rows.slice(1).map((row, index) => {
          const values = row.split(",");
          return {
            id: leads.length + index + 1,
            companyName: values[headers.indexOf("companyName")] || "",
            phone: values[headers.indexOf("phone")] || "",
            email: values[headers.indexOf("email")] || "",
            status:
              (values[headers.indexOf("status")] as Lead["status"]) ||
              "pending",
            callAttempts:
              parseInt(values[headers.indexOf("callAttempts")]) || 0,
            lastCalledAt: values[headers.indexOf("lastCalledAt")] || null,
          };
        });
        setLeads([...leads, ...newLeads]);
        toast({
          title: "CSV imported",
          description: `${newLeads.length} lead(s) have been imported.`,
        });
      };
      reader.readAsText(file);
    }
  };

  const renderCell = (lead: Lead, field: keyof Lead) => {
    const isEditing =
      editingCell?.id === lead.id && editingCell?.field === field;
    const isEditable = ![
      "id",
      "call_attempts",
      "last_called_at",
      "created_at",
      "updated_at",
    ].includes(field);

    if (isEditing) {
      if (field === "status") {
        return (
          <Select
            value={lead[field]}
            onValueChange={(value) =>
              handleStatusChange(value as Lead["status"], lead.id)
            }
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
        );
      } else {
        return (
          <Input
            ref={inputRef}
            value={lead[field] as string}
            onChange={(e) => handleInputChange(e, lead.id, field)}
            onBlur={(e) => handleInputBlur(lead.id, field, e.target.value)}
            className="w-full h-full p-0 border-none focus:ring-0"
          />
        );
      }
    }

    if (field === "status") {
      return (
        <Badge className={statusStyles[lead.status]}>
          {lead.status.replace("_", " ")}
        </Badge>
      );
    } else if (field === "last_called_at") {
      return formatDate(lead[field]);
    } else {
      return lead[field];
    }
  };

  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[50px]">
          <Checkbox
            checked={selectedLeads.length === leads.length}
            onCheckedChange={toggleAll}
          />
        </TableHead>
        {Object.entries(FIELD_MAPPINGS).map(([key]) => (
          <TableHead
            key={key}
            className={key === "call_attempts" ? "text-center" : ""}
          >
            {FIELD_MAPPINGS[key as keyof typeof FIELD_MAPPINGS]}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  const renderTableBody = () => (
    <TableBody>
      {isAddingLead && (
        <TableRow>
          <TableCell colSpan={7}>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Company Name"
                value={newLead.company_name || ""}
                onChange={(e) =>
                  setNewLead({ ...newLead, company_name: e.target.value })
                }
              />
              <Input
                placeholder="Phone"
                value={newLead.phone || ""}
                onChange={(e) =>
                  setNewLead({ ...newLead, phone: e.target.value })
                }
              />
              <Input
                placeholder="Email"
                value={newLead.email || ""}
                onChange={(e) =>
                  setNewLead({ ...newLead, email: e.target.value })
                }
              />
              <Button onClick={handleAddLead}>Add</Button>
              <Button variant="outline" onClick={() => setIsAddingLead(false)}>
                Cancel
              </Button>
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
          {Object.keys(FIELD_MAPPINGS).map((field) => (
            <TableCell
              key={field}
              onClick={() => handleCellClick(lead.id, field as keyof Lead)}
              className={`${
                !["call_attempts", "last_called_at"].includes(field)
                  ? "cursor-text"
                  : "cursor-not-allowed"
              } p-0`}
            >
              <div className="px-4 py-2 min-h-[2.5rem] flex items-center">
                {renderCell(lead, field as keyof Lead)}
              </div>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );

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
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
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
                  This action cannot be undone. This will permanently delete{" "}
                  {selectedLeads.length} selected lead(s).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <div className="border rounded-md">
        <Table>
          {renderTableHeader()}
          {renderTableBody()}
        </Table>
      </div>
    </div>
  );
}
