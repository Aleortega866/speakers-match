export type { ContactStatus } from "@/lib/admin/contactFlow";

export interface AdminClientListItem {
  id: number;
  fullName: string;
  email: string;
  company: string;
  completedAt: Date | null;
  answersCount: number;
  originChannelLabel: string;
  status: import("@/lib/admin/contactFlow").ContactStatus;
  statusLabel: string;
  statusBadgeClass: string;
}

export interface AdminClientDetail {
  id: number;
  fullName: string;
  email: string;
  company: string;
  completedAt: Date | null;
  eventDate: string | null;
  origin: string;
  token: string | null;
  form_started_at: Date | null;
  calendly_booked_at: Date | null;
  answers: string[];
  matches: AdminClientMatch[];
}

export interface AdminClientMatch {
  id: number;
  score: number;
  topSkill: string | null;
  speaker: {
    id: number;
    name: string;
    specialty: string;
    bio: string | null;
  };
  skills: Array<{
    label: string;
    value: number;
  }>;
}

export interface AdminClientListResult {
  items: AdminClientListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface AdminSpeakerListItem {
  id: number;
  nombre: string;
  especialidad: string;
  bio_short: string | null;
  active: boolean;
}

export interface AdminSpeakerListResult {
  items: AdminSpeakerListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}
