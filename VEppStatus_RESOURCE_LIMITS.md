# Ограничения ресурсов для VeppStatus

## Обзор

VeppStatus настроен с ограничениями ресурсов для предотвращения перегрузки сервера и обеспечения стабильной работы.

## Текущие лимиты

### Django веб-сервер (veppstatus-django.service)
- **Память**: 512MB - максимум оперативной памяти
- **CPU**: Учет использования (limits можно добавить)
- **Файлы**: 4096 открытых файлов максимум
- **Учет**: Все ресурсы отслеживаются

### Сервер данных (veppstatus-data.service)
- **Память**: 256MB - максимум оперативной памяти  
- **CPU**: Учет использования
- **Файлы**: 1024 открытых файла максимум
- **Учет**: Все ресурсы отслеживаются

## Мониторинг использования ресурсов

### Просмотр текущего потребления

```bash
# Подробная информация о ресурсах
sudo systemctl status veppstatus-django -l | grep -A 10 "Memory\|CPU\|Tasks"

# Просмотр логов об ограничениях памяти
sudo journalctl -u veppstatus-django | grep -i "memory\|oome"
sudo journalctl -u veppstatus-data | grep -i "memory\|oome"
```

### Мониторинг в реальном времени

```bash
# Использование памяти процессами
sudo systemctl show veppstatus-django --property=MemoryCurrent,MemoryEffective,MEMORYSTATS
sudo systemctl show veppstatus-data --property=MemoryCurrent,MemoryEffective,MEMORYSTATS
```

## Настройка лимитов под вашу систему

### Определение оптимальных значений

```bash
# Проверка общей памяти системы
free -h

# Проверка доступной памяти
echo "Доступно памяти: $(free | grep '^Mem:' | awk '{print $7/1024/1024 " GB"}')"

# Рекомендации:
# Django: 20-30% от общей памяти или минимум 256MB
# Data server: 10-15% от общей памяти или минимум 128MB
# Общий лимит: Не более 75% общей памяти системы
```

### Формула расчета лимитов

```
Общая память системы — 1GB (система) — 20% (резерв) — другие службы
= Доступная память для VeppStatus

Пример для 4GB системы:
4000MB — 1000MB (система) — 800MB (резерв) — 200MB (другие службы)
= Доступно: ~2000MB

Распределение:
- Django: 512MB (25%)
- Data Server: 256MB (12.5%)  
```

## Изменение лимитов

### Способ 1: Редактирование файлов служб

```bash
# Остановка служб
sudo systemctl stop veppstatus-django
sudo systemctl stop veppstatus-data

# Редактирование лимитов
sudo nano /etc/systemd/system/veppstatus-django.service
# Измените MemoryLimit=512M на нужное значение

sudo nano /etc/systemd/system/veppstatus-data.service
# Измените MemoryLimit=256M на нужное значение

# Перезагрузка конфигурации
sudo systemctl daemon-reload

# Запуск служб
sudo systemctl start veppstatus-data
sudo systemctl start veppstatus-django
```

### Способ 2: Через systemctl override (рекомендуется)

```bash
# Создание директории override
sudo systemctl edit veppstatus-django

# Добавление только нужных настроек (например, для увеличения лимита):
[Service]
MemoryLimit=1G

# Применение изменений
sudo systemctl restart veppstatus-django
```

## Настройка для разных типов серверов

### Серверы с ограниченной памятью (1-2GB)

```bash
# Django: 256MB
# Data: 128MB
sudo systemctl edit veppstatus-django
[Service]
MemoryLimit=256M

sudo systemctl edit veppstatus-data
[Service]
MemoryLimit=128M
```

### Серверы со средней памятью (4-8GB)

```bash
# Django: 512MB (текущие настройки)
# Data: 256MB (текущие настройки)
# Не требует изменений
```

### Серверы с большой памятью (16GB+)

```bash
# Django: 1G
# Data: 512MB  
sudo systemctl edit veppstatus-django
[Service]
MemoryLimit=1G

sudo systemctl edit veppstatus-data
[Service]
MemoryLimit=512M
```

## Дополнительные ограничения ресурсов

### Ограничение CPU

```bash
# Ограничение использования CPU до 50% одного ядра
sudo systemctl edit veppstatus-django
[Service]
CPUQuota=50%
CPUAccounting=true
```

### Ограничение дискового ввода/вывода

```bash
# Ограничение скорости записи/чтения
sudo systemctl edit veppstatus-data
[Service]
IOReadBandwidthMax=/dev/sda 10M
IOWriteBandwidthMax=/dev/sda 5M
```

### Ограничение количества файлов

```bash
# Увеличение лимита файлов
sudo systemctl edit veppstatus-django
[Service]
LimitNOFILE=8192
```

## Действия при превышении лимитов

### Что происходит при превышении памяти

```bash
# Проверка логов OOM (Out Of Memory)
sudo journalctl -u veppstatus-django -p err | grep -i "memory\|oom\|killed"

# Если процесс убит из-за превышения лимита:
# 1. Служба автоматически перезапустится (Restart=always)
# 2. В логах появится сообщение об ошибке
# 3. Нужно увеличить MemoryLimit
```

### Увеличение лимитов при проблемах

```bash
# Если служба часто падает из-за нехватки памяти:
sudo systemctl edit veppstatus-django
[Service]
MemoryLimit=1024M

# Применение изменений
sudo systemctl daemon-reload
sudo systemctl restart veppstatus-django
```

## Мониторинг производительности

### Автоматический мониторинг

```bash
# Создание скрипта мониторинга ресурсов
sudo tee /opt/veppstatus/resource-monitor.sh > /dev/null << 'EOF'
#!/bin/bash

echo "=== VeppStatus Resource Usage ==="
echo "Date: $(date)"

echo -e "\n--- Django Server ---"
sudo systemctl status veppstatus-django | grep -E "Main PID|Memory:" || echo "Service not running"

echo -e "\n--- Data Server ---"  
sudo systemctl status veppstatus-data | grep -E "Main PID|Memory:" || echo "Service not running"

echo -e "\n--- System Memory ---"
free -h | grep "Mem:"

echo -e "\n--- Top Processes ---"
ps aux --sort=-%mem | head -10 | grep -E "(veppstatus|manage.py|current_state)"

EOF

sudo chmod +x /opt/veppstatus/resource-monitor.sh

# Добавление в crontab для регулярного мониторинга
echo "*/15 * * * * /opt/veppstatus/resource-monitor.sh >> /var/log/veppstatus-resources.log" | sudo crontab -
```

### Алерты при высоком потреблении

```bash
# Скрипт проверки лимитов памяти
sudo tee /opt/veppstatus/memory-check.sh > /dev/null << 'EOF'
#!/bin/bash

DJANGO_MEMORY=$(sudo systemctl show veppstatus-django --property=MemoryCurrent | cut -d= -f2)
DJANGO_LIMIT=$(sudo systemctl show veppstatus-django --property=MemoryLimit | cut -d= -f2)

DATA_MEMORY=$(sudo systemctl show veppstatus-data --property=MemoryCurrent | cut -d= -f2)  
DATA_LIMIT=$(sudo systemctl show veppstatus-data --property=MemoryLimit | cut -d= -f2)

if [ "$DJANGO_MEMORY" -gt $((DJANGO_LIMIT * 80 / 100)) ]; then
    echo "WARNING: Django using ${DJANGO_MEMORY}MB of ${DJANGO_LIMIT}MB (80%+)"
fi

if [ "$DATA_MEMORY" -gt $((DATA_LIMIT * 80 / 100)) ]; then
    echo "WARNING: Data server using ${DATA_MEMORY}MB sud $((DATA_MEMORY * 80 / 100))MB (80%+)"
fi

EOF

sudo chmod +x /opt/veppstatus/memory-check.sh
```

## Разные стратегии лимитов

### Консервативная стратегия (для критически важных систем)

```bash
# Лимиты меньше, больше ресурсов для системы
Django: 256MB
Data: 128MB
CPU: 25% каждого процесса
```

### Агрессивная стратегия (максимальное использование ресурсов)

```bash
# Лимиты больше, лучше производительность приложения
Django: 1GB  
Data: 512MB
CPU: 100% каждого процесса
```

### Сбалансированная стратегия (рекомендуется)

```bash
# Текущие настройки
Django: 512MB
Data: 256MB
CPU: без ограничений
```

## Troubleshooting ограничений ресурсов

### Частое превышение лимитов

```bash
# Проверка логов
sudo journalctl -u veppstatus-django --since "1 hour ago" | grep -i "memory\|oom"

# Увеличение лимита временно
sudo systemctl edit veppstatus-django
[Service]
MemoryLimit=1024M
sudo systemctl daemon-reload && sudo systemctl restart veppstatus-django
```

### Слишком низкие лимиты

```bash
# Служба не может нормально работать
# Увеличение лимитов
sudo systemctl edit veppstatus-django  
[Service]
MemoryLimit=768M

sudo systemctl edit veppstatus-data
[Service]
MemoryLimit=384M
```

---

**Итого**: Теперь ваши службы защищены от перегрузки памяти и не смогут "съесть" весь сервер! 🛡️
