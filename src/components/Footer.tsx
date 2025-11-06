
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
        { icon: Clock, label: "Segunda - Sexta", value: "9:00 - 20:00" },
        { icon: Clock, label: "Sábado", value: "9:00 - 18:00" },
        { icon: Clock, label: "Domingo", value: "Fechado" }
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
    <footer id="contact" className="relative bg-gradient-to-b from-urbana-black via-urbana-brown to-urbana-black text-urbana-light overflow-hidden">
      {/* Modern geometric background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-urbana-gold rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-yellow-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-urbana-gold/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="urbana-container relative z-10 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-1 space-y-8"
          >
            <div className="space-y-6">
              <h3 
                className="font-playfair text-5xl md:text-6xl font-bold leading-tight tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #FFA500 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 40px rgba(255, 215, 0, 0.3)'
                }}
              >
                {shopName}
              </h3>
              <div className="flex items-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-urbana-gold fill-current drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
                ))}
                <span className="text-urbana-light/70 font-raleway ml-2 text-lg">Excelência Premium</span>
              </div>
            </div>
            
            <p className="text-urbana-light/80 leading-relaxed text-lg font-raleway">
              Tradição e modernidade se encontram em cada corte. 
              Oferecemos uma experiência premium de barbearia com foco na excelência e satisfação do cliente.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-6">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className={`w-14 h-14 bg-urbana-gold/10 backdrop-blur-lg border border-urbana-gold/20 hover:bg-urbana-gold hover:text-urbana-black rounded-xl flex items-center justify-center transition-all duration-300 group ${social.color}`}
                  aria-label={social.name}
                >
                  <social.icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Hours and Contact Sections */}
          {footerSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: sectionIndex * 0.2 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h3 
                className="font-playfair text-3xl md:text-4xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.2)'
                }}
              >
                {section.title}
              </h3>
              <ul className="space-y-6">
                {section.items.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start group hover:translate-x-2 transition-transform duration-300"
                  >
                    <div className="w-12 h-12 bg-urbana-gold/10 backdrop-blur-lg border border-urbana-gold/20 rounded-lg flex items-center justify-center mr-4 group-hover:bg-urbana-gold/20 transition-colors duration-300">
                      <item.icon className="h-5 w-5 text-urbana-gold group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="font-raleway font-semibold text-urbana-light group-hover:text-urbana-gold transition-colors duration-300">
                        {item.label}
                      </p>
                      <p className="text-urbana-light/70 font-raleway">
                        {item.value}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Quick Links & Map */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h3 
              className="font-playfair text-3xl md:text-4xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.2)'
              }}
            >
              Links Rápidos
            </h3>
            <ul className="space-y-4">
              {quickLinks.map((link, index) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <a 
                    href={link.href} 
                    className="text-urbana-light/80 hover:text-urbana-gold transition-colors duration-300 relative group inline-block font-raleway text-lg"
                  >
                    {link.name}
                    <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-urbana-gold group-hover:w-full transition-all duration-300"></span>
                  </a>
                </motion.li>
              ))}
            </ul>

            {/* Map Section */}
            <div className="mt-12">
              <h4 
                className="font-playfair text-2xl md:text-3xl font-bold mb-6 tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.2)'
                }}
              >
                Nossa Localização
              </h4>
              <div className="bg-urbana-black/50 backdrop-blur-lg rounded-xl p-6 border border-urbana-gold/20 hover:border-urbana-gold/40 transition-colors duration-300">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3742.6441437707836!2d-40.28747308455458!3d-20.325849486358473!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xb83d4e5a5e5e5e5%3A0x5e5e5e5e5e5e5e5!2sRua%20Castelo%20Branco%2C%20483%20-%20Praia%20da%20Costa%2C%20Vila%20Velha%20-%20ES%2C%2029101-480!5e0!3m2!1spt!2sbr!4v1620000000000!5m2!1spt!2sbr"
                  className="w-full h-48 rounded-lg border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização da Barbearia - Rua Castelo Branco, 483 - Praia da Costa - Vila Velha/ES"
                ></iframe>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="border-t border-urbana-gold/20 mt-20 pt-8"
        >
          <div className="flex flex-wrap items-center justify-center gap-2 text-urbana-light/70 font-raleway text-sm md:text-base">
            <span className="flex items-center gap-2">
              Feito com
              <Heart className="w-4 h-4 text-red-400 animate-pulse" />
              pela equipe {shopName}
            </span>
            <span className="hidden md:inline text-urbana-gold/50">•</span>
            <span className="text-urbana-light/50">
              © {new Date().getFullYear()} Barbearia Costa Urbana. Todos os direitos reservados.
            </span>
            <span className="hidden md:inline text-urbana-gold/50">•</span>
            <span className="text-urbana-gold/70">
              Desenvolvido pela Beltec Soluções
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
