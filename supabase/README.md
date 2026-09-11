# Keeanu: base de datos y almacenamiento

## Orden

1. `migrations/202609100001_portfolio_admins.sql`: administrador (ya aplicado según la confirmación del usuario).
2. `migrations/202609100002_projects_and_storage.sql`: proyectos, fotos, depósito privado y políticas. Ejecutar una sola vez en SQL Editor, en el proyecto wqldecfbovawesodvros.
3. `migrations/202609100003_contact_messages.sql`: bandeja privada y límites por hora con huellas irreversibles. Ejecutar una sola vez después de la segunda.

La segunda consulta no modifica las tablas anteriores ni elimina políticas existentes. Si ya existe alguno de sus objetos, detenerse y revisar. Contiene pruebas transaccionales de lectura y escritura de proyectos/fotos como administrador, usuario sin permiso y visitante; los registros de prueba no se guardan. Un fallo revierte la consulta completa.

## Modelo

- `projects`: título, slug, categoría weddings/films/commercial, descripción, orden y estado draft/published. Los nuevos proyectos son borradores por defecto. No guardar información privada en sus campos: todos se consideran publicables al publicar el proyecto.
- `project_assets`: fotos asociadas, texto alternativo y orden. La ruta siempre pertenece al proyecto indicado.
- `portfolio`: depósito privado, máximo 10 MiB por archivo, JPEG/PNG/WebP. Vídeos y SVG no están habilitados.
- `keeanu_private.is_portfolio_admin()`: consulta el permiso del usuario de la petición. No acepta un UID externo, fija search_path y no expone la tabla de administradores. Mantener este esquema fuera de los esquemas expuestos por Data API.

## Flujo que implementará la aplicación

1. Crear proyecto en draft.
2. Validar el contenido real y dimensiones de la imagen en servidor, eliminar metadatos sensibles como GPS y optimizarla antes de subir. Los filtros MIME/extensión del bucket no sustituyen esa validación.
3. Subir por Storage API bajo `project-id/uuid-aleatorio.webp` (o jpg/jpeg/png), sin reutilizar nombres.
4. Insertar project_assets con la ruta exacta. Un objeto sin asociación queda privado.
5. Publicar mediante el cambio de estado del proyecto. Las políticas permiten entonces leer solo sus fotos vinculadas. Nunca activar el flag public del depósito.
6. Para quitar un archivo, usar Storage API, no borrar filas de storage.objects con SQL. El borrado de un proyecto elimina las asociaciones, pero no los archivos físicos; habrá que limpiarlos por Storage API.

El frontend usará descargas autenticadas o URLs firmadas breves. No usar getPublicUrl en este depósito. Las URLs firmadas previamente emitidas pueden seguir funcionando hasta caducar y las imágenes ya descargadas no se pueden revocar.

## Validación realizada antes de aplicar

Ambas migraciones ejecutadas contra PostgreSQL local en PGlite, con réplicas mínimas de roles y esquemas auth/storage. Pasaron las pruebas incluidas de tablas, privacidad de fotos, bloqueo de escrituras no autorizadas, carga de rutas válidas por administrador, bloqueo de rutas inválidas y resistencia a políticas permisivas ajenas. Las pruebas locales no verifican Supabase remoto, tokens reales, bytes de archivos ni límites de Storage API. Estos controles se probarán cuando esté habilitada la carga real.

El panel ya permite crear/editar borradores, subir y quitar fotos, publicar y despublicar. La carga del panel limita cada foto a 4 MiB y comprueba el contenido real antes de optimizar y guardar. El bucket mantiene el límite de 10 MiB. Las fotos publicadas se sirven mediante URLs firmadas de 60 segundos. Queda pendiente el recorrido real de carga y publicación con una foto del usuario.

Fuentes: https://supabase.com/docs/guides/storage/security/access-control ; https://supabase.com/docs/guides/storage/buckets/creating-buckets ; https://supabase.com/docs/guides/database/postgres/row-level-security

## Contacto

La tabla `contact_messages` no permite lectura ni escritura anónima. La función `submit_contact` solo se concede al rol interno `service_role`; la ruta de servidor la llama con `SUPABASE_SECRET_KEY`. La bandeja se lee con la sesión normal del administrador y RLS. Los límites por IP y correo usan hashes HMAC y conservan los eventos durante un máximo aproximado de dos días.
