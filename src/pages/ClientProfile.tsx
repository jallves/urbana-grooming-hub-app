
import React from "react";
import { ClientSidebar } from "@/components/client/ClientSidebar";
import { useClientAuth } from "@/contexts/ClientAuthContext";

export default function ClientProfile() {
  const { client } = useClientAuth();

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-stone-800 via-stone-900 to-stone-700">
      <ClientSidebar />
      <main className="flex-1 max-w-3xl mx-auto py-10 px-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">Meu Perfil</h1>
        <div className="bg-stone-800 rounded-2xl shadow p-8 border border-stone-700">
          <div className="text-lg text-white mb-2"><strong>Nome:</strong> {client?.name}</div>
          <div className="text-white"><strong>Email:</strong> {client?.email || "Não informado"}</div>
          <div className="text-white"><strong>Telefone:</strong> {client?.phone}</div>
        </div>
      </main>
    </div>
  );
}
