CURGRAPH.namespace("CURGRAPH.CurrentController");
CURGRAPH.CurrentController = function(model,view){
    var view = view,
        model = model
        ;

    tick = function(){
        $(document).trigger("tick");
    };

    var tik_tak = setInterval(tick, 1000);

    return{

    };
};