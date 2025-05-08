
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TeamMemberProps {
  name: string;
  role: string;
  experience: string;
  image: string;
}

const TeamMember: React.FC<TeamMemberProps> = ({ name, role, experience, image }) => {
  return (
    <div className="group text-center">
      <div className="relative mb-5 overflow-hidden rounded-lg">
        <div className="aspect-square w-full overflow-hidden">
          <Avatar className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105">
            <AvatarImage src={image} alt={name} className="object-cover object-center h-full w-full" />
            <AvatarFallback className="text-2xl bg-urbana-gold text-white h-full w-full">
              {name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-urbana-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
          <div className="p-4 w-full text-white">
            <p className="text-sm mb-1">Experience: {experience}</p>
            <p className="text-sm">Specializes in classic and modern styles</p>
          </div>
        </div>
      </div>
      <h3 className="text-xl font-bold text-urbana-black">{name}</h3>
      <p className="text-urbana-gold font-medium">{role}</p>
    </div>
  );
};

const Team: React.FC = () => {
  const teamMembers = [
    {
      name: "Rafael Costa",
      role: "Master Barber & Founder",
      experience: "15+ years",
      image: "/team-1.jpg"
    },
    {
      name: "Lucas Oliveira",
      role: "Senior Stylist",
      experience: "8+ years",
      image: "/team-2.jpg"
    },
    {
      name: "Gabriel Santos",
      role: "Beard Specialist",
      experience: "6+ years",
      image: "/team-3.jpg"
    },
    {
      name: "Mateus Silva",
      role: "Color Expert",
      experience: "7+ years",
      image: "/team-4.jpg"
    }
  ];

  return (
    <section id="team" className="urbana-section">
      <div className="urbana-container">
        <div className="text-center mb-16">
          <h2 className="urbana-heading">Meet Our Team</h2>
          <p className="urbana-subheading">Our skilled barbers are dedicated to providing you with the best grooming experience</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <TeamMember
              key={index}
              name={member.name}
              role={member.role}
              experience={member.experience}
              image={member.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
