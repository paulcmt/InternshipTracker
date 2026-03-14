/**
 * Action utilities: overdue, due today (used by actions table)
 */

import { isOverdue, isDueToday } from "./dates";
import type { ActionStatus } from "@prisma/client";

const COMPLETED_STATUSES: ActionStatus[] = ["DONE", "CANCELED"];

export function isActionOverdue(action: {
  dueDate: Date | null;
  status: ActionStatus;
}): boolean {
  if (!action.dueDate || COMPLETED_STATUSES.includes(action.status))
    return false;
  return isOverdue(action.dueDate);
}

export function isActionDueToday(action: {
  dueDate: Date | null;
  status: ActionStatus;
}): boolean {
  if (!action.dueDate || COMPLETED_STATUSES.includes(action.status))
    return false;
  return isDueToday(action.dueDate);
}
