import { createFileRoute } from '@tanstack/react-router'
import { defaultMaintenanceText, defaultMaintenanceTitle } from '~/utils/maintenance'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/maintenance')({
  head: () => ({
    meta: seo({
      title: 'Údržba | mojeKytara',
      description: 'Web je dočasně v režimu údržby.',
    }),
  }),
  component: MaintenancePage,
})

function MaintenancePage() {
  return (
    <div className="min-h-full bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
          Režim údržby
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
          {defaultMaintenanceTitle}
        </h1>

        <p className="text-stone-300 leading-relaxed text-base sm:text-lg mb-8">
          {defaultMaintenanceText}
        </p>
      </div>
    </div>
  )
}
