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
        bm.centerAndZoom(new BMap.Point(view.defaultLong, view.defaultLat), 15);
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
        alert(point.lng + "," + point.lat);
    },
};

function updateLocation(){
    view.init();
    if(typeof localStorage["username"] !== 'undefined'){
        locationSource.get(
            localStorage["username"],
            localStorage["password"],
            function(data){
                $('#login').hide();
                for(var i=0;i<data.length;i++){
                    var device=data[i];
                    console.log(device['name']);
                    if(device['name']=='weishi_iPhone5'){
                        $('#long').html(device['location']['longitude']);
                        $('#lat').html(device['location']['latitude']);
                    }
                }
                view.render(parseFloat($('#long').html()), 
                            parseFloat($('#lat').html())
                            );
                //view.render(122,30);
            },
            function(xhr, status){
                $('#warning').html(status);
            }
        );
    }
};


document.addEventListener('DOMContentLoaded', function () {
    $('#refresh').click(updateLocation);
    updateLocation();
});
