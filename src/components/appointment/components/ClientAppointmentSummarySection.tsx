
import React from "react";
import { AppointmentSummary } from "./AppointmentSummary";

interface Props {
  selectedService: any;
  selectedDate: any;
  selectedTime: any;
  appliedCoupon: any;
  finalPrice: number;
}

export function ClientAppointmentSummarySection({
  selectedService,
  selectedDate,
  selectedTime,
  appliedCoupon,
  finalPrice
}: Props) {
  return (
    <div className="bg-gradient-to-r from-urbana-gold/10 to-urbana-gold/20 border border-urbana-gold/30 rounded-xl p-6">
      <AppointmentSummary
        selectedService={selectedService}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        appliedCoupon={appliedCoupon}
        finalPrice={finalPrice}
      />
    </div>
  );
}
