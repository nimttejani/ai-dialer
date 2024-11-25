import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import { Lead } from "@/lib/supabase";
import { STATUS_STYLES, NON_EDITABLE_FIELDS } from "./constants";
import { EditingCell } from "./types";

interface CellRendererProps {
  lead: Lead;
  field: keyof Lead;
  editingCell: EditingCell | null;
  onEdit: (id: string, field: keyof Lead, value: string) => void;
  onStartEdit: (id: string, field: keyof Lead) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, id: string, field: keyof Lead, value: string) => void;
}

export function CellRenderer({
  lead,
  field,
  editingCell,
  onEdit,
  onStartEdit,
  onKeyDown,
}: CellRendererProps) {
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell?.id === lead.id && editingCell?.field === field) {
      setEditValue(String(lead[field] || ""));
      inputRef.current?.focus();
    }
  }, [editingCell, lead, field]);

  if (editingCell?.id === lead.id && editingCell?.field === field && !NON_EDITABLE_FIELDS.includes(field)) {
    if (field === "status") {
      return (
        <Select
          value={editValue}
          onValueChange={(value) => {
            onEdit(lead.id, field, value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(STATUS_STYLES).map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => onKeyDown(e, lead.id, field, editValue)}
        onBlur={() => onEdit(lead.id, field, editValue)}
        className="h-8"
      />
    );
  }

  const value = lead[field];

  if (field === "status" && typeof value === "string") {
    return (
      <Badge className={STATUS_STYLES[value as keyof typeof STATUS_STYLES]}>
        {value.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  }

  if (
    field === "last_called_at" ||
    field === "created_at" ||
    field === "updated_at"
  ) {
    return value ? formatDateTime(value as string) : "Never";
  }

  return (
    <span
      className={NON_EDITABLE_FIELDS.includes(field) ? "" : "cursor-text"}
      onClick={() => !NON_EDITABLE_FIELDS.includes(field) && onStartEdit(lead.id, field)}
    >
      {value ?? ""}
    </span>
  );
}
