import { 
  LayoutDashboard, 
  BarChart3, 
  FileBarChart,
  FolderOpen,
  Package,
  ShoppingCart,
  Boxes,
  Users, 
  UserCheck,
  Shield,
  MessageSquare,
  Bell,
  Mail,
  Calendar,
  CheckSquare,
  FileText,
  Database,
  ShieldCheck,
  HardDrive,
  Settings,
  LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  BarChart3,
  FileBarChart,
  FolderOpen,
  Package,
  ShoppingCart,
  Boxes,
  Users,
  UserCheck,
  Shield,
  MessageSquare,
  Bell,
  Mail,
  Calendar,
  CheckSquare,
  FileText,
  Database,
  ShieldCheck,
  HardDrive,
  Settings,
};

interface IconMapperProps {
  iconName: string;
  className?: string;
}

export function IconMapper({ iconName, className = "h-4 w-4" }: IconMapperProps) {
  const IconComponent = iconMap[iconName];
  
  if (!IconComponent) {
    return <Settings className={className} />; // Fallback icon
  }
  
  return <IconComponent className={className} />;
}
