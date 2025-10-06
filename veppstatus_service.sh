#!/bin/bash
# Скрипт запуска VeppStatus для systemd сервиса
# Этот скрипт запускает оба сервера в фоновом режиме

set -e

# Определяем пути
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Проверяем наличие виртуального окружения
if [[ ! -f "veppstatus_env/bin/activate" ]]; then
    echo "❌ Виртуальное окружение не найдено: $SCRIPT_DIR/veppstatus_env/bin/activate"
    echo "📝 Запустите setup_venv.sh для создания окружения."
    exit 1
fi

# Активируем виртуальное окружение
source veppstatus_env/bin/activate

# Проверяем активацию
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "❌ Не удалось активировать виртуальное окружение."
    exit 1
fi

# Функция для запуска Django сервера
start_django() {
    echo "🌐 Запуск Django сервера..."
    cd curgraph
    python manage.py runserver 0.0.0.0:8001 > /dev/null 2>&1 &
    DJANGO_PID=$!
    echo $DJANGO_PID > /tmp/veppstatus_django.pid
    cd ..
    echo "📋 Django PID: $DJANGO_PID"
}

# Функция для запуска сервера сбора данных
start_data_server() {
    echo "📊 Запуск сервера сбора данных..."
    cd current-interface
    
    # Проверяем, доступен ли EPICS
    if python -c "import cothread" 2>/dev/null; then
        echo "✅ EPICS доступен, запускаем основной сервер..."
        LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/ python current_state_server.py > /dev/null 2>&1 &
    else
        echo "⚠️  EPICS недоступен, запускаем мок-сервер..."
        python mock_server.py > /dev/null 2>&1 &
    fi
    
    DATA_PID=$!
    echo $DATA_PID > /tmp/veppstatus_data.pid
    cd ..
    echo "📋 Data Server PID: $DATA_PID"
}

# Функция для остановки серверов
stop_servers() {
    echo "🛑 Остановка серверов..."
    
    # Останавливаем Django сервер
    if [[ -f /tmp/veppstatus_django.pid ]]; then
        DJANGO_PID=$(cat /tmp/veppstatus_django.pid)
        if kill -0 $DJANGO_PID 2>/dev/null; then
            kill $DJANGO_PID
            echo "✅ Django сервер остановлен (PID: $DJANGO_PID)"
        fi
        rm -f /tmp/veppstatus_django.pid
    fi
    
    # Останавливаем сервер сбора данных
    if [[ -f /tmp/veppstatus_data.pid ]]; then
        DATA_PID=$(cat /tmp/veppstatus_data.pid)
        if kill -0 $DATA_PID 2>/dev/null; then
            kill $DATA_PID
            echo "✅ Сервер сбора данных остановлен (PID: $DATA_PID)"
        fi
        rm -f /tmp/veppstatus_data.pid
    fi
}

# Обработка сигналов
trap stop_servers EXIT

# Запускаем серверы
start_django
sleep 2
start_data_server

echo "🎉 VeppStatus запущен!"
echo "🌐 Веб-интерфейс: http://0.0.0.0:8001/interface/"
echo "📊 Сервер сбора данных: tcp://127.0.0.1:4242"

# Ждем завершения (для systemd)
wait
