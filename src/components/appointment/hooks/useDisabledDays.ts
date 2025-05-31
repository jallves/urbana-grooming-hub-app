
import { useState, useEffect } from 'react';

export const useDisabledDays = () => {
  // For now, we'll just disable past dates
  const isDisabledDay = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return { disabledDays: isDisabledDay };
};
