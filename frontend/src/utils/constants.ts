export const UOM_OPTIONS = [
  { label: 'Each', value: 'each' },
  { label: 'Kilogram', value: 'kg' },
  { label: 'Liter', value: 'liter' },
  { label: 'Meter', value: 'meter' },
  { label: 'Box', value: 'box' },
  { label: 'Pallet', value: 'pallet' },
];

export const PO_STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  pending_approval: 'orange',
  approved: 'blue',
  sent: 'cyan',
  partially_received: 'geekblue',
  received: 'green',
  cancelled: 'red',
};

export const PO_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  sent: 'Sent',
  partially_received: 'Partially Received',
  received: 'Received',
  cancelled: 'Cancelled',
};

export const ZONE_TYPES = [
  { label: 'Receiving', value: 'receiving' },
  { label: 'Storage', value: 'storage' },
  { label: 'Picking', value: 'picking' },
  { label: 'Shipping', value: 'shipping' },
];

export const ADJUSTMENT_TYPES = [
  { label: 'Physical Count', value: 'count' },
  { label: 'Damage', value: 'damage' },
  { label: 'Correction', value: 'correction' },
  { label: 'Write Off', value: 'write_off' },
];
