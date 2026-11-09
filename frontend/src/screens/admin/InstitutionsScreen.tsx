import { useState } from 'react';
import { Button } from '../../design-system';
import type { DemoInstitution } from '../fixtures/admin-extra';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { SectionCard } from '../researcher/ResearcherBlocks';
import { InstitutionDialog, type InstitutionForm } from './InstitutionDialog';
import { InstitutionsTable } from './InstitutionsTable';

const FORM_EMPTY: InstitutionForm = {
  codigo: '',
  nombre: '',
  usuariosActivos: 0,
  estado: 'Activa',
};

type InstitutionUser = { id: string; nombre: string; institucion: string };

export function InstitutionsScreen({
  institutions,
  users = [],
}: {
  institutions: DemoInstitution[];
  users?: InstitutionUser[];
}) {
  const [rows, setRows] = useState(institutions);
  const [assignments, setAssignments] = useState(
    Object.fromEntries(
      users.map((user) => [
        user.id,
        institutions.find((item) => item.nombre === user.institucion)?.id ?? '',
      ]),
    ),
  );
  const [dialog, setDialog] = useState<'new' | 'edit' | 'deactivate' | null>(null);
  const [selected, setSelected] = useState<DemoInstitution | null>(null);
  const [form, setForm] = useState<InstitutionForm>(FORM_EMPTY);
  const [notice, setNotice] = useState('');

  const close = () => {
    setDialog(null);
    setSelected(null);
    setForm(FORM_EMPTY);
  };
  const save = () => {
    if (!form.codigo.trim() || !form.nombre.trim()) return;
    if (dialog === 'edit' && selected) {
      setRows((current) =>
        current.map((item) =>
          item.id === selected.id
            ? { ...item, codigo: form.codigo.trim(), nombre: form.nombre.trim() }
            : item,
        ),
      );
    } else {
      setRows((current) => [
        ...current,
        {
          id: `DEMO-INST-${current.length + 1}`,
          ...form,
          codigo: form.codigo.trim(),
          nombre: form.nombre.trim(),
        },
      ]);
    }
    setNotice('Cambios de demostración aplicados únicamente en esta vista; no se guardaron datos.');
    setDialog(null);
  };

  return (
    <DemoRoleLayout role="administrador">
      <ScreenFrame
        title="Instituciones"
        description="Administración institucional ilustrativa."
        actions={
          <Button
            onClick={() => {
              setForm(FORM_EMPTY);
              setDialog('new');
            }}
          >
            Nueva institución
          </Button>
        }
      >
        <SectionCard title={`Instituciones (${rows.length})`}>
          <InstitutionsTable
            rows={rows}
            users={users}
            assignments={assignments}
            notice={notice}
            onAssign={(userId, institutionId) =>
              setAssignments((current) => ({ ...current, [userId]: institutionId }))
            }
            onEdit={(institution) => {
              setSelected(institution);
              setForm({
                codigo: institution.codigo,
                nombre: institution.nombre,
                usuariosActivos: institution.usuariosActivos,
                estado: institution.estado,
              });
              setDialog('edit');
            }}
            onDeactivate={(institution) => {
              setSelected(institution);
              setDialog('deactivate');
            }}
          />
        </SectionCard>
        <InstitutionDialog
          dialog={dialog}
          selected={selected}
          form={form}
          onFormChange={setForm}
          onClose={close}
          onSave={save}
          onDeactivate={() => {
            if (!selected) return;
            setRows((current) =>
              current.map((item) =>
                item.id === selected.id ? { ...item, estado: 'Inactiva' } : item,
              ),
            );
            setNotice('Institución desactivada en esta demostración.');
            close();
          }}
        />
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
