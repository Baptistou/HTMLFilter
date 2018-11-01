/* -------------------- PreProcess -------------------- */

//Global constants
const PORT_CONTENT = "content";
const MODE_READ=1, MODE_EDIT=2;

/* -------------------- Functions -------------------- */

//Event functions
var targetoncontextmenu = (event) => (target = event.target);
var removeonclick = (event) => event.target.remove();

//Restores previous state to last hovered element
function restorepreviousstate(){
	var item = document.querySelector(".webext-htmlfilter-mode");
	if(item){
		item.classList.remove("webext-htmlfilter-mode");
		item.removeEventListener("mousedown",removeonclick);}
}

//Changes state of target element on mouse hover
function changestateonmouseover(event){
	if(event.target!=document.documentElement && !(event.target instanceof SVGElement)){
		restorepreviousstate();
		event.target.classList.add("webext-htmlfilter-mode");
		event.target.addEventListener("mousedown",removeonclick);}
}

//Sets mode
function setmode(msg){
	mode = msg.mode;
	switch(mode){
	case MODE_READ :
		restorepreviousstate();
		document.removeEventListener("mouseover",changestateonmouseover);
	break;
	case MODE_EDIT :
		document.addEventListener("mouseover",changestateonmouseover);
	break;}	
}

/* -------------------- Main Process -------------------- */

//Global variables
var mode = MODE_READ;
var target = null;

//Context menu click
//Note: Firefox not firing oncontextmenu when shift key is pressed
document.addEventListener("click",targetoncontextmenu);
document.addEventListener("contextmenu",targetoncontextmenu);

//Connects port with background script
var port = browser.runtime.connect({name: PORT_CONTENT});

//Port communication between scripts
port.onMessage.addListener(function(msg){
	switch(msg.status){
	case "mode" : setmode(msg);
	break;
	case "remove" : target.remove();
	break;}
});
