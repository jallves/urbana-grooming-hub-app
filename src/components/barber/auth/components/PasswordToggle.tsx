
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
      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-zinc-700/50 text-zinc-400 hover:text-amber-400 rounded-lg transition-colors"
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
