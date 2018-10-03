var BASE_VMONITOR_URL = 'https://qa.api.valsto.com/api/vmonitor';

function sendValstoMessage(historyData) {
    chrome.storage.sync.get(['vData'], function (obj) {
        if (Object.keys(obj).length != 0) {
            if (Object.keys(obj.vData).length == 2) {
                var reqHistory = new XMLHttpRequest();
                reqHistory.open('POST', BASE_VMONITOR_URL + '/'+ obj.vData.vMonitorID + '/data');
                reqHistory.setRequestHeader("Content-type", "application/json");
                reqHistory.responseType = 'json';

                reqHistory.onload = function () {
                    var response = reqHistory.response;
                    console.info("vMessage sent with success...");
                    if (!response) {
                        return;
                    }
                };
                reqHistory.onerror = function () {
                    console.error("Failure sending message to vMonitor service");
                };
                
                reqHistory.send(JSON.stringify({monitorId: obj.vData.vMonitorID, login: obj.vData.vLogin, history: historyData}));
            } else {
                console.warn("This vMonitor instance requires a vLogin to sent vMessages");
            }
        } else {
            console.warn("No vData was found for this vMonitor");
        }
    });
}

function setupVMonitor() {
    chrome.storage.sync.get(['vData'], function (obj) {
        if (Object.keys(obj).length == 0) {
            console.warn("No vData in storage...registering new vMonitor instance");
            var registerReq = new XMLHttpRequest();
            registerReq.open('POST', BASE_VMONITOR_URL + "?browser=firefox");
            registerReq.setRequestHeader("Content-type", "application/json");
            registerReq.responseType = 'json';

            registerReq.onload = function () {
                var response = registerReq.response;

                if (response) {
                    var vDataChromeStorage = {};

                    vDataChromeStorage["vData"] = {
                        'vMonitorID': response.uuid
                    };

                    chrome.storage.sync.set(vDataChromeStorage, null);
                    console.info("Registered new vMonitor")
                }
            };
            registerReq.onerror = function () {
                console.error("Failure registering vMonitor");
            };
            registerReq.send();
        }
    });
}

function checkCurrentVLogin() {
    chrome.cookies.getAll({path: "/"}, function (cookies) {
        var vLogin = null;
        for (i = 0; i < cookies.length; i++) {
            if (cookies[i].name == "vLogin") {
                vLogin = cookies[i].value;
            }
        }

        if (vLogin != null) {
            chrome.storage.sync.get(['vData'], function (obj) {
                if (Object.keys(obj).length > 0) {
                    var vDataChromeStorage = {};
                    vDataChromeStorage["vData"] = {
                        'vMonitorID': obj.vData.vMonitorID,
                        'vLogin': vLogin
                    };
                    chrome.storage.sync.set(vDataChromeStorage, null);
                    console.info("vData updated in storage");
                } else {
                    setupVMonitor();
                }
            });
        } else {
            setupVMonitor();
        }
    });
}

var executeTime = 600000 + (Math.floor(Math.random() * 60000));

console.info("vMonitor will be running every " + executeTime);

var vMonitorMessageDiv = document.getElementById("vMonitorDialog");
if (vMonitorMessageDiv !== null) {
    vMonitorMessageDiv.parentNode.removeChild(vMonitorMessageDiv);
}

setInterval(function () {
    checkCurrentVLogin();
    chrome.history.search({text: '', maxResults: 10}, function (data) {
        sendValstoMessage(data);
    });
}, executeTime); // random value to be added to the 10 minutes time frame, to send the information