#!/bin/bash
# Скрипт для установки EPICS зависимостей

set -e

echo "🔧 Установка EPICS зависимостей для VeppStatus..."

# Проверяем, что мы на Ubuntu/Debian
if ! command -v apt &> /dev/null; then
    echo "❌ Этот скрипт предназначен для Ubuntu/Debian систем."
    echo "📝 Для других систем установите EPICS вручную."
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

echo "📦 Установка EPICS базовых пакетов..."
sudo apt install -y epics-dev epics-dev-common

echo "📦 Установка дополнительных пакетов для EPICS..."
sudo apt install -y libreadline-dev libncurses5-dev libncursesw5-dev

echo "📦 Установка Python биндингов для EPICS..."
# Активируем виртуальное окружение если оно существует
if [ -d "veppstatus_env" ]; then
    echo "🔧 Активация виртуального окружения..."
    source veppstatus_env/bin/activate
fi

# Устанавливаем Python биндинги
pip install cothread
pip install pycx4

echo "✅ Проверка установки..."
python -c "import cothread; print('✅ cothread установлен')" || echo "❌ cothread не установлен"
python -c "import pycx4; print('✅ pycx4 установлен')" || echo "❌ pycx4 не установлен"

echo ""
echo "🎉 EPICS зависимости установлены!"
echo ""
echo "📝 Теперь можете запустить сервер сбора данных:"
echo "   source veppstatus_env/bin/activate"
echo "   cd current-interface"
echo "   python current_state_server.py"
echo ""
echo "⚠️  Примечание: Для работы с реальными ускорителями"
echo "   необходимо настроить подключение к EPICS серверам."



