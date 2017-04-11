CURGRAPH.namespace("CURGRAPH.CurrentChart");
CURGRAPH.CurrentChart = function(chart,model){
    var model=model,
        weekdata=[],
        counter=10;

    function updateChartData(){
        //var range = $("#v3rangeSelector").jqxRangeSelector("getRange");
        //console.log("The selected range is from " + range.from + " to " + range.to);
        $("#v3chart").jqxChart('update');
        $("#v4chart").jqxChart('update');
    };

    function createWeekChart(){
        var v3_chartsource =
        {
            dataType: "json",
            dataFields: [
                { name: 'time' },
                { name: 'V3_total' }
            ],
            localData: weekdata
        };
        var v3_chartAdapter = new $.jqx.dataAdapter(v3_chartsource);
        var settings = {
            title: "V3 week data",
            description: "",
            enableAnimations: false,
            showLegend: true,
            padding: { left: 10, top: 5, right: 10, bottom: 5 },
            titlePadding: { left: 50, top: 0, right: 0, bottom: 10 },
            source: v3_chartAdapter,
            xAxis:
            {
                dataField: 'time',
                formatFunction: function (value) {
                    var date = new Date(value*1000);
                    return date.getDate() + '-' + date.getHours() + ':' + date.getMinutes()+ ':' + date.getSeconds();
                },
                labels: {
                    angle: -45,
                    rotationPoint: 'topright',
                    offset: { x: 0, y: -25 }
                },
                gridLines: {
                    visible: false
                },
                rangeSelector: {
                    renderTo: $('#v3rangeSelector'),
                    size: 80,
                    padding: { /*left: 0, right: 0,*/top: 0, bottom: 0 },
                    backgroundColor: 'white',
                    dataField: 'V3_total',
                    gridLines: { visible: false },
                    serieType: 'area',
                    labels: {
                        formatFunction: function (value) {
                            var date = new Date(value*1000);
                            return date.getDate() + '-' + date.getHours();
                        }
                    }
                }
            },
            valueAxis:
            {
                visible: true,
                title: { text: 'Current' },
                tickMarks: { color: '#BCBCBC' }
            },
            colorScheme: 'scheme05',
            seriesGroups:
                [
                    {
                        type: 'line',
                        series: [
                                { dataField: 'V3_total', displayText: 'V3_total', color: '#34ba3e', emptyPointsDisplay: 'skip' }
                            ]
                    }
                ]
        };
        $('#v3chart').jqxChart(settings);
        var v4_chartsource =
        {
            dataType: "json",
            dataFields: [
                { name: 'time' },
                { name: 'V4_total' },
                { name: 'V4_luminosityE' }
            ],
            localData: weekdata
        };
        var v4_chartAdapter = new $.jqx.dataAdapter(v4_chartsource);
        var v4_settings = {
            title: "V4 week data",
            description: "",
            enableAnimations: true,
            showLegend: true,
            padding: { left: 10, top: 5, right: 10, bottom: 5 },
            titlePadding: { left: 50, top: 0, right: 0, bottom: 10 },
            source: v4_chartAdapter,
            xAxis:
            {
                dataField: 'time',
                formatFunction: function (value) {
                    var date = new Date(value*1000);
                    return date.getDate() + '-' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                },
                labels: {
                    angle: -45,
                    rotationPoint: 'topright',
                    offset: { x: 0, y: -25 }
                },
                rangeSelector: {
                    // Uncomment the line below to render the selector in a separate container
                    renderTo: $('#v4rangeSelector'),
                    size: 80,
                    padding: { /*left: 0, right: 0,*/top: 0, bottom: 0 },
                    backgroundColor: 'white',
                    dataField: 'V4_total',
                    gridLines: { visible: false },
                    serieType: 'area',
                    labels: {
                        formatFunction: function (value) {
                            var date = new Date(value*1000);
                            return date.getDate() + '-' + date.getHours();
                        }
                    }
                }
            },
            colorScheme: 'scheme05',
            seriesGroups:
                [
                    {
                        type: 'line',
                        valueAxis:
                        {
                            visible: true,
                            title: { text: 'Current' },
                            tickMarks: { color: '#BCBCBC' }
                        },
                        series: [
                                { dataField: 'V4_total', displayText: 'V4_total', color: '#34ba3e', emptyPointsDisplay: 'skip' }
                            ]
                    },
                    {
                        type: 'line',
                        valueAxis:
                        {
                            visible: true,
                            title: { text: 'Luminosity' },
                            tickMarks: { color: '#BCBCBC' },
                            minValue:0
                        },
                        series: [
                                { dataField: 'V4_luminosityE', displayText: 'V4_luminosityE', color: '#ff0000', emptyPointsDisplay: 'skip' }
                            ]
                    }
                ]
        };
        $('#v4chart').jqxChart(v4_settings);
    };

    $(document).on("got_weekdata",function(){
        weekdata = model.getWeekData();
        createWeekChart();
    });

    $(document).on("got_tickdata",function(){
        weekdata.push(model.getTickDataAsObj());
        //console.log($("#v3rangeSelector").jqxRangeSelector('getRange'));
        if(counter==0){
            updateChartData();
            counter = 10;
        }
        counter --;
    });


    return {

    };
}