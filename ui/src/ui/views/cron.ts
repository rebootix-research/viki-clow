import type { CronDeliveryMode, CronJobSummary, CronStatus } from "../types.js";

export const CRON_VIEW_DELIVERY_MODES: CronDeliveryMode[] = ["none", "announce", "webhook"];

export function summarizeCronStatus(status: CronStatus): string {
  if (!status.enabled) {
    return "Cron disabled";
  }
  if (status.jobs === 0) {
    return "No cron jobs";
  }
  return `${status.jobs} cron jobs`;
}

export function groupCronJobsByDeliveryMode(jobs: CronJobSummary[]) {
  return CRON_VIEW_DELIVERY_MODES.reduce<Record<CronDeliveryMode, CronJobSummary[]>>(
    (groups, mode) => {
      groups[mode] = jobs.filter((job) => job.deliveryMode === mode);
      return groups;
    },
    {
      none: [],
      announce: [],
      webhook: [],
    },
  );
}
