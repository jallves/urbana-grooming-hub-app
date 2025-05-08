
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-urbana-black py-2 shadow-lg' : 'bg-transparent py-4'
      }`}
    >
      <div className="urbana-container flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white flex items-center">
          URBANA
          <span className="text-urbana-gold">.</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <NavLink href="/#services">Serviços</NavLink>
          <NavLink href="/#team">Equipe</NavLink>
          <NavLink href="/#appointment">Agendar</NavLink>
          <NavLink href="tel:+5511999999999">Contato</NavLink>
          <NavLink href="/admin">Admin</NavLink>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-urbana-black text-white">
              <nav className="flex flex-col space-y-6 pt-10">
                <MobileNavLink href="/#services">Serviços</MobileNavLink>
                <MobileNavLink href="/#team">Equipe</MobileNavLink>
                <MobileNavLink href="/#appointment">Agendar</MobileNavLink>
                <MobileNavLink href="tel:+5511999999999">Contato</MobileNavLink>
                <MobileNavLink href="/admin">Admin</MobileNavLink>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="text-white text-sm uppercase tracking-wider font-medium hover:text-urbana-gold transition-colors"
    >
      {children}
    </a>
  );
};

const MobileNavLink: React.FC<NavLinkProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="text-white text-xl uppercase tracking-wider font-medium hover:text-urbana-gold transition-colors"
    >
      {children}
    </a>
  );
};

export default Navbar;
