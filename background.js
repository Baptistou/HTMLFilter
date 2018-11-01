/* -------------------- PreProcess -------------------- */

//Global constants
const PORT_CONTENT = "content";
const MODE_READ=1, MODE_EDIT=2;
const BROWSERACTION_TITLE = {1: "HTMLFilter (OFF)", 2: "HTMLFilter (ON)"};
const BROWSERACTION_ICON = {1: "/images/icon-read.png", 2: "/images/icon-edit.png"};
const CONTEXTTYPE_HTML = !ANDROID && Object.values(browser.contextMenus.ContextType)
	.intersect(["audio","editable","frame","image","link","page","password","selection","video"]);

/* -------------------- Main Process -------------------- */

//Global variables
var portcon = new PortConnect();
var mode = MODE_READ;

//Browser action button click
//Note: No Firefox Android support for browserAction.setIcon()
browser.browserAction.onClicked.addListener(function(tab){
	mode = (mode==MODE_EDIT)? MODE_READ : MODE_EDIT;
	browser.browserAction.setTitle({title: BROWSERACTION_TITLE[mode]});
	if(!ANDROID) browser.browserAction.setIcon({path: BROWSERACTION_ICON[mode]});
	portcon.send(PORT_CONTENT);
});

//Creates context menu items
//Note: No Firefox Android support
if(!ANDROID)
browser.contextMenus.create({
	id: "remove",
	title: "Remove this element",
	contexts: CONTEXTTYPE_HTML
});

//Context menu click
//Note: No Firefox Android support
if(!ANDROID)
browser.contextMenus.onClicked.addListener(function(info,tab){
	portcon.send({
		port: PORT_CONTENT,
		tabid: tab.id,
		msg: {status: info.menuItemId}
	});
});

//Port communication between scripts
browser.runtime.onConnect.addListener(function(port){
	portcon.connect({
		port: port,
		msgpost: function(){
			return {status: "mode", mode: mode};
		}
	});
	portcon.send(PORT_CONTENT);
});
