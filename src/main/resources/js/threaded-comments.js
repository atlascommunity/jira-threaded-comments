function RearrangeComments() {
    var issueID = JIRA.Issue.getIssueId();
    //#4
    if (!issueID || issueID === ""){
        return;
    }
    var parents = {};
    AJS.$.getJSON(AJS.contextPath() + "/rest/handlecomments/latest/hdata/commentdata?issueid=" + issueID, function (data) {
        AJS.$.each(data, function () {
            //console.log(this.commentid);
            parents[this.commentid] = this.parentcommentid;
        });
        AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(function () {
            var commentId = AJS.$(this).attr('id').split('-')[1];

            var parent = parents[commentId];
            //console.log(commentId);
            if (parent) {
                var parentId = '#comment-' + parent;
                if (AJS.$(parentId).length != 0) {
                    //console.log("found parent in dom");
                    AJS.$(this).addClass('movedcomment');
                    AJS.$(this).appendTo(parentId);
                }
            }
            else {
                //console.log("no parent found for " + commentId);
            }
        });
        AJS.$('.issue-data-block.focused').scrollIntoView({marginBottom: 200,marginTop: 200});
    });
}

function AddCommentButtons() {
    var loggedInUser = AJS.Meta.get('remote-user');
    var issueID = JIRA.Issue.getIssueId();
    var issueKey = AJS.Meta.get('issue-key');

    //console.log("AddCommentButtons called - " + issueID);

    AJS.$.getJSON(AJS.contextPath() + "/rest/api/latest/issue/" + issueKey, function (data) {
        var projectKey = data.fields.project.key;
        AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(function () {
            var commentWholeId = AJS.$(this).attr('id');
            var commentId = AJS.$(this).attr('id').split('-')[1];
            var commentUser = AJS.$(this).find('.action-details a').attr("rel");
            var commentBlock = AJS.$(this).children()[0];
            var iscommentallowed = AJS.$('#issue-comment-add-submit').length > 0;

            if (iscommentallowed && AJS.$(commentBlock).find('.commentreply').length == 0) {
                //console.log("Adding Reply block and handler for commentId - " + commentId);

                AJS.$(commentBlock).append(AJS.$('<a class="commentreply" href="#">Reply</a>'));

                AJS.$(commentBlock).append(AJS.$('<div class="commentreplyarea">' +
                    '<textarea class="textcommentreply textarea long-field wiki-textfield mentionable" cols="60" rows="10" wrap="virtual" ' +
                    'data-projectkey="' + projectKey + '" data-issuekey="' + issueKey + '" style="overflow-y: auto; height: 200px;"></textarea>' +
                    '<ul class="ops">' +
                    '<li><a href="#" data="' + commentId + '" class="aui-button replycommentbutton">Add</a></li>' +
                    '<li><a href="#" data="' + commentId + '" class="aui-button aui-button-link cancel replycommentcancel">Cancel</a></li>' +
                    '<span class="icon throbber loading hiddenthrobber"></span>' +
                    '</ul>' +
                    '</div><br/>'));
                //AJS.$(commentBlock).append(securityInfo.clone(true));

                AJS.$(this).find('.commentreply').click(function (event) {
                    event.preventDefault();
                    AJS.$('.commentreplyarea').hide();
                    AJS.$('.commentreply').show();
                    AJS.$(this).next().toggle();
                    AJS.$(this).next().find("textarea").focus();

                    AJS.$(this).hide();
                });
                AJS.$(this).find('.replycommentbutton').click(function () {
                    var newComment = AJS.$(this).parent().parent().parent().children("textarea").val();
                    if (newComment.length == 0) {
                        console.log("empty input");
                        return;
                    }
                    AJS.$(this).find('.hiddenthrobber').show();
                    var encoded = AJS.$('<div/>').text(newComment).html();
                    var postData = {};
                    postData.commentbody = newComment;
                    postData.parentcommentid = AJS.$(this).attr('data');
                    postData.issueid = issueID;

                    //console.log("new data " + postData);
                    AJS.$.ajax({
                        url: AJS.contextPath() + "/rest/handlecomments/latest/hdata/addcomment",
                        data: JSON.stringify(postData),
                        type: "POST",
                        contentType: "application/json",
                        success: function (data) {
                            //console.log("New comment added :" + data);
                            JIRA.trigger(JIRA.Events.REFRESH_ISSUE_PAGE, [JIRA.Issue.getIssueId(), {
                                complete: function () {
                                    //AJS.$("#comment-" + data.commentid).scrollIntoView({marginBottom: 200, marginTop: 200});
                                    //AJS.$("#comment-" + data.commentid).addClass('focused');
                                }
                            }]);
                            AJS.$(this).find('.hiddenthrobber').hide();
                        }
                    });
                });
                AJS.$(this).find('.replycommentcancel').click(function (event) {
                    event.preventDefault();
                    AJS.$(this).parent().parent().parent().toggle();
                    //AJS.$(this).closest('.commentreplyarea').show();
                    AJS.$(this).closest('.issue-data-block').find('.commentreply').show();
                });

                AJS.$(commentBlock).find('.action-links').each(function () {
                    //Add the buttons (only if the comment is from someone else)
                    if (loggedInUser != commentUser) {
                        AJS.$(this).append(AJS.$('<a class="upvote" commentid=' + commentId + ' title="Up votes this comment">' +
                            '<img class="emoticon" src="' + AJS.contextPath() + '/images/icons/emoticons/thumbs_up.gif" height="16" width="16" align="absmiddle" alt="" border="0"></a>' +
                            '<a class="downvote" commentid=' + commentId + ' title="Down votes this comment">' +
                            '<img class="emoticon" src="' + AJS.contextPath() + '/images/icons/emoticons/thumbs_down.gif" height="16" width="16" align="absmiddle" alt="" border="0"></a>'));
                    }
                });

                AJS.$(this).find('.upvote').click(function (event) {
                    event.preventDefault();
                    AJS.$.ajax({
                        url: AJS.contextPath() + "/rest/handlecomments/latest/hdata/upvote?commentid=" + AJS.$(this).attr('commentid') + '&issueid=' + issueID,
                        success: function () {
                            //console.log('Up voted');
                            ShowCurrentVotes();
                        }
                    });
                });

                AJS.$(this).find('.downvote').click(function (event) {
                    event.preventDefault();
                    AJS.$.ajax({
                        url: AJS.contextPath() + "/rest/handlecomments/latest/hdata/downvote?commentid=" + AJS.$(this).attr('commentid') + '&issueid=' + issueID,
                        success: function () {
                            //console.log('Down voted');
                            ShowCurrentVotes();
                        }
                    });
                });
            }
        });
    });
}

function ShowCurrentVotes() {
    var issueID = JIRA.Issue.getIssueId();
    var commentData = {};

    AJS.$.getJSON(AJS.contextPath() + "/rest/handlecomments/latest/hdata/commentsvotes?issueid=" + issueID, function (data) {
            AJS.$.each(data, function () {
                commentData['comment-' + this.commentid] = this;
            });
            AJS.$('.currentvotes').remove();

            AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(function () {
                var commentBlock = AJS.$(this).children()[0];
                var commentId = AJS.$(this).attr('id').split('-')[1];
                AJS.$(commentBlock).find('.action-links').each(function () {
                    //Add the current votes
                    var cmData = commentData["comment-" + commentId];

                    if (cmData && cmData.downvotes) {
                        var plu = cmData.downvotes > 1 ? 's':'';
                        AJS.$(this).before(
                            AJS.$('<div class="description currentvotes dislikes">' + cmData.downvotes + ' dislike' + plu + '</div>')
                        );
                    }
                    if (cmData && cmData.upvotes) {
                        var plu = cmData.upvotes > 1 ? 's':'';
                        AJS.$(this).before(
                            AJS.$('<div class="description currentvotes likes">' + cmData.upvotes + ' like' + plu + '</div>')
                        );
                    }
                });
            });
        }
    );
}


AJS.$('document').ready(function () {
    AddCommentButtons();
    RearrangeComments();
    ShowCurrentVotes();
    JIRA.ViewIssueTabs.onTabReady(function () {
        AddCommentButtons();
        RearrangeComments();
        ShowCurrentVotes();
    });
    JIRA.bind(JIRA.Events.REFRESH_ISSUE_PAGE, function (e, context, reason) {
        RearrangeComments();
        AddCommentButtons();
        ShowCurrentVotes();
    });
});
