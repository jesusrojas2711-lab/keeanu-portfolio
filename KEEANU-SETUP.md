# Keeanu — panel de proyectos y fotos

## Preparado en el proyecto

Next.js 16.3.4 con clientes SSR de Supabase y variables locales ignoradas por Git. Login por correo/contraseña y cierre de sesión local. El servidor valida la identidad con getUser y consulta portfolio_admins bajo RLS en cada operación protegida. No confía en user_metadata, un UID enviado desde el navegador ni getSession.

## Migraciones de Supabase

Aplicada según confirmación del usuario: `supabase/migrations/202609100001_portfolio_admins.sql` en SQL Editor del proyecto wqldecfbovawesodvros. Asigna únicamente el UID 731d36d2-fa78-47d8-a050-7507c17b5733. Si el UID no existe o una prueba falla, la transacción revierte todos los cambios. Si la tabla ya existe, detenerse y revisar en lugar de eliminarla.

La clave publicable no permite crear esta tabla ni conceder permisos. La migración requiere la sesión de propietario en el panel de Supabase; no introducir service_role ni contraseñas en el código. Hasta ejecutar la migración, la comprobación de permisos falla cerrada. La consulta incluye comprobaciones de privilegios y simulación de lectura con ambos roles.

## Comprobación de acceso

1. Reiniciar `npm run dev` y abrir http://localhost:3000/login.
2. Entrar con el correo y contraseña del usuario creado en Supabase. No compartir la contraseña en el chat. Debe aparecer "You have administrator access.".
3. Cerrar sesión y volver a /admin: debe ir a /login. Las API privadas deben responder 401.
4. Un usuario válido sin fila en portfolio_admins debe obtener 403; errores de configuración o conexión deben devolver 503 sin datos privados.
5. Para revocar acceso, eliminar su fila como propietario desde Supabase. La siguiente operación del servidor vuelve a consultar el permiso.

`node --test tests/admin-auth.test.mjs` prueba la lógica con dobles controlados de Auth y base de datos. Estas pruebas no sustituyen el inicio de sesión real ni las comprobaciones SQL en Supabase.

## Estructura

- `app/_lib/auth.ts`: identidad y autorización del servidor.
- `app/login/page.tsx`, `app/_components/login-form.tsx`: inicio de sesión; sin registro público. Supabase recibe la contraseña directamente y aplica sus límites de autenticación.
- `app/admin/page.tsx`: acceso privado con estados de denegación y fallo de conexión.
- `app/_components/sign-out-button.tsx`: cierra la sesión de este dispositivo.
- `lib/supabase/*`, `proxy.ts`: clientes por entorno y renovación de cookies, sin caché en rutas de sesión. Cada nueva ruta con sesión debe incluirse en matcher.
- `app/api/admin/projects` y rutas por ID: crear borrador, listar con paginación, editar y publicar/despublicar. Se verifica identidad y permiso en cada operación.
- `app/api/admin/uploads`: comprueba origen, limita el cuerpo, decodifica JPEG/PNG/WebP, elimina metadatos, orienta y convierte a WebP hasta 2400 px. Guarda por Storage API con la sesión del administrador, sin clave secreta. Si falla guardar la asociación, intenta limpiar el objeto; informa si la limpieza falla.
- `/media/[id]` y `/work/[slug]`: acceso público sin cookies de administrador, con RLS. Las fotos usan enlaces firmados de 60 segundos, sin caché en las rutas de redirección.
- El panel permite eliminar fotos de borradores después de una confirmación; no incluye borrado completo de proyectos.
- `app/api/contact`: origen exacto, JSON máximo de 16 KiB, validación, campo trampa y límite distribuido por hora. Guarda mensajes solo mediante una clave secreta del servidor; nunca la entrega al navegador.
- `app/api/admin/messages`: bandeja privada. Solo el administrador puede leer y cambiar el estado de un mensaje gracias a RLS.
- `.env.example`: plantilla; `.env.local` nunca se versiona. SITE_URL debe coincidir exactamente con el origen del navegador.

## Siguientes etapas

Aplicar `supabase/migrations/202609100003_contact_messages.sql` y añadir `SUPABASE_SECRET_KEY` únicamente a `.env.local`. El aviso de privacidad está en `/privacy`; los límites guardan hashes HMAC y no direcciones IP legibles. Antes del despliegue público se añadirá CAPTCHA y MFA para el administrador.

Después: GitHub y Vercel, variables por entorno, callbacks permitidos, dominio HTTPS, CSP compatible con Next.js, monitorización y actualizaciones. No hacer exportación estática: las API necesitan servidor. Nunca publicar borradores ni usar una clave secreta en NEXT_PUBLIC_.

Fuentes: https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/auth/server-side/creating-a-client ; https://nextjs.org/docs/app/guides/authentication . También se revisó la documentación de la versión instalada de Next.js.

## Proyectos y Storage: consulta preparada

La migración `supabase/migrations/202609100002_projects_and_storage.sql` crea proyectos, fotos y un depósito privado con RLS. Aplicada según confirmación del usuario; se verificó lectura anónima de ambas tablas en Supabase. Las pruebas SQL se ejecutaron localmente antes de entregarla. Ver `supabase/README.md` para el modelo, límites y el siguiente paso de la interfaz de administración.

## Uso del panel

Entrar a `/admin`, pulsar New project, escribir título, dirección con minúsculas/guiones, categoría y descripción; pulsar Create draft. Subir una foto por vez (JPEG/PNG/WebP, hasta 4 MiB y 40 megapíxeles, sin animación). El límite del panel es menor al bucket para permanecer debajo del límite de cuerpo de las funciones de Vercel. Añadir descripción de accesibilidad y pulsar Upload photo. Save and publish guarda el texto y publica; exige al menos una foto. Para editar algo publicado, usar Move to drafts.

Máximo 200 fotos por proyecto en el panel. La portada muestra hasta 100 proyectos publicados, ordenados por Display order y fecha; la lista administrativa pagina de 12 en 12. No se implementa todavía vídeo. El contacto queda listo después de aplicar la migración 003 y configurar la clave secreta del servidor.

Validación: compilación de producción, revisión ESLint y 21 pruebas automatizadas. También se comprobó el recorrido real de fotografía publicada y el envío real de contacto; el mensaje de prueba se archivó. La comprobación remota confirmó que un visitante anónimo no puede leer la bandeja ni ejecutar la función privada.
