#!/bin/bash
# Простой скрипт для передачи проекта на удаленный сервер

set -e

echo "🚀 Трансфер VeppStatus на удаленный сервер..."

# Проверяем аргументы
if [ $# -ne 2 ]; then
    echo "❌ Неверное количество аргументов"
    echo "📝 Использование: $0 USER@SERVER_IP LOCAL_PATH_TO_PROJECT"
    echo "📝 Пример: $0 root@192.168.1.100 /home/user/VeppStatus"
    exit 1
fi

SERVER=$1
LOCAL_PATH=$2
REMOTE_PATH="/opt/veppstatus"

echo "📋 Параметры трансфера:"
echo "  Сервер: $SERVER"
echo "  Локальный путь: $LOCAL_PATH"
echo "  Удаленный путь: $REMOTE_PATH"

# Проверяем подключение к серверу
echo "🔍 Проверка подключения к серверу..."
if ! ssh -o ConnectTimeout=10 $SERVER "echo '✅ Подключение установлено'" > /dev/null 2>&1; then
    echo "❌ Не удается подключиться к серверу"
    echo "📝 Проверьте SSH ключи и доступность сервера"
    exit 1
fi

echo "📁 Создание директории на сервере..."
ssh $SERVER "sudo mkdir -p $REMOTE_PATH && sudo chmod 777 $REMOTE_PATH"

echo "📋 Копирование файлов проекта..."
rsync -avz --progress \
    --exclude='veppstatus_env/' \
    --exclude='.git/' \
    --exclude='*.pyc' \
    --exclude='__pycache__/' \
    --exclude='db.sqlite3' \
    --exclude='week_data' \
    --exclude='logs/' \
    $LOCAL_PATH/ $SERVER:$REMOTE_PATH/

echo "🔧 Настройка прав доступа..."
ssh $SERVER "sudo chown -R root:root $REMOTE_PATH && sudo chmod +x $REMOTE_PATH/install_as_service.sh"

echo "📋 Инструкции для установки:"
echo ""
echo "🔧 Подключитесь к серверу:"
echo "  ssh $SERVER"
echo ""
echo "📁 Перейдите в директорию проекта:"
echo "  cd $REMOTE_PATH"
echo ""
echo "🚀 Запустите автоматическую установку:"
echo "  sudo ./install_as_service.sh"
echo ""
echo "✅ После установки службы будут доступны по адресу:"
echo "  http://$(echo $SERVER | cut -d'@' -f2):8000"
echo ""
echo "📋 Полезные команды управления:"
echo "  sudo systemctl start veppstatus-django     # Запуск служб"
echo "  sudo systemctl status veppstatus-django    # Проверка статуса"
echo "  sudo journalctl -u veppstatus-django -f     # Просмотр логов"
echo ""
echo "🎉 Трансфер завершен! Следуйте инструкциям выше для установки."
