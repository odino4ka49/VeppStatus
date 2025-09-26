var datetimerange = [];

function initPicker(startDate) {
    if(!startDate) startDate = moment().subtract(1, 'hours');
    
    // Создаем daterangepicker, но отключаем его
    $('#datetimerange').daterangepicker({
        timePicker: true,
        timePicker24Hour: true,
        startDate: startDate,
        endDate: moment(),
        minDate: moment().subtract(7, 'days'),
	maxDate: moment(),
        locale: {
            format: 'YYYY-MM-DD HH:mm:ss'
        },
        autoUpdateInput: true,
        opens: 'left'
    });
    
    // Отключаем клик по полю даты/времени
    $('#datetimerange').prop('readonly', true);
    $('#datetimerange').css('cursor', 'default');
    
    // Удаляем обработчик клика
    $('#datetimerange').off('click.daterangepicker');
    $('#datetimerange').off('keydown.daterangepicker');
    
    // Устанавливаем начальные значения
    datetimerange[0] = startDate;
    datetimerange[1] = moment();
    
    // Обновляем отображение
    $('#datetimerange').val(startDate.format('YYYY-MM-DD HH:mm:ss') + ' - ' + moment().format('YYYY-MM-DD HH:mm:ss'));
  }

function changeDateRange(range) {
    var start_date = moment().subtract(1, 'hours');
    switch(range){
	case '3h':
	    start_date = moment().subtract(3, 'hours');
	    setFrequency(30);
	    break;
	case '9h':
	    start_date = moment().hours(moment().get('hour')>21?21:9).minutes(0).seconds(0);
	    setFrequency(60);
	    break;
	case '24h':
	    start_date = moment().subtract(1, 'days');
	    setFrequency(120);
	    break;
	case 'week':
	    start_date = moment().subtract(7, 'days');
	    setFrequency(300);
	    break;
	default:
	    setFrequency(30);
	    break;
    }
    
    // Обновляем значения без переинициализации picker
    datetimerange[0] = start_date;
    datetimerange[1] = moment();
    
    // Обновляем отображение
    $('#datetimerange').val(start_date.format('YYYY-MM-DD HH:mm:ss') + ' - ' + moment().format('YYYY-MM-DD HH:mm:ss'));
    
    $(document).trigger("set_timeperiod",[true]);
}

function setFrequency(freq){
    $("#graph_frequency").val(freq);
}

function timeTickingChanges(){
    // Обновляем только отображение без переинициализации
    var startDate = datetimerange[0];
    var endDate = moment();
    
    datetimerange[1] = endDate;
    $('#datetimerange').val(startDate.format('YYYY-MM-DD HH:mm:ss') + ' - ' + endDate.format('YYYY-MM-DD HH:mm:ss'));
}

function getDateTime() {
    return datetimerange;
}
