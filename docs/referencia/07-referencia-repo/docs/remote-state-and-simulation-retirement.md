# Arquitectura de Estado Remoto y Desacoplamiento de Simulación

**Estado:** Aprobado / Canónico  
**Proyecto:** OPTIMUS-THY  
**Tarea:** TES-102  

---

## 1. Contexto y Problema

Históricamente, la interfaz de usuario prototípica de `optimus-thy` utilizaba `SimulationContext` como una base de datos ficticia en memoria del navegador (almacenando usuarios, roles, fichas clínicas, pacientes, imágenes y notificaciones).

Esto introducía:
1. Desincronización con el backend FastAPI y los contratos OpenAPI.
2. Contadores e IDs no deterministas (`P101`, `U011`, `FC-011`).
3. Notificaciones globales utilizadas como repositorio de eventos en lugar de feedback visual efímero.

---

## 2. Decisión Arquitectónica

1. **Estado del Servidor (Server State):**
   - Se gestiona **exclusivamente** mediante `@tanstack/react-query` y el cliente HTTP unificado (`src/shared/api/client.ts`).
   - Las claves de consulta se centralizan en la factoría `queryKeys` (`src/shared/api/query-keys.ts`).
   - Tras mutaciones (`useMutation`), las vistas deben invalidar las query keys correspondientes:
     ```ts
     await queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
     ```

2. **Autenticación y Sesión Real:**
   - Gestionada en `AuthProvider` (`src/providers/auth-context.tsx`) mediante cookie `session_id` (`HttpOnly`, `SameSite=Lax/Strict`).
   - La sesión se valida con `GET /auth/me` y el login real contra `POST /auth/login`.
   - Se prohíbe inventar roles ficticios o alternar identidades sin credenciales válidas en backend.

3. **Feedback UI y Notificaciones Efímeras:**
   - Desacopladas completamente de cualquier lógica de negocio en `ToastProvider` / `useToast` (`src/shared/ui/toast.tsx`).
   - `NotificationToasts` consume exclusivamente el contexto de UI efímero y no persiste datos de negocio.

4. **Reglas de Migración para Nuevos Módulos (OCR, IA, Pacientes, Investigación):**
   - **Prohibido:** agregar nuevas colecciones de datos o contadores a `SimulationContext`.
   - **Obligatorio:** consumir endpoints REST de FastAPI mapeados en `contracts/openapi.json` con `useQuery` / `useMutation`.
   - Los mocks legacy existentes en módulos pendientes se mantienen temporalmente encapsulados y se retiran progresivamente al implementar cada issue específico (TES-105, TES-109, TES-115, etc.).
