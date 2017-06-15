CURGRAPH.namespace("CURGRAPH.CurrentModel");
CURGRAPH.CurrentModel = function(){
    var week_data,
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
    function getTickDataAsObj(){
        var result = {}
        tick_data.forEach(function(field){
            result[field.Name]=field.Value;
        });
        return result;
    };

    function loadWeekData(){
       // console.log("loadweek")
            $(document).trigger("set_loading_cursor");
            $.ajax({
                type: "GET",
                //data: {scheme_names: JSON.stringify(tree_scheme_names),filter_name: JSON.stringify(filter_name) },
                url: CURGRAPH.serveradr()+"interface/getWeekArray",
                error: function(xhr, ajaxOptions, thrownError) {
                    $(document).trigger("unset_loading_cursor");
                    $(document).trigger("error_message",thrownError);
                },
                success: function(data){
                    week_data = data;
                    console.log(week_data)
                    $(document).trigger("unset_loading_cursor");
                    $(document).trigger("got_weekdata");
                }
            });
        };

    function loadArrByVar(variable,start,end){
        //console.log("loadarrbyvar")
            $(document).trigger("set_loading_cursor");
            $.ajax({
                type: "GET",
                data: {variable: JSON.stringify(variable), start: JSON.stringify(start), end: JSON.stringify(end) },
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

    $(document).on("tick",function(){
        loadTickData();
    });

    //loadWeekData();

    return {
        getTickData: getTickData,
        getWeekData: getWeekData,
        getVarData: getVarData,
        loadArrByVar: loadArrByVar,
        getTickDataAsObj: getTickDataAsObj
    };
}