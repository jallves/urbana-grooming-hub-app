
import React from 'react';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-urbana-black text-white">
      <div className="urbana-container pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About Section */}
          <div>
            <h3 className="text-2xl font-bold mb-4 text-urbana-gold">Costa Urbana</h3>
            <p className="mb-6 text-gray-300">
              Barbearia premium oferecendo serviços especializados com foco na satisfação do cliente e um ambiente relaxado.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-urbana-gold transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-urbana-gold transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-urbana-gold transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Hours Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Horário de Funcionamento</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <Clock className="h-5 w-5 mr-2 text-urbana-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Segunda - Sexta</p>
                  <p>9:00 - 20:00</p>
                </div>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 mr-2 text-urbana-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Sábado</p>
                  <p>9:00 - 18:00</p>
                </div>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 mr-2 text-urbana-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Domingo</p>
                  <p>Fechado</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contato</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-urbana-gold shrink-0 mt-0.5" />
                <p>Rua da Barbearia, 123, São Paulo, SP</p>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-urbana-gold shrink-0" />
                <p>+55 11 9876-5432</p>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-urbana-gold shrink-0" />
                <p>contato@costaurbana.com.br</p>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="#services" className="hover:text-urbana-gold transition-colors">Serviços</a>
              </li>
              <li>
                <a href="#team" className="hover:text-urbana-gold transition-colors">Nossa Equipe</a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-urbana-gold transition-colors">Galeria</a>
              </li>
              <li>
                <a href="#appointment" className="hover:text-urbana-gold transition-colors">Agendar Horário</a>
              </li>
              <li>
                <a href="#" className="hover:text-urbana-gold transition-colors">Política de Privacidade</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <p className="text-center text-gray-500">
            © {new Date().getFullYear()} Costa Urbana Barbearia. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
