
import React from "react";
import { User, Calendar, Clock, LogOut, Home, Scissors } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useClientAuth } from "@/contexts/ClientAuthContext";

const sidebarItems = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/cliente/dashboard"
  },
  {
    label: "Novo Agendamento",
    icon: Scissors,
    href: "/cliente/novo-agendamento"
  },
  {
    label: "Meus Agendamentos",
    icon: Calendar,
    href: "/cliente/dashboard#historico"
  },
  {
    label: "Perfil",
    icon: User,
    href: "/cliente/perfil"
  }
];

export function ClientSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { signOut } = useClientAuth();

  return (
    <aside className="flex flex-col bg-stone-900/90 backdrop-blur border-r border-stone-800 min-h-screen w-[230px] p-4 shadow-md hidden md:flex">
      <div className="flex items-center mb-8 gap-3">
        <Scissors className="h-7 w-7 text-amber-500" />
        <div className="text-xl font-black text-white font-playfair">Costa Urbana</div>
      </div>
      <nav className="flex flex-col gap-2 flex-1">
        {sidebarItems.map(item => (
          <Button
            key={item.label}
            variant={pathname === item.href || (item.href !== "/cliente/perfil" && pathname.startsWith(item.href)) ? "secondary" : "ghost"}
            className="justify-start gap-3 rounded-lg font-medium px-3 py-2 text-left w-full"
            onClick={() => navigate(item.href)}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </nav>
      <Button 
        variant="destructive"
        className="mt-auto w-full flex gap-2 justify-center"
        onClick={signOut}
      >
        <LogOut className="h-5 w-5" />
        Sair
      </Button>
    </aside>
  );
}
