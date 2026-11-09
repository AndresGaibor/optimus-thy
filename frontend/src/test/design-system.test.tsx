import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Button,
  Dialog,
  FileDropzone,
  SearchInput,
  SidebarLayout,
  StatusBadge,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../design-system';

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
});

describe('Dialog', () => {
  it('abre, anuncia su título, cierra con Escape y restaura el foco al trigger', async () => {
    const user = userEvent.setup();
    render(
      <Dialog trigger={<Button>Abrir diálogo</Button>} title="Revisar ficha">
        Contenido de demostración
      </Dialog>,
    );

    const trigger = screen.getByRole('button', { name: 'Abrir diálogo' });
    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Revisar ficha' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('restaura el foco a quien abrió un diálogo controlado sin trigger interno', async () => {
    const user = userEvent.setup();

    function ExternalTrigger() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Abrir desde afuera</Button>
          <Dialog open={open} onOpenChange={setOpen} title="Confirmación">
            Contenido
          </Dialog>
        </>
      );
    }

    render(<ExternalTrigger />);
    const trigger = screen.getByRole('button', { name: 'Abrir desde afuera' });
    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Confirmación' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});

describe('Tabs', () => {
  it('cambia pestaña y panel con la flecha derecha', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="perfil">
        <TabsList aria-label="Información sintética">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="laboratorios">Laboratorios</TabsTrigger>
        </TabsList>
        <TabsContent value="perfil">Perfil de demostración</TabsContent>
        <TabsContent value="laboratorios">Laboratorios de demostración</TabsContent>
      </Tabs>,
    );

    const profileTab = screen.getByRole('tab', { name: 'Perfil' });
    await user.click(profileTab);
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Laboratorios' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Laboratorios de demostración');
  });
});

describe('Switch', () => {
  it('cambia con la barra espaciadora y conserva aria-checked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Alertas de seguridad" onCheckedChange={onCheckedChange} />);

    const toggle = screen.getByRole('switch', { name: 'Alertas de seguridad' });
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard(' ');

    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe('Tonos clínicos', () => {
  it('mantiene Pendiente como warning en lista y detalle', () => {
    render(
      <>
        <section aria-label="Lista de fichas">
          <StatusBadge kind="record" status="Pendiente" />
        </section>
        <section aria-label="Detalle de paciente">
          <StatusBadge kind="record" status="Pendiente" />
        </section>
      </>,
    );

    const listStatus = within(screen.getByRole('region', { name: 'Lista de fichas' })).getByText(
      'Pendiente',
    );
    const detailStatus = within(
      screen.getByRole('region', { name: 'Detalle de paciente' }),
    ).getByText('Pendiente');

    expect(listStatus).toHaveClass('text-warning');
    expect(detailStatus).toHaveClass('text-warning');
  });
});

describe('FileDropzone', () => {
  it('filtra también los archivos que el selector entrega fuera de accept', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onFiles = vi.fn();
    const pdf = new File(['demo sintético'], 'ficha.pdf', { type: 'application/pdf' });
    const image = new File(['demo sintético'], 'imagen.png', { type: 'image/png' });

    render(<FileDropzone label="Adjuntar ficha" accept=".pdf" multiple onFiles={onFiles} />);
    await user.upload(screen.getByLabelText('Adjuntar ficha'), [pdf, image]);

    expect(onFiles).toHaveBeenCalledWith([pdf]);
  });
});

describe('SearchInput', () => {
  it('deshabilita el control de limpieza junto con el campo', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <SearchInput
        label="Buscar pacientes demo"
        value="Paciente demo 001"
        onChange={() => undefined}
        onClear={onClear}
        disabled
      />,
    );

    const clearButton = screen.getByRole('button', { name: 'Limpiar búsqueda' });
    expect(clearButton).toBeDisabled();
    await user.click(clearButton);
    expect(onClear).not.toHaveBeenCalled();
  });
});

describe('SidebarLayout', () => {
  it('cierra el menú móvil al pasar a escritorio y mueve el foco a navegación visible', async () => {
    let matches = false;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mediaQuery = {
      get matches() {
        return matches;
      },
      media: '(min-width: 64rem)',
      onchange: null,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === 'function') {
          listeners.add(listener as (event: MediaQueryListEvent) => void);
        }
      },
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === 'function') {
          listeners.delete(listener as (event: MediaQueryListEvent) => void);
        }
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => mediaQuery),
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/inicio']}>
        <SidebarLayout navItems={[{ to: '/inicio', label: 'Inicio', end: true }]}>
          <h1>Contenido de demostración</h1>
        </SidebarLayout>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(screen.getByRole('dialog', { name: 'Navegación principal' })).toBeInTheDocument();

    matches = true;
    act(() => {
      for (const listener of listeners) {
        listener({ matches, media: '(min-width: 64rem)' } as MediaQueryListEvent);
      }
    });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveFocus();
  });
});
