#!/bin/bash
# Универсальный скрипт для управления автозапуском VeppStatus
# Автоматически определяет пользователя и пути

set -e

echo "🔧 Управление автозапуском VeppStatus..."

# Проверяем права root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Этот скрипт должен запускаться от имени root (sudo)"
   exit 1
fi

# Определяем пути
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_USER=$(stat -c '%U' "$SCRIPT_DIR")
PROJECT_GROUP=$(stat -c '%G' "$SCRIPT_DIR")

echo "👤 Пользователь проекта: $PROJECT_USER"
echo "👥 Группа проекта: $PROJECT_GROUP"
echo "📁 Путь к проекту: $SCRIPT_DIR"

# Функция для проверки статуса автозапуска
check_autostart() {
    if systemctl is-enabled --quiet veppstatus 2>/dev/null; then
        echo "✅ Автозапуск ВКЛЮЧЕН - сервис будет запускаться при перезагрузке"
        return 0
    else
        echo "❌ Автозапуск ОТКЛЮЧЕН - сервис НЕ будет запускаться при перезагрузке"
        return 1
    fi
}

# Функция для включения автозапуска
enable_autostart() {
    echo "🔌 Включение автозапуска..."
    systemctl enable veppstatus.service
    echo "✅ Автозапуск включен"
}

# Функция для отключения автозапуска
disable_autostart() {
    echo "🔌 Отключение автозапуска..."
    systemctl disable veppstatus.service
    echo "✅ Автозапуск отключен"
}

# Функция для показа информации
show_info() {
    echo ""
    echo "📋 Информация о сервисе:"
    echo "  Имя сервиса: veppstatus"
    echo "  Файл сервиса: /etc/systemd/system/veppstatus.service"
    echo "  Пользователь: $PROJECT_USER"
    echo "  Группа: $PROJECT_GROUP"
    echo "  Рабочая директория: $SCRIPT_DIR"
    echo "  Целевой уровень: multi-user.target (запуск при загрузке системы)"
    echo ""
    
    # Проверяем статус автозапуска
    check_autostart
    
    echo ""
    echo "📋 Статус сервиса:"
    systemctl status veppstatus --no-pager -l || true
    
    echo ""
    echo "📋 Команды для управления автозапуском:"
    echo "  sudo systemctl enable veppstatus   # Включить автозапуск"
    echo "  sudo systemctl disable veppstatus  # Отключить автозапуск"
    echo "  sudo systemctl is-enabled veppstatus # Проверить статус автозапуска"
}

# Обработка аргументов командной строки
case "${1:-info}" in
    "enable")
        enable_autostart
        ;;
    "disable")
        disable_autostart
        ;;
    "check"|"status")
        check_autostart
        ;;
    "info"|"")
        show_info
        ;;
    *)
        echo "❌ Неизвестная команда: $1"
        echo ""
        echo "📋 Использование:"
        echo "  $0 enable   # Включить автозапуск"
        echo "  $0 disable  # Отключить автозапуск"
        echo "  $0 check    # Проверить статус автозапуска"
        echo "  $0 info     # Показать полную информацию"
        exit 1
        ;;
esac
