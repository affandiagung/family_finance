import React from 'react';
import {
  Utensils,
  ShoppingCart,
  Zap,
  GraduationCap,
  Car,
  HeartPulse,
  CreditCard,
  Home,
  Film,
  Gift,
  Smile,
  MoreHorizontal,
  Briefcase,
  Award,
  Store,
  Laptop,
  TrendingUp,
  PlusCircle,
  Coffee,
  Smartphone,
  Shield,
  Plane,
  Tag,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Utensils,
  ShoppingCart,
  Zap,
  GraduationCap,
  Car,
  HeartPulse,
  CreditCard,
  Home,
  Film,
  Gift,
  Smile,
  MoreHorizontal,
  Briefcase,
  Award,
  Store,
  Laptop,
  TrendingUp,
  PlusCircle,
  Coffee,
  Smartphone,
  Shield,
  Plane,
  Tag,
  DollarSign,
};

interface Props {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CategoryIcon: React.FC<Props> = ({ name, className = 'w-5 h-5', style }) => {
  const IconComponent = iconMap[name] || MoreHorizontal;
  return <IconComponent className={className} style={style} />;
};
