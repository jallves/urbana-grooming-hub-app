
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Início', href: '/' },
    { name: 'Serviços', href: '#services' },
    { name: 'Equipe', href: '#team' },
    { name: 'Galeria', href: '#gallery' },
    { name: 'Contato', href: '#contact' },
  ];

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="urbana-container flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <h1 className={`text-2xl font-bold ${isScrolled ? 'text-urbana-black' : 'text-white'}`}>
            COSTA<span className="text-urbana-gold">URBANA</span>
          </h1>
        </Link>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            className={`${isScrolled ? 'text-urbana-black' : 'text-white'}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className={`font-medium hover:text-urbana-gold transition-colors ${
                isScrolled ? 'text-urbana-black' : 'text-white'
              }`}
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <Button className="bg-urbana-gold hover:bg-urbana-gold/90 text-white">
            Agendar Agora
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="urbana-container py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block font-medium text-urbana-black hover:text-urbana-gold"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <Button className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-white mt-4">
              Agendar Agora
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
