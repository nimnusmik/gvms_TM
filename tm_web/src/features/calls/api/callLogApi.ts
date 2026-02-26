import { api } from "@/lib/axios";
import type { PaginatedResponse } from "@/features/dashboard/types";
import type { CallLog, RecordingUrlResponse } from "../types";

export const callLogApi = {
  listByAssignment: async (assignmentId: number) => {
    const response = await api.get<PaginatedResponse<CallLog>>(`/calls/logs/`, {
      params: { assignment: assignmentId },
    });
    return response.data;
  },
  getRecordingUrl: async (callLogId: number) => {
    const response = await api.get<RecordingUrlResponse>(`/calls/logs/${callLogId}/recording-url/`);
    return response.data;
  },
};
