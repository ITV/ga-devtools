var GADebugger = (function() {

    var GADebugger = function() {
        this.requestHandler = this.requestHandler.bind(this);
        this.HARHandler = this.HARHandler.bind(this);
        this.listClickHandler = this.listClickHandler.bind(this);
        this.gaEventHandler = this.gaEventHandler.bind(this);

        chrome.devtools.network.onRequestFinished.addListener(this.requestHandler);
        chrome.devtools.network.getHAR(this.HARHandler);

        this.list = document.querySelector('#requests .item-list');
        this.payload = document.querySelector('#payload pre');

        this.list.addEventListener('change', this.listClickHandler);

        if(chrome.devtools.panels.themeName === 'dark') {
            this.list.style.color = 'white';
            this.payload.style.color = 'darkturquoise';
        }

        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (changeInfo.status === 'complete') {
                this.cleanView();
            }
        }.bind(this));

        document.getElementById("clean").addEventListener("click", this.cleanView);
    }

    GADebugger.prototype.cleanView = function() {
        document.querySelector(".item-list").innerHTML = ""
        document.getElementById("payload-body").innerHTML = "";
    };

    var parseQueryString = function(queryString) {
        var params = {}, queries, temp, i, l;
        // Split into key/value pairs
        queries = queryString.split("&");
        // Convert the array of strings into an object
        for ( i = 0, l = queries.length; i < l; i++ ) {
            temp = queries[i].split('=');
            params[temp[0]] = temp[1];
        }
        return params;
    }

    GADebugger.prototype.requestHandler = function(item) {
        if (item.request.url.indexOf('google-analytics.com') !== -1) {
            var queryString = item.request.url.substring( item.request.url.indexOf('?') + 1 );
            if (item.request.method === 'GET' && queryString) {
                var payload = parseQueryString(queryString);          
                if (Array.isArray(payload)) {
                    payload.forEach(this.gaEventHandler);
                }
                else {
                    this.gaEventHandler(payload);
                }
            }
        }
    };

    GADebugger.prototype.gaEventHandler = function(eventData) {
        var timestamp = (new Date).toISOString().replace(/z|t/gi, ' ').trim();
        var item = UI.ItemList.addItem(
            this.list,
            '[' + timestamp + '] ' + eventData.t,
            JSON.stringify(eventData)
        );
    };

    GADebugger.prototype.listClickHandler = function(event) {
        this.payload.innerHTML = JSON.stringify(JSON.parse(event.detail), undefined, 2);
    };

    GADebugger.prototype.HARHandler = function(result) {
        result.entries.forEach(this.requestHandler);
    };

    return new GADebugger();

})();
