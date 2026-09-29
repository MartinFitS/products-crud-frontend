# TapAdmissionFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.27.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

El build de producción lee `API_URL` y genera el environment utilizado por
Angular. En Vercel configura, para Production, Preview y Development:

```dotenv
API_URL=https://products-crud-api-production-5865.up.railway.app/api
```

`vercel.json` define la carpeta de salida y redirige las rutas de la SPA a
`index.html`, por lo que las rutas internas también funcionan al recargar.

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Frontend Authentication

La aplicación usa Angular 19 standalone y Laravel Sanctum mediante Bearer Tokens. La URL base se configura en `src/environments/environment.ts`; producción reemplaza ese archivo por `environment.production.ts` durante el build.

El flujo es el siguiente:

- `AuthService` concentra login, usuario actual, recuperación/restablecimiento de contraseña, restauración de sesión y logout.
- `AuthStore` mantiene token, usuario, estado de carga e inicialización con Signals. Las secciones se derivan de todos los perfiles del usuario.
- El token se persiste con la única clave `auth_token` en `localStorage`. Se eligió por simplicidad para esta SPA/examen; una aplicación con requisitos superiores debería evaluar una cookie `HttpOnly`, `Secure` y administrada por el backend.
- El interceptor añade `Authorization: Bearer` únicamente a URLs bajo `environment.apiUrl`. Un 401 protegido limpia la sesión y redirige a login; los endpoints públicos de autenticación no provocan ciclos de redirección.
- Los guards esperan a `restoreSession()`, que valida el token existente mediante `GET /auth/me`, evitando la carrera al recargar una ruta protegida.
- `AuthGuard` exige una sesión válida, `GuestGuard` mantiene las pantallas públicas fuera del alcance de usuarios autenticados y `SectionGuard` valida `products`, `users` o `profiles`.
- Tras login se abre la primera sección permitida en el orden Products, Users, Profiles; si no existe ninguna, se muestra `/unauthorized`.
- El sidebar se genera exclusivamente desde `profiles[].sections` y reacciona a los Signals del store.
- Forgot Password envía únicamente el correo. Reset Password toma `token` y `email` del enlace, valida la confirmación y no inicia sesión automáticamente.
- Logout intenta revocar el token actual en Laravel y siempre limpia el estado local, incluso si el token ya no es válido.

Los guards y la visibilidad del menú son controles de experiencia de usuario. La autorización real permanece en Laravel y cada endpoint protegido debe validar su sección en backend.

## Users Module

El módulo protegido `/users` consume todos los endpoints disponibles de Laravel:

- Listado paginado con búsqueda por código, nombre o correo y filtro de estado.
- Registro multipart con fotografía, contraseña segura y perfiles opcionales.
- Consulta de detalle y perfiles resueltos.
- Edición multipart; contraseña y fotografía opcionales.
- Activación o desactivación de cuentas. La API revoca las sesiones al desactivar.
- Eliminación física con confirmación explícita.
- Descargas PDF y Excel respetando el nombre enviado por el backend.

Las rutas `/users/new`, `/users/:id` y `/users/:id/edit` heredan el `SectionGuard` de Users. La consulta de opciones de perfiles se realiza únicamente cuando el usuario autenticado también posee la sección `profiles`.

## Profiles and Sections Module

El módulo `/profiles` permite listar, buscar, crear, consultar, editar, eliminar y exportar perfiles de acceso. Cada perfil requiere entre 1 y 20 slugs existentes obtenidos desde `/api/sections`.

La ruta `/profiles/sections` administra el catálogo asignable:

- Lista secciones del sistema y personalizadas.
- Crea secciones con slug explícito o generado por Laravel.
- Impide desde la interfaz eliminar secciones del sistema.
- Delega al backend la validación final para impedir eliminar secciones asignadas a perfiles.

Laravel también impide eliminar un perfil asignado a uno o más usuarios. Estos rechazos se muestran mediante mensajes legibles y no se ocultan con validaciones únicamente frontend.

## Products Module

El módulo protegido `/products` implementa el catálogo completo de Laravel:

- Listado paginado y búsqueda por código, nombre o marca.
- Alta y edición con nombre, marca, precio de 0 a 999.99 y hasta dos decimales.
- Fotografía opcional JPEG, PNG o WEBP de hasta 5 MB, con vista previa y reemplazo mediante multipart.
- Detalle individual, eliminación confirmada y limpieza de la fotografía asociada en el backend.
- Exportaciones PDF y Excel que respetan el nombre de archivo indicado por la API.

Las rutas `/products/new`, `/products/:id` y `/products/:id/edit` heredan el `SectionGuard` de Products. El frontend valida los límites conocidos para mejorar la experiencia, mientras Laravel conserva la validación y autorización definitivas.

## Audit Log Module

El módulo de solo lectura `/audit-logs` requiere la sección `audit-logs` y permite:

- Consultar actividad paginada y buscar por responsable, correo, código o registro afectado.
- Filtrar por acción, entidad y rango de fechas.
- Revisar el detalle con la comparación de valores anteriores y nuevos.
- Exportar a PDF o Excel conservando los filtros activos.

La interfaz no permite modificar ni eliminar registros de auditoría. El backend conserva la autorización definitiva y devuelve al responsable cuando el usuario aún existe.
