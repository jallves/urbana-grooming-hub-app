
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordToggleProps {
  showPassword: boolean;
  onToggle: () => void;
}

const PasswordToggle: React.FC<PasswordToggleProps> = ({ showPassword, onToggle }) => {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-zinc-400 hover:text-white"
      onClick={onToggle}
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </Button>
  );
};

export default PasswordToggle;
