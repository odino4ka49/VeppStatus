CURGRAPH.namespace("CURGRAPH.WeekChart");
CURGRAPH.WeekChart = function(chart,model){
    var model=model,
        graphdata={"V3_total":{
            "values":[],
            "plotindex":0,
            "chartname":"v3chart"
        },"V4_total":{
            "values":[],
            "plotindex":0,
            "chartname":"v4chart"
        },"V4_luminosityE":{
            "values":[],
            "plotindex":1,
            "chartname":"v4chart"
        }},
        adddata={"V3_total":[],"V4_total":[],"V4_luminosityE":[]},
        counter=30,
        refresh = true;

    function updateChartData(){
        for(key in adddata){
            zingchart.exec(graphdata[key].chartname, 'appendseriesvalues', {
                'plotindex':graphdata[key].plotindex,
                'values':adddata[key]
            });
            adddata[key] = [];
        }
    };

    function addChartData(tick){
        var time = tick["time"]*1000;
        for(key in adddata){
            adddata[key].push([time,tick[key]]);
        }
        if(counter==0){
            updateChartData();
            counter = 30;
        }
        counter --;
    };

    window.feed=function(callback){
        var tick = {};
        console.log("feed");
        tick.scaleX = new Date().getTime();
        tick.plot0 = 10;
        callback(JSON.stringify(tick));
    };

    function createWeekChart(){
        var chartData = {
            type: "line",
            backgroundColor:"black",
            title: {
                text: "VEPP3 Data",
                color: "white",
                fontWeight: "bold"
            },
            legend: {},
            plot:{
                exact:true,
                preview:true
            },
            preview:{
                visible:true,
                height:60,
                adjustLayout: true,
                backgroundColor:"black",
                preserveZoom: true
            },
            scaleX:{
                zooming: true,
                transform:{
                    type: 'date',
                    all: '%D, %d %M<br>%h:%i:%s',
                    itemsOverlap: true
                },
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                }
            },
            crosshairX:{
                plotLabel:{
                    borderWidth: 3,
                    borderRadius: 5,
                    borderColor: "gray",
                    backgroundColor:"#fff",
                    width: 100
                }
            },
            scaleY:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                }
            },
            zoom:{
                preserveZoom: true
            },
            series: [
                {
                    values: graphdata["V3_total"].values,
                    lineColor: "#47f753",
                    text: "V3_total"
                }
            ]
        };
        zingchart.render({
            id: "v3chart",
            data: chartData,
            height: 500,
            width: 700
        });
        var v4chartData = {
            type: "line",
            backgroundColor:"black",
            title: {
                text: "VEPP4 Data",
                color: "white",
                fontWeight: "bold"
            },
            legend: {
            },
            plot:{
                exact:true,
                preview:true
            },
            preview:{
                visible:true,
                height:60,
                adjustLayout: true,
                backgroundColor:"black",
                preserveZoom: true
            },
            scaleX:{
                zooming: true,
                transform:{
                    type: 'date',
                    all: '%D, %d %M<br>%h:%i:%s',
                    itemsOverlap: true
                },
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                }
            },
            crosshairX:{
                plotLabel:{
                    borderWidth: 3,
                    borderRadius: 5,
                    borderColor: "gray",
                    backgroundColor:"#fff",
                    width: 100
                }
            },
            scaleY:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                }
            },
            scaleY2:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                minValue: 0,
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                }
            },
            zoom:{
                preserveZoom: true
            },
            series: [
                {
		            scales:'scale-x,scale-y',
                    values: graphdata["V4_total"].values,
                    lineColor: "#47f753",
                    text: "V4_total"
                },
                {
		            scales:'scale-x,scale-y-2',
                    values: graphdata["V4_luminosityE"].values,
                    lineColor: "#1cffec",
                    text: "LuminosityE"
                }
            ]
        }
        zingchart.render({
            id: "v4chart",
            data: v4chartData,
            height: 500,
            width: 700
        });
    };

    function loadGraphData(){
        //model.loadArrByVar("V3_total");
        for(key in graphdata){
            model.loadArrByVar(key);
        }
    };

    function installTimeSelectors(){
        var time = new Date(),
            weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
        $("#from_time").jqxDateTimeInput({width: '300px', height: '25px',  selectionMode: 'range', max: new Date(time.getFullYear(), time.getMonth(), time.getDate()), min: new Date(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate()) });
    };

    $(document).on("got_graphdata",function(event,variable){
        graphdata[variable].values = model.getVarData(variable);
        createWeekChart();
    });

    $(document).on("got_weekdata",function(){
        weekdata = model.getWeekData();
        createWeekChart();
    });

    $(document).on("got_tickdata",function(){
        addChartData(model.getTickDataAsObj());
        /*weekdata.push(model.getTickDataAsObj());
        if(counter==0){
            updateChartData();
            counter = 10;
        }
        counter --;*/
    });

    $(document).on("set_timeperiod",function(){
        var v3det = document.getElementById("v3detalization").value;
        var v4det = document.getElementById("v4detalization").value;
        if(v3det!=v3detalization){
            v3detalization = v3det;
        }
        if(v4det!=v4detalization){
            v4detalization = v4det;
        }
    });

    loadGraphData();
    installTimeSelectors();

    return {

    };
};

function setDetails(){
    $(document).trigger("set_timeperiod");
};