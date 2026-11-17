# Tasks

## 1. Componente

- [x] 1.1 Crear `ProfileMenu` en el sistema de diseño con disparador compacto, panel, opciones `aria-pressed`, cierre con Escape, clic fuera y foco devuelto.
- [x] 1.2 Documentar sus cinco secciones JSDoc y escribir la historia CSF3 con estados: una sola área, varias áreas, abierto y teclado.
- [x] 1.3 Exportar el componente en el barril del sistema de diseño.

## 2. Integración

- [x] 2.1 Usar `ProfileMenu` en `AppShell` con los roles disponibles, el cambio de rol existente y el cierre de sesión.
- [x] 2.2 Quitar del pie los botones grandes de rol y cierre; dejar de pasar `roleLabel` a la marca.
- [x] 2.3 Ajustar `SidebarLayout`: altura mínima de 44 px en los ítems y marca sin rol implícito.

## 3. Pruebas y calidad

- [x] 3.1 Ajustar `AppFlows.stories.tsx` y `routing.test.tsx` al nuevo control y comprobar teclado en la historia del componente.
- [x] 3.2 Correr `typecheck`, `lint`, `ui:check`, `tamanos`, pruebas de app y las historias afectadas.
- [x] 3.3 Comprobar la vista en navegador (escritorio y móvil) antes de fusionar.

## 4. Cierre

- [ ] 4.1 PR con requisito, criterios y evidencias; fusionar con CI en verde.
- [ ] 4.2 Archivar el change y actualizar TES-376 con el SHA desplegado.
