
import React from 'react';
import { Scissors, Clock, Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ServiceProps {
  title: string;
  price: string;
  description: string;
}

const ServiceCard: React.FC<ServiceProps> = ({ title, price, description }) => {
  return (
    <Card className="urbana-card">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl text-urbana-black">{title}</h3>
          <span className="font-playfair text-lg font-bold text-urbana-gold">{price}</span>
        </div>
        <Separator className="my-3 bg-urbana-gold/20" />
        <p className="text-urbana-gray mt-2">{description}</p>
      </CardContent>
    </Card>
  );
};

const Services: React.FC = () => {
  const services = [
    {
      title: "Classic Haircut",
      price: "R$ 50",
      description: "Precision cut tailored to your style, includes hot towel finish and styling."
    },
    {
      title: "Beard Trim",
      price: "R$ 35",
      description: "Shape and define your beard with precision tools and hot towel treatment."
    },
    {
      title: "Luxury Shave",
      price: "R$ 45",
      description: "Traditional straight razor shave with pre and post-shave treatments."
    },
    {
      title: "Hair & Beard Combo",
      price: "R$ 75",
      description: "Complete grooming package with haircut, beard trim, and styling."
    },
    {
      title: "Color Treatment",
      price: "R$ 60+",
      description: "Professional color application to cover grays or change your look."
    },
    {
      title: "Kid's Haircut",
      price: "R$ 35",
      description: "Gentle haircut service for children under 12 years."
    }
  ];

  const features = [
    {
      icon: <Scissors className="h-8 w-8 text-urbana-gold" />,
      title: "Expert Barbers",
      description: "Our team of skilled professionals provide premium grooming services."
    },
    {
      icon: <Clock className="h-8 w-8 text-urbana-gold" />,
      title: "Efficient Service",
      description: "We respect your time and ensure prompt, quality service."
    },
    {
      icon: <Star className="h-8 w-8 text-urbana-gold" />,
      title: "Premium Experience",
      description: "Enjoy complimentary beverages and a relaxing atmosphere."
    }
  ];

  return (
    <section id="services" className="urbana-section bg-urbana-light">
      <div className="urbana-container">
        <div className="text-center mb-16">
          <h2 className="urbana-heading">Our Services</h2>
          <p className="urbana-subheading">Experience premium grooming with our range of professional services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="mx-auto mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-urbana-black">{feature.title}</h3>
              <p className="text-urbana-gray">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              title={service.title}
              price={service.price}
              description={service.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
