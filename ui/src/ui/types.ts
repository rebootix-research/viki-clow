export const CRON_DELIVERY_MODES = ["none", "announce", "webhook"] as const;

export type CronDeliveryMode = (typeof CRON_DELIVERY_MODES)[number];

export type CronStatus = {
  enabled: boolean;
  storePath: string;
  jobs: number;
  nextWakeAtMs?: number | null;
};

export type CronJobSummary = {
  id: string;
  name: string;
  enabled: boolean;
  deliveryMode: CronDeliveryMode;
  nextRunAtMs?: number | null;
};
