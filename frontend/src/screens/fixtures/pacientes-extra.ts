import type { DemoPatient } from './types';

export interface DemoConsentimiento {
  estado: 'Vigente' | 'Revocado';
  fecha: string;
  canal: string;
}

export const consentimientoVigenteDemo: DemoConsentimiento = {
  estado: 'Vigente',
  fecha: '2026-06-14',
  canal: 'Formulario firmado de demostración',
};

export const pacienteConConsentimientoRevocado = {
  paciente: {
    id: 'DEMO-PAC-035',
    historia: 'DEMO-HC-035',
    nombre: 'Paciente demo 035',
    edad: 44,
    sexo: 'F',
    institucion: 'Institución demo',
    ultimaConsulta: '2026-10-20',
  } satisfies DemoPatient,
  consentimiento: {
    estado: 'Revocado',
    fecha: '2026-10-20',
    canal: 'Revocación registrada para demostración',
  } satisfies DemoConsentimiento,
};

export const pacienteArchivado = {
  paciente: {
    id: 'DEMO-PAC-037',
    historia: 'DEMO-HC-037',
    nombre: 'Paciente demo 037',
    edad: 52,
    sexo: 'M',
    institucion: 'Institución demo',
    ultimaConsulta: '2026-09-12',
  } satisfies DemoPatient,
  archivadoEn: '2026-10-28',
  motivo: 'Archivo solicitado para demostración.',
};

export const posiblesDuplicados: DemoPatient[] = [
  {
    id: 'DEMO-PAC-038-A',
    historia: 'DEMO-HC-038-A',
    nombre: 'Paciente demo coincidencia A',
    edad: 48,
    sexo: 'F',
    institucion: 'Institución demo',
    ultimaConsulta: '2026-10-20',
  },
  {
    id: 'DEMO-PAC-038-B',
    historia: 'DEMO-HC-038-B',
    nombre: 'Paciente demo coincidencia B',
    edad: 48,
    sexo: 'F',
    institucion: 'Institución demo',
    ultimaConsulta: '2026-10-18',
  },
];
