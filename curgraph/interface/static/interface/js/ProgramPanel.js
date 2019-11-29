CURGRAPH.namespace("CURGRAPH.ProgramPanel");
CURGRAPH.ProgramPanel = function(box,model){
    var model=model,
        programbox = box,
	programdata = [];

    function updateProgramPanel(){
	var person = programdata[0];
	var program = programdata[1];
	if(!person) person = "";
	if(!program) program = "";
        programbox.children("h3").text("Начальник смены: "+ person +"         Программа работы: "+ program)
    };


    function initProgramDataReading(){
    	model.loadProgramData();
	setTimeout(function(){initProgramDataReading()}, 30*60*1000);
    }

    initProgramDataReading();

    $(document).on("got_programdata",function(){
        programdata = model.getProgramData();
        updateProgramPanel();
    });

    return {

    };
}
