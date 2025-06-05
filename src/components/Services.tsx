const ServiceCard: React.FC<ServiceProps> = ({ title, price, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="relative overflow-hidden bg-white border-0 shadow-lg h-full">
        <CardContent className="p-8 h-full flex flex-col">
          {/* Service icon - sem efeitos hover */}
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold/10 rounded-2xl flex items-center justify-center">
              <Scissors className="w-8 h-8 text-urbana-gold" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-playfair text-2xl font-bold text-urbana-gold leading-tight">
                {title}
              </h3>
              <div className="text-right ml-4">
                <div className="relative">
                  <span className="text-3xl font-playfair font-bold text-urbana-gold">
                    {price}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Divider - simplificado */}
            <div className="relative mb-6">
              <div className="h-px bg-gradient-to-r from-urbana-gold/0 via-urbana-gold/30 to-urbana-gold/0"></div>
            </div>
            
            <p className="text-urbana-gold/80 text-base leading-relaxed">
              {description || "Serviço premium de barbearia com atenção aos detalhes"}
            </p>
          </div>
          
          {/* Decorative elements - sem efeitos hover */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-urbana-gold/5 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-urbana-gold/5 to-transparent rounded-tr-full"></div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
