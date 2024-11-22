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
import { PlusCircle, Upload, ArrowUpDown } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Lead } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { type SortDirection } from "@/lib/types";

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

// Add these new interfaces and type
interface CSVPreviewData {
  company_name: string;
  phone: string;
  email: string;
}

interface CSVDialogProps {
  previewData: CSVPreviewData[];
  onConfirm: (data: CSVPreviewData[]) => void;
  onCancel: () => void;
  open: boolean;
}

// Add this new component for the CSV preview dialog
function CSVPreviewDialog({
  previewData,
  onConfirm,
  onCancel,
  open,
}: CSVDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm CSV Import</AlertDialogTitle>
          <AlertDialogDescription>
            Please review the data before importing. The following{" "}
            {previewData.length} leads will be added:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.company_name}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>{row.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(previewData)}>
            Import
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type SortConfig = {
  column: keyof Lead | null;
  direction: SortDirection;
};

// Add this new function near the top of the component
const getStoredSortConfig = (): SortConfig => {
  if (typeof window === "undefined") return { column: null, direction: "none" };

  const stored = localStorage.getItem("leadsTableSort");
  return stored ? JSON.parse(stored) : { column: null, direction: "none" };
};

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
  const [csvPreviewData, setCSVPreviewData] = useState<CSVPreviewData[]>([]);
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    getStoredSortConfig()
  );

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

    // Apply stored sort configuration to the fetched data
    let sortedData = [...data];
    if (sortConfig.column && sortConfig.direction !== "none") {
      sortedData.sort((a, b) => {
        const aValue = a[sortConfig.column!];
        const bValue = b[sortConfig.column!];

        if (aValue === null) return sortConfig.direction === "asc" ? 1 : -1;
        if (bValue === null) return sortConfig.direction === "asc" ? -1 : 1;

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortConfig.direction === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      });
    }

    setLeads(sortedData);
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
        try {
          const content = e.target?.result as string;
          const rows = content
            .split(/\r?\n/)
            .filter((row) => row.trim().length > 0);

          if (rows.length < 2) {
            throw new Error(
              "CSV file must contain at least a header row and one data row"
            );
          }

          // Parse headers and find relevant columns
          const headers = rows[0].split(",").map(
            (h) =>
              h
                .trim()
                .toLowerCase()
                .replace(/['"]/g, "") // Remove quotes
                .replace(/\s+/g, "_") // Replace spaces with underscore
          );

          // Find the indices of required columns
          const companyNameIndex = headers.findIndex(
            (h) =>
              h.includes("company") ||
              h.includes("name") ||
              h.includes("business")
          );
          const phoneIndex = headers.findIndex(
            (h) =>
              h.includes("phone") || h.includes("tel") || h.includes("contact")
          );
          const emailIndex = headers.findIndex(
            (h) =>
              h.includes("email") || h.includes("mail") || h.includes("e-mail")
          );

          if (
            companyNameIndex === -1 ||
            phoneIndex === -1 ||
            emailIndex === -1
          ) {
            throw new Error(
              "Could not find required columns (company name, phone, email)"
            );
          }

          // Parse data rows
          const parsedData: CSVPreviewData[] = rows
            .slice(1)
            .map((row) => {
              // Handle both quoted and unquoted values
              const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
              const cleanValues = values.map((val) =>
                val.replace(/^"|"$/g, "").trim()
              );

              return {
                company_name: cleanValues[companyNameIndex] || "",
                phone: cleanValues[phoneIndex] || "",
                email: cleanValues[emailIndex] || "",
              };
            })
            .filter((row) => row.company_name && row.phone && row.email);

          if (parsedData.length === 0) {
            throw new Error("No valid data rows found in CSV");
          }

          setCSVPreviewData(parsedData);
          setShowCSVPreview(true);
        } catch (error) {
          toast({
            title: "Error parsing CSV",
            description:
              error instanceof Error ? error.message : "Invalid CSV format",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
    // Reset the file input
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleCSVImport = async (data: CSVPreviewData[]) => {
    const newLeads = data.map((row) => ({
      ...row,
      status: "pending" as const,
      call_attempts: 0,
      last_called_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("leads").insert(newLeads);

    if (error) {
      toast({
        title: "Error importing leads",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    await fetchLeads();
    setShowCSVPreview(false);
    setCSVPreviewData([]);
    toast({
      title: "CSV imported",
      description: `${data.length} lead(s) have been imported successfully.`,
    });
  };

  const handleSort = (column: keyof Lead) => {
    let direction: SortDirection = "asc";

    if (sortConfig.column === column) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") direction = "none";
      else direction = "asc";
    }

    const newSortConfig = { column, direction };
    setSortConfig(newSortConfig);
    localStorage.setItem("leadsTableSort", JSON.stringify(newSortConfig));

    if (direction === "none") {
      fetchLeads();
      return;
    }

    const sortedLeads = [...leads].sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];

      if (aValue === null) return direction === "asc" ? 1 : -1;
      if (bValue === null) return direction === "asc" ? -1 : 1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return direction === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    setLeads(sortedLeads);
  };

  const renderCell = (lead: Lead, field: keyof Lead) => {
    const isEditing =
      editingCell?.id === lead.id && editingCell?.field === field;

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
            checked={leads.length > 0 && selectedLeads.length === leads.length}
            onCheckedChange={toggleAll}
            disabled={leads.length === 0}
          />
        </TableHead>
        {Object.entries(FIELD_MAPPINGS).map(([key]) => (
          <TableHead
            key={key}
            className={`${
              key === "call_attempts" ? "text-center" : ""
            } cursor-pointer select-none`}
            onClick={() => handleSort(key as keyof Lead)}
          >
            <div className="flex items-center justify-between">
              {FIELD_MAPPINGS[key as keyof typeof FIELD_MAPPINGS]}
              <ArrowUpDown
                className={`ml-1 h-4 w-4 ${
                  sortConfig.column === key
                    ? sortConfig.direction === "asc"
                      ? "text-primary"
                      : sortConfig.direction === "desc"
                      ? "text-primary rotate-180"
                      : "text-muted-foreground"
                    : "text-muted-foreground"
                }`}
              />
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  const renderTableBody = () => (
    <TableBody>
      {leads.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={7}
            className="h-24 text-center text-muted-foreground"
          >
            No leads available. Add a new lead or import from CSV.
          </TableCell>
        </TableRow>
      ) : (
        <>
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
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingLead(false)}
                  >
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
        </>
      )}
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
      {showCSVPreview && (
        <CSVPreviewDialog
          previewData={csvPreviewData}
          onConfirm={handleCSVImport}
          onCancel={() => {
            setShowCSVPreview(false);
            setCSVPreviewData([]);
          }}
          open={showCSVPreview}
        />
      )}
    </div>
  );
}
