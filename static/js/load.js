
// add functions that need to be loaded always
$(function(){
    // For: buttons and links which action requires a user
    // Prevents action and show a modal instead
    $('.user-required-action').click(function (e) {
        console.log(e);
        
        var fragment = $(e.currentTarget).data('fragment');
        history.pushState('', document.title, window.location.pathname + '?action=' + fragment);
        
        $('#login-register').modal('show');
        e.stopImmediatePropagation();
    });
});

// Shows an alert box
// type = {success, info, warning, danger}
// usage: show_alert_message('danger', 5000, "Title test", "test");
function show_alert_message(type, milliseconds, title, text){
    $('#alert-window').attr('class', 'alert alert-dismissable alert-'+type);
    $('#alert-window').show();
    $('#alert-window').find('.alert-title').html(title);
    $('#alert-window').find('.alert-message').html(text);
    if(milliseconds){
        setTimeout("$('#alert-window').hide('slow')", milliseconds);
    }
}
