
    //add functions that need to be loaded always
$(function(){
    // Buttons and links which action requires a user
    // prevent action and show a modal instead
    $('.user-required-action').click(function (e) {
        $('#login-register').modal('show');
        $(this).un('click');
        $(this).unbind('click');
        this.removeEventListener('click');
        e.preventDefault();
    });
});