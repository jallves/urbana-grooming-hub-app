import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  image_url: string | null;
  is_active: boolean;
}

interface TeamMemberProps {
  name: string;
  role: string;
  experience: string;
  image: string | null;
}

const TeamMember: React.FC<TeamMemberProps> = ({ name, role, experience, image }) => {
  return (
    <div className="group text-center">
      <div className="relative mb-5 overflow-hidden rounded-lg">
        <div className="aspect-square w-full overflow-hidden">
          <Avatar className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105">
            <AvatarImage 
              src={image || ''} 
              alt={name} 
              className="object-cover object-center h-full w-full" 
            />
            <AvatarFallback className="text-2xl bg-urbana-gold text-white h-full w-full">
              {name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
          <div className="p-4 w-full text-white">
            <p className="text-sm mb-1">Experiência: {experience}</p>
            <p className="text-sm">Especialista em estilos clássicos e modernos</p>
          </div>
        </div>
      </div>
      <h3 className="text-xl font-bold text-white">{name}</h3>
      <p className="text-urbana-gold font-medium">{role}</p>
    </div>
  );
};

export const Team: React.FC = () => {
  const { data: staffMembers = [], isLoading, error } = useQuery<StaffMember[]>({
    queryKey: ['team-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const fallbackTeamMembers: StaffMember[] = [
    {
      id: '1',
      name: "Rafael Costa",
      role: "Barbeiro Master & Fundador",
      experience: "+15 anos",
      image_url: "/team-1.jpg",
      is_active: true
    },
    {
      id: '2',
      name: "Lucas Oliveira", 
      role: "Estilista Sênior",
      experience: "+8 anos",
      image_url: "/team-2.jpg",
      is_active: true
    },
    {
      id: '3',
      name: "Gabriel Santos",
      role: "Especialista em Barba",
      experience: "+6 anos",
      image_url: "/team-3.jpg",
      is_active: true
    },
    {
      id: '4',
      name: "Mateus Silva",
      role: "Especialista em Coloração", 
      experience: "+7 anos",
      image_url: "/team-4.jpg",
      is_active: true
    }
  ];

  if (isLoading) {
    return (
      <section id="team" className="urbana-section bg-black">
        <div className="urbana-container">
          <div className="text-center mb-16">
            <h2 className="urbana-heading text-white">Nossa Equipe</h2>
            <p className="urbana-subheading text-gray-300">Carregando nossa equipe...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const teamToDisplay = staffMembers.length > 0 ? staffMembers : fallbackTeamMembers;

  return (
    <section id="team" className="urbana-section bg-black">
      <div className="urbana-container">
        <div className="text-center mb-16">
          <h2 className="urbana-heading text-white">Nossa Equipe</h2>
          <p className="urbana-subheading text-gray-300">
            Nossos barbeiros qualificados estão dedicados a proporcionar a melhor experiência de cuidado
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamToDisplay.map((member) => (
            <TeamMember
              key={member.id}
              name={member.name}
              role={member.role}
              experience={member.experience}
              image={member.image_url}
            />
          ))}
        </div>
        
        {error && (
          <div className="text-center mt-4">
            <p className="text-red-400 text-sm">
              Erro ao carregar a equipe. Exibindo equipe padrão.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Team;
