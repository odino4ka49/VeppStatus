CURGRAPH.namespace("CURGRAPH.TickDataTable");
CURGRAPH.TickDataTable = function(table,model){
    var model=model,
        tickdata=[],
        V3_table = [{
            "name": "V3_status",
            "fieldname": "Status",
            "units": ""
        },
        {
            "name": "V3_time",
            "fieldname": "From start",
            "units": "sec",
            "color": "yellow"
        },
        {
            "name": "V3_mode",
            "fieldname": "Mode",
            "units": "",
            "color": "yellow"
        },
        {
            "name": "V3_polarity",
            "fieldname": "Polarity",
            "units": "",
            "color": "green"
        },
        {
            "name": "V3_energy",
            "fieldname": "Energy",
            "units": "MeV",
            "color": "yellow"
        },
        {
            "name": "V3_total",
            "fieldname": "Beam current",
            "units": "mA",
            "color": "yellow",
            "plot": "True"
        },
        {
            "name": "V3_sep1",
            "fieldname": "Current 1 bunch",
            "units": "mA"
        },
        {
            "name": "V3_sep2",
            "fieldname": "Current 2 bunch",
            "units": "mA"
        },
        {
            "name": "V3_lifetime",
            "fieldname": "Lifetime",
            "units": "sec",
            "color": "yellow"
        },
        {
            "name": "V3_currintegral",
            "fieldname": "Current integral",
            "units": "C",
            "color": "blue"
        }
        ],
        V4_table = [{
            "name": "V4_status",
            "fieldname": "Status",
            "units": ""
        },
        {
            "name": "V4_mode",
            "fieldname": "Mode",
            "units": "",
            "color": "yellow"
        },
        {
            "name": "V4_polarity",
            "fieldname": "Polarity",
            "units": "",
            "color": "green"
        },
        {
            "name": "V4_energy",
            "fieldname": "Energy",
            "units": "MeV",
            "color": "yellow"
        },
        {
            "name": "V4_e1",
            "fieldname": "Current e- 1 bunch",
            "units": "mA",
            "color": "green"
        },
        {
            "name": "V4_e2",
            "fieldname": "Current e- 2 bunch",
            "units": "mA",
            "color": "green"
        },
        {
            "name": "V4_p1",
            "fieldname": "Current e+ 1 bunch",
            "units": "mA",
            "color": "red"
        },
        {
            "name": "V4_p2",
            "fieldname": "Current e+ 2 bunch",
            "units": "mA",
            "color": "red"
        },
        {
            "name": "V4_lifetime",
            "fieldname": "Lifetime",
            "units": "sec",
            "color": "yellow"
        },
        {
            "name": "V4_luminosityE",
            "fieldname": "LuminosityE",
            "units": "^28",
            "color": "yellow"
        },
        {
            "name": "V4_luminosityP",
            "fieldname": "LuminosityP",
            "units": "^28",
            "color": "yellow"
        },
        {
            "name": "V4_currintegral",
            "fieldname": "Current integral",
            "units": "C",
            "color": "blue"
        },
        {
            "name": "V4_lumintegral",
            "fieldname": "Luminosity integral",
            "units": "1/nb",
            "color": "blue"
        }
        ];

    function updateTableData(){
        V3_table.forEach(function(table_item){
            var tick_item = $.grep(tickdata, function(e){ return e.Name==table_item.name; })[0]
            if(tick_item){
                table_item.value = tick_item.Value;
            }

        })
        V4_table.forEach(function(table_item){
            var tick_item = $.grep(tickdata, function(e){ return e.Name==table_item.name; })[0]
            if(tick_item){
                table_item.value = tick_item.Value;
            }
        })
    };

    $(document).on("got_tickdata",function(){
        tickdata = model.getTickData();
        updateTableData();
        $("#v3tickData").jqxDataTable('updateBoundData');
        $("#v4tickData").jqxDataTable('updateBoundData');
    });

    var cellclass = function(row,datafield,value,rowdata){
        return rowdata.color;
    }

    var v3_tablesource =
    {
        dataType: "json",
        dataFields: [
            { name: 'value' },
            { name: 'name' },
            { name: 'fieldname' },
            { name: 'units' },
            { name: 'color' }
        ],
        localData: V3_table
    };
    var v3_tableAdapter = new $.jqx.dataAdapter(v3_tablesource);
    v3_tableAdapter.dataBind();
    $("#v3tickData").jqxDataTable(
    {
        source: v3_tableAdapter,
        localization: {thousandsSeparator: " "},
        columns: [
            { dataField: 'fieldname', width: 170, resizable: true },
            { dataField: 'value', width: 170, resizable: true, cellclassname: cellclass },
            { dataField: 'units', width: 50, resizable: true }
        ],
        showHeader: false
    });

    var v4_tablesource =
    {
        dataType: "json",
        dataFields: [
            { name: 'value' },
            { name: 'name' },
            { name: 'fieldname' },
            { name: 'units' },
            { name: 'color' }
        ],
        localData: V4_table
    };
    var v4_tableAdapter = new $.jqx.dataAdapter(v4_tablesource);
    v4_tableAdapter.dataBind();
    $("#v4tickData").jqxDataTable(
    {
        source: v4_tableAdapter,
        localization: {thousandsSeparator: " "},
        columns: [
            { dataField: 'fieldname', width: 170, resizable: true },
            { dataField: 'value', width: 170, resizable: true, cellclassname: cellclass  },
            { dataField: 'units', width: 50, resizable: true }
        ],
        showHeader: false
    });

    return {

    };
}