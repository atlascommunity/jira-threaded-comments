
function AddCommentButtons() {
    var loggedInUser = AJS.$('input[title="loggedInUser"]').val();
    var issueID = AJS.$('input[name="id"]').val();
    var iscommentallowed = AJS.$('#issue-comment-add-submit');

    console.log("loggedInUser - " + loggedInUser);
    console.log("issueID - " + issueID);
    console.log("iscommentallowed - " + iscommentallowed);

    AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(function () {
        var commentId = AJS.$(this).attr('id').split('-')[1];
        console.log("commentId - " + commentId);
        var idextra = "-" + commentId;

        var replyButton = AJS.$('#addcommentmodule').clone(true,true);
        replyButton.attr("id", replyButton.attr("id") + idextra);
        replyButton.find('#footer-comment-button').removeClass("aui-button");
        replyButton.find('#footer-comment-button').addClass("commentreply");
        replyButton.find('#footer-comment-button').children("span:first").remove();
        replyButton.find('#footer-comment-button').children("span:first").text("Reply");
        AJS.$(this).append(replyButton);

    });
    AJS.$('.commentreply').click(function () {
        event.preventDefault();
        AJS.$(this).next().toggle();
    });
    AJS.$('.replycommentbutton').click(function () {
        AJS.$(this).attr('readonly','readonly');
        var newComment = AJS.$(this).previous().val();
        var encoded = $('<div/>').text(newComment).html();
        var data = '{"commentbody":"' + encoded + '","parentcommentid":"' + AJS.$(this).attr('data') + '","issueid":' + issueID + '}';
        AJS.$.ajax({
            url: AJS.contextPath() + "/rest/handlecomments/latest/addcomment",
            data: data1,
            type: "POST",
            contentType: "application/json",
            success: function (json) {
                console.log("New comment added :");
                location.reload();
            }
        });
    });
}

AJS.$('document').ready(function () {
    AddCommentButtons();
    JIRA.ViewIssueTabs.onTabReady(function(){
        AddCommentButtons();
    });
});