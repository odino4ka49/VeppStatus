var CURGRAPH = CURGRAPH||{};
//создание пространства имен
CURGRAPH.namespace = function (ns_string) {
    var parts = ns_string.split('.'),
        parent = CURGRAPH,
        i;
    if (parts[0] === "CURGRAPH") {
        parts = parts.slice(1);
    }
    for (i = 0; i < parts.length; i += 1) {
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
};
CURGRAPH.serveradr = function(){
	return location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '')+"/";
};

$(document).on("set_loading_cursor",function(){
    document.body.style.cursor='wait';
});
$(document).on("unset_loading_cursor",function(){
    document.body.style.cursor='default';
});
$(document).ready(function(){
    var model = CURGRAPH.CurrentModel(),
        controller = CURGRAPH.CurrentController(model,null);
    var datatable = CURGRAPH.TickDataTable($("#tickData"),model);
    var chart = CURGRAPH.WeekChart($("#v3chart"),model);
    $.jqx.theme = 'darkblue';
});


