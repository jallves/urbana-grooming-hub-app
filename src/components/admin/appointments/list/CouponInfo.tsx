
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';

interface CouponInfoProps {
  couponCode?: string | null;
  discountAmount?: number | null;
  servicePrice?: number;
}

const CouponInfo: React.FC<CouponInfoProps> = ({ 
  couponCode, 
  discountAmount, 
  servicePrice 
}) => {
  if (!couponCode || !discountAmount) {
    return null;
  }

  const finalAmount = servicePrice ? servicePrice - discountAmount : null;

  return (
    <div className="flex flex-col gap-1">
      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
        <Tag className="h-3 w-3" />
        {couponCode}
      </Badge>
      <div className="text-xs text-muted-foreground">
        Desconto: R$ {discountAmount.toFixed(2)}
        {finalAmount && (
          <span> • Total: R$ {finalAmount.toFixed(2)}</span>
        )}
      </div>
    </div>
  );
};

export default CouponInfo;
