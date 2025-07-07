import React from 'react';
import { useShopSettings } from '@/hooks/useShopSettings';
import { useNavbar } from './useNavbar';
import NavbarLogo from './NavbarLogo';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';

const Navbar: React.FC = () => {
  const { shopSettings } = useShopSettings();
  const {
    user,
    scrolled,
    handleSignOut,
    handlePanelClick
  } = useNavbar();

  const shopName = shopSettings?.shop_name || "Barbearia Costa Urbana";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-urbana-black/90 shadow-xl backdrop-blur-md border-b border-urbana-gold/20'
          : 'bg-transparent backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <NavbarLogo shopName={shopName} />
        <DesktopNavigation
          user={user}
          handlePanelClick={handlePanelClick}
          handleSignOut={handleSignOut}
        />
        <MobileNavigation
          user={user}
          handlePanelClick={handlePanelClick}
          handleSignOut={handleSignOut}
        />
      </div>
    </div>
  );
};

export default Navbar;
