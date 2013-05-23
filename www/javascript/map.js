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

    /* locationi from DB */
    init: function(){
        persistence.store.websql.config(persistence, 'fmiDB', 'Location history', 128 * 1024);
        Loc=persistence.define('loc',{
            longitude: "TEXT",
            latitude: "TEXT",
            accuracy: "TEXT",
            timestamp: "INT"
        });
        persistence.schemaSync();
    },

    add: function(lg,lt,acc,ts){
        var newLoc=new Loc();
        newLoc.longitude=lg.toString();
        newLoc.latitude=lt.toString();
        newLoc.accuracy=acc.toString();
        newLoc.timestamp=ts;
        persistence.add(newLoc);
        persistence.flush(function() {
            console.log('Done flushing');
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
        var fromNow=moment(view.lastUpdate).fromNow();
        var label = new BMap.Label(fromNow,{offset:new BMap.Size(20,-10)});
        label.setStyle({fontSize: '16px', borderRaduis:'5px'});
        //marker.setLabel(label);
        marker.addEventListener('click',function(){
            /* Update info */
            this.getLabel().setContent(moment(view.lastUpdate).fromNow());
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

function updateLocation(){
    $('#refreshBtn').addClass('loading');
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
                    $('#info').html(moment(view.lastUpdate).format('MM/D/YYYY HH:mm:ss'));
                    $('#refreshBtn').removeClass('loading');
                    $.mobile.loading("hide");
                },
                function(xhr, status){
                    $('#info').html(status);
                }
        );
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


document.addEventListener('DOMContentLoaded', function () {
    /* Bind buttons */
    settings.load();
    $('#save').click(settings.save);
    $('#refreshBtn').click(updateLocation);

    $('#trafficFlip').val('off');
    $('#trafficFlip').change(view.toggleTraffic);

    locationSource.init();
    view.init();
    /* Populate history */
    $('#historyPage').on('pagebeforeshow',function(){
        /* Load history */
        $('#historyList').empty();
        locationSource.getAll(function(locs){
            locs.forEach(function(loc){
                var historyEntry=$('<li/>',{
                    id: loc.id,
                    text: moment(loc.timestamp).format('MM/D/YYYY HH:mm:ss')
                });
                $('#historyList').append(historyEntry);
            });
            $('#historyList').listview('refresh');
        });
    });
});
