// Простые часы без зависимости от CURGRAPH
var Clock = (function() {
    var clockInterval = null;
    var isRunning = false;
    
    // Русские названия дней недели и месяцев
    var weekDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    function formatTime(date) {
        var hours = date.getHours().toString().padStart(2, '0');
        var minutes = date.getMinutes().toString().padStart(2, '0');
        var seconds = date.getSeconds().toString().padStart(2, '0');
        return hours + ':' + minutes + ':' + seconds;
    }
    
    function formatDate(date) {
        var dayOfWeek = weekDays[date.getDay()];
        var day = date.getDate();
        var month = months[date.getMonth()];
        var year = date.getFullYear();
        return dayOfWeek + ', ' + day + ' ' + month + ' ' + year;
    }
    
    function updateClock() {
        var now = new Date();
        var timeElement = document.getElementById('current-time');
        var dateElement = document.getElementById('current-date');
        
        if (timeElement) {
            timeElement.textContent = formatTime(now);
        }
        
        if (dateElement) {
            dateElement.textContent = formatDate(now);
        }
    }
    
    function startClock() {
        if (isRunning) {
            return;
        }
        
        // Обновляем сразу
        updateClock();
        
        // Запускаем обновление каждую секунду
        clockInterval = setInterval(updateClock, 1000);
        isRunning = true;
        
        console.log('🕐 Часы запущены');
    }
    
    function stopClock() {
        if (clockInterval) {
            clearInterval(clockInterval);
            clockInterval = null;
        }
        isRunning = false;
        console.log('🕐 Часы остановлены');
    }
    
    // Автоматический запуск при загрузке страницы
    $(document).ready(function() {
        startClock();
    });
    
    // Остановка при выгрузке страницы
    $(window).on('beforeunload', function() {
        stopClock();
    });
    
    return {
        start: startClock,
        stop: stopClock,
        update: updateClock,
        isRunning: function() { return isRunning; }
    };
})();
