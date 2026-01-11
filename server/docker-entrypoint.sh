#!/bin/bash
set -e

echo "========================================"
echo "DocuMind Server Startup"
echo "========================================"

# Wait for database to be ready
echo "Waiting for database..."
while ! pg_isready -h ${DB_HOST:-db} -U ${DB_USER:-postgres} -q 2>/dev/null; do
    echo "  Database not ready, waiting..."
    sleep 2
done
echo "Database is ready!"

# Create and run migrations
echo "Creating database migrations..."
python manage.py makemigrations --noinput

echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Seed Egyptian laws (idempotent - skips if already seeded)
echo "Seeding Egyptian laws..."
python manage.py seed_egyptian_laws

echo "========================================"
echo "Startup complete! Starting server..."
echo "========================================"

# Start the server or execute the passed command (for celery worker)
if [ "$#" -gt 0 ]; then
    exec "$@"
else
    exec python manage.py runserver 0.0.0.0:8000
fi
