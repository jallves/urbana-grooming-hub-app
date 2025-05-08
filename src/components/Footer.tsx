
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
              Premium barbershop providing expert grooming services with a focus on client satisfaction and a relaxed atmosphere.
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
            <h3 className="text-xl font-bold mb-4">Opening Hours</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <Clock className="h-5 w-5 mr-2 text-urbana-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Monday - Friday</p>
                  <p>9:00 AM - 8:00 PM</p>
                </div>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 mr-2 text-urbana-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Saturday</p>
                  <p>9:00 AM - 6:00 PM</p>
                </div>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 mr-2 text-urbana-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Sunday</p>
                  <p>Closed</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-urbana-gold shrink-0 mt-0.5" />
                <p>123 Barber Street, São Paulo, SP, Brazil</p>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-urbana-gold shrink-0" />
                <p>+55 11 9876-5432</p>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-urbana-gold shrink-0" />
                <p>info@costaurbana.com.br</p>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="#services" className="hover:text-urbana-gold transition-colors">Services</a>
              </li>
              <li>
                <a href="#team" className="hover:text-urbana-gold transition-colors">Our Team</a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-urbana-gold transition-colors">Gallery</a>
              </li>
              <li>
                <a href="#appointment" className="hover:text-urbana-gold transition-colors">Book Appointment</a>
              </li>
              <li>
                <a href="#" className="hover:text-urbana-gold transition-colors">Privacy Policy</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <p className="text-center text-gray-500">
            © {new Date().getFullYear()} Costa Urbana Barbershop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
