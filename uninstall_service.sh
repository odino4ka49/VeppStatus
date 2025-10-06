#!/bin/bash
# Универсальный скрипт для удаления VeppStatus systemd сервиса

set -e

echo "🗑️  Удаление VeppStatus systemd сервиса..."

# Проверяем права root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Этот скрипт должен запускаться от имени root (sudo)"
   exit 1
fi

# Определяем пути
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_USER=$(stat -c '%U' "$SCRIPT_DIR")

echo "👤 Пользователь проекта: $PROJECT_USER"
echo "📁 Путь к проекту: $SCRIPT_DIR"

# Останавливаем сервис если он запущен
if systemctl is-active --quiet veppstatus; then
    echo "🛑 Остановка сервиса..."
    systemctl stop veppstatus
fi

# Отключаем автозапуск
if systemctl is-enabled --quiet veppstatus; then
    echo "🔌 Отключение автозапуска..."
    systemctl disable veppstatus
fi

# Удаляем файл сервиса
if [[ -f /etc/systemd/system/veppstatus.service ]]; then
    rm -f /etc/systemd/system/veppstatus.service
    echo "✅ Файл сервиса удален"
fi

# Перезагружаем systemd
systemctl daemon-reload
echo "✅ systemd перезагружен"

echo ""
echo "🎉 VeppStatus systemd сервис успешно удален!"
echo ""
echo "📋 Для запуска вручную используйте:"
echo "  ./start_veppstatus.sh"
echo ""
echo "📋 Для повторной установки сервиса:"
echo "  sudo ./install_service_universal.sh"
