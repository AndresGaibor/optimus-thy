import {
  CircleCheck,
  Info,
  OctagonAlert,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { BadgeTone } from '../tones';

/** Icono por tono: refuerza el color con una forma distinta. */
export const TONE_ICONS: Record<BadgeTone, LucideIcon> = {
  neutral: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  attention: TriangleAlert,
  danger: OctagonAlert,
  ai: Sparkles,
};
