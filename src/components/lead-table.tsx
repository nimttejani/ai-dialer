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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Upload,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Lead } from "@/lib/supabase";
import {
  type SortDirection,
  type SortCriterion,
  type FilterCriterion,
} from "@/lib/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { leadsService } from "@/lib/services/leads";
import { OutboundCallControl } from "./outbound-call-control";

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

type SortConfig = SortCriterion[];

// Add the HeaderMenuProps interface at the top with other interfaces
interface HeaderMenuProps {
  column: string;
  label: string;
  sortCriterion?: SortCriterion;
  filterCriterion?: FilterCriterion;
  sortConfig: SortConfig;
  onSortChange: (direction: SortDirection) => void;
  onFilterChange: (value: string, type: "contains" | "equals") => void;
  onFilterRemove: () => void;
  isEnum?: boolean;
}

// Update the HeaderMenu component with proper event handling
function HeaderMenu({
  column,
  label,
  sortCriterion,
  filterCriterion,
  sortConfig,
  onSortChange,
  onFilterChange,
  onFilterRemove,
  isEnum,
}: HeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValue, setFilterValue] = useState(filterCriterion?.value || "");

  useEffect(() => {
    setFilterValue(filterCriterion?.value || "");
  }, [filterCriterion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filterValue !== filterCriterion?.value) {
        if (filterValue) {
          onFilterChange(filterValue, "contains");
        } else {
          onFilterRemove();
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filterValue, filterCriterion?.value, onFilterChange, onFilterRemove]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent">
          <div className="flex items-center">
            {sortCriterion ? (
              <div className="flex items-center -space-x-1">
                {sortCriterion.direction === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                {Array.isArray(sortConfig) && sortConfig.length > 1 && (
                  <span className="text-xs font-mono translate-y-[1px] ml-1">
                    {sortConfig.findIndex((c) => c.column === column) + 1}
                  </span>
                )}
              </div>
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </div>
          <span>{label}</span>
          {filterCriterion && (
            <Badge variant="secondary" className="ml-1">
              Filtered
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 space-y-4"
        onInteractOutside={(e) => {
          if (
            (e.target as HTMLElement).closest("input") ||
            window.getSelection()?.toString()
          ) {
            e.preventDefault();
          }
        }}
      >
        <div className="space-y-2">
          <Label>Sort</Label>
          <RadioGroup
            value={sortCriterion?.direction || "none"}
            onValueChange={(value: SortDirection) => {
              onSortChange(value);
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id={`${column}-none`} />
              <Label htmlFor={`${column}-none`}>None</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="asc" id={`${column}-asc`} />
              <Label htmlFor={`${column}-asc`}>Ascending</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="desc" id={`${column}-desc`} />
              <Label htmlFor={`${column}-desc`}>Descending</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Filter</Label>
          {isEnum ? (
            <Select
              value={filterValue}
              onValueChange={(value) => {
                setFilterValue(value);
                if (value === "__clear__") {
                  onFilterRemove();
                } else {
                  onFilterChange(value, "equals");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__clear__">Clear filter</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Filter value..."
                value={filterValue}
                onChange={(e) => {
                  setFilterValue(e.target.value);
                }}
              />
              {filterCriterion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterValue("");
                    onFilterRemove();
                  }}
                  className="w-full"
                >
                  Clear Filter
                </Button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
  const [sortConfig, setSortConfig] = useState<SortConfig>([]);
  const [filterConfig, setFilterConfig] = useState<FilterCriterion[]>([]);
  const [rawLeads, setRawLeads] = useState<Lead[]>([]);

  const fetchLeads = async () => {
    const { data, error } = await leadsService.getLeads();
    if (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to fetch leads. Please try again.",
        variant: "destructive",
      });
      return;
    }
    if (data) {
      setRawLeads(data);
    }
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    const { success, error } = await leadsService.updateLead(id, updates);
    if (!success) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead. Please try again.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleDeleteLeads = async () => {
    const results = await Promise.all(
      selectedLeads.map((id) => leadsService.deleteLead(id))
    );

    const errors = results.filter((r) => !r.success);
    if (errors.length > 0) {
      console.error("Error deleting leads:", errors);
      toast({
        title: "Error",
        description: `Failed to delete ${errors.length} leads. Please try again.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedLeads.length} leads.`,
      });
    }

    setIsDeleteDialogOpen(false);
    setSelectedLeads([]);
    fetchLeads();
  };

  const handleCreateLead = async (lead: Omit<Lead, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await leadsService.createLead(lead);
    if (error) {
      console.error("Error creating lead:", error);
      toast({
        title: "Error",
        description: "Failed to create lead. Please try again.",
        variant: "destructive",
      });
      return false;
    }
    return true;
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
    try {
      const response = await handleUpdateLead(id, { [field]: value });
      if (!response) {
        throw new Error("Failed to update lead");
      }
      setEditingCell(null);
      fetchLeads();
    } catch (error) {
      toast({
        title: "Error updating lead",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (value: Lead["status"], id: string) => {
    try {
      const response = await handleUpdateLead(id, { status: value });
      if (!response) {
        throw new Error("Failed to update status");
      }
      const updatedLeads = leads.map((lead) =>
        lead.id === id ? { ...lead, status: value } : lead
      );
      setLeads(updatedLeads);
      setEditingCell(null);
    } catch (error) {
      toast({
        title: "Error updating status",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleAddLead = async () => {
    if (!newLead.company_name || !newLead.phone || !newLead.email) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

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

    try {
      const response = await handleCreateLead(newLeadData);
      if (!response) {
        throw new Error("Failed to add lead");
      }
      setNewLead({});
      setIsAddingLead(false);
      await fetchLeads();
      toast({
        title: "Lead added",
        description: "New lead has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error adding lead",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
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

    try {
      const response = await Promise.all(
        newLeads.map((lead) => leadsService.createLead(lead))
      );

      const errors = response.filter((r) => !r.success);
      if (errors.length > 0) {
        console.error("Error importing leads:", errors);
        toast({
          title: "Error",
          description: `Failed to import ${errors.length} leads. Please try again.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "CSV imported",
          description: `${data.length} lead(s) have been imported successfully.`,
        });
      }

      await fetchLeads();
      setShowCSVPreview(false);
      setCSVPreviewData([]);
    } catch (error) {
      toast({
        title: "Error importing leads",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const getSortedLeads = (leadsToSort: Lead[]): Lead[] => {
    if (!Array.isArray(sortConfig) || sortConfig.length === 0) {
      return leadsToSort;
    }

    return [...leadsToSort].sort((a, b) => {
      for (const { column, direction } of sortConfig) {
        const aValue = a[column as keyof Lead];
        const bValue = b[column as keyof Lead];

        // Skip to next sort criterion if values are equal
        if (aValue === bValue) continue;

        // Handle null values
        if (aValue === null) return direction === "asc" ? 1 : -1;
        if (bValue === null) return direction === "asc" ? -1 : 1;

        // Compare dates
        if (
          column === "last_called_at" ||
          column === "created_at" ||
          column === "updated_at"
        ) {
          const aDate = new Date(aValue as string).getTime();
          const bDate = new Date(bValue as string).getTime();
          return direction === "asc" ? aDate - bDate : bDate - aDate;
        }

        // Compare numbers
        if (typeof aValue === "number" && typeof bValue === "number") {
          return direction === "asc" ? aValue - bValue : bValue - aValue;
        }

        // Compare strings case-insensitively
        if (typeof aValue === "string" && typeof bValue === "string") {
          return direction === "asc"
            ? aValue.localeCompare(bValue, undefined, { sensitivity: "base" })
            : bValue.localeCompare(aValue, undefined, { sensitivity: "base" });
        }

        return 0;
      }
      return 0;
    });
  };

  const getFilteredAndSortedLeads = (leadsToProcess: Lead[]): Lead[] => {
    // Create a copy of the original leads
    let processedLeads = [...leadsToProcess];

    // Apply filters if there are any
    if (filterConfig.length > 0) {
      processedLeads = processedLeads.filter((lead) => {
        return filterConfig.every((filter) => {
          const value = lead[filter.column as keyof Lead];
          if (value === null) return false;

          const stringValue = String(value).toLowerCase();
          const filterValue = filter.value.toLowerCase();

          if (filter.type === "contains") {
            return stringValue.includes(filterValue);
          } else {
            return stringValue === filterValue;
          }
        });
      });
    }

    // Then apply sorting
    return getSortedLeads(processedLeads);
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
        {Object.entries(FIELD_MAPPINGS).map(([key]) => {
          const currentConfig = Array.isArray(sortConfig) ? sortConfig : [];
          const sortCriterion = currentConfig.find((c) => c.column === key);
          const filterCriterion = filterConfig.find((c) => c.column === key);

          return (
            <TableHead
              key={key}
              className={`${
                key === "call_attempts" ? "text-center" : ""
              } cursor-pointer select-none text-muted-foreground`}
            >
              <HeaderMenu
                column={key}
                label={FIELD_MAPPINGS[key as keyof typeof FIELD_MAPPINGS]}
                sortCriterion={sortCriterion}
                filterCriterion={filterCriterion}
                sortConfig={sortConfig}
                onSortChange={(direction) => {
                  const newConfig = [...sortConfig];
                  if (direction === "none") {
                    setSortConfig(newConfig.filter((c) => c.column !== key));
                  } else {
                    const filteredConfig = newConfig.filter(
                      (c) => c.column !== key
                    );
                    filteredConfig.push({ column: key, direction });
                    setSortConfig(filteredConfig);
                  }
                }}
                onFilterChange={(value, type) => {
                  const newConfig = filterConfig.filter(
                    (c) => c.column !== key
                  );
                  if (value) {
                    newConfig.push({ column: key, value, type });
                  }
                  setFilterConfig(newConfig);
                }}
                onFilterRemove={() => {
                  setFilterConfig(filterConfig.filter((c) => c.column !== key));
                }}
                isEnum={key === "status"}
              />
            </TableHead>
          );
        })}
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
        leads.map((lead) => (
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
        ))
      )}
    </TableBody>
  );

  return (
    <div className="space-y-4">
      <OutboundCallControl />
      <div className="flex justify-between items-center">
        <div className="space-x-2 flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchLeads}
            title="Refresh leads"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
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
                <AlertDialogAction onClick={handleDeleteLeads}>
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

      <Dialog open={isAddingLead} onOpenChange={setIsAddingLead}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter the lead's information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                placeholder="Company Name"
                value={newLead.company_name || ""}
                onChange={(e) =>
                  setNewLead({ ...newLead, company_name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Input
                placeholder="Phone"
                value={newLead.phone || ""}
                onChange={(e) =>
                  setNewLead({ ...newLead, phone: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Input
                placeholder="Email"
                value={newLead.email || ""}
                onChange={(e) =>
                  setNewLead({ ...newLead, email: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingLead(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLead}>Add Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
