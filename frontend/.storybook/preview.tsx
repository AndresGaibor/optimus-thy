import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { withThemeByClassName } from '@storybook/addon-themes';
import { initialize, mswLoader } from 'msw-storybook-addon';
import '../src/styles/tokens.css';
import './preview.css';
import { ProveedorShell } from '../src/screens/shared/shell';

initialize({
  serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  onUnhandledRequest(request, print) {
    // Solo se exige cobertura para la API simulada; fuentes, imágenes y HMR se ignoran.
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api')) {
      print.warning();
    }
  },
});

type RouterParams = { router?: { initialEntries?: string[] } };

const preview: Preview = {
  globalTypes: {
    shell: {
      description: 'Marco de la aplicación (sidebar y navegación)',
      toolbar: {
        title: 'Shell',
        icon: 'sidebar',
        items: [
          { value: 'ninguno', title: 'Sin sidebar' },
          { value: 'app', title: 'Con sidebar' },
        ],
        dynamicTitle: true,
      },
    },
    motion: {
      description: 'Simula preferencia de movimiento reducido',
      toolbar: {
        title: 'Movimiento',
        icon: 'contrast',
        items: [
          { value: 'normal', title: 'Normal' },
          { value: 'reducido', title: 'Reducido' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    shell: 'ninguno',
    motion: 'normal',
  },
  tags: ['autodocs'],
  parameters: {
    a11y: { test: 'todo' },
    layout: 'fullscreen',
    viewport: {
      options: {
        movil: {
          name: 'Móvil 360×800',
          styles: { width: '360px', height: '800px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet 768×1024',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
        escritorio: {
          name: 'Escritorio 1366×768',
          styles: { width: '1366px', height: '768px' },
          type: 'desktop',
        },
        escritorioAmplio: {
          name: 'Escritorio 1440×900',
          styles: { width: '1440px', height: '900px' },
          type: 'desktop',
        },
      },
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Inicio',
          [
            'Introducción',
            'Primeros pasos',
            'Arquitectura',
            'Instalación y configuración',
            'Convenciones de desarrollo',
            'Cómo contribuir',
            'Changelog',
          ],
          'Aplicación',
          [
            'Mapa de pantallas',
            'Flujos',
            'Pública',
            'Médico',
            'Administrador',
            'Shell y navegación',
          ],
          'Sistema de diseño',
          [
            'Fundamentos',
            [
              'Colores',
              'Tokens semánticos',
              'Tipografía',
              'Tipografía en contexto',
              'Espaciado',
              'Dimensiones',
              'Bordes y radios',
              'Sombras y elevación',
              'Iconografía',
              'Ilustraciones',
              'Grid y breakpoints',
              'Temas',
              'Temas en oscuro',
              'Movimiento y animaciones',
            ],
            'Primitivos',
            'Átomos',
            'Moléculas',
            'Organismos',
            'Plantillas',
            'Patrones',
            [
              'Formularios',
              'Validación',
              'Tablas y listados',
              'Búsqueda',
              'Filtros',
              'Paginación',
              'Navegación',
              'Modales',
              'Confirmaciones',
              'Notificaciones',
              'Carga de archivos',
              'Estados',
              'Permisos',
              'Flujos clínicos',
            ],
          ],
          'Guías y calidad',
          [
            'Accesibilidad',
            'Diseño adaptable',
            'Contenido y microcopy',
            'Estados y casos límite',
            'Rendimiento',
            'Evidencias visuales',
            'Gates de calidad',
          ],
        ],
      },
    },
  },
  // `ai-generated`: historia producida por un agente y pendiente de revisión humana; quien la revisa elimina la etiqueta en el mismo PR.
  decorators: [
    withThemeByClassName({
      themes: { claro: '', oscuro: 'dark' },
      defaultTheme: 'claro',
    }),
    (Story, context) => {
      const { globals } = context;
      const motionGlobal =
        globals && typeof globals === 'object' && 'motion' in globals ? globals.motion : undefined;
      const motion = (motionGlobal ?? 'normal') === 'reducido' ? 'reducido' : 'normal';
      return (
        <div data-motion={motion} style={{ display: 'contents' }}>
          <Story />
        </div>
      );
    },
    (Story, context) => {
      const { parameters, globals } = context;
      const params: RouterParams = parameters;
      const shellParam =
        parameters && typeof parameters === 'object' && 'shell' in parameters
          ? parameters.shell
          : undefined;
      const shellGlobal =
        globals && typeof globals === 'object' && 'shell' in globals ? globals.shell : undefined;
      const conShell = (shellParam ?? shellGlobal ?? 'ninguno') === 'app';
      const initialEntries = params.router?.initialEntries ?? ['/'];
      return (
        <MemoryRouter key={context.id} initialEntries={initialEntries}>
          <ProveedorShell conShell={conShell}>
            <Story />
          </ProveedorShell>
        </MemoryRouter>
      );
    },
  ],
  loaders: [mswLoader],
};

export default preview;
