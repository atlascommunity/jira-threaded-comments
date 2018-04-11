(function ($) { // this closure helps us keep our variables to ourselves.
// This pattern is known as an "iife" - immediately invoked function expression

    // form the URL
    var url = AJS.contextPath() + "/rest/threaded-comments-admin/1.0/";

    // wait for the DOM (i.e., document "skeleton") to load. This likely isn't necessary for the current case,
    // but may be helpful for AJAX that provides secondary content.
    $(document).ready(function () {
        // request the config information from the server
        $.ajax({
            url: url,
            dataType: "json"
        }).done(function (config) { // when the configuration is returned...
            // ...populate the form.
            $("#checkglobalactive").attr('checked', config.globalactive);

            AJS.$("#admin").submit(function (e) {
                e.preventDefault();
                updateConfig();
            });
        });
    });

})(AJS.$ || jQuery);

function updateConfig() {
    AJS.$.ajax({
        url: AJS.contextPath() + "/rest/threaded-comments-admin/1.0/",
        type: "PUT",
        contentType: "application/json",
        data: '{ "globalactive": ' + AJS.$("#checkglobalactive").prop("checked") + ' }',
        processData: false
    });
}