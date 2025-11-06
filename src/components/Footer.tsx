
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
        <div className="absolute top-20 left-20 w-96 h-96 bg-urbana-gold rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-urbana-gold/20 rounded-full blur-2xl"></div>
      </div>

      <div className="urbana-container relative z-10 pt-24 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Section - Takes 3 columns on lg */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-3 space-y-6"
          >
            <div className="space-y-4">
              <h3 
                className="font-playfair text-3xl md:text-4xl font-bold leading-tight tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Barbearia<br/>Costa Urbana
              </h3>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-urbana-gold fill-current" />
                ))}
              </div>
            </div>
            
            <p className="text-urbana-light/70 leading-relaxed text-sm font-raleway">
              Tradição e modernidade se encontram em cada corte.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3 pt-2">
              {socialLinks.map((social, index) => (
              <motion.a
                  key={social.name}
                  href={social.href}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: 1.15,
                    rotate: [0, -10, 10, -10, 0],
                    transition: { duration: 0.5 }
                  }}
                  className={`w-10 h-10 bg-urbana-gold/10 backdrop-blur-lg border border-urbana-gold/20 hover:bg-urbana-gold hover:text-urbana-black rounded-lg flex items-center justify-center transition-all duration-300 group`}
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Hours Section - Takes 3 columns on lg */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            viewport={{ once: true }}
            className="lg:col-span-3 space-y-5"
          >
            <h3 
              className="font-playfair text-xl md:text-2xl font-bold tracking-tight text-urbana-gold"
            >
              Horário de Funcionamento
            </h3>
            <ul className="space-y-3">
              {footerSections[0].items.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-urbana-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-urbana-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="font-raleway text-urbana-light text-sm font-medium">
                      {item.label}
                    </p>
                    <p className="text-urbana-light/60 font-raleway text-xs">
                      {item.value}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Section - Takes 3 columns on lg */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="lg:col-span-3 space-y-5"
          >
            <h3 
              className="font-playfair text-xl md:text-2xl font-bold tracking-tight text-urbana-gold"
            >
              Contato
            </h3>
            <ul className="space-y-3">
              {footerSections[1].items.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 bg-urbana-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-urbana-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-raleway text-urbana-light text-sm font-medium mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-urbana-light/60 font-raleway text-xs break-words">
                      {item.value}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Links & Map Section - Takes 3 columns on lg */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            viewport={{ once: true }}
            className="lg:col-span-3 space-y-5"
          >
            <h3 
              className="font-playfair text-xl md:text-2xl font-bold tracking-tight text-urbana-gold"
            >
              Links Rápidos
            </h3>
            <ul className="space-y-2">
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
                    className="text-urbana-light/70 hover:text-urbana-gold transition-colors duration-300 relative group inline-block font-raleway text-sm"
                  >
                    {link.name}
                    <span className="absolute left-0 bottom-0 w-0 h-px bg-urbana-gold group-hover:w-full transition-all duration-300"></span>
                  </a>
                </motion.li>
              ))}
            </ul>

            {/* Map Section */}
            <div className="pt-3">
              <h4 className="font-playfair text-lg font-bold mb-3 text-urbana-gold">
                Nossa Localização
              </h4>
              <div className="bg-urbana-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-urbana-gold/20">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3742.6441437707836!2d-40.28747308455458!3d-20.325849486358473!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xb83d4e5a5e5e5e5%3A0x5e5e5e5e5e5e5e5!2sRua%20Castelo%20Branco%2C%20483%20-%20Praia%20da%20Costa%2C%20Vila%20Velha%20-%20ES%2C%2029101-480!5e0!3m2!1spt!2sbr!4v1620000000000!5m2!1spt!2sbr"
                  className="w-full h-36 border-0"
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
              <Heart className="w-4 h-4 text-red-400" />
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
