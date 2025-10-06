# VeppStatus - Инструкции по запуску

## Быстрый старт

### 0. Установка системных зависимостей (Ubuntu/Debian)
```bash
# Если возникает ошибка "ensurepip is not available"
chmod +x install_dependencies.sh
sudo ./install_dependencies.sh
```

### 1. Настройка виртуального окружения
```bash
# Сделать скрипт исполняемым
chmod +x setup_venv.sh

# Запустить настройку
./setup_venv.sh
```

### 2. Запуск проекта (автоматический)
```bash
# Простой запуск всех компонентов
chmod +x start_veppstatus.sh
./start_veppstatus.sh
```

### 3. Запуск проекта (ручной)

#### Django веб-сервер:
```bash
source veppstatus_env/bin/activate
cd curgraph
python manage.py runserver
# Веб-интерфейс будет доступен по адресу: http://127.0.0.1:8000/interface/
```

#### Сервер сбора данных (в отдельном терминале):
```bash
source veppstatus_env/bin/activate
cd current-interface
python current_state_server.py
# Сервер будет слушать на порту 4242 для RPC запросов
```

## Подробные инструкции

### Структура проекта
```
VeppStatus/
├── veppstatus_env/          # Виртуальное окружение
├── curgraph/               # Django веб-приложение
│   ├── manage.py
│   ├── curgraph/
│   └── interface/
├── current-interface/      # Сервер сбора данных
│   ├── current_state_server.py
│   ├── pv_list.json
│   └── status_list.json
├── requirements.txt        # Зависимости Python
├── setup_venv.sh         # Скрипт настройки
└── README.md             # Эта инструкция
```

### Компоненты системы

1. **Django веб-приложение** (`curgraph/`)
   - Веб-интерфейс для отображения данных
   - API для получения данных
   - Статические файлы (CSS, JS)

2. **Сервер сбора данных** (`current-interface/`)
   - Сбор данных с ускорителей через EPICS
   - RPC сервер для предоставления данных
   - Обработка и хранение данных

### Порты и адреса

- **Django сервер**: http://127.0.0.1:8000
- **RPC сервер**: tcp://127.0.0.1:4242
- **ZMQ очередь**: tcp://localhost:5554

### Основные URL

- Главная страница: http://127.0.0.1:8000/interface/
- ВЭПП-3: http://127.0.0.1:8000/interface/vepp3
- ВЭПП-4: http://127.0.0.1:8000/interface/vepp4

### API Endpoints

- `/interface/getTickData` - текущие данные
- `/interface/getWeekData` - недельные данные
- `/interface/getArrByVar` - данные по переменной
- `/interface/getProgramData` - информация о программе

## Устранение проблем

### Ошибка "ensurepip is not available"
```bash
# Ubuntu/Debian - установите python3-venv
sudo apt install python3-venv

# Или для конкретной версии Python (например, Python 3.12)
sudo apt install python3.12-venv

# Альтернативно, используйте наш скрипт
sudo ./install_dependencies.sh
```

### Ошибка "ModuleNotFoundError: No module named 'django.utils.six.moves'"
```bash
# Эта ошибка возникает из-за несовместимости Django 1.8.4 с современными версиями Python
# Решение: обновление Django до версии 2.2.28

# Активируйте виртуальное окружение
source veppstatus_env/bin/activate

# Запустите скрипт обновления
chmod +x update_venv.sh
./update_venv.sh
```

### Ошибка "TabError: inconsistent use of tabs and spaces"
```bash
# Эта ошибка возникает из-за смешанного использования табов и пробелов
# Решение: исправление отступов во всех Python файлах

# Проверьте синтаксис всех файлов
chmod +x check_syntax.sh
./check_syntax.sh

# Если есть ошибки, исправьте их вручную или пересоздайте файлы
```

### Ошибка "ModuleNotFoundError: No module named 'django'"
```bash
# Убедитесь, что виртуальное окружение активировано
source veppstatus_env/bin/activate

# Переустановите зависимости
pip install -r requirements.txt
```

### Ошибка "ModuleNotFoundError: No module named 'cothread'"
```bash
# Эта ошибка возникает при отсутствии EPICS библиотек
# Решение 1: Установка EPICS (для работы с реальными ускорителями)
sudo ./install_epics.sh

# Решение 2: Использование мок-сервера (для тестирования)
cd current-interface
python mock_server.py
```

### Ошибка подключения к базе данных
```bash
# Проверьте настройки в curgraph/settings.py
# По умолчанию используется SQLite
```

### Ошибка EPICS (для сервера сбора данных)
```bash
# Установите EPICS зависимости
sudo apt-get install epics-dev epics-dev-common
pip install cothread pycx4
```

### Проблемы с портами
```bash
# Проверьте, что порты свободны
netstat -tulpn | grep :8000
netstat -tulpn | grep :4242
```

## Разработка

### Добавление новых зависимостей
```bash
# Активируйте окружение
source veppstatus_env/bin/activate

# Установите новый пакет
pip install новый_пакет

# Обновите requirements.txt
pip freeze > requirements.txt
```

### Отладка
```bash
# Запуск Django в режиме отладки
cd curgraph
python manage.py runserver --settings=curgraph.settings

# Логи сервера сбора данных
cd current-interface
python current_state_server.py 2>&1 | tee server.log
```

## Остановка

### Деактивация виртуального окружения
```bash
deactivate
```

### Остановка серверов
```bash
# Django сервер: Ctrl+C в терминале
# Сервер сбора данных: Ctrl+C в терминале
```

## Резервное копирование

### Сохранение данных
```bash
# Файл с данными
cp current-interface/week_data current-interface/week_data.backup

# База данных Django
cp curgraph/db.sqlite3 curgraph/db.sqlite3.backup
```

### Восстановление
```bash
# Восстановление данных
cp current-interface/week_data.backup current-interface/week_data

# Восстановление БД
cp curgraph/db.sqlite3.backup curgraph/db.sqlite3
```

## Systemd сервис (автозапуск)

### Установка как systemd сервиса
```bash
# Установка сервиса (автоматически определяет пользователя и пути)
sudo ./install_service.sh

# Запуск сервиса
sudo systemctl start veppstatus

# Проверка статуса
sudo systemctl status veppstatus
```

### Управление сервисом
```bash
# Основные команды
sudo systemctl start veppstatus    # Запустить
sudo systemctl stop veppstatus     # Остановить
sudo systemctl restart veppstatus  # Перезапустить

# Автозапуск при перезагрузке
sudo ./manage_autostart.sh enable   # Включить
sudo ./manage_autostart.sh disable  # Отключить
sudo ./manage_autostart.sh check    # Проверить

# Просмотр логов
sudo journalctl -u veppstatus -f
```

### Удаление сервиса
```bash
sudo ./uninstall_service.sh
```

**Преимущества systemd сервиса:**
- ✅ Автозапуск при перезагрузке системы
- ✅ Автоматический перезапуск при сбоях
- ✅ Централизованные логи через systemd journal
- ✅ Универсальность - работает на любой машине
