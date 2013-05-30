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

        var commentBlock = AJS.$(this).children()[0];
        if (AJS.$(commentBlock).find('.commentreply').length == 0) {
            AJS.$(commentBlock).append(AJS.$('<a class="commentreply" href="#">Reply</a>'));
            AJS.$(commentBlock).append(AJS.$('<div class="commentreplyarea"><textarea class="textcommentreply"/>' +
                '<ul class="ops"><li><a href="#" data="' + commentId + '" class="first last button replycommentbutton">Add Reply</a></li></ul>' +
                '</div>'));
        }
    });
    AJS.$('.commentreply').click(function () {
        event.preventDefault();
        AJS.$(this).next().toggle();
    });
    AJS.$('.replycommentbutton').click(function () {
        var newComment = AJS.$(this).parent().parent().parent().children("textarea").val();
        if(newComment.length == 0 ) {
            console.log("empty input");
            return;
        }
        console.log("new comment " + encoded);
        var encoded = AJS.$('<div/>').text(newComment).html();
        console.log("new comment " + encoded);
        var data1 = '{"commentbody":"' + encoded + '","parentcommentid":"' + AJS.$(this).attr('data') + '","issueid":' + issueID + '}';
        console.log("new data " + data1);
        AJS.$.ajax({
            url: AJS.contextPath() + "/rest/handlecomments/latest/addcomment",
            data: data1,
            type: "POST",
            contentType: "application/json",
            success: function (json) {
                console.log("New comment added :");
            }
        });
    });
}

AJS.$('document').ready(function () {
    AddCommentButtons();
    JIRA.ViewIssueTabs.onTabReady(function(){
        AddCommentButtons();
    });
    JIRA.bind(JIRA.Events.NEW_CONTENT_ADDED, function(e, context, reason) {
        AddCommentButtons();
    });
});