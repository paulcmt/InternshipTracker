/**
 * Action utilities: overdue, due today, due soon, open, completed
 */

import { isOverdue, isDueToday, isUpcomingIn7Days } from "./dates";
import type { Action, ActionStatus } from "@prisma/client";

const OPEN_STATUSES: ActionStatus[] = ["TODO", "IN_PROGRESS"];
const COMPLETED_STATUSES: ActionStatus[] = ["DONE", "CANCELED"];

export function isActionOverdue(action: { dueDate: Date | null; status: ActionStatus }): boolean {
  if (!action.dueDate || COMPLETED_STATUSES.includes(action.status)) return false;
  return isOverdue(action.dueDate);
}

export function isActionDueToday(action: { dueDate: Date | null; status: ActionStatus }): boolean {
  if (!action.dueDate || COMPLETED_STATUSES.includes(action.status)) return false;
  return isDueToday(action.dueDate);
}

export function isActionDueSoon(action: { dueDate: Date | null; status: ActionStatus }): boolean {
  if (!action.dueDate || COMPLETED_STATUSES.includes(action.status)) return false;
  return isUpcomingIn7Days(action.dueDate) && !isOverdue(action.dueDate);
}

export function isActionOpen(action: { status: ActionStatus }): boolean {
  return OPEN_STATUSES.includes(action.status);
}

export function isActionCompleted(action: { status: ActionStatus }): boolean {
  return COMPLETED_STATUSES.includes(action.status);
}

export function filterOverdueActions<T extends Action>(actions: T[]): T[] {
  return actions.filter((a) => isActionOverdue(a));
}

export function filterDueTodayActions<T extends Action>(actions: T[]): T[] {
  return actions.filter((a) => isActionDueToday(a));
}

export function filterDueSoonActions<T extends Action>(actions: T[]): T[] {
  return actions.filter((a) => isActionDueSoon(a));
}

export function filterOpenActions<T extends Action>(actions: T[]): T[] {
  return actions.filter((a) => isActionOpen(a));
}

export function filterCompletedActions<T extends Action>(actions: T[]): T[] {
  return actions.filter((a) => isActionCompleted(a));
}
