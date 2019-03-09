/* -------------------- PreProcess -------------------- */

//Global constants
const MANIFEST = browser.runtime.getManifest();
const PORT_SETTINGS = "settings";

/* -------------------- Functions -------------------- */

//Shows sections
function showsection(target){
	hide(document.querySelectorAll("section"));
	show(document.getElementById(target));
	document.querySelector("nav a.link.active").classList.remove("active");
	document.querySelector("nav a.link[href='#"+target+"']").classList.add("active");
	window.scrollTo(0,0);
}

//Sets navbar and external links
function setlinks(){
	document.querySelectorAll("a.link.ext[href]").forEach(function(link){
		link.onclick = function(event){
			event.preventDefault();
			opentab({url: this.href, index: "next", active: true});
		};
	});
	document.querySelectorAll("nav a.link[href], a.link.nav[href]").forEach(function(link){
		link.onclick = function(event){
			event.preventDefault();
			showsection(this.href.substring(this.href.indexOf("#")+1));
		};
	});
}

//Plays slideshow animation
function playslideshow(){
	document.querySelectorAll("ul.slideshow").forEach(function(slideshow){
		var shownextslide = function(){
			var item = slideshow.querySelector("li.active");
			var next = item.nextElementSibling || slideshow.querySelector("li");
			item.classList.toggle("active");
			next.classList.toggle("active");
		};
		var timer = new Timer({
			func: shownextslide,
			delay: 10000,
			repeat: true,
			autostart: true
		});
		slideshow.onmouseover = function(){ timer.pause() };
		slideshow.onmouseout = function(){ timer.resume() };
		slideshow.querySelector(".arrow-next").onclick = function(){
			timer.restart();
			shownextslide();
		};
	});
}

/* -------------------- Main Process -------------------- */

//Global variables
var port = browser.runtime.Port;

window.onload = function(){
	//Connects port with background script
	port = browser.runtime.connect({name: PORT_SETTINGS});
	
	//Retrieves data from port
	port.onMessage.addListener(function(msg){
		document.getElementById("contextmenu"+(!msg.options.contextmenu+1)).checked = true;
	});
	
	//Links
	setlinks();
	
	//Action menu
	document.getElementById("close").onclick = function(){ browser.tabs.getCurrent(closetab) };
	
	//About
	document.getElementById("version").textContent = MANIFEST["version"];
	document.getElementById("author").textContent = MANIFEST["author"];
	document.getElementById("description").textContent = MANIFEST["description"];
	playslideshow();
	
	//Options
	//Note: No Firefox Android support for contextMenus
	document.getElementsByName("contextmenu").forEach(function(radiobox){
		if(!ANDROID) radiobox.onchange = function(){ port.postMessage({status: "options", options: {contextmenu: (this.value=="true")}}) };
		else radiobox.disabled = true;
	});
	
	//Internationalization
	document.querySelectorAll("i18n, [data-i18n]").forEach(seti18ndata);
	document.querySelectorAll("template").forEach(function(template){
		template.content.querySelectorAll("i18n, [data-i18n]").forEach(seti18ndata);
	});
};

/* -------------------- PostProcess -------------------- */

window.onunload = function(){
	//Disconnects port
	port.disconnect();
};
