import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TituloPagina, tituloPara } from '../components/TituloPagina';

describe('tituloPara', () => {
  it('resuelve la recuperación de contraseña', () => {
    expect(tituloPara('/login/recuperar')).toBe('Recuperar contraseña · OPTIMUS-THY');
  });

  it('resuelve el acceso', () => {
    expect(tituloPara('/login')).toBe('Acceso · OPTIMUS-THY');
  });

  it('resuelve la lista de pacientes', () => {
    expect(tituloPara('/medico/pacientes')).toBe('Pacientes · OPTIMUS-THY');
  });

  it('resuelve el panel clínico', () => {
    expect(tituloPara('/medico')).toBe('Panel clínico · OPTIMUS-THY');
  });

  it('resuelve la gestión de usuarios', () => {
    expect(tituloPara('/administrador/usuarios')).toBe('Usuarios · OPTIMUS-THY');
  });

  it('resuelve los roles y permisos', () => {
    expect(tituloPara('/administrador/roles')).toBe('Roles y permisos · OPTIMUS-THY');
  });

  it('cae en el título por defecto en pantallas aún provisionales', () => {
    expect(tituloPara('/medico/inferencia')).toBe('OPTIMUS-THY · Gestión clínica de tiroides');
    expect(tituloPara('/investigador/exportaciones')).toBe(
      'OPTIMUS-THY · Gestión clínica de tiroides',
    );
  });

  it('devuelve el título por defecto para rutas desconocidas', () => {
    expect(tituloPara('/ruta/inexistente')).toBe('OPTIMUS-THY · Gestión clínica de tiroides');
  });

  it('normaliza la barra final en roles y permisos', () => {
    expect(tituloPara('/administrador/roles/')).toBe('Roles y permisos · OPTIMUS-THY');
  });
});

describe('TituloPagina', () => {
  it('fija el título del documento según la ruta activa', async () => {
    render(
      <MemoryRouter initialEntries={['/medico/pacientes']}>
        <TituloPagina />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.title).toBe('Pacientes · OPTIMUS-THY');
    });
  });
});
