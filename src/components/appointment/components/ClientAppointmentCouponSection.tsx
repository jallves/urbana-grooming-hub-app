
import React from "react";
import { CouponField } from "./CouponField";
import { Service } from "@/types/appointment";

interface Props {
  form: any;
  servicePrice: number;
  appliedCoupon: any;
  isApplyingCoupon: boolean;
  finalPrice: number;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
}

export function ClientAppointmentCouponSection({
  form,
  servicePrice,
  appliedCoupon,
  isApplyingCoupon,
  finalPrice,
  onApplyCoupon,
  onRemoveCoupon,
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Cupom de Desconto</h3>
      <CouponField
        form={form}
        servicePrice={servicePrice}
        appliedCoupon={appliedCoupon}
        isApplyingCoupon={isApplyingCoupon}
        finalPrice={finalPrice}
        onApplyCoupon={onApplyCoupon}
        onRemoveCoupon={onRemoveCoupon}
      />
    </div>
  );
}
