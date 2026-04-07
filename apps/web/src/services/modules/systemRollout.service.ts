import api from "@/services/api.service";
import { ENDPOINTS } from "@/services/endpoints.service";

export interface SystemRolloutFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface SystemRolloutSnapshot {
  summary: {
    recommendedPhase: "phase_1" | "phase_2" | "phase_3" | "phase_4";
    readOnly: boolean;
    message: string;
  };
  flags: SystemRolloutFlag[];
}

export async function fetchSystemRolloutSnapshot(): Promise<SystemRolloutSnapshot> {
  const { data } = await api.get<SystemRolloutSnapshot>(ENDPOINTS.system.rollout);
  return data;
}
