import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LeadFormState } from "./types";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LeadFormState) => void;
  initialData?: LeadFormState;
  mode?: "add" | "edit";
}

export function LeadFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData = {},
  mode = "add"
}: LeadFormDialogProps) {
  const [formData, setFormData] = useState<LeadFormState>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Lead" : "Edit Lead"}</DialogTitle>
          <DialogDescription>
            {mode === "add" 
              ? "Enter the lead's information below."
              : "Edit the lead's information below."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              id="company_name"
              placeholder="Company Name"
              value={formData.company_name || ""}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
              required
            />
            <Input
              id="contact_name"
              placeholder="Contact Name"
              value={formData.contact_name || ""}
              onChange={(e) =>
                setFormData({ ...formData, contact_name: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Input
              id="phone"
              placeholder="Phone"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Input
              id="email"
              placeholder="Email"
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === "add" ? "Add Lead" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
