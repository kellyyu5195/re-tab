if(document.getElementById('save') != null) {
	document.getElementById('save').onclick = function(e) {
		CreateAlarm(document.getElementById('input').value);
	};
}

document.onkeypress = function(e) {
	e = e || window.event;
	var code = (typeof e.which == "number") ? e.which : e.keyCode;
	if (code == 13) {
		CreateAlarm(document.getElementById('input').value);
	}
}

if(document.getElementById('view') != null) {
	document.getElementById('view').onclick = function(e) {
		showAlarms();
	};
}

var errorStr = '<h4 id="intro"><center><font color="#ff5a5f" face="arial,helvetica,sans-serif">Something about your input is wrong :( Please try again!</font></center></h4>';

/* CreateAlarm(TIME), isInvalidInput(userInput), getTime(TIME)
	are used to create an alarm when the done button is pressed */
function CreateAlarm(TIME) {
	if (isInvalidInput(TIME)) {
		document.getElementById('intro').innerHTML = errorStr;
		return;
	}
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
     	activeTab = arrayOfTabs[0];
		var activeTabURL = activeTab.url;
		var activeTabID = activeTab.id;
		var time = getTime(TIME);
		var windID = activeTab.windowId;
		var alarmName = activeTabURL + " " + windID;
		chrome.alarms.create(alarmName, {
			"when" : time
		});
		var dataObj = {};
		dataObj[alarmName] = activeTabURL;
		chrome.storage.sync.set(dataObj);
		chrome.tabs.remove(activeTabID);
		
	});
}

function isInvalidInput(userInput){

	if (userInput == null) return true;

	inpList = userInput.split(/:| /);
	if (inpList.length < 3) return true;
	for (i=0; i < inpList.length; i++) {
		if (inpList[i] == '') return true;
	}
	if (inpList[1] == 0 && inpList[1] != "00") return true;
	if (inpList[0] > 23) return true;
	if (inpList[1] > 59) return true;

	var validAMPM = (inpList[2]=="am" || inpList[2]=="AM" || inpList[2]=="pm" || inpList[2]=="PM");
	if (!validAMPM) return true;
	
}

function getTime(TIME) {
	var time = moment();

	var inpTime = TIME.split(/:| /);
	var hr = parseInt(inpTime[0]);
	var min = parseInt(inpTime[1]);

	if ((inpTime[2] == 'pm'|| inpTime[2] == "PM") && hr < 12) hr = hr + 12;
	if ((inpTime[2] == 'am'|| inpTime[2] == "AM")  && hr == 12) hr = 0;

	if (hr < time.hour() || (hr == time.hour() && min < time.minute())) {
		time.add(1, 'day');
		alert("This is set for ~*tomorrow*~ :)");
	}

	time.hour(hr);
	time.minute(min);
	time.second(0);

	return time.utc().unix() * 1000;
}

function clearDisplay () {
	if (document.getElementById('all-alarms') != null) {
		document.getElementById('all-alarms').remove();
	}
}

/* showAlarms(), addAlarmView() and makeButt(id) are use to show the user the currently set alarms */
function showAlarms() {
	clearDisplay();
	chrome.storage.sync.get(null, function(items){
		var ks = Object.keys(items);
		var showAlms = document.createElement("div");
		showAlms.id = "all-alarms";
		showAlms.style.textAlign = "center";
		document.body.appendChild(showAlms);
		for(i=0; i<ks.length; i++){
			var item = document.createElement('span');
			item.id = ks[i];
			showAlms.appendChild(item);
			addAlarmView(ks[i]);
		}
		if (ks.length == 0) {
			var txt = document.createElement('h4');
			var error = document.createTextNode("Sorry, you don't have anything saved!");
			txt.appendChild(error);
			txt.className = "text";
			showAlms.appendChild(txt);
		}
	});
}

function addAlarmView(name) {
	var time = " ";
	chrome.alarms.get(name, function(alm) {
		uTime = alm.scheduledTime;
		time = moment.unix(uTime/1000).format("MMM DD YYYY hh:mm a");
		var txt = document.createElement("h4");
		var inp = name.split(" ");
		var url = inp[0];
		var webName = getHostName(url);
		var disp = document.createTextNode(webName + " @ " + time);
		txt.appendChild(disp);
		txt.className = "text";
		document.getElementById(name).appendChild(txt);
		//deleteButt(name);
		editButt(name);
		nowButt(name);
	});

}



function editButt(name) {
	var eButt = makeButton("Edit", "button2", "edit");
	document.createElement("button");
	eButt.onclick = function(e) {
		newSetup(name);
	}
	document.getElementById(name).appendChild(eButt);
}

function nowButt(name) {
	var nButt = makeButton("Open Now", 'button2', 'nowbutt');
	nButt.onclick = function(e) {
		console.log("hi");
		now = moment().utc().unix() * 1000;
		chrome.alarms.clear(name);
		chrome.alarms.create(name, {"when" : now});
		clearDisplay();
		showAlarms();
	};
	document.getElementById(name).appendChild(nButt);
}

function newSetup(name) {
	if(document.getElementById('holder') != null) {
		document.getElementById('holder').remove();
	}
	
	var newItems = document.createElement("div");
	newItems.id = "holder";
	var newTimeInp = document.createElement("textarea");
	newTimeInp.id = "new-time";
	
	var sendButt = makeButton("Update", "button2", "sendbutt");
	sendButt.onclick = function(e) {
		var newInp = document.getElementById('new-time').value;
		if (isInvalidInput(newInp)) {
			document.getElementById('intro').innerHTML = errorStr;
			return;
		}
		newTime = getTime(newInp);
		chrome.alarms.clear(name);
		chrome.alarms.create(name, {"when" : newTime});
		clearDisplay();
		showAlarms();
	};

	var deleteButt = makeButton("Delete", "button2", "delete");
	deleteButt.onclick = function(e){
		chrome.alarms.clear(name);
		chrome.storage.sync.remove(name);
		clearDisplay();
		showAlarms();
	};
	
	// adding to DOM
	document.getElementById(name).appendChild(newItems);
	newItems.appendChild(document.createElement("br"));
	newItems.appendChild(newTimeInp);
	newItems.appendChild(document.createElement("br"));
	newItems.appendChild(document.createElement("br"));
	newItems.appendChild(sendButt);
	newItems.appendChild(deleteButt);
}


function getHostName(url) {
    var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
    return match[2];
    }
    else {
        return null;
    }
}

function makeButton(name, buttClass, buttID){
	var button = document.createElement("button");
	button.appendChild(document.createTextNode(name));
	button.className = buttClass;
	button.id = buttID;
	return button;
}