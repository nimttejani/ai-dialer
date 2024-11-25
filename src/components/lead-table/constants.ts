export const FIELD_MAPPINGS = {
  company_name: "Company Name",
  phone: "Phone",
  email: "Email",
  status: "Status",
  call_attempts: "Call Attempts",
  last_called_at: "Last Called At",
} as const;

export const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  calling: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  no_answer: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  scheduled: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  not_interested: "bg-gray-100 text-gray-800 hover:bg-gray-200"
} as const;

export const NON_EDITABLE_FIELDS = ["call_attempts", "last_called_at", "created_at", "updated_at"];
