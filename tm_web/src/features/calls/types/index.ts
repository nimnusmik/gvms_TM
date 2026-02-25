export interface CallLog {
  id: number;
  assignment: number;
  agent?: string | null;
  agent_name?: string | null;
  customer_id?: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  call_start?: string | null;
  duration?: number | null;
  result?: string | null;
  recording_file?: string | null;
  recording_status?: "PENDING" | "UPLOADED" | "FAILED" | string;
  recording_mime?: string | null;
  recording_size?: number | null;
  recording_uploaded_at?: string | null;
}

export interface RecordingUrlResponse {
  download_url: string;
  expires_in: number;
}
