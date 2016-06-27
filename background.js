chrome.alarms.onAlarm.addListener(function(alarm) {
	var alName = alarm.name.split(" ");
	var windID = parseInt(alName[1]);
	var alURL = alName[0];

	chrome.windows.get(windID, function(w) {
		if(chrome.runtime.lastError) {
			chrome.tabs.create({windowId: chrome.windows.WINDOW_ID_CURRENT, url : alURL});
		} else if (chrome.windows.WINDOW_ID_CURRENT != undefined) {
			chrome.tabs.create({windowId: w.id, url : alURL});
		} else {
			chome.windows.create({ url: alURL});
		}
	});

	chrome.storage.sync.remove(alarm.name);


	chrome.alarms.clear(alarm.name);

	chrome.notifications.create({
		type : "basic",
		title : "re:tab",
		message : "Here is " + alURL + " from before!",
		iconUrl : "notifIcon.png",
		buttons : [{
			title : "Snooze!" 
		}]
	});

	chrome.notifications.onButtonClicked.addListener(function(notID, butInd){
		chrome.alarms.create(alarm.name, { "delayInMinutes" : 5 });
		var dataObj = {};
		dataObj[alarm.name] = alURL;
		chrome.storage.sync.set(dataObj);
		chrome.tabs.query({currentWindow: true, active : true}, function(tabArray){
				chrome.tabs.remove(tabArray[0].id);
		});

	});
	
});
