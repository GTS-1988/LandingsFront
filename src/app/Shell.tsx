import { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, PanelsTopLeft, Inbox } from 'lucide-react'
import { cx } from '../lib/cx'

function Item({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
          isActive ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white',
        )
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  )
}

export default function Shell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 md:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3 shadow">
          <div className="mb-3 px-2">
            <div className="text-base font-semibold">Landing Admin</div>
            <div className="text-xs text-zinc-400">Supabase API backend</div>
          </div>
          <nav className="flex flex-col gap-1">
            <Item to="/" icon={LayoutDashboard} label="Dashboard" />
            <Item to="/clients" icon={Users} label="Clientes" />
            <Item to="/landings" icon={PanelsTopLeft} label="Landings" />
            <Item to="/submissions" icon={Inbox} label="Submissions" />
          </nav>
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-xs text-zinc-300">
            <div className="font-medium">Auth</div>
            <div className="text-zinc-400">x-admin-key desde .env (frontend)</div>
          </div>
        </aside>

        <main className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow">
          {children}
        </main>
      </div>
    </div>
  )
}
