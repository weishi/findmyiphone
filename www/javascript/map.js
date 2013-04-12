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
                console.log('good');
                console.log(data);
                success(data);
            },
            error: function(xhr, status){
                console.log('bad');
                console.log(status);
                failure(status);
            }
        });
    },
};

var view={
    defaultLong: 116,
    defaultLat: 39,
    bm: '',

    init: function(){
        var bm = new BMap.Map("mapview");
        bm.centerAndZoom(new BMap.Point(view.defaultLong, view.defaultLat), 17);
        bm.addControl(new BMap.NavigationControl());
        view.bm=bm;
    },

    render: function(longitude, latitude){
        var point = new BMap.Point(longitude, latitude);
        console.log(longitude);
        console.log(latitude);
        BMap.Convertor.translate(point,0,view.translate); 
    },
    
    translate: function (point){
        var marker = new BMap.Marker(point);
        view.bm.addOverlay(marker);
        var label = new BMap.Label("test1",{offset:new BMap.Size(20,-10)});
        marker.setLabel(label); 
        view.bm.setCenter(point);
    },
};

function updateLocation(){
    view.init();
    if(typeof localStorage["username"] !== 'undefined'){
        locationSource.get(
            localStorage["username"],
            localStorage["password"],
            function(data){
                $('#info').html("Done");
                for(var i=0;i<data.length;i++){
                    var device=data[i];
                    console.log(device['name']);
                    $('#long').val(device['location']['longitude']);
                    $('#lat').val(device['location']['latitude']);
                }
                view.render(parseFloat($('#long').val()), 
                            parseFloat($('#lat').val())
                            );
                //view.render(122,30);
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

    /* Auto update on page load */
    updateLocation();
});
