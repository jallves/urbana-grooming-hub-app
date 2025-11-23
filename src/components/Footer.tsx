
import React from 'react';
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, Heart, Star } from 'lucide-react';
import { useShopSettings } from '@/hooks/useShopSettings';

const Footer: React.FC = () => {
  const { shopSettings } = useShopSettings();
  
  // Extract values or use defaults
  const shopName = shopSettings?.shop_name || "Costa Urbana";
  const address = shopSettings?.address || "Rua Castelo Branco, 483 - 29101-480 Praia da Costa - Vila Velha/ES";
  const phone = shopSettings?.phone || "+55 11 9876-5432";
  const email = shopSettings?.email || "contato@costaurbana.com.br";
  const instagram = shopSettings?.social_instagram || "#";
  const facebook = shopSettings?.social_facebook || "#";
  const twitter = shopSettings?.social_twitter || "#";
  
  const footerSections = [
    {
      title: "Horário de Funcionamento",
      items: [
        { icon: Clock, label: "Segunda - Sábado", value: "8:00 - 20:00" },
        { icon: Clock, label: "Domingo", value: "9:00 - 13:00" }
      ]
    },
    {
      title: "Contato",
      items: [
        { icon: MapPin, label: "Endereço", value: address },
        { icon: Phone, label: "Telefone", value: phone },
        { icon: Mail, label: "Email", value: email }
      ]
    }
  ];

  const quickLinks = [
    { name: "Serviços", href: "#services" },
    { name: "Galeria", href: "#gallery" },
    { name: "Política de Privacidade", href: "#" }
  ];

  const socialLinks = [
    { icon: Instagram, href: instagram, name: "Instagram", color: "hover:text-pink-400" },
    { icon: Facebook, href: facebook, name: "Facebook", color: "hover:text-blue-400" },
    { icon: Twitter, href: twitter, name: "Twitter", color: "hover:text-sky-400" }
  ];

  return (
    <footer id="contact" className="relative bg-urbana-black text-urbana-light overflow-hidden border-t border-urbana-gold/10">
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-urbana-gold rounded-full blur-3xl"></div>
      </div>

      <div className="urbana-container relative z-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 
              className="font-playfair text-3xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Barbearia<br/>Costa Urbana
            </h3>
            
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-urbana-gold fill-current" />
              ))}
              <span className="text-urbana-light/60 font-raleway ml-2 text-sm">Excelência Premium</span>
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-urbana-gold/5 border border-urbana-gold/20 hover:bg-urbana-gold hover:text-urbana-black rounded-lg flex items-center justify-center transition-all duration-300"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Hours Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 
              className="font-playfair text-xl font-bold text-urbana-gold mb-4"
            >
              Horário de Funcionamento
            </h3>
            <div className="space-y-2 text-sm font-raleway">
              <div className="flex justify-between text-urbana-light/80">
                <span>Segunda - Sábado</span>
                <span className="text-urbana-gold">8:00 - 20:00</span>
              </div>
              <div className="flex justify-between text-urbana-light/80">
                <span>Domingo</span>
                <span className="text-urbana-gold">9:00 - 13:00</span>
              </div>
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 
              className="font-playfair text-xl font-bold text-urbana-gold mb-4"
            >
              Contato
            </h3>
            <div className="space-y-3 text-sm font-raleway">
              <div className="flex items-start gap-2 text-urbana-light/80">
                <MapPin className="h-4 w-4 text-urbana-gold mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{address}</span>
              </div>
              <div className="flex items-center gap-2 text-urbana-light/80">
                <Phone className="h-4 w-4 text-urbana-gold flex-shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-urbana-light/80">
                <Mail className="h-4 w-4 text-urbana-gold flex-shrink-0" />
                <span className="break-all">barbearia.costaurbana@gmail.com</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="border-t border-urbana-gold/10 pt-6 pb-6"
        >
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-raleway">
            {quickLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href} 
                className="text-urbana-light/70 hover:text-urbana-gold transition-colors duration-300"
              >
                {link.name}
              </a>
            ))}
          </div>
        </motion.div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h4 className="font-playfair text-xl font-bold text-urbana-gold mb-4 text-center">
            Nossa Localização
          </h4>
          <div className="max-w-4xl mx-auto bg-urbana-black/50 backdrop-blur-lg rounded-lg p-3 border border-urbana-gold/10">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3742.6441437707836!2d-40.28747308455458!3d-20.325849486358473!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xb83d4e5a5e5e5e5%3A0x5e5e5e5e5e5e5e5!2sRua%20Castelo%20Branco%2C%20483%20-%20Praia%20da%20Costa%2C%20Vila%20Velha%20-%20ES%2C%2029101-480!5e0!3m2!1spt!2sbr!4v1620000000000!5m2!1spt!2sbr"
              className="w-full h-48 rounded border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização da Barbearia - Rua Castelo Branco, 483 - Praia da Costa - Vila Velha/ES"
            ></iframe>
          </div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="border-t border-urbana-gold/10 pt-6 flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-16 font-raleway"
        >
          <p className="text-sm text-urbana-light/50">© {new Date().getFullYear()} Barbearia Costa Urbana. Todos os direitos reservados.</p>
          <p className="text-sm text-urbana-gold">Powered Beltec Soluções</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
