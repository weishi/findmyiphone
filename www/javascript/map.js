var locationSource={
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
};

var view={
    curLong: 121.480028,
    curLat: 31.236977,
    bm: '',

    init: function(){
        var bm = new BMap.Map("mapview");
        var traffic = new BMap.TrafficLayer();
        bm.centerAndZoom(new BMap.Point(view.curLong, view.curLat), 17);
        //bm.addControl(new BMap.MapTypeControl());
        //bm.addTileLayer(traffic);
        view.bm=bm;
    },
    
    update: function(longitude, latitude, acc, timestamp){
        view.curLong=longitude;
        view.curLat=latitude;
        view.curAccuracy=acc;
        view.lastUpdate=timestamp;
    },

    render: function(){
        var point = new BMap.Point(view.curLong, view.curLat);
        BMap.Convertor.translate(point,0,view.translate); 
    },
    
    translate: function (point){
        view.bm.setCenter(point);
        var marker = new BMap.Marker(point);
        view.bm.addOverlay(marker);
        
        /* Add info */
        var fromNow=moment(view.lastUpdate).fromNow();
        var label = new BMap.Label(fromNow,{offset:new BMap.Size(20,-10)});
        label.setStyle({fontSize: '16px', borderRaduis:'5px'});
        marker.setLabel(label);
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

    },
};

function updateLocation(){
    $('#refreshBtn').addClass('loading');
    if(typeof localStorage["username"] !== 'undefined'){
        locationSource.get(
            localStorage["username"],
            localStorage["password"],
            function(data){
                for(var i=0;i<data.length;i++){
                    var device=data[i];
                    console.log(device['name']);
                    view.update(device['location']['longitude'],
                                device['location']['latitude'],
                                device['location']['horizontalAccuracy'],
                                device['location']['timeStamp']);
                }
                view.render();
                $('#info').html(moment(view.lastUpdate).format('MM/D/YYYY HH:mm:ss'));
                $('#refreshBtn').removeClass('loading');
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
    initSVG();
    /* Bind buttons */
    $('#settings').hide();
    $('#settingsBtn').click(function(){
        settings.load();
        $('#settings').show();
        $('html, body').animate({scrollTop: $(document).height()-$(window).height()}, 
                  500,"swing");
    });
    $('#save').click(settings.save);
    $('#refreshBtn').click(updateLocation);

    view.init();
});
