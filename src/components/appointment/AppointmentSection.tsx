
import React from 'react';
import AppointmentForm from './AppointmentForm';

const AppointmentSection: React.FC = () => {
  return (
    <section id="appointment" className="urbana-section bg-urbana-brown text-white">
      <div className="urbana-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Agende seu Horário</h2>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto opacity-90">
            Marque sua visita e experimente serviços premium de barbearia
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-black/30 backdrop-blur-sm rounded-lg p-6 md:p-10 shadow-xl">
          <AppointmentForm />
        </div>
      </div>
    </section>
  );
};

export default AppointmentSection;
