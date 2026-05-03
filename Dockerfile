FROM php:8.3-apache

# Copiamos el proyecto al directorio web de Apache
COPY . /var/www/html/

# Habilitar mod_rewrite (opcional pero común)
RUN a2enmod rewrite

# Ajustar permisos (opcional pero recomendable)
RUN chown -R www-data:www-data /var/www/html