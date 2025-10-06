#!/bin/bash
# Универсальный скрипт установки VeppStatus systemd сервиса
# Автоматически определяет пользователя и пути

set -e

echo "🔧 Установка VeppStatus как systemd сервиса..."

# Проверяем права root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Этот скрипт должен запускаться от имени root (sudo)"
   exit 1
fi

# Определяем пути
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/veppstatus.service"
SERVICE_SCRIPT="$SCRIPT_DIR/veppstatus_service.sh"

# Определяем пользователя и группу (владелец директории проекта)
PROJECT_USER=$(stat -c '%U' "$SCRIPT_DIR")
PROJECT_GROUP=$(stat -c '%G' "$SCRIPT_DIR")

echo "👤 Пользователь проекта: $PROJECT_USER"
echo "👥 Группа проекта: $PROJECT_GROUP"
echo "📁 Путь к проекту: $SCRIPT_DIR"

# Проверяем наличие файлов
if [[ ! -f "$SERVICE_FILE" ]]; then
    echo "❌ Файл сервиса не найден: $SERVICE_FILE"
    exit 1
fi

if [[ ! -f "$SERVICE_SCRIPT" ]]; then
    echo "❌ Скрипт запуска не найден: $SERVICE_SCRIPT"
    exit 1
fi

# Проверяем наличие виртуального окружения
if [[ ! -f "$SCRIPT_DIR/veppstatus_env/bin/activate" ]]; then
    echo "❌ Виртуальное окружение не найдено: $SCRIPT_DIR/veppstatus_env/bin/activate"
    echo "📝 Запустите setup_venv.sh для создания окружения."
    exit 1
fi

# Создаем временный файл сервиса с правильными путями и пользователем
TEMP_SERVICE="/tmp/veppstatus.service"
cat > "$TEMP_SERVICE" << EOF
[Unit]
Description=VeppStatus - Django веб-сервер и сервер сбора данных
Documentation=https://github.com/odino4ka49/VeppStatus
After=network.target
Wants=network.target

[Service]
Type=simple
User=$PROJECT_USER
Group=$PROJECT_GROUP
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/veppstatus_service.sh
ExecReload=/bin/kill -HUP \$MAINPID
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=30
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=veppstatus

# Переменные окружения
Environment=PATH=$SCRIPT_DIR/veppstatus_env/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=VIRTUAL_ENV=$SCRIPT_DIR/veppstatus_env

# Ограничения ресурсов
LimitNOFILE=65536
LimitNPROC=4096

# Безопасность
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$SCRIPT_DIR

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Создан временный файл сервиса с правильными путями"

# Делаем скрипт исполняемым
chmod +x "$SERVICE_SCRIPT"
echo "✅ Скрипт запуска сделан исполняемым"

# Копируем файл сервиса в systemd
cp "$TEMP_SERVICE" /etc/systemd/system/veppstatus.service
echo "✅ Файл сервиса скопирован в /etc/systemd/system/"

# Удаляем временный файл
rm -f "$TEMP_SERVICE"

# Перезагружаем systemd
systemctl daemon-reload
echo "✅ systemd перезагружен"

# Включаем автозапуск
systemctl enable veppstatus.service
echo "✅ Автозапуск включен"

echo ""
echo "🎉 VeppStatus успешно установлен как systemd сервис!"
echo ""
echo "📋 Информация о сервисе:"
echo "  Пользователь: $PROJECT_USER"
echo "  Группа: $PROJECT_GROUP"
echo "  Рабочая директория: $SCRIPT_DIR"
echo "  Виртуальное окружение: $SCRIPT_DIR/veppstatus_env"
echo ""
echo "📋 Команды для управления сервисом:"
echo "  sudo systemctl start veppstatus    # Запустить сервис"
echo "  sudo systemctl stop veppstatus     # Остановить сервис"
echo "  sudo systemctl restart veppstatus  # Перезапустить сервис"
echo "  sudo systemctl status veppstatus   # Статус сервиса"
echo "  sudo journalctl -u veppstatus -f   # Просмотр логов"
echo ""
echo "🚀 Для запуска сервиса выполните:"
echo "  sudo systemctl start veppstatus"
