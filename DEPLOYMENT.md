# Развертывание VeppStatus для постоянной работы серверов

## Обзор

Это руководство поможет развернуть VeppStatus на сервере как постоянную службу с автоматическим восстановлением после сбоев и автозапуском при перезагрузке системы.

## Ключевые преимущества системных служб

✅ **Максимальная надежность** - автозапуск при загрузке системы  
✅ **Профессиональная изоляция** - отдельный пользователь для безопасности  
✅ **Полный контроль** - все стандартные команды управления systemd  
✅ **Централизованные логи** - все события в едином журнале системы  

## Системные требования

- **OS**: Ubuntu 18.04+ + / Debian 9+ / CentOS 7+ / любая система с systemd
- **Python**: 3.6+
- **Права**: sudo доступ к серверу
- **Порты**: Доступ к портам 8000 (Django) и 4242 (ZeroMQ)
- **Диск**: Минимум 5GB свободного места

## Быстрая установка

### Автоматическая установка (рекомендуется)

```bash
# Передача проекта на удаленный сервер
./deploy_to_server.sh youruser@server-ip /path/to/VeppStatus

# Подключение к серверу и установка
ssh youruser@server-ip
cd ~/veppstatus
sudo ./install_as_service.sh
```

Этот скрипт автоматически:
- Создает системного пользователя `veppstatus`
- Устанавливает проект в `/opt/veppstatus`
- Создает виртуальное окружение Python
- Устанавливает все зависимости
- Настраивает systemd службы
- Включает автозапуск

## Детальный процесс установки

### 1. Подготовка системы

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка базовых зависимостей
sudo apt install -y python3 python3-pip python3-venv git
sudo apt install -y postgresql-client

# Установка EPICS зависимостей (если нужны)
sudo apt install -y epics-base
```

### 2. Копирование проекта

```bash
# Определяем директории
INSTALL_DIR="/opt/veppstatus"
PROJECT_DIR="/path/to/your/VeppStatus"

# Копирование файлов
sudo mkdir -p $INSTALL_DIR
sudo cp -r $PROJECT_DIR/curgraph $INSTALL_DIR/
sudo cp -r $PROJECT_DIR/current-interface $INSTALL_DIR/
sudo cp $PROJECT_DIR/requirements.txt $INSTALL_DIR/
sudo cp $PROJECT_DIR/pv_list.json $INSTALL_DIR/
sudo cp $PROJECT_DIR/status_list.json $INSTALL_DIR/

# Установка прав доступа
sudo chown -R veppstatus:veppstatus $INSTALL_DIR
sudo chmod +x $INSTALL_DIR/current-interface/*.py
```

### 3. Настройка пользователя и окружения

```bash
# Создание системного пользователя (если нет)
sudo useradd -r -s /bin/false -d /opt/veppstatus veppstatus

# Создание Python окружения
sudo python3 -m venv $INSTALL_DIR/venv
sudo -u veppstatus $INSTALL_DIR/venv/bin/pip install --upgrade pip
sudo -u veppstatus $INSTALL_DIR/venv/bin/pip install -r $INSTALL_DIR/requirements.txt
```

### 4. Настройка Django

```bash
cd $INSTALL_DIR/curgraph
sudo -u veppstatus $INSTALL_DIR/venv/bin/python manage.py migrate --settings=curgraph.settings
sudo -u veppstatus $INSTALL_DIR/venv/bin/python manage.py collectstatic --settings=curgraph.settings
```

### 5. Установка systemd служб

```bash
# Копирование конфигурационных файлов
sudo cp veppstatus-django.service /etc/systemd/system/
sudo cp veppstatus-data.service /etc/systemd/system/

# Перезагрузка systemd и запуск служб
sudo systemctl daemon-reload
sudo systemctl enable veppstatus-data.service
sudo systemctl enable veppstatus-django.service
```

## Управление службами

### Запуск служб

```bash
# Запуск обеих служб
sudo systemctl start veppstatus-data
sudo systemctl start veppstatus-django

# Проверка статуса
sudo systemctl status veppstatus-django
sudo systemctl status veppstatus-data
```

### Остановка служб

```bash
sudo systemctl stop veppstatus-django
sudo systemctl stop veppstatus-data
```

### Перезапуск служб

```bash
sudo systemctl restart veppstatus-data
sudo systemctl restart veppstatus-django
```

### Просмотр активных служб

```bash
# Список всех служб VeppStatus
sudo systemctl list-units --type=service | grep veppstatus

# Проверка автозапуска
sudo systemctl is-enabled veppstatus-django
sudo systemctl is-enabled veppstatus-data
```

## Мониторинг и логи

### Просмотр логов

```bash
# Логи в реальном времени
sudo journalctl -u veppstatus-django -f
sudo journalctl -u veppstatus-data -f

# Логи за последний час
sudo journalctl -u veppstatus-django --since "1 hour ago"

# Логи с ошибками только
sudo journalctl -u veppstatus-django -p err

# Логи за определенный период
sudo journalctl -u veppstatus-django --since "2024-01-01 00:00:00" --until "2024-01-02 00:00:00"
```

### Мониторинг производительности

```bash
# Использование ресурсов службами
sudo systemctl status veppstatus-django -l
sudo systemctl status veppstatus-data -l

# Проверка портов
sudo netstat -tlnp | grep -E ':(8000|4242)'

# Проверка процессов
ps aux | grep -E '(manage.py|current_state_server)'
```

## Автозапуск и восстановление

### Настройка автозапуска (уже включено скриптом)

```bash
# Включение автозапуска
sudo systemctl enable veppstatus-data
sudo systemctl enable veppstatus-django

# Проверка автозапуска
sudo systemctl is-enabled veppstatus-django
```

### Автоматическое восстановление

Службы автоматически настроены для восстановления:
- `Restart=always` - всегда перезапускать при сбоях
- `RestartSec=10/15` - пауза перед перезапущем
- `After=network.target` - ждут запуска сети

### Проверка автозапуска

```bash
# Перезагружаем для проверки (опционально)
sudo reboot

# После перезагрузки проверяем
sudo systemctl status veppstatus-django
sudo systemctl status veppstatus-data
```

## Настройка firewall

### Ubuntu/Debian (ufw)

```bash
# Разрешаем доступ к веб-интерфейсу
sudo ufw allow 8000/tcp comment "VeppStatus Django"

# Проверяем статус
sudo ufw status
```

### CentOS/RHEL (firewalld)

```bash
# Разрешаем доступ
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload

# Проверяем статус
sudo firewall-cmd --list-ports
```

## Обновление проекта

### Полное обновление

```bash
# Останавливаем службы
sudo systemctl stop veppstatus-django

# Создаем бэкап
sudo cp -r /opt/veppstatus /opt/veppstatus.backup.$(date +%Y%m%d)

# Обновляем код (замените путь на актуальный)
sudo rsync -avz --exclude='venv' /path/to/new/code/ /opt/veppstatus/

# Устанавливаем права
sudo chown -R veppstatus:veppstatus /opt/veppstatus

# Обновляем зависимости
sudo -u veppstatus /opt/veppstatus/venv/bin/pip install -r /opt/veppstatus/requirements.txt

# Выполняем миграции Django
cd /opt/veppstatus/curgraph
sudo -u veppstatus ../venv/bin/python manage.py migrate --settings=curgraph.settings
sudo -u veppstatus ../venv/bin/python manage.py collectstatic --settings=curgraph.settings

# Перезапускаем службы
sudo systemctl restart veppstatus-data
sudo systemctl restart veppstatus-django
```

## Устранение проблем

### Общие команды диагностики

```bash
# Проверка статуса всех служб
sudo systemctl status veppstatus-*

# Проверка логов на ошибки
sudo journalctl -u veppstatus-django -p err -n 50
sudo journalctl -u veppstatus-data -p err -n 50

# Проверка портов
sudo netstat -tlnp | grep -E ':(8000|4242)'

# Проверка процессов
ps aux | grep veppstatus
```

### Проблемы с портами

```bash
# Проверяем, какие процессы используют порты
sudo lsof -i :8000
sudo lsof -i :4242

# Убиваем процессы (осторожно!)
sudo fuser -k 8000/tcp
sudo fuser -k 4242/tcp

# Перезапускаем службы
sudo systemctl restart veppstatus-data
sudo systemctl restart veppstatus-django
```

### Проблемы с Django

```bash
cd /opt/veppstatus/curgraph

# Проверяем миграции
sudo -u veppstatus ../venv/bin/python manage.py showmigrations
sudo -u veppstatus ../venv/bin/python manage.py migrate --settings=curgraph.settings

# Проверяем конфигурацию
sudo -u veppstatus ../venv/bin/python manage.py check --settings=curgraph.settings

# Создаем суперпользователя (если нужен)
sudo -u veppstatus ../venv/bin/python manage.py createsuperuser
```

### Проблемы с EPICS

```bash
# Проверяем наличие библиотек
sudo ldconfig -p | grep libca

# Проверяем переменные окружения в службе
sudo systemctl show veppstatus-data.service | grep Environment
```

### Полный перезапуск

```bash
# Полная остановка
sudo systemctl stop veppstatus-django
sudo systemctl stop veppstatus-data

# Ожидание освобождения портов
sleep 5

# Запуск в правильном порядке
sudo systemctl start veppstatus-data
sleep 3
sudo systemctl start veppstatus-django

# Проверка статуса
sudo systemctl status veppstatus-django
sudo systemctl status veppstatus-data
```

## Производительность и масштабирование

### Оптимизация для продакшена

Для высоконагруженных систем рекомендуется использовать WSGI сервер:

```bash
# Установка Gunicorn
sudo -u veppstatus /opt/veppstatus/venv/bin/pip install gunicorn

# Создание конфигурации Gunicorn
sudo tee /opt/veppstatus/gunicorn.conf.py > /dev/null << 'EOF'
bind = "0.0.0.0:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2
USER = "veppstatus"
GROUP = "veppstatus"
preload_app = True
EOF

# Обновление ExecStart в veppstatus-django.service
sudo systemctl edit veppstatus-django.service
# Добавить:
# ExecStart=/opt/veppstatus/venv/bin/gunicorn curgraph.wsgi:application -c /opt/veppstatus/gunicorn.conf.py
```

### Мониторинг ресурсов

```bash
# Установка утилит мониторинга
sudo apt install -y htop iotop

# Мониторинг в реальном времени
htop

# Мониторинг диска
sudo iotop
```

## Безопасность

### Настройки безопасности служб

Systemd службы уже настроены с базовыми мерами безопасности:
- Отдельный пользователь `veppstatus`
- Ограничения файловой системы (`ProtectSystem`, `ReadOnlyPaths`)
- Защита домашних директорий (`ProtectHome`)
- Отключение новых привилегий (`NoNewPrivileges`)

### Дополнительная безопасность

```bash
# Создание пользовательской группы (опционально)
sudo groupadd veppstatus-admin
sudo usermod -aG veppstatus-admin $USER

# Ограничение SSH доступа (опционально)
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
# Редактировать /etc/ssh/sshd_config для ограничения доступа
```

### SSL через reverse proxy

```bash
# Установка nginx
sudo apt install -y nginx

# Создание конфигурации proxy
sudo tee /etc/nginx/sites-available/veppstatus > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Включение конфигурации
sudo ln -s /etc/nginx/sites-available/veppstatus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Доступ к интерфейсу

После успешной установки:

- **HTTP доступ**: `http://SERVER_IP:8000`
- **HTTPS доступ**: `https://DOMAIN_NAME` (при настроенном SSL)
- **Статус служб**: `sudo systemctl status veppstatus-django`
- **Логи в реальном времени**: `sudo journalctl -u veppstatus-django -f`

## Поддержка и обслуживание

### Регулярные задачи

```bash
# Еженедельная проверка статуса
sudo systemctl status veppstatus-*

# Очистка старых логов (автоматически через systemd)
sudo journalctl --vacuum-time=30d

# Обновление зависимостей (ежемесячно)
sudo -u veppstatus /opt/veppstatus/venv/bin/pip install --upgrade -r /opt/veppstatus/requirements.txt
```

### Мониторинг health check

Создайте простой скрипт мониторинга:

```bash
sudo tee /opt/veppstatus/healthcheck.sh > /dev/null << 'EOF'
#!/bin/bash
if ! systemctl is-active --quiet veppstatus-django; then
    echo "ALERT: VeppStatus Django is DOWN!"
    # Добавьте здесь уведомления (email, telegram и т.д.)
fi

if ! systemctl is-active --quiet veppstatus-data; then
    echo "ALERT: VeppStatus Data Server is DOWN!"
fi
EOF

sudo chmod +x /opt/veppstatus/healthcheck.sh

# Добавьте в crontab
echo "*/5 * * * * /opt/veppstatus/healthcheck.sh" | sudo crontab -
```

## 🆕 Новый подход: Универсальный systemd сервис

### Установка единого systemd сервиса
```bash
# Установка сервиса (автоматически определяет пользователя и пути)
sudo ./install_service.sh

# Запуск сервиса
sudo systemctl start veppstatus

# Проверка статуса
sudo systemctl status veppstatus
```

### Преимущества нового подхода
- ✅ **Единый сервис** - управляет и Django, и сервером сбора данных
- ✅ **Автоматическое определение** пользователя и путей
- ✅ **Универсальность** - работает на любой машине
- ✅ **Простота управления** - одна команда для всего
- ✅ **Автозапуск** при перезагрузке системы
- ✅ **Автоматический перезапуск** при сбоях

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

**Рекомендация**: Используйте новый универсальный systemd сервис вместо старых отдельных сервисов.

---