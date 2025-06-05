const ServiceCard: React.FC<ServiceProps> = ({ title, price, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="group relative overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-2 h-full">
        <CardContent className="p-8 h-full flex flex-col">
          {/* Modern service icon */}
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Scissors className="w-8 h-8 text-urbana-gold" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-urbana-gold/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-playfair text-2xl font-bold text-urbana-gold leading-tight">
                {title}
              </h3>
              <div className="text-right ml-4">
                <div className="relative">
                  <span className="text-3xl font-playfair font-bold text-urbana-gold group-hover:scale-110 inline-block transition-transform duration-300">
                    {price}
                  </span>
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-urbana-gold/0 via-urbana-gold/50 to-urbana-gold/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </div>
            </div>
            
            <div className="relative mb-6">
              <div className="h-px bg-gradient-to-r from-urbana-gold/0 via-urbana-gold/30 to-urbana-gold/0 group-hover:via-urbana-gold/60 transition-all duration-500"></div>
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-urbana-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            
            <p className="text-urbana-gold/80 text-base leading-relaxed">
              {description || "Serviço premium de barbearia com atenção aos detalhes"}
            </p>
          </div>
          
          {/* Modern decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-urbana-gold/5 to-transparent rounded-bl-full group-hover:scale-125 transition-transform duration-500"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-urbana-gold/5 to-transparent rounded-tr-full group-hover:scale-125 transition-transform duration-500"></div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
