var options={
    load: function(){
        $('#username').val(localStorage["username"]);
        $('#password').val(localStorage["password"]);
    },

    save: function(){
        localStorage["username"]=$('#username').val();
        localStorage["password"]=$('#password').val();
        $('#notifier').show().fadeOut(3000);
    }
};


document.addEventListener('DOMContentLoaded', function () {
    $('#notifier').hide();
    options.load();
    $('#saveCredential').click(options.save);

});
