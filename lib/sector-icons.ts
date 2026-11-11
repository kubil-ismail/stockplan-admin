import { Box, Building, Cpu, Droplet, Factory, Flame, Landmark, Leaf, Plus, RadioTower, ShoppingBag, ShoppingBasket, Sun, Truck, Wrench, Zap, type LucideIcon } from "lucide-react";

// Same key -> icon mapping as the client's sector page (components/tema/icons.tsx); keys are the API's SECTOR_ICONS.
export const SECTOR_ICON: Record<string, LucideIcon> = {
  bolt: Zap, cube: Box, factory: Factory, basket: ShoppingBasket, bag: ShoppingBag, plus: Plus, bank: Landmark, building: Building,
  chip: Cpu, tower: RadioTower, truck: Truck, flame: Flame, droplet: Droplet, wrench: Wrench, sun: Sun, leaf: Leaf,
};
