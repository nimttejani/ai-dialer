"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Table } from "@/components/ui/table";
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
import { Lead } from "@/lib/supabase";
import { leadsService } from "@/lib/services/leads";

// Import our new components and hooks
import { CSVPreviewDialog } from "./csv-preview-dialog";
import { LeadFormDialog } from "./lead-form-dialog";
import { LeadTableHeader } from "./table-header";
import { LeadTableBody } from "./table-body";
import { useLeadSort } from "./hooks/use-lead-sort";
import { useLeadFilter } from "./hooks/use-lead-filter";
import { useCSVImport } from "./hooks/use-csv-import";
import { LeadTableProps, EditingCell } from "./types";

export function LeadTable({ initialLeads }: LeadTableProps) {
  const [rawLeads, setRawLeads] = useState<Lead[]>(initialLeads);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const { toast } = useToast();

  // Initialize our custom hooks
  const { sortState, handleSort, getSortedLeads } = useLeadSort();
  const { filterConfig, filteredLeads, addFilter, removeFilter } = useLeadFilter(rawLeads);
  const {
    csvPreviewData,
    showCSVPreview,
    fileInputRef,
    handleFileUpload,
    handleCSVImport,
    setShowCSVPreview,
  } = useCSVImport(() => fetchLeads(false));

  // Fetch leads on component mount
  useEffect(() => {
    fetchLeads(false);
  }, []);

  const fetchLeads = async (showToast = false) => {
    const { data, error } = await leadsService.getLeads();
    if (error) {
      console.error("Error fetching leads:", error);
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to fetch leads. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }
    if (data) {
      setRawLeads(data);
      if (showToast) {
        toast({
          title: "Success",
          description: "Leads refreshed successfully",
          variant: "success",
        });
      }
    }
  };

  const handleManualRefresh = () => {
    fetchLeads(true);
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
        variant: "success",
      });
    }

    setIsDeleteDialogOpen(false);
    setSelectedLeads([]);
    fetchLeads(false);
  };

  const handleAddLead = async (data: Partial<Lead>) => {
    const newLead = {
      ...data,
      status: "pending" as const,
      call_attempts: 0,
      last_called_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdLead, error } = await leadsService.createLead(newLead);
    if (error || !createdLead) {
      console.error("Error creating lead:", error);
      toast({
        title: "Error",
        description: "Failed to create lead. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Lead created successfully.",
        variant: "success",
      });
      setIsAddingLead(false);
      fetchLeads(false);
    }
  };

  const toggleLead = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id)
        ? prev.filter((leadId) => leadId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedLeads(checked ? filteredLeads.map((lead) => lead.id) : []);
  };

  const moveToNextCell = (currentId: string, currentField: keyof Lead, reverse: boolean = false) => {
    const editableFields = Object.keys(FIELD_MAPPINGS).filter(
      (field) => !["call_attempts", "last_called_at", "created_at", "updated_at"].includes(field)
    ) as (keyof Lead)[];

    const currentFieldIndex = editableFields.indexOf(currentField);
    const currentLeadIndex = filteredLeads.findIndex((lead) => lead.id === currentId);

    if (currentFieldIndex === -1 || currentLeadIndex === -1) return;

    if (reverse) {
      if (currentFieldIndex > 0) {
        setEditingCell({
          id: currentId,
          field: editableFields[currentFieldIndex - 1]
        });
      } else if (currentLeadIndex > 0) {
        setEditingCell({
          id: filteredLeads[currentLeadIndex - 1].id,
          field: editableFields[editableFields.length - 1]
        });
      }
    } else {
      if (currentFieldIndex < editableFields.length - 1) {
        setEditingCell({
          id: currentId,
          field: editableFields[currentFieldIndex + 1]
        });
      } else if (currentLeadIndex < filteredLeads.length - 1) {
        setEditingCell({
          id: filteredLeads[currentLeadIndex + 1].id,
          field: editableFields[0]
        });
      }
    }
  };

  const handleKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: string,
    field: keyof Lead,
    value: string
  ) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      try {
        const response = await handleUpdateLead(id, { [field]: value });
        if (!response) {
          throw new Error("Failed to update lead");
        }
        if (e.key === 'Tab') {
          moveToNextCell(id, field, e.shiftKey);
        } else {
          setEditingCell(null);
        }
      } catch (error) {
        toast({
          title: "Error updating lead",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
        fetchLeads(false);
      }
    }
  };

  // Apply sorting to filtered leads
  const sortedLeads = getSortedLeads(filteredLeads);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-x-2 flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleManualRefresh}
            title="Refresh leads"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsAddingLead(true)}>
            Add Lead
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
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
          <LeadTableHeader
            onSelectAll={handleSelectAll}
            allSelected={
              sortedLeads.length > 0 &&
              sortedLeads.every((lead) => selectedLeads.includes(lead.id))
            }
            sortState={sortState}
            onSort={handleSort}
            hasLeads={sortedLeads.length > 0}
          />
          <LeadTableBody
            leads={sortedLeads}
            selectedLeads={selectedLeads}
            editingCell={editingCell}
            onToggleLead={toggleLead}
            onEdit={async (id, field, value) => {
              const success = await handleUpdateLead(id, { [field]: value });
              if (success) {
                fetchLeads(false);
                setEditingCell(null);
              }
            }}
            onStartEdit={(id, field) => setEditingCell({ id, field })}
            onKeyDown={handleKeyDown}
          />
        </Table>
      </div>

      <LeadFormDialog
        open={isAddingLead}
        onOpenChange={setIsAddingLead}
        onSubmit={handleAddLead}
      />

      <CSVPreviewDialog
        previewData={csvPreviewData}
        onConfirm={handleCSVImport}
        onCancel={() => setShowCSVPreview(false)}
        open={showCSVPreview}
      />
    </div>
  );
}
