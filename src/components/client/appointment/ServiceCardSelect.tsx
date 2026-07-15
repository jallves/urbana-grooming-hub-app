import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Service } from '@/types/appointment';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Scissors, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceCardSelectProps {
  services: Service[];
  form: UseFormReturn<any>;
}

const ServiceCarousel: React.FC<{ images: string[]; alt: string }> = ({ images, alt }) => {
  const [idx, setIdx] = useState(0);
  const has = images.length > 0;
  const total = images.length;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIdx((i) => (i - 1 + total) % total);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIdx((i) => (i + 1) % total);
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-urbana-black/5 overflow-hidden rounded-t-lg">
      {has ? (
        <>
          <img
            src={images[idx]}
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Foto anterior"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Próxima foto"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition-colors',
                      i === idx ? 'bg-urbana-gold' : 'bg-white/60'
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-urbana-black/40">
          <Scissors className="h-10 w-10" />
        </div>
      )}
    </div>
  );
};

const ServiceCardSelect: React.FC<ServiceCardSelectProps> = ({ services, form }) => {
  return (
    <FormField
      control={form.control}
      name="service_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-black">Serviço</FormLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {services.map((service) => {
              const selected = field.value === service.id;
              const images = (service.imagens || []).filter(Boolean);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => field.onChange(service.id)}
                  className={cn(
                    'text-left rounded-lg border bg-white shadow-sm transition-all overflow-hidden flex flex-col',
                    selected
                      ? 'border-urbana-gold ring-2 ring-urbana-gold shadow-md'
                      : 'border-slate-200 hover:border-urbana-gold/60'
                  )}
                >
                  <div className="relative">
                    <ServiceCarousel images={images} alt={service.name} />
                    {selected && (
                      <div className="absolute top-1 right-1 bg-urbana-gold text-urbana-black rounded-full h-6 w-6 flex items-center justify-center shadow">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">
                      {service.name}
                    </p>
                    {service.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold text-urbana-gold">
                        R$ {Number(service.price).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.duration}min
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ServiceCardSelect;