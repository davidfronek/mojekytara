const maintenanceModeValue = (import.meta.env.VITE_MAINTENANCE_MODE ?? '').toLowerCase()

export const isMaintenanceMode = maintenanceModeValue === '1' || maintenanceModeValue === 'true' || maintenanceModeValue === 'yes'

export const defaultMaintenanceTitle =
  import.meta.env.VITE_MAINTENANCE_TITLE ??
  'Vrátíme se brzy'

export const defaultMaintenanceText =
  import.meta.env.VITE_MAINTENANCE_TEXT ??
  'Probíhá plánovaná údržba. Za chvíli jsme zpět. Děkujeme za trpělivost.'
