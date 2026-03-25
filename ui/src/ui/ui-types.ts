export const UI_CRON_DELIVERY_MODES = ["none", "announce", "webhook"] as const;

export type UiCronDeliveryMode = (typeof UI_CRON_DELIVERY_MODES)[number];

export type UiCronStatus = {
  enabled: boolean;
  storePath: string;
  jobs: number;
  nextWakeAtMs?: number | null;
};

export type UiCronPanelState = {
  status: UiCronStatus;
  selectedDeliveryMode: UiCronDeliveryMode;
};
