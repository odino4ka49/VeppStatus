var datetimerange = [];

function initPicker(startDate) {
    if(!startDate) startDate = moment().subtract(1, 'hours');
    $('#datetimerange').daterangepicker({
        timePicker: true,
        timePicker24Hour: true,
        startDate: startDate,
        endDate: moment(),
        minDate: moment().subtract(7, 'days'),
	maxDate: moment(),
        locale: {
            format: 'YYYY-MM-DD HH:mm:ss'
        }
    });
    datetimerange[0] = startDate;
    datetimerange[1] = moment();
    $('#datetimerange').on('apply.daterangepicker', function(ev, picker) {
        datetimerange[0] = picker.startDate;
        datetimerange[1] = picker.endDate;
    	$(document).trigger("set_timeperiod",[false]);
    });
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
    initPicker(start_date);
    $(document).trigger("set_timeperiod",[true]);
}

function setFrequency(freq){
    $("#graph_frequency").val(freq);
}

function timeTickingChanges(){
    initPicker($('#datetimerange').data('daterangepicker').startDate);
}

function getDateTime() {
    return datetimerange;
}
