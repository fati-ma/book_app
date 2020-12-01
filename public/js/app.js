$(function(){
    $('.hamburger div').on('click', function() {
        $('.list').slideToggle(500);
    });

    $('#updateForm').hide();
    $('#updateBtn').on('click', function(){
        $('#updateForm').toggle();
    })
});
