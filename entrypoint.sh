#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npm run migration:run:prod
  echo "Migrations completed."
fi

# Start the application
echo "Starting NestJS application..."
exec node dist/main

