#!/bin/bash
# Скрипт для быстрого запуска VeppStatus

set -e

echo "🚀 Запуск VeppStatus..."

# Активируем виртуальное окружение
echo "🔧 Активация виртуального окружения..."
source veppstatus_env/bin/activate

if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "❌ Не удалось активировать виртуальное окружение."
    echo "📝 Убедитесь, что файл veppstatus_env/bin/activate существует."
    echo "📝 Запустите setup_venv.sh для создания окружения."
    exit 1
fi

echo "✅ Виртуальное окружение активировано: $VIRTUAL_ENV"

# Проверяем наличие Django
if ! python -c "import django" 2>/dev/null; then
    echo "❌ Django не установлен. Запустите setup_venv.sh"
    exit 1
fi

# Функция для запуска Django сервера
start_django() {
    echo "🌐 Запуск Django сервера..."
    cd curgraph
    python manage.py runserver &
    DJANGO_PID=$!
    echo "📋 Django PID: $DJANGO_PID"
    cd ..
}

# Функция для запуска сервера сбора данных
start_data_server() {
    echo "📊 Запуск сервера сбора данных..."
    cd current-interface
    
    # Проверяем, доступен ли EPICS
    if python -c "import cothread" 2>/dev/null; then
        echo "✅ EPICS доступен, запускаем основной сервер..."
        LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/ python current_state_server.py &
    else
        echo "⚠️  EPICS недоступен, запускаем мок-сервер..."
        echo "📝 Для установки EPICS запустите: sudo ./install_epics.sh"
        python mock_server.py &
    fi
    
    DATA_PID=$!
    echo "📋 Data Server PID: $DATA_PID"
    cd ..
}

# Функция для остановки серверов
cleanup() {
    echo ""
    echo "🛑 Остановка серверов..."
    if [[ ! -z "$DJANGO_PID" ]]; then
        kill $DJANGO_PID 2>/dev/null || true
        echo "✅ Django сервер остановлен"
    fi
    if [[ ! -z "$DATA_PID" ]]; then
        kill $DATA_PID 2>/dev/null || true
        echo "✅ Сервер сбора данных остановлен"
    fi
    echo "👋 До свидания!"
    exit 0
}

# Обработка сигналов для корректного завершения
trap cleanup SIGINT SIGTERM

# Запускаем серверы
start_django
sleep 2
start_data_server

echo ""
echo "🎉 VeppStatus запущен!"
echo ""
echo "🌐 Веб-интерфейс: http://127.0.0.1:8000/interface/"
echo "📊 Сервер сбора данных: tcp://127.0.0.1:4242"
echo ""
echo "⏹️  Для остановки нажмите Ctrl+C"
echo ""

# Ждем завершения
wait
