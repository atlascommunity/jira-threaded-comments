function AddCommentButtons() {
    var loggedInUser = AJS.$('input[title="loggedInUser"]').val();
    var issueID = JIRA.Issue.getIssueId();
    //var iscommentallowed = AJS.$('#issue-comment-add-submit');

    ///console.log("loggedInUser - " + loggedInUser);
    console.log("AddCommentButtons called - " + issueID);
    var parents = {};
    AJS.$.getJSON(AJS.contextPath() + "/rest/handlecomments/latest/commentdata?issueid=" + issueID, function(data){
        $.each(data, function(){
            console.log(this.commentid);
            parents[this.commentid] = this.parentcommentid;
        });
        AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(function () {
            var commentId = AJS.$(this).attr('id').split('-')[1];

            var parent = parents[commentId];
            console.log(commentId);
            if( parent )
            {
                var parentId = '#comment-' + parent;
                if(AJS.$(parentId).length != 0) {
                    console.log("found parent in dom");
                    AJS.$(this).addClass('movedcomment');
                    AJS.$(this).appendTo(parentId);
                }
            }
            else
            {
                console.log("no parent found for " + commentId);
            }
        });
    });
    AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(function () {
        var commentWholeId = AJS.$(this).attr('id');
        var commentId = AJS.$(this).attr('id').split('-')[1];

        var commentBlock = AJS.$(this).children()[0];
        if (AJS.$(commentBlock).find('.commentreply').length == 0) {
            console.log("Adding Reply block and handler for commentId - " + commentId);
            AJS.$(commentBlock).append(AJS.$('<a class="commentreply" href="#">Reply</a>'));
            AJS.$(commentBlock).append(AJS.$('<div class="commentreplyarea"><textarea class="textcommentreply"/>' +
                '<ul class="ops"><li><a data="' + commentId + '" class="aui-button replycommentbutton">Add Reply</a></li><li><a href="#" data="' +
                commentId + '" class="aui-button aui-button-link cancel replycommentcancel">Cancel</a></li><span class="icon throbber loading hiddenthrobber"></span></ul>' +
                '</div>'));

            AJS.$(this).find('.commentreply').click(function () {
                event.preventDefault();
                AJS.$(this).next().toggle();
            });
            AJS.$(this).find('.replycommentbutton').click(function () {
                var newComment = AJS.$(this).parent().parent().parent().children("textarea").val();
                if (newComment.length == 0) {
                    console.log("empty input");
                    return;
                }
                AJS.$(this).find('.hiddenthrobber').show();
                var encoded = AJS.$('<div/>').text(newComment).html();
                //console.log("new comment " + encoded);
                var data1 = '{"commentbody":"' + encoded + '","parentcommentid":"' + AJS.$(this).attr('data') + '","issueid":' + issueID + '}';
                console.log("new data " + data1);
                AJS.$.ajax({
                    url: AJS.contextPath() + "/rest/handlecomments/latest/addcomment",
                    data: data1,
                    type: "POST",
                    contentType: "application/json",
                    success: function (data) {
                        console.log("New comment added :");
                        JIRA.trigger(JIRA.Events.REFRESH_ISSUE_PAGE, [JIRA.Issue.getIssueId(), {
                            complete:function () {
                                AJS.$("#" + commentWholeId).scrollIntoView({marginBottom: 200,marginTop: 200});
                            }
                        }]);
                        AJS.$(this).find('.hiddenthrobber').hide();
                    }
                });
                JIRA.trigger(JIRA.Events.REFRESH_ISSUE_PAGE, [JIRA.Issue.getIssueId(), {
                    complete:function () {
                        AJS.$("#" + commentWholeId).scrollIntoView({marginBottom: 200,marginTop: 200});
                    }
                }]);
                AJS.$(this).find('.hiddenthrobber').hide();
            });
            AJS.$(this).find('.replycommentcancel').click(function () {
                event.preventDefault();
                AJS.$(this).parent().parent().parent().toggle();
            });
        }
    });
}

AJS.$('document').ready(function () {
    AddCommentButtons();
    JIRA.ViewIssueTabs.onTabReady(function () {
        AddCommentButtons();
    });
    JIRA.bind(JIRA.Events.REFRESH_ISSUE_PAGE, function (e, context, reason) {
        AddCommentButtons();
    });
});