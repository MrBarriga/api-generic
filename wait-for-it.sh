#!/usr/bin/env bash
# wait-for-it.sh

host="$1"
port="$2"

while ! nc -z $host $port; do
  echo "⏳ Aguardando $host:$port..."
  sleep 2
done

echo "✅ $host:$port está disponível!"
exec "${@:3}"
