var locationSource={
    Loc: null,
    url: 'http://www.stanford.edu/~weishi/cgi-bin/locate.py',

    get: function(username, password, success, failure){
        $.ajax({
            dataType: 'json',
        url: locationSource.url,
        type: 'GET',
        data: {
            u: username,
        p: password,
        action: 'getLocation'
        },
        success: function(data){
            console.log(data);
            success(data);
        },
        error: function(xhr, status){
            console.log(status);
            failure(status);
        }
        });
    },

    getHistory: function(password, success, failure){
        $.ajax({
            dataType: 'json',
        url: locationSource.url,
        type: 'GET',
        data: {
            p: password,
        action: 'getHistory'
        },
        success: function(data){
            console.log(data);
            success(data);
        },
        error: function(xhr, status){
            console.log(status);
            failure(status);
        }
        });
    },

    clearRemoteHistory: function(){
        $.ajax({
            dataType: 'json',
        url: locationSource.url,
        type: 'GET',
        data: { action: 'clearHistory'}
        });
    },

    /* location from DB */
    init: function(){
        persistence.store.websql.config(persistence, 'fmiDB', 'Location history', 128 * 1024);
        Loc=persistence.define('loc',{
            longitude: "TEXT",
            latitude: "TEXT",
            accuracy: "TEXT",
            timestamp: "INT"
        });
        Loc.index('timestamp',{unique:true});
        persistence.schemaSync();
    },

    clearLocalHistory: function(){
        Loc.all().destroyAll();
        persistence.flush(function() {
            console.log('Done destorying');
        });
    },

    add: function(lg,lt,acc,ts){
        var newLoc=new Loc();
        newLoc.longitude=lg.toString();
        newLoc.latitude=lt.toString();
        newLoc.accuracy=acc.toString();
        newLoc.timestamp=ts;
        Loc.all().filter('timestamp','=',ts).count(function(result){
            if(result==0){
                persistence.add(newLoc);
                persistence.flush(function() {
                    console.log('Done inserting');
                });
            }
        });
    },

    getAll: function(callback){
        var allLoc=Loc.all().order('timestamp',false);
        allLoc.list(null,callback);
    },
};

var view={
    curLong: 121.480028,
    curLat: 31.236977,
    bm: '',
    curMarker: null,
    curCircle: null,
    traffic: null,
    enabledTraffic: false,

    init: function(){
        var bm = new BMap.Map("mapview", {enableHighResolution: true});
        bm.centerAndZoom(new BMap.Point(view.curLong, view.curLat), 17);
        var opts = {type: BMAP_NAVIGATION_CONTROL_ZOOM};    
        bm.addControl(new BMap.NavigationControl(opts));
        bm.addControl(new BMap.MapTypeControl());
        view.bm=bm;
        view.traffic = new BMap.TrafficLayer();
    },

    toggleTraffic: function(){
        if(view.enabledTraffic){
            view.bm.removeTileLayer(view.traffic);
            view.enabledTraffic=false;
        }else{
            view.bm.addTileLayer(view.traffic);
            view.enabledTraffic=true;
        }
    },

    update: function(longitude, latitude, acc, timestamp){
        view.curLong=longitude;
        view.curLat=latitude;
        view.curAccuracy=acc;
        view.lastUpdate=timestamp;
    },

    render: function(){
        view.bm.removeOverlay(view.curMarker);
        view.bm.removeOverlay(view.curCircle);
        var point = new BMap.Point(view.curLong, view.curLat);
        BMap.Convertor.translate(point,0,view.translate); 
    },

    translate: function (point){
        view.bm.centerAndZoom(point,19);
        var marker = new BMap.Marker(point);
        view.bm.addOverlay(marker);
        /* Add info */
        var fromNow=moment(view.lastUpdate).fromNow() + "<br>" + 
            moment(view.lastUpdate).format('MM/D HH:mm');
        var label = new BMap.Label(fromNow,{offset:new BMap.Size(20,-10)});
        label.setStyle({fontSize: '12px', borderRadius:'5px', opacity:'0.6'});
        marker.setLabel(label);
        marker.addEventListener('click',function(){
            /* Update info */
            this.getLabel().setContent(moment(view.lastUpdate).fromNow() + "<br>" +
                moment(view.lastUpdate).format('MM/D HH:mm'));
        });
        /* Add radius */
        var circle= new BMap.Circle(point,view.curAccuracy);
        circle.setFillColor('#0033cc');
        circle.setFillOpacity(0.3);
        circle.setStrokeWeight(1);
        view.bm.addOverlay(circle);

        /* Save object ref */
        view.curMarker=marker;        
        view.curCircle=circle;
    },
};


function loadHistory(){
    $.mobile.loading( "show", {
        text: "",
        textVisible: false,
        theme: "b",
        textonly: false,
        html: ""
    });
    if(typeof localStorage["username"] !== 'undefined'){
        locationSource.getHistory(
                localStorage["password"],
                function(historyPoints){
                    for(var j=0;j<historyPoints.length;j++){
                        data=historyPoints[j];
                        for(var i=0;i<data.length;i++){
                            var device=data[i];
                            console.log(device['name']);
                            var _long=device['location']['longitude'];
                            var _lat=device['location']['latitude'];
                            var _acc=device['location']['horizontalAccuracy'];
                            var _ts=device['location']['timeStamp'];
                            locationSource.add(_long,_lat,_acc,_ts);
                        }
                    }
                    $.mobile.loading("hide");
                    //Reload history
                    $.mobile.changePage($("#historyPage"), 
                        {reloadPage: true, allowSamePageTransition: true});
                },
                function(xhr, status){
                    //failure
                }
        );
    }
};

function updateLocation(){
    $.mobile.loading( "show", {
        text: "",
        textVisible: false,
        theme: "b",
        textonly: false,
        html: ""
    });
    if(typeof localStorage["username"] !== 'undefined'){
        locationSource.get(
                localStorage["username"],
                localStorage["password"],
                function(data){
                    for(var i=0;i<data.length;i++){
                        var device=data[i];
                        console.log(device['name']);
                        var _long=device['location']['longitude'];
                        var _lat=device['location']['latitude'];
                        var _acc=device['location']['horizontalAccuracy'];
                        var _ts=device['location']['timeStamp'];
                        view.update(_long,_lat,_acc,_ts);
                        locationSource.add(_long,_lat,_acc,_ts);
                    }
                    view.render();
                    $('#locationInfo').html(moment(view.lastUpdate).format('MM/D/YYYY HH:mm:ss'));
                    $('#locationInfo').data('isHistory',false);
                    $.mobile.loading("hide");
                },
                function(xhr, status){
                    $('#info').html(status);
                }
        );
    }
};

function lastLocation(){
    if($('#locationInfo').data('isHistory')){
        var targetIndex=$('#locationInfo').data('index')+1;
        var hList=$('#historyList').find('a');
        if(0<= targetIndex && targetIndex-1 < hList.length){
            $(hList[targetIndex]).trigger('click');
        }
    }
};

function nextLocation(){
    if($('#locationInfo').data('isHistory')){
        var targetIndex=$('#locationInfo').data('index')-1;
        var hList=$('#historyList').find('a');
        if(0<= targetIndex && targetIndex-1 < hList.length){
            $(hList[targetIndex]).trigger('click');
        }
    }
};

var settings={
    load: function(){
        $('#username').val(localStorage["username"]);
        $('#password').val(localStorage["password"]);
    },

    save: function(){
        localStorage["username"]=$('#username').val();
        localStorage["password"]=$('#password').val();
        $('#settings').hide();
    }
};

function deg2rad(deg) {
    return deg * (Math.PI/180)
} 

function gpsDistance(p1,p2){
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(p2.latitude-p1.latitude);
    var dLon = deg2rad(p2.longitude-p1.longitude); 
    var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(p1.latitude)) * Math.cos(deg2rad(p2.latitude)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c * 1000; // Distance in m
    return d;
}

function historyListFiller(){
    /* Load history */
    $('#historyList').empty();
    locationSource.getAll(function(locArray){
        /* compute distance */
        locs=[];
        console.log(locArray.length);
        for(var i=locArray.length-1;i>=0;i--){
            locObj=new Object();
            locObj.longitude=locArray[i].longitude;
            locObj.latitude=locArray[i].latitude;
            locObj.accuracy=locArray[i].accuracy;
            locObj.timestamp=locArray[i].timestamp;
            if(i==locArray.length-1){
                locObj.distance=0;
            }else{
                locObj.distance=Math.round(gpsDistance(locArray[i],locArray[i+1]));
            }
            if(locObj.distance >= $('#distFilter').val()){
                locs.push(locObj);
            }
        }
        locs.reverse();

        /* build li entry*/
        for(index=0;index<locs.length;index++){
            var loc=locs[index];
            var historyLi=$('<li/>');
            var historyEntry=$('<a/>',{
                id: loc.id,
                text: moment(loc.timestamp).format('MM/D/YYYY HH:mm:ss')
                + ' | '+ loc.distance +'m'
            });
            historyEntry.data('index',index);
            historyEntry.data('longitude',loc.longitude);
            historyEntry.data('latitude',loc.latitude);
            historyEntry.data('accuracy',loc.accuracy);
            historyEntry.data('timestamp',loc.timestamp);
            historyEntry.data('dateStr',moment(loc.timestamp).format('dddd, MMMM Do YYYY'));
            historyEntry.on('click',function(event){
                $('#locationInfo').data('index',$(this).data('index'));
                $('#locationInfo').data('isHistory',true);
                $.mobile.changePage( $("#mapPage"), "slide", true, true);
                view.update(
                    $(this).data('longitude'),
                    $(this).data('latitude'),
                    $(this).data('accuracy'),
                    $(this).data('timestamp')
                    );
                view.render();
            });
            historyLi.append(historyEntry);
            $('#historyList').append(historyLi);
        }
        /* List divider */
        $('#historyList').listview({
            autodividers: true,
            autodividersSelector: function(li){
                var divider=$(li).find('a').data('dateStr');
                return divider;
            }
        });
        $('#historyList').listview('refresh');
    });
}

document.addEventListener('DOMContentLoaded', function () {
    settings.load();
    locationSource.init();
    view.init();
    /* Bind buttons */
    //mapPage
    $('#refreshBtn').click(updateLocation);
    $('#leftBtn').click(lastLocation);
    $('#rightBtn').click(nextLocation);
    //setttingsPage
    $('#save').click(settings.save);
    $('#clearLocalHistory').click(locationSource.clearLocalHistory);
    $('#clearRemoteHistory').click(locationSource.clearRemoteHistory);
    $('#trafficFlip').val('off');
    $('#trafficFlip').change(view.toggleTraffic);
    //historyPage
    $('#loadHistory').click(loadHistory);

    /* Populate history */
    $('#historyPage').on('pagebeforeshow', historyListFiller);

    /* init states */
    $('#locationInfo').data('isHistory',false);
});
