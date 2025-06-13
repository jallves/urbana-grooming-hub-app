
import React from 'react';
                control={control}
                barbers={barbers}
                barberAvailability={barberAvailability}
                isCheckingAvailability={isCheckingAvailability}
                getFieldValue={getValues}
                checkBarberAvailability={checkBarberAvailability}
              />
              <BarberDebugInfo barbers={barbers} barberAvailability={barberAvailability} isCheckingAvailability={isCheckingAvailability} />
            </div>

            {selectedService && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Cupom de Desconto</h3>
                <CouponField
                  form={form}
                  servicePrice={selectedService.price}
                  appliedCoupon={appliedCoupon}
                  isApplyingCoupon={isApplyingCoupon}
                  finalPrice={finalPrice}
                  onApplyCoupon={applyCoupon}
                  onRemoveCoupon={removeCoupon}
                />
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Observações</h3>
              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Informe detalhes adicionais sobre o seu agendamento (opcional)"
                        className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-urbana-gold focus:ring-urbana-gold/20 resize-none min-h-[100px]"
                        aria-describedby="notes-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-gradient-to-r from-urbana-gold/10 to-urbana-gold/20 border border-urbana-gold/30 rounded-xl p-6">
              <AppointmentSummary
                selectedService={selectedService}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                appliedCoupon={appliedCoupon}
                finalPrice={finalPrice}
              />
              {selectedService && (
                <p className="text-zinc-300 mt-2">
                  Duração estimada: <strong>{selectedService.duration} minutos</strong>
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/cliente/dashboard')}
                className="flex-1 bg-transparent border-zinc-600 text-white hover:bg-zinc-800 hover:border-zinc-500 h-12"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                aria-label={appointmentId ? 'Atualizar agendamento' : 'Confirmar agendamento'}
                className="flex-1 bg-gradient-to-r from-urbana-gold to-urbana-gold/90 hover:from-urbana-gold/90 hover:to-urbana-gold text-black font-semibold h-12 shadow-lg shadow-urbana-gold/25"
                disabled={loading || isSending || !formState.isValid || formState.isSubmitting}
              >
                {loading || isSending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full" />
                    {appointmentId ? 'Atualizando...' : 'Agendando...'}
                  </div>
                ) : (
                  appointmentId ? 'Atualizar Agendamento' : 'Confirmar Agendamento'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
