# Guía de Configuración de la Base de Datos con XAMPP y MySQL

Esta guía te ayudará a configurar una base de datos local para la aplicación **PizzApp**. Usaremos XAMPP, que es una herramienta excelente para principiantes porque facilita la creación de un servidor web y una base de datos en tu propio ordenador.

## Paso 1: Instalar XAMPP

1.  **Descarga XAMPP**: Ve al sitio web oficial de [Apache Friends](https://www.apachefriends.org/index.html) y descarga la versión de XAMPP para tu sistema operativo (Windows, macOS o Linux).
2.  **Instala XAMPP**: Ejecuta el instalador que descargaste. Sigue las instrucciones en pantalla. En la mayoría de los casos, puedes dejar las opciones por defecto. Asegúrate de que **MySQL** y **phpMyAdmin** estén seleccionados para instalarse.

## Paso 2: Iniciar los Servicios de XAMPP

1.  **Abre el Panel de Control de XAMPP**: Una vez instalado, busca y abre el "XAMPP Control Panel".
2.  **Inicia Apache y MySQL**: En el panel de control, verás una lista de módulos. Haz clic en el botón **"Start"** junto a **Apache** y **MySQL**. Deberían ponerse de color verde para indicar que se están ejecutando correctamente.
    *   **Apache** es el servidor web que te permitirá acceder a la interfaz de la base de datos desde tu navegador.
    *   **MySQL** es el sistema de gestión de base de datos donde guardaremos toda la información de la aplicación.

## Paso 3: Crear la Base de Datos

1.  **Abre phpMyAdmin**: Con Apache y MySQL en funcionamiento, abre tu navegador web (Chrome, Firefox, etc.) y ve a la siguiente dirección: `http://localhost/phpmyadmin/`.
2.  **Crea la base de datos**:
    *   En la página principal de phpMyAdmin, busca la pestaña **"Bases de datos"** (o "Databases") y haz clic en ella.
    *   En el campo que dice "Crear base de datos" (o "Create database"), escribe el nombre de tu base de datos. Para este proyecto, la llamaremos `pizzapp_db`.
    *   En el menú desplegable de al lado (llamado "Cotejamiento" o "Collation"), selecciona `utf8mb4_general_ci`. Esto asegura que podamos guardar caracteres especiales como acentos y emojis sin problemas.
    *   Haz clic en el botón **"Crear"** (o "Create").

¡Felicidades! Acabas de crear tu base de datos. Ahora, necesitamos crear las tablas donde se guardará la información.

## Paso 4: Crear las Tablas con SQL

Las tablas son como hojas de cálculo dentro de tu base de datos. Crearemos tres tablas principales: `users` (para los usuarios), `pizzerias` (para la información de los restaurantes) y `reviews` (para las opiniones de los usuarios).

1.  **Selecciona tu base de datos**: En la lista de la izquierda en phpMyAdmin, haz clic en el nombre de tu base de datos (`pizzapp_db`).
2.  **Abre la pestaña SQL**: En la parte superior, haz clic en la pestaña **"SQL"**.
3.  **Ejecuta los siguientes comandos**: Copia y pega el siguiente código en el cuadro de texto grande y haz clic en el botón **"Continuar"** (o "Go") en la parte inferior derecha.

Este código creará las tres tablas con sus respectivas columnas y relaciones.

```sql
-- ---------------------------------
-- Tabla para los usuarios (users)
-- ---------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100),
  `is_admin` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ------------------------------------
-- Tabla para las pizzerías (pizzerias)
-- ------------------------------------
CREATE TABLE `pizzerias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `lat` DECIMAL(10, 8) NOT NULL,
  `lng` DECIMAL(11, 8) NOT NULL,
  `image_url` VARCHAR(512),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ----------------------------------
-- Tabla para las opiniones (reviews)
-- ----------------------------------
CREATE TABLE `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rating` INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `comment` TEXT,
  `user_id` INT NOT NULL,
  `pizzeria_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`pizzeria_id`) REFERENCES `pizzerias`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

```

### Explicación de las Tablas:

*   **`users`**:
    *   `id`: Un número único para cada usuario (clave primaria).
    *   `email`: El correo del usuario, que también será su nombre de usuario. `UNIQUE` significa que no puede haber dos usuarios con el mismo email.
    *   `password_hash`: Aquí se guardará la contraseña del usuario de forma segura (encriptada). **Nunca guardes contraseñas como texto plano.**
    *   `is_admin`: Un valor `TRUE` o `FALSE` para saber si el usuario es administrador.
*   **`pizzerias`**:
    *   `id`: Un número único para cada pizzería.
    *   `name`, `address`: El nombre y la dirección.
    *   `lat`, `lng`: Las coordenadas geográficas para ubicarla en el mapa.
*   **`reviews`**:
    *   `id`: Un número único para cada opinión.
    *   `rating`, `comment`: La calificación (de 1 a 5 estrellas) y el texto de la opinión.
    *   `user_id`: Un número que conecta la opinión con el usuario que la escribió. Es una **clave foránea** (`FOREIGN KEY`) que apunta al `id` de la tabla `users`.
    *   `pizzeria_id`: Un número que conecta la opinión con la pizzería que se está calificando. Es una **clave foránea** que apunta al `id` de la tabla `pizzerias`.
    *   `ON DELETE CASCADE` significa que si un usuario o una pizzería se elimina, todas sus opiniones asociadas también se eliminarán automáticamente.

## Paso 5: ¡Listo para Conectar!

¡Ya tienes tu base de datos local lista! El siguiente paso en el desarrollo de la aplicación sería conectar tu código de backend (por ejemplo, con Node.js, PHP o Python) a esta base de datos para poder guardar y leer información.

Recuerda que esta configuración es para **desarrollo local**. Cuando quieras que tu aplicación esté disponible en internet para todo el mundo (en producción), necesitarás contratar un servicio de hosting que ofrezca una base de datos MySQL.
