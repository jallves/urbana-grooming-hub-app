
import React from 'react';
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, Heart } from 'lucide-react';
import { useShopSettings } from '@/hooks/useShopSettings';

const Footer: React.FC = () => {
  const { shopSettings } = useShopSettings();
  
  // Extract values or use defaults
  const shopName = shopSettings?.shop_name || "Costa Urbana";
  const address = shopSettings?.address || "Rua da Barbearia, 123, São Paulo, SP";
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
    { name: "Nossa Equipe", href: "#team" },
    { name: "Galeria", href: "#gallery" },
    { name: "Agendar Horário", href: "#appointment" },
    { name: "Política de Privacidade", href: "#" }
  ];

  const socialLinks = [
    { icon: Instagram, href: instagram, name: "Instagram" },
    { icon: Facebook, href: facebook, name: "Facebook" },
    { icon: Twitter, href: twitter, name: "Twitter" }
  ];

  return (
    <footer id="contact" className="relative bg-gradient-to-b from-urbana-black to-urbana-brown text-white overflow-hidden">
      {/* Modern background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-urbana-gold rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-urbana-gold rounded-full blur-3xl"></div>
      </div>

      <div className="urbana-container relative z-10 pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <h3 className="font-playfair text-3xl font-bold mb-6 text-urbana-gold">
              {shopName}
            </h3>
            <p className="mb-8 text-gray-300 leading-relaxed text-lg">
              Tradição e modernidade se encontram em cada corte. 
              Oferecemos uma experiência premium de barbearia com foco na excelência e satisfação do cliente.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 bg-urbana-gold/10 hover:bg-urbana-gold hover:text-urbana-black rounded-full flex items-center justify-center transition-all duration-300 group"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
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
            >
              <h3 className="font-playfair text-xl font-bold mb-6 text-urbana-gold">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.items.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start group"
                  >
                    <item.icon className="h-5 w-5 mr-3 text-urbana-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-medium text-white group-hover:text-urbana-gold transition-colors">
                        {item.label}
                      </p>
                      <p className="text-gray-300 text-sm">
                        {item.value}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="font-playfair text-xl font-bold mb-6 text-urbana-gold">
              Links Rápidos
            </h3>
            <ul className="space-y-3">
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
                    className="text-gray-300 hover:text-urbana-gold transition-colors duration-300 relative group inline-block"
                  >
                    {link.name}
                    <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-urbana-gold group-hover:w-full transition-all duration-300"></span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 mt-16 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-center md:text-left">
              © {new Date().getFullYear()} {shopName}. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2 text-gray-500">
              <span>Feito com</span>
              <Heart className="w-4 h-4 text-red-500 animate-pulse" />
              <span>pela equipe {shopName}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
