import { Laptop, Smartphone, Tablet, Tv } from 'lucide-react';
import type { ElementType } from 'react';

/** What kind of device a model is. Saved on each model by the server; listed separately everywhere. */
export type DeviceCategory = 'phone' | 'laptop' | 'tablet' | 'tv';

export const DEVICE_CATEGORIES: Array<{ id: DeviceCategory; label: string; plural: string; icon: ElementType }> = [
  { id: 'phone', label: 'Phone', plural: 'Phones', icon: Smartphone },
  { id: 'laptop', label: 'Laptop', plural: 'Laptops', icon: Laptop },
  { id: 'tablet', label: 'Tablet', plural: 'Tablets & iPads', icon: Tablet },
  { id: 'tv', label: 'Smart TV', plural: 'Smart TVs', icon: Tv },
];

export const CATEGORY_ICON: Record<DeviceCategory, ElementType> = Object.fromEntries(
  DEVICE_CATEGORIES.map((c) => [c.id, c.icon])
) as Record<DeviceCategory, ElementType>;

/** The model's saved device type (models saved before types existed are phones). */
export const categoryOf = (model: { category?: string | null }): DeviceCategory =>
  model.category === 'laptop' || model.category === 'tablet' || model.category === 'tv' ? model.category : 'phone';
