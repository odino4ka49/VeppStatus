CURGRAPH.namespace("CURGRAPH.ProgramPanel");
CURGRAPH.ProgramPanel = function(box,model){
    var model=model,
        programbox = box,
	programdata = [];

    function updateProgramPanel(){
        programbox.children("h3").text("Начальник смены: "+programdata[0]+"         Программа работы: "+programdata[1])
	/*.each(function(i) {
	    if(i==0){
		$( this ).text("Начальник смены: "+programdata[0])
	    }
	    else if(i==1){
		$( this ).text("Программа работы: "+programdata[1])
	    }
	});*/
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
