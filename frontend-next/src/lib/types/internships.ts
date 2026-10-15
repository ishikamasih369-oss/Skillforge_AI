export type InternshipStatus =
  | "Saved"
  | "Applied"
  | "Assessment"
  | "Interview"
  | "Rejected"
  | "Selected";

export interface Internship {
  id: number;
  company: string;
  role: string;
  location: string | null;
  application_date: string | null;
  deadline: string | null;
  status: InternshipStatus | string;
  job_url: string | null;
  notes: string | null;
}

export interface InternshipCreate {
  company: string;
  role: string;
  location?: string | null;
  application_date?: string | null;
  deadline?: string | null;
  status?: InternshipStatus | string;
  job_url?: string | null;
  notes?: string | null;
}

export interface InternshipStatusUpdate {
  status: InternshipStatus;
}

export interface InternshipStats {
  total: number;
  Saved: number;
  Applied: number;
  Assessment: number;
  Interview: number;
  Rejected: number;
  Selected: number;
}

export interface InternshipActionResponse {
  message: string;
  internship_id: number;
  status?: string;
}
