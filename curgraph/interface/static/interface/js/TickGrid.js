CURGRAPH.namespace("CURGRAPH.TickGrid");
CURGRAPH.TickGrid = function(table,model,vepp){
    var model=model,
    	vepp=vepp,
        tickdata=[],
        V3_table = [{
            "name": "V3_status",
            "fieldname": "Status",
            "units": "",
            "displaycheckbox":"false",
        },
        {
            "name": "V3_time",
            "fieldname": "From start",
            "units": "sec",
            "displaycheckbox":"false",
        },
        {
            "name": "V3_mode",
            "fieldname": "Mode",
            "units": "",
            "displaycheckbox":"false",
        },
        {
            "name": "V3_polarity",
            "fieldname": "Polarity",
            "units": "",
            "displaycheckbox":"false",
        },
        {
            "name": "V3_energy",
            "fieldname": "Energy",
            "units": "MeV",
            "color": "color1",
            "plot": "V3_energy"
        },
        {
            "name": "V3_total",
            "fieldname": "Beam current",
            "units": "mA",
            "color": "color2",
            "display": "true",
            "plot": ["V3_total_e-","V3_total_e+"]
        },
        {
            "name": "V3_sep1",
            "fieldname": "Current 1",
            "color": "color3",
            "units": "mA",
            "plot": "V3_sep1"
        },
        {
            "name": "V3_sep2",
            "fieldname": "Current 2",
            "color": "color4",
            "units": "mA",
            "plot": "V3_sep2"
        },
        {
            "name": "V3_lifetime",
            "fieldname": "Lifetime",
            "units": "sec",
            "color": "color5",
            "plot": "V3_lifetime"
        },
        {
            "name": "V3_currintegral",
            "fieldname": "Cur integral",
            "units": "C",
            "color": "color6",
            "plot":"V3_currintegral"
        }
        ],
        V4_table = [{
            "name": "V4_status",
            "fieldname": "Status",
            "units": "",
            "displaycheckbox":"false"
        },
        {
            "name": "V4_mode",
            "fieldname": "Mode",
            "units": "",
            "displaycheckbox":"false"
        },
        {
            "name": "V4_polarity",
            "fieldname": "Polarity",
            "units": "",
            "displaycheckbox":"false"
        },
        {
            "name": "V4_energy",
            "fieldname": "Energy",
            "units": "MeV",
            "color": "color1",
            "plot": "V4_energy"
        },
        {
            "name": "V4_total",
            "fieldname": "Beam current",
            "units": "mA",
            "color": "color2",
            "display": "true",
            "plot": "V4_total"
        },
        {
            "name": "V4_e1",
            "fieldname": "Current e- 1",
            "units": "mA",
            "color": "color3",
            "plot": "V4_e1"
        },
        {
            "name": "V4_e2",
            "fieldname": "Current e- 2",
            "units": "mA",
            "color": "color7",
            "plot": "V4_e2"
        },
        {
            "name": "V4_p1",
            "fieldname": "Current e+ 1",
            "units": "mA",
            "color": "red",
            "color": "color13",
            "plot": "V4_p1"
        },
        {
            "name": "V4_p2",
            "fieldname": "Current e+ 2",
            "units": "mA",
            "color": "color8",
            "plot": "V4_p2"
        },
        {
            "name": "V4_lifetime",
            "fieldname": "Lifetime",
            "units": "sec",
            "color": "color5",
            "plot": "V4_lifetime"
        },
        {
            "name": "V4_luminosityE",
            "fieldname": "LuminosityE",
            "units": "^28",
            "color": "color9",
            "display": "true",
            "plot": "V4_luminosityE"
        },
        {
            "name": "V4_luminosityP",
            "fieldname": "LuminosityP",
            "units": "^28",
            "color": "color10",
            "plot": "V4_luminosityP"
        },
        {
            "name": "V4_luminosityMean",
            "fieldname": "Mean Lum",
            "units": "^28",
            "color": "color12",
            "plot": "V4_luminosityMean"
        },
        {
            "name": "V4_currintegral",
            "fieldname": "Cur integral",
            "units": "C",
            "color": "color6",
            "plot": "V4_currintegral"
        },
        {
            "name": "V4_lumintegral",
            "fieldname": "Lum integral",
            "units": "1/nb",
            "color": "color11",
            "plot": "V4_lumintegral"
        }
        ];

    function updateTableData(){
	if(vepp!="vepp4"){
		V3_table.forEach(function(table_item){
		    var tick_item = $.grep(tickdata, function(e){ return e.Name==table_item.name; })[0]
		    if(tick_item){
			table_item.value = tick_item.Value;
		    }

		})
	}
	if(vepp!="vepp3"){
		V4_table.forEach(function(table_item){
		    var tick_item = $.grep(tickdata, function(e){ return e.Name==table_item.name; })[0]
		    if(tick_item){
		        table_item.value = tick_item.Value;
		    }
		})
	}
    };

    $(document).on("got_tickdata",function(){
        tickdata = model.getTickData();
        updateTableData();
	if(vepp!="vepp4"){
	    $("#v3tickData").jqxGrid('updateBoundData');
	}
	if(vepp!="vepp3"){
            $("#v4tickData").jqxGrid('updateBoundData');
	}
    });

    var cellclass = function(row,datafield,value,rowdata){
        return rowdata.color;
    }
    var hiddencellclass = function(row,datafield,value,rowdata){
        if(rowdata.displaycheckbox==false){
            return "hidden";
        }
    }

    if(vepp!="vepp4"){
	var v3_tablesource =
	{
		dataType: "json",
		dataFields: [
		    { name: 'value' },
		    { name: 'name' },
		    { name: 'fieldname' },
		    { name: 'units' },
		    { name: 'color' },
		    { name: 'display', type: 'bool' },
		    { name: 'displaycheckbox', type: 'bool' }
		],
		localData: V3_table
	};
	var v3_tableAdapter = new $.jqx.dataAdapter(v3_tablesource);
	v3_tableAdapter.dataBind();
	$("#v3tickData").jqxGrid(
	{
		source: v3_tableAdapter,
		localization: {thousandsSeparator: " "},
		autoheight: true,
		rowsheight: 20,
		width: 295,
		editable: true,
		columns: [
		    { dataField: 'fieldname', width: 125, resizable: true, editable: false, cellclassname: cellclass },
		    { dataField: 'value', width: 100, resizable: true, cellsalign: 'right', cellclassname: cellclass, editable: false },
		    { dataField: 'units', width: 45, resizable: true, editable: false, cellclassname: cellclass },
		    { dataField: 'display', width: 10, resizable: true, columntype: 'checkbox', cellclassname: hiddencellclass, editable: true }
		],
		showHeader: false
	});
	$("#v3tickData").on('cellendedit', function (event) {
		var args = event.args;
		V3_table[args.rowindex][args.datafield] = args.value;
		if(args.datafield=="display"){
		    $(document).trigger("plot_display",[V3_table[args.rowindex],args.value]);
		}
	});
    }

    if(vepp!="vepp3"){
	var v4_tablesource =
	{
		dataType: "json",
		dataFields: [
		    { name: 'value' },
		    { name: 'name' },
		    { name: 'fieldname' },
		    { name: 'units' },
		    { name: 'color' },
		    { name: 'display', type: 'bool' },
		    { name: 'displaycheckbox', type: 'bool' }
		],
		localData: V4_table
	};
	var v4_tableAdapter = new $.jqx.dataAdapter(v4_tablesource);
	v4_tableAdapter.dataBind();
	$("#v4tickData").jqxGrid(
	{
		source: v4_tableAdapter,
		localization: {thousandsSeparator: " "},
		autoheight: true,
		rowsheight: 20,
		width: 295,
		editable: true,
		columns: [
		    { dataField: 'fieldname', width: 125, resizable: true, editable: false, cellclassname: cellclass },
		    { dataField: 'value', width: 100, resizable: true, cellsalign: 'right', cellclassname: cellclass, editable: false },
		    { dataField: 'units', width: 45, resizable: true, editable: false, cellclassname: cellclass },
		    { dataField: 'display', width: 10, resizable: true, columntype: 'checkbox', cellclassname: hiddencellclass, editable: true }
		],
		showHeader: false
	});
	$("#v4tickData").on('cellendedit', function (event) {
		var args = event.args;
		V4_table[args.rowindex][args.datafield] = args.value;
		if(args.datafield=="display"){
		    $(document).trigger("plot_display",[V4_table[args.rowindex],args.value]);
		}
	});
    }

    $(".collapseTrigger").click(function(){
	if($(this).hasClass("collapsed")){
	    $(this).siblings(":not(this)").show();
	    $(this).parent().next().show();
	    $(this).removeClass("collapsed");
	}
	else{
	     $(this).siblings(":not(this)").hide();
	    $(this).parent().next().hide();
	    $(this).addClass("collapsed");
	}
	
    });

    return {

    };
}
