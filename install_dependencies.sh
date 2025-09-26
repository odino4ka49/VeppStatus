#!/bin/bash
# Скрипт для установки системных зависимостей VeppStatus

set -e

echo "🔧 Установка системных зависимостей для VeppStatus..."

# Проверяем, что мы на Ubuntu/Debian
if ! command -v apt &> /dev/null; then
    echo "❌ Этот скрипт предназначен для Ubuntu/Debian систем."
    echo "📝 Для других систем установите python3-venv вручную."
    exit 1
fi

# Проверяем права sudo
if ! sudo -n true 2>/dev/null; then
    echo "⚠️  Требуются права sudo для установки пакетов."
    echo "📝 Запустите: sudo $0"
    exit 1
fi

echo "📋 Обновление списка пакетов..."
sudo apt update

echo "📦 Установка Python и venv..."
sudo apt install -y python3 python3-pip python3-venv

# Определяем версию Python для установки конкретного пакета venv
PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "📋 Установка python$PYTHON_VERSION-venv..."

# Пытаемся установить конкретную версию venv
if sudo apt install -y python$PYTHON_VERSION-venv 2>/dev/null; then
    echo "✅ python$PYTHON_VERSION-venv установлен"
else
    echo "⚠️  Не удалось установить python$PYTHON_VERSION-venv"
    echo "📝 Попробуйте: sudo apt install python3-venv"
fi

# Дополнительные пакеты для разработки (опционально)
echo "📦 Установка дополнительных пакетов для разработки..."
sudo apt install -y python3-dev build-essential

# Проверяем установку
echo "✅ Проверка установки..."
python3 -c "import sys; print(f'Python {sys.version}')"
python3 -m venv --help > /dev/null && echo "✅ venv модуль работает" || echo "❌ venv модуль не работает"

echo ""
echo "🎉 Системные зависимости установлены!"
echo ""
echo "📝 Теперь можете запустить:"
echo "   ./setup_venv.sh"
echo ""
echo "📋 Или вручную:"
echo "   python3 -m venv veppstatus_env"
echo "   source veppstatus_env/bin/activate"
echo "   pip install -r requirements.txt"

