/**
 * Enum-to-French label mappings for all entities
 */

import type {
  CompanyStatus,
  EntryPointType,
  EntryPointStatus,
  ApplicationType,
  ApplicationStatus,
  InterviewType,
  InterviewStatus,
  ActionStatus,
  ActionPriority,
} from "@prisma/client";

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  FIND_ENTRY_POINT: "Recherche point d'entrée",
  PROCESS_IN_PROGRESS: "En cours",
  CLOSED: "Clôturé",
};

export const ENTRY_POINT_TYPE_LABELS: Record<EntryPointType, string> = {
  JOB_POSTING: "Offre d'emploi",
  RECRUITER: "Recruteur",
  ALUMNI: "Alumni",
  REFERRAL: "Recommandation",
  COLD_APPLICATION: "Candidature spontanée",
  EMPLOYEE: "Employé",
};

export const ENTRY_POINT_STATUS_LABELS: Record<EntryPointStatus, string> = {
  TO_CONTACT: "À contacter",
  CONTACTED: "Contacté",
  RESPONDED: "Réponse reçue",
  WAITING: "En attente",
  FOLLOW_UP: "Relance",
  CLOSED: "Clôturé",
};

export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  REFERRAL: "Recommandation",
  DIRECT_CONTACT: "Contact direct",
  CAREERS_SITE: "Site carrières",
  COLD_APPLICATION: "Spontanée",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PREPARATION: "Préparation",
  SENT: "Envoyée",
  WAITING: "En attente",
  RESPONSE_RECEIVED: "Réponse reçue",
  HR_INTERVIEW: "Entretien RH",
  TECHNICAL_INTERVIEW: "Entretien technique",
  CASE_STUDY: "Case study",
  FINAL: "Finale",
  REJECTED: "Refusée",
  OFFER: "Offre",
  WITHDRAWN: "Retirée",
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  HR: "RH",
  MANAGER: "Manager",
  TECHNICAL: "Technique",
  SYSTEM_DESIGN: "System Design",
  FIT: "Fit",
  FOUNDER: "Fondateur",
  CASE_STUDY: "Case study",
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  SCHEDULED: "Planifié",
  COMPLETED: "Terminé",
  CANCELED: "Annulé",
  FEEDBACK_RECEIVED: "Feedback reçu",
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
  CANCELED: "Annulé",
};

export const ACTION_PRIORITY_LABELS: Record<ActionPriority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
};
