import { FlaskConical, ShieldCheck, Stethoscope, type LucideIcon } from 'lucide-react';
import type { RoleKey } from '../tones';

export const ROLE_ICONS: Record<RoleKey, LucideIcon> = {
  medico: Stethoscope,
  investigador: FlaskConical,
  administrador: ShieldCheck,
};
