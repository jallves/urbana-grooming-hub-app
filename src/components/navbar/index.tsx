
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
    isDesktop,
    handleSignOut, 
    handlePanelClick 
  } = useNavbar();
  
  // Use shop name from settings or fallback to default
  const shopName = shopSettings?.shop_name || "Barbearia Costa Urbana";

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled || !isDesktop
        ? 'bg-urbana-black/95 backdrop-blur-xl shadow-2xl border-b border-urbana-gold/30' 
        : 'bg-transparent backdrop-blur-sm'
    }`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="w-full mx-auto pt-3 pb-2 sm:py-3 md:py-4 lg:py-5 px-3 sm:px-4 md:px-6 flex items-center justify-between mobile-navbar">
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
