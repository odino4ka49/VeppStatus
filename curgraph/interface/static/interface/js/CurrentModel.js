CURGRAPH.namespace("CURGRAPH.CurrentModel");
CURGRAPH.CurrentModel = function(){
    var week_data,
    program_data = [],
    graph_data = {},
    tick_data = [
    {
        "Name": "V3_status",
        "Value": 5
    },
    {
        "Name": "V3_status_int",
        "Value": 5
    },
    {
        "Name": "V3_time",
        "Value": 5
    },
    {
        "Name": "V3_mode",
        "Value": 5
    },
    {
        "Name": "V3_polarity",
        "Value": 5
    },
    {
        "Name": "V3_energy",
        "Value": 5
    },
    {
        "Name": "V3_total",
        "Value": 5
    },
    {
        "Name": "V3_sep1",
        "Value": 5
    },
    {
        "Name": "V3_sep2",
        "Value": 5
    },
    {
        "Name": "V3_lifetime",
        "Value": 5
    },
    {
        "Name": "V3_currintegral",
        "Value": 5
    }];

    function getTickData(){
        return tick_data;
    };
    function getWeekData(){
        return week_data;
    };
    function getVarData(variable){
        return graph_data[variable];
    };
    function getProgramData(){
        return program_data;
    };
    function getTickDataAsObj(){
        var result = {}
        tick_data.forEach(function(field){
            result[field.Name]=field.Value;
        });
        return result;
    };

    function loadWeekData(page, pageSize, startTime, endTime){
        // console.log("loadweek")
        $(document).trigger("set_loading_cursor");
        
        var params = {};
        if (page) params.page = page;
        if (pageSize) params.pageSize = pageSize;
        if (startTime) params.start = startTime;
        if (endTime) params.end = endTime;
        
        $.ajax({
            type: "GET",
            data: params,
            url: CURGRAPH.serveradr()+"interface/getWeekArray",
            error: function(xhr, ajaxOptions, thrownError) {
                $(document).trigger("unset_loading_cursor");
                $(document).trigger("error_message",thrownError);
            },
            success: function(data){
                if (page && page > 1) {
                    // Добавляем к существующим данным
                    week_data = week_data.concat(data);
                } else {
                    // Заменяем данные
                    week_data = data;
                }
                $(document).trigger("unset_loading_cursor");
                $(document).trigger("got_weekdata", {page: page, hasMore: data.length === pageSize});
            }
        });
    };
    
    function loadWeekDataRange(startTime, endTime, maxRecords) {
        return loadWeekData(1, maxRecords || 1000, startTime, endTime);
    };
    
    function loadWeekDataPage(page, pageSize) {
        return loadWeekData(page, pageSize || 1000);
    };

    function loadArrByVar(variable,start,end,freq){
            $(document).trigger("set_loading_cursor");
            $.ajax({
                type: "GET",
                data: {variable: JSON.stringify(variable), start: JSON.stringify(start), end: JSON.stringify(end),freq: freq },
                url: CURGRAPH.serveradr()+"interface/getArrByVar",
                error: function(xhr, ajaxOptions, thrownError) {
                    $(document).trigger("unset_loading_cursor");
                    $(document).trigger("error_message",thrownError);
                },
                success: function(data){
                    graph_data[variable] = data;
                    $(document).trigger("unset_loading_cursor");
                    $(document).trigger("got_graphdata",[variable]);
                }
            });
        };

    function loadTickData(){
            $.ajax({
                type: "GET",
                //data: {scheme_names: JSON.stringify(tree_scheme_names),filter_name: JSON.stringify(filter_name) },
                url: CURGRAPH.serveradr()+"interface/getTickData",
                error: function(xhr, ajaxOptions, thrownError) {
                    $(document).trigger("error_message",thrownError);
                },
                success: function(data){
                    tick_data = data;
                    $(document).trigger("got_tickdata");
                }
            });
        };

    function loadProgramData(){
            $.ajax({
                type: "GET",
                url: CURGRAPH.serveradr()+"interface/getProgramData",
                error: function(xhr, ajaxOptions, thrownError) {
                    $(document).trigger("error_message",thrownError);
                },
                success: function(data){
                    program_data = data;
                    $(document).trigger("got_programdata");
                }
            });
        };

    $(document).on("tick",function(){
        loadTickData();
    });

    //loadWeekData();

    return {
        getTickData: getTickData,
        getWeekData: getWeekData,
        getVarData: getVarData,
	getProgramData: getProgramData,
        loadArrByVar: loadArrByVar,
	loadProgramData: loadProgramData,
        getTickDataAsObj: getTickDataAsObj,
        loadWeekData: loadWeekData,
        loadWeekDataRange: loadWeekDataRange,
        loadWeekDataPage: loadWeekDataPage
    };
}
