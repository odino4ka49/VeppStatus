#!/bin/bash
# Скрипт для настройки виртуального окружения VeppStatus

set -e  # Остановка при ошибке

echo "🚀 Настройка виртуального окружения для VeppStatus..."

# Проверяем наличие Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден. Установите Python3 и попробуйте снова."
    exit 1
fi

# Проверяем версию Python
PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "📋 Найден Python $PYTHON_VERSION"

# Проверяем наличие python3-venv
if ! python3 -m venv --help &> /dev/null; then
    echo "❌ Модуль venv недоступен."
    echo "📦 Установите пакет python3-venv:"
    echo "   sudo apt install python3-venv"
    echo "   или для конкретной версии Python:"
    echo "   sudo apt install python$PYTHON_VERSION-venv"
    exit 1
fi

# Создаем виртуальное окружение
echo "📦 Создание виртуального окружения..."
python3 -m venv veppstatus_env

# Активируем окружение
echo "🔧 Активация виртуального окружения..."
source veppstatus_env/bin/activate

# Обновляем pip
echo "⬆️  Обновление pip..."
pip install --upgrade pip

# Устанавливаем зависимости
echo "📚 Установка зависимостей..."
pip install -r requirements.txt

# Проверяем установку Django
echo "✅ Проверка установки Django..."
python -c "import django; print(f'Django {django.get_version()} установлен успешно')"

# Проверяем другие модули
echo "✅ Проверка других модулей..."
python -c "import zerorpc, zmq, psycopg2; print('Все основные модули установлены')"

echo ""
echo "🎉 Виртуальное окружение настроено успешно!"
echo ""
echo "📝 Для активации окружения выполните:"
echo "   source veppstatus_env/bin/activate"
echo ""
echo "🚀 Для запуска Django сервера:"
echo "   cd curgraph && python manage.py runserver"
echo ""
echo "🔧 Для запуска сервера сбора данных:"
echo "   cd current-interface && python current_state_server.py"
echo ""
echo "❌ Для деактивации окружения:"
echo "   deactivate"
