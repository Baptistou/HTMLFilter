/* -------------------- PreProcess -------------------- */

//Global constants
const PORT_CONTENT = "content", PORT_SETTINGS = "settings";
const MODE_READ=1, MODE_EDIT=2;
const BROWSERACTION_TITLE = {1: "HTMLFilter (OFF)", 2: "HTMLFilter (ON)"};
const BROWSERACTION_ICON = {1: "/images/icon-read.png", 2: "/images/icon-edit.png"};
const CONTEXTMENU_SETTINGS = "settings", CONTEXTMENU_REMOVE = "remove";
const CONTEXTMENU_SETTINGS_TITLE = geti18ndata("Settings");
const CONTEXTMENU_REMOVE_TITLE = geti18ndata({key: "contextmenu_remove", msg: "Remove this element"});
const CONTEXTTYPE_HTML = !ANDROID && Object.values(browser.contextMenus.ContextType)
	.intersect(["audio","editable","frame","image","link","page","password","selection","video"]);

/* -------------------- Functions -------------------- */

//Creates context menu items
function createcontextmenu(){
	browser.contextMenus.create({
		id: CONTEXTMENU_REMOVE,
		title: CONTEXTMENU_REMOVE_TITLE,
		contexts: CONTEXTTYPE_HTML
	});
}

//Removes context menu items
function removecontextmenu(){
	browser.contextMenus.remove(CONTEXTMENU_REMOVE);
}

//Connects to content scripts
function contentcon(port){
	portcon.connect({
		port: port,
		msgpost: function(){
			return {status: "mode", mode: mode};
		}
	});
	portcon.send(PORT_CONTENT);
}

//Gets settings data received from port message
function getsettingsdata(msg){
	switch(msg.status){
	case "options" :
		for(var prop in msg.options) options[prop] = msg.options[prop];
		if(options.contextmenu==true) createcontextmenu();
		if(options.contextmenu==false) removecontextmenu();
		browser.storage.local.set({options: options});
	break;}
	portcon.send(PORT_SETTINGS);
}

//Connects to settings script
function settingscon(port){
	portcon.connect({
		port: port,
		msgpost: function(){
			return {status: "settings", options: options};
		},
		msgget: getsettingsdata
	});
	portcon.send(PORT_SETTINGS);
}

/* -------------------- Main Process -------------------- */

//Global variables
var portcon = new PortConnect();
var mode = MODE_READ;
var options = null;

//Retrieves data from local storage
browser.storage.local.get(function(storage){
	options = storage.options || {};
	options = {
		contextmenu: (!ANDROID && options.contextmenu!=false),
	};
	if(options.contextmenu) createcontextmenu();
});

//Browser action button click
//Note: No Firefox Android support for browserAction.setIcon()
browser.browserAction.onClicked.addListener(function(tab){
	mode = (mode==MODE_EDIT)? MODE_READ : MODE_EDIT;
	browser.browserAction.setTitle({title: BROWSERACTION_TITLE[mode]});
	if(!ANDROID) browser.browserAction.setIcon({path: BROWSERACTION_ICON[mode]});
	portcon.send(PORT_CONTENT);
});

//BrowserAction context menu
//Note: Firefox doesn't have browserAction context menu to open OptionsPage
//Note: No Firefox 52- support for ContextType.BROWSER_ACTION
//Note: No Firefox Android 56- support + Firefox and Opera issue with openOptionsPage()
if(FIREFOX && !ANDROID && browser.contextMenus.ContextType.BROWSER_ACTION)
browser.contextMenus.create({
	id: CONTEXTMENU_SETTINGS,
	title: CONTEXTMENU_SETTINGS_TITLE,
	contexts: ["browser_action"]
});

//Context menu click
//Note: No Firefox Android support
if(!ANDROID)
browser.contextMenus.onClicked.addListener(function(info,tab){
	switch(info.menuItemId){
	case CONTEXTMENU_SETTINGS : browser.runtime.openOptionsPage();
	break;
	case CONTEXTMENU_REMOVE :
		portcon.send({
			port: PORT_CONTENT,
			tabid: tab.id,
			msg: {status: CONTEXTMENU_REMOVE}
		});
	break;}
});

//Port communication between scripts
browser.runtime.onConnect.addListener(function(port){
	switch(port.name){
	case PORT_CONTENT : contentcon(port);
	break;
	case PORT_SETTINGS : settingscon(port);
	break;}
});
