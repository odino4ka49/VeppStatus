CURGRAPH.namespace("CURGRAPH.StatusPanel");
CURGRAPH.StatusPanel = function(table,model){
    var model =  model,
        tickdata=[],
        status_table = [{
            "name": "systems",
            "units": "",
            "fieldname": "",
            "V4": "ВЭПП-4",
            "V3": "ВЭПП-3",
            "IC": "ИК"
        },
        {
            "name": "energy",
            "units": "МэВ",
            "fieldname": "Энергия",
            "V4_field": "V4_energy",
            "V3_field": "V3_energy",
            "IC": ""
        },
        {
            "name": "status",
            "units": "",
            "fieldname": "Статус",
            "V4_field": "V4_status",
            "V3_field": "V3_status",
            "IC": ""
        },
        {
            "name": "current",
            "units": "мА",
            "fieldname": "Ток",
            "V4_field": "V4_total",
            "V3_field": "V3_total",
            "IC": ""
        },
        {
            "name": "polarity",
            "units": "",
            "fieldname": "Полярность",
            "V4_field": "V4_polarity",
            "V3_field": "V3_polarity",
            "IC": ""
        }];


    function updateTableData(){
        status_table.forEach(function(table_item){
            var v3_item = $.grep(tickdata, function(e){ return e.Name==table_item.V3_field; })[0]
            var v4_item = $.grep(tickdata, function(e){ return e.Name==table_item.V4_field; })[0]
            if(v3_item){
                table_item.V3 = v3_item.Value;
            }
            if(v4_item){
                table_item.V4 = v4_item.Value;
            }
        });
    };

    $(document).on("got_tickdata",function(){
        tickdata = model.getTickData();
        updateTableData();
        $("#statusPanel").jqxGrid('updateBoundData');
    });

    var status_tablesource =
    {
        dataType: "json",
        dataFields: [
            { name: 'name' },
            { name: 'fieldname' },
            { name: 'units' },
            { name: 'V4' },
            { name: 'V3' },
            { name: 'IC' }
        ],
        localData: status_table
    };
    var status_tableAdapter = new $.jqx.dataAdapter(status_tablesource);
    status_tableAdapter.dataBind();
    $("#statusPanel").jqxGrid(
    {
        source: status_tableAdapter,
        localization: {thousandsSeparator: " "},
        height: 160,
	rowsheight: 30,
        width: 1150,
        editable: true,
        columns: [
            { dataField: 'fieldname', width: 150, resizable: true, editable: false },
            { dataField: 'units', width: 85, resizable: true, editable: false },
            { dataField: 'V4', width: 150, resizable: true, cellsalign: 'center', editable: false },
            { dataField: 'V3', width: 250, resizable: true, cellsalign: 'center', editable: false },
            { dataField: 'IC', width: 250, resizable: true, cellsalign: 'center', editable: false },
        ],
        showHeader: false
    });

    return {

    };
}
