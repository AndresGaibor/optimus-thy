import type { Meta, StoryObj } from '@storybook/react-vite';
import { delay, http, HttpResponse } from 'msw';
import { expect, userEvent, within } from 'storybook/test';
import { SessionProvider } from '../session/SessionContext';
import { LoginPage } from './LoginPage';

const errorContrato = (code: string, message: string) => ({
  error: { code, message },
  request_id: 'req-demo-msw',
});

const meta = {
  title: 'Aplicación/Pública/Acceso (HU-001)',
  component: LoginPage,
  decorators: [
    (Story) => (
      <SessionProvider>
        <Story />
      </SessionProvider>
    ),
  ],
  parameters: {
    router: { initialEntries: ['/login'] },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof LoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Predeterminada: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/(?:api\/)?auth\/me(?:\?.*)?$/, () =>
          HttpResponse.json(errorContrato('not_authenticated', 'No autenticado'), { status: 401 }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    await expect(canvas.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
  },
};

export const CredencialesInvalidas: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/(?:api\/)?auth\/me(?:\?.*)?$/, () =>
          HttpResponse.json(errorContrato('not_authenticated', 'No autenticado'), { status: 401 }),
        ),
        http.post(/\/(?:api\/)?auth\/login(?:\?.*)?$/, () =>
          HttpResponse.json(errorContrato('invalid_credentials', 'Credenciales inválidas'), {
            status: 401,
          }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Entrar' });
    await userEvent.type(canvas.getByLabelText(/correo electrónico/i), 'medico@demo.test');
    await userEvent.type(canvas.getByLabelText(/contraseña/i), 'clave-incorrecta');
    await userEvent.click(canvas.getByRole('button', { name: 'Entrar' }));
    await expect(await canvas.findByRole('alert')).toBeInTheDocument();
  },
};

export const Enviando: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/(?:api\/)?auth\/me(?:\?.*)?$/, () =>
          HttpResponse.json(errorContrato('not_authenticated', 'No autenticado'), { status: 401 }),
        ),
        http.post(/\/(?:api\/)?auth\/login(?:\?.*)?$/, async () => {
          await delay('infinite');
          return HttpResponse.json(errorContrato('timeout', 'No debería resolverse'));
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Entrar' });
    await userEvent.type(canvas.getByLabelText(/correo electrónico/i), 'medico@demo.test');
    await userEvent.type(canvas.getByLabelText(/contraseña/i), 'clave-segura');
    await userEvent.click(canvas.getByRole('button', { name: 'Entrar' }));
    await expect(await canvas.findByRole('button', { name: 'Entrando…' })).toBeInTheDocument();
  },
};
