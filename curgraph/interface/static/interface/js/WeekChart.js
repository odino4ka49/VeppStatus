CURGRAPH.namespace("CURGRAPH.WeekChart");
CURGRAPH.WeekChart = function(chart,model){
    var model=model,
        graphdata={"V3_energy":{
                "scales":'scale-x,scale-y-2',
                "values":[],
                "chartname":"v3chart",
                "color": "#1cffec"
            },"V3_total_e-":{
                "scales":'scale-x,scale-y',
                "values":[],
                "chartname":"v3chart",
                "color": "#42f4a7",
                "display": "default"
            },"V3_total_e+":{
                "scales":'scale-x,scale-y',
                "values":[],
                "chartname":"v3chart",
                "color": "#ff1900",
                "display": "default"
            },"V3_sep1":{
                "scales":'scale-x,scale-y',
                "values":[],
                "chartname":"v3chart",
                "color": "#47f753"
            },"V3_sep2":{
                "scales":'scale-x,scale-y',
                "values":[],
                "chartname":"v3chart",
                "color": "#9df441"
            },"V3_lifetime":{
                "scales":'scale-x,scale-y-3',
                "values":[],
                "chartname":"v3chart",
                "color": "#f4f441"
            },"V3_currintegral":{
                "scales":'scale-x,scale-y-4',
                "values":[],
                "chartname":"v3chart",
                "color": "#f441cd"
            },"V4_energy":{
                "scales":'scale-x,scale-y-2',
                "values":[],
                "chartname":"v4chart",
                "color": "#1cffec"
            },"V4_total":{
                "scales":'scale-x,scale-y',
                "values":[],
                "chartname":"v4chart",
                "color": "#42f4a7",
                "display": "default"
            },"V4_e1":{
                "scales":'scale-x,scale-y',
                "values":[],
                "chartname":"v4chart",
                "color": "#47f753"
            },"V4_e2":{
                "scales":'scale-x,scale-y',
                "values":[],
                "chartname":"v4chart",
                "color": "#47f78a"
            },"V4_p1":{
                "scales":'scale-x,scale-y',
                "values":[],
                "chartname":"v4chart",
                "color": "#f989b8"
            },"V4_p2":{
                "scales":'scale-x,scale-y',
                "values":[],
                "chartname":"v4chart",
                "color": "#fc3a8b"
            },"V4_lifetime":{
                "scales":'scale-x,scale-y-3',
                "values":[],
                "chartname":"v4chart",
                "color": "#f2f76f"
            },"V4_luminosityE":{
                "scales":'scale-x,scale-y-4',
                "values":[],
                "chartname":"v4chart",
                "color": "#6fb7f7",
                "display": "default"
            },"V4_luminosityP":{
                "scales":'scale-x,scale-y-4',
                "values":[],
                "chartname":"v4chart",
                "color": "#41f4e2"
            },"V4_luminosityMean":{
                "scales":'scale-x,scale-y-4',
                "values":[],
                "chartname":"v4chart",
                "color": "#41c7f4"
            },"V4_currintegral":{
                "scales":'scale-x,scale-y-5',
                "values":[],
                "chartname":"v4chart",
                "color": "#f441cd"
            },"V4_lumintegral":{
                "scales":'scale-x,scale-y-5',
                "values":[],
                "chartname":"v4chart",
                "color": "#df41f4"
            }
        },
        adddata={},
        last_adding = 0,
        counter=30,
        datesrange = {from:"",to:""},
        no_time_changes = false;
        refresh = true,
	visible_plots = [];

    function getFrequency(){
	var freq = $("#graph_frequency").val();
	return ((freq!=undefined) && (freq > 0)) ? freq : 10;
    };

    function updateChartData(){
        if(!refresh){
            return;
        }
        for(key in adddata){
            var addlength = adddata[key].length,
                graphvalues = graphdata[key].values;
            for(var i=addlength-1; i>=0; i--){
                if(graphvalues[i]&&graphvalues[i][0]<datesrange.from.getTime()){
                    delete graphvalues[i];
                }
            }
            for(var i=graphvalues.length-1;i>graphvalues.length-addlength;i--){
                for(var j=0;j<addlength;j++){
                    if(graphvalues[i]&&graphvalues[i][0]==adddata[key][j][0]){
                        delete adddata[key][j];
                        j-=1;
                        addlength-=1;
                    }
                }
            }
            //graphdata[key].values.splice(0,adddata[key].length);
            graphdata[key].values = graphvalues.concat(adddata[key]);
            adddata[key] = [];
            zingchart.exec(graphdata[key].chartname, 'setseriesvalues', {
                'plotid':key,
                'values':graphvalues
            });
            /*zingchart.exec(graphdata[key].chartname, 'appendseriesvalues', {
                'plotindex':graphdata[key].plotindex,
                'values':adddata[key]
            });
            adddata[key] = [];*/
        }
        var time = new Date();
        var date1 = new Date();
            date1.setHours(date1.getHours() - 2);
        //var range = $("#from_time").jqxDateTimeInput('getRange');
        no_time_changes = true;
        $("#from_time").jqxDateTimeInput('setRange', date1, time);
        counter = 30;
    };

    function addChartData(tick){
        counter --;
        if(counter==0){
            updateChartData();
        }
	if(last_adding!=0){
	    last_adding --;
	    return;
	}
	last_adding = getFrequency()-1;
        var time = tick["time"]*1000;
        for(key in adddata){
            var values = adddata[key]
            var lastel = values[values.length - 1]
            if(lastel&&lastel[0]==time){
                return;
            }
            adddata[key].push([time,tick[key]]);
        }
    };

    function removePlot(variable){
        delete adddata[variable];
        plot_info = graphdata[variable];
        zingchart.exec(plot_info.chartname, 'removeplot', {
            plotid:variable
        });
    }

    function addPlot(variable,data){
        plot_info = graphdata[variable];
        adddata[variable]=[];
        zingchart.exec(plot_info.chartname, 'removeplot', {
            plotid:variable
        });
        zingchart.exec(plot_info.chartname, 'addplot', {
            data : {
                id:variable,
                values : data,
                text : variable,
                lineColor: plot_info.color,
                lineWidth: 1,
                scales: plot_info.scales
            }
        });
    };

    window.feed=function(callback){
        var tick = {};
        tick.scaleX = new Date().getTime();
        tick.plot0 = 10;
        callback(JSON.stringify(tick));
    };

    function createWeekChart(){
	$('.resizable').resizable({
       		handles: 'n, e, s, w'
    	});
        var chartData = {
            type: "line",
            backgroundColor:"black",
            plot:{
                exact: true,
                preview: true,
		marker: {
		    visible: false
		}
            },
            plotarea:{
                "margin-left":"15%",
            },
            /*preview:{
                visible:true,
                visible:true,
                height:60,
                adjustLayout: true,
                backgroundColor:"black",
                preserveZoom: true
            },*/
            scrollX:{

            },
            scrollY:{

            },
            scaleX:{
                zooming: true,
                transform:{
                    type: 'date',
                    all: '%D, %d %M<br>%H:%i:%s',
                    itemsOverlap: true
                },
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                }
            },
            crosshairX:{
		exact: true,
                plotLabel:{
                    borderWidth: 3,
                    borderRadius: 5,
                    borderColor: "none",
                    backgroundColor:"transparent",
		    fontColor: "white",
                    width: 140,
		    y: -40
                }
            },
            "scale-y-n":{
                "label":{
                    "font-size":12,
                    "font-angle": 0,
                    "color": "white",
                    "offset-y": -190,
                    "offset-x": 28
                },
                "item":{
                },
                "tick":{
                }
            },
            scaleY:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                label:{
                    "text":"mA"
                },
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                },
                lineColor:"#47f753"
            },
            scaleY2:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                label:{
                    "text":"MeV"
                },
                minValue: 0,
                placement: "default",
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                },
                lineColor:"#1cffec"
            },
            scaleY3:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                label:{
                    "text":"sec"
                },
                minValue: 0,
                placement: "default",
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                },
                lineColor:"#f4f441"
            },
            scaleY4:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                label:{
                    "text":"C"
                },
                minValue: 0,
                placement: "default",
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                },
                lineColor:"#f441cd"
            },
            zoom:{
                preserveZoom: true
            },
            series: [
                /*{
                    values: graphdata["V3_total"].values,
                    lineColor: "#47f753",
                    text: "V3_total"
                }*/
            ]
        };
        zingchart.render({
            id: "v3chart",
            data: chartData,
            height: '100%',
            width: '100%'
        });
	zingchart.zoom = function(p){
	    console.log(p);
	}
        var v4chartData = {
            type: "line",
            backgroundColor:"black",
            plot:{
                exact:true,
                preview:true,
		marker: {
		    visible: false
		}
            },
            plotarea:{
                "margin-left":"15%",
            },
            /*preview:{
                visible:true,
                height:60,
                adjustLayout: true,
                backgroundColor:"black",
                preserveZoom: true
            },*/
            scrollX:{

            },
            scrollY:{

            },
            scaleX:{
                zooming: true,
                transform:{
                    type: 'date',
                    all: '%D, %d %M<br>%H:%i:%s',
                    itemsOverlap: true
                },
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                }
            },
            crosshairX:{
		exact: true,
                plotLabel:{
                    borderWidth: 3,
                    borderRadius: 5,
                    borderColor: "none",
                    backgroundColor:"transparent",
		    fontColor: "white",
                    width: 140,
		    y: -40
                }
            },
            "scale-y-n":{
                "label":{
                    "font-size":12,
                    "font-angle": 0,
                    "color": "white",
                    "offset-y": -190,
                    "offset-x": 28
                },
                "item":{
                },
                "tick":{
                }
            },
            scaleY:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                label:{
                    "text":"mA"
                },
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                },
                lineColor:"#47f753"
            },
            scaleY2:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                label:{
                    "text":"MeV"
                },
                minValue: 0,
                placement: "default",
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                },
                lineColor:"#1cffec"
            },
            scaleY3:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                label:{
                    "text":"sec"
                },
                //minValue: 0,
                placement: "default",
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                },
                lineColor:"#f4f441"
            },
            scaleY4:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                label:{
                    "text":"^28"
                },
                minValue: 0,
                //placement: "default",
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                },
                lineColor:"#6fb7f7"
            },
            scaleY5:{
                "guide":{
                    "visible":false
                },
                zooming:true,
                label:{
                    "text":"C, 1/nb"
                },
                minValue: 0,
                placement: "default",
                item:{
                    fontColor: "white",
                    fontWeight: "bold"
                },
                lineColor:"#f441cd"
            },
            zoom:{
                preserveZoom: true
            },
            series: [
                /*{
		            scales:'scale-x,scale-y',
                    values: graphdata["V4_total"].values,
                    lineColor: "#47f753",
                    text: "V4_total"
                },
                {
		            scales:'scale-x,scaleY2',
                    values: graphdata["V4_luminosityE"].values,
                    lineColor: "#1cffec",
                    text: "LuminosityE"
                }*/
            ]
        }
        zingchart.render({
            id: "v4chart",
            data: v4chartData,
            height: '100%',
            width: '100%'
        });
    };

    function loadGraphData(){
        var dates = $("#from_time").jqxDateTimeInput('getRange');
        for(key of visible_plots){
            model.loadArrByVar(key,dates.from.getTime()/1000|0,dates.to.getTime()/1000|0,getFrequency());
        }
    };

    function initTimeSelectors(){
        var time = new Date(),
            weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
        var date1 = new Date();
            date1.setHours(date1.getHours() - 2);
        datesrange.from = date1;
        datesrange.to = time;
        $("#from_time").jqxDateTimeInput({width: '480px', height: '25px', formatString: 'ddd, MMM dd yyyy HH:mm:ss', showTimeButton: true,  selectionMode: 'range', max: new Date(time.getFullYear(), time.getMonth(), time.getDate()), min: new Date(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate()) });
        $("#from_time").jqxDateTimeInput('setRange', date1, time);
        $('#from_time').on('valueChanged', function (event) {
            var date = event.args.date;
            refresh = time <= date.to;
            datesrange.from = date.from;
            datesrange.to = date.to;
            if(!no_time_changes){
                loadGraphData();
            }
            else{
                no_time_changes = false;
            }
        });
    };

    function initRefreshButton(){
        document.getElementById('refresh_graph').onclick = function() {
            updateChartData();
        }
    };

    function initReloadButton(){
        document.getElementById('reload_graph').onclick = function() {
            loadGraphData();
        }
    };

    function initVisible(){
	for(key in graphdata){
            if (graphdata[key].display=="default"){
		visible_plots.push(key);
	    }
	}
    };

    function removeFromArray(search_term, array){
	var index = array.indexOf(search_term);
	if (index !== -1) {
	    array.splice(index, 1);
	}
    };

    $(document).on("got_graphdata",function(event,variable){
        values = model.getVarData(variable);
        graphdata[variable].values = values;
        addPlot(variable, values);
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

    $(document).on("plot_display",function(event,variable_info,display){
        if(display){
            var range = $("#from_time").jqxDateTimeInput('getRange');
            if(typeof variable_info["plot"]=="string"){
                model.loadArrByVar(variable_info["plot"],range.from.getTime()/1000|0,range.to.getTime()/1000|0,getFrequency());
		visible_plots.push(variable_info["plot"]);
            }
            else{
                variable_info["plot"].forEach(function(plot){
                    model.loadArrByVar(plot,range.from.getTime()/1000|0,range.to.getTime()/1000|0,getFrequency());
		    visible_plots.push(plot);
                });
            }
        }
        else{
            if(typeof variable_info["plot"]=="string"){
                removePlot(variable_info["plot"]);
	        removeFromArray(variable_info["plot"],visible_plots);
            }
            else{
                variable_info["plot"].forEach(function(plot){
                    removePlot(plot);
		    removeFromArray(plot,visible_plots);
                });
            }
        }
    });

    $(document).on("set_timeperiod",function(){
    console.log("timechanged")
        var v3det = document.getElementById("v3detalization").value;
        var v4det = document.getElementById("v4detalization").value;
        if(v3det!=v3detalization){
            v3detalization = v3det;
        }
        if(v4det!=v4detalization){
            v4detalization = v4det;
        }
    });

    initTimeSelectors();
    initRefreshButton();
    initReloadButton();
    initVisible();
    loadGraphData();
    createWeekChart();

    return {

    };
};

function setDetails(){
    $(document).trigger("set_timeperiod");
};

//not sure if we need this, for faster mousewheel response
/*addEventListener(document, "touchstart", function(e) {
  console.log(e.defaultPrevented);  // will be false
  e.preventDefault();   // does nothing since the listener is passive
  console.log(e.defaultPrevented);  // still false
}, {passive: true});*/
