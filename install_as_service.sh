#!/bin/bash
# Скрипт для установки VeppStatus как системной службы

set -e

echo "🚀 Установка VeppStatus как системной службы..."

# Определяем пути
INSTALL_DIR="/opt/veppstatus"
VENV_DIR="$INSTALL_DIR/venv"
CURRENT_USER="$SUDO_USER"

# Проверяем, что скрипт запущен с правами root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Для установки системных служб нужны права root"
    echo "📝 Запустите: sudo $0"
    exit 1
fi

echo "👤 Текущий пользователь: $CURRENT_USER"
echo "📁 Установка в: $INSTALL_DIR"

# Проверяем наличие Python
echo "🐍 Проверка Python..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    echo "✅ Найден python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    echo "✅ Найден python"
else
    echo "❌ Python не найден. Установите Python3 и попробуйте снова."
    echo "📦 Для Ubuntu/Debian: sudo apt install python3 python3-venv"
    echo "📦 Для CentOS/RHEL: sudo yum install python3 python3-venv"
    exit 1
fi

# Проверяем версию Python
PYTHON_VERSION=$($PYTHON_CMD -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "unknown")
echo "📋 Версия Python: $PYTHON_VERSION"

# Проверяем наличие модуля venv
if ! $PYTHON_CMD -m venv --help &> /dev/null; then
    echo "❌ Модуль venv недоступен."
    echo "📦 Установите пакет python3-venv:"
    echo "   sudo apt install python3-venv"
    echo "   или для конкретной версии Python:"
    echo "   sudo apt install python$PYTHON_VERSION-venv"
    exit 1
fi

# Создаем пользователя для службы (если не существует)
if ! id "veppstatus" &>/dev/null; then
    echo "👤 Создание пользователя veppstatus..."
    useradd -r -s /bin/false -d /opt/veppstatus veppstatus
    echo "✅ Пользователь veppstatus создан"
else
    echo "✅ Пользователь veppstatus уже существует"
fi

# Создаем директорию установки
echo "📁 Создание директории установки..."
mkdir -p $INSTALL_DIR
chown veppstatus:veppstatus $INSTALL_DIR

# Получаем путь к исходному проекту (папка, где находится скрипт)
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
echo "📋 Копирование файлов из: $SCRIPT_DIR"

# Копируем проект
echo "📋 Копирование файлов проекта..."
cp -r $SCRIPT_DIR/curgraph $INSTALL_DIR/
cp -r $SCRIPT_DIR/current-interface $INSTALL_DIR/
cp $SCRIPT_DIR/requirements.txt $INSTALL_DIR/

# Устанавливаем права доступа
chown -R veppstatus:veppstatus $INSTALL_DIR
chmod +x $INSTALL_DIR/current-interface/*.py

# Создаем виртуальное окружение
echo "🐍 Создание виртуального окружения..."
$PYTHON_CMD -m venv $VENV_DIR
sudo -u veppstatus $VENV_DIR/bin/pip install --upgrade pip
sudo -u veppstatus $VENV_DIR/bin/pip install -r $INSTALL_DIR/requirements.txt

# Выполняем миграции Django
echo "🗄️ Выполнение миграций Django..."
cd $INSTALL_DIR/curgraph
sudo -u veppstatus $VENV_DIR/bin/python manage.py migrate --settings=curgraph.settings
cd $INSTALL_DIR

# Копируем файлы systemd служб
echo "⚙️ Копирование конфигурации systemd..."
cp $SCRIPT_DIR/veppstatus-django.service /etc/systemd/system/
cp $SCRIPT_DIR/veppstatus-data.service /etc/systemd/system/

# Перезагружаем systemd
systemctl daemon-reload

# Включаем службы
echo "🔧 Запуск служб..."
systemctl enable veppstatus-data.service
systemctl enable veppstatus-django.service

echo ""
echo "✅ Установка завершена!"
echo ""
echo "📋 Основные команды управления службами:"
echo "  sudo systemctl start veppstatus-django    # Запуск Django"
echo "  sudo systemctl start veppstatus-data      # Запуск сервера данных"
echo "  sudo systemctl stop veppstatus-django     # Остановка Django"
echo "  sudo systemctl stop veppstatus-data       # Остановка сервера данных"
echo "  sudo systemctl status veppstatus-django   # Статус Django"
echo "  sudo systemctl status veppstatus-data     # Статус сервера данных"
echo ""
echo "📋 Просмотр логов:"
echo "  sudo journalctl -u veppstatus-django -f   # Логи Django"
echo "  sudo journalctl -u veppstatus-data -f     # Логи сервера данных"
echo ""
echo "📋 Автозапуск после перезагрузки:"
echo "  ✅ Службы уже включены для автозапуска"
echo ""
echo "🚀 Запуск служб сейчас:"
echo "  sudo systemctl start veppstatus-data"
echo "  sudo systemctl start veppstatus-django"
echo ""
echo "🌐 Сервер будет доступен по адресу:"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "  http://$SERVER_IP:8000"
echo ""
echo "⚡ Службы настроены для автоматического перезапуска при сбоях!"