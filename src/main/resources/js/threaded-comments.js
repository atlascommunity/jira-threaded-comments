var issueKey;
var loggedInUser;
var issueID;
var projectKey;

var parents = {};
var commentData = {};
//var lastUpdatedTime;
var retries = 0;
var intialized = false;
var tm = function () {
    var d = new Date();
    return d.getMilliseconds();
}

var retry = function () {
    if (retries < 60) {
        setTimeout(doAll, 1000);
    }
    retries++;
}

var doAll = function () {
    debug("doAll called");

    try {
        issueID = JIRA.Issue.getIssueId();
        issueKey = JIRA.Issue.getIssueKey();
        loggedInUser = JIRA.Users.LoggedInUser.userName();
    }
    catch (err) {
        debug("Exception. Retrying...")
        retry();
        return;
    }
    if (!issueID || !issueKey) {
        debug("Null values. Retrying...")
        retry();
        return;
    }

    debug("Got all values doAll");

//    if(lastUpdatedTime)
//    {
//        new Date()
//        if(tm() - lastUpdatedTime < 2000)
//        {
//            debug("Too frequent updates, ignoring");
//            return;
//        }
//    }

//    lastUpdatedTime = tm();

    AJS.$.getJSON(AJS.contextPath() + "/rest/api/latest/mypermissions?issueId=" + issueID, function (data) {
        if (data.permissions.ADD_COMMENTS.havePermission) {
            AJS.$.getJSON(AJS.contextPath() + "/rest/api/latest/issue/" + issueKey, function (data) {
                projectKey = data.fields.project.key;
                debug("threaded comments context - " + issueKey + "," + issueID + "," + loggedInUser);

                addCommentButtons();
                rearrangeComments();
                showCurrentVotes();
                intialized = true;
            });
        }
        else {
            debug("Rearrange/show");
            rearrangeComments();
            showCurrentVotes();
            intialized = true;
        }
    });
}

AJS.$('document').ready(function () {
    debug("doc ready");
    //Needed only once
    AJS.$(document).on("click", '.commentreply', replyClick);
    AJS.$(document).on("click", '.replycommentbutton', replyCommentAdd);
    AJS.$(document).on("click", '.replycommentcancel', cancelHandle);
    AJS.$(document).on("click", '.upvote', upVote);
    AJS.$(document).on("click", '.downvote', downVote);

    JIRA.ViewIssueTabs.onTabReady(function (in1, in2, in3) {
        if ("activitymodule" == in1.attr("id") || "activitymodule" == in1.parent().attr("id")) {
            debug("Tab ready");
            doAll();
        }
    });

    doAll();
});

var debug = function (msg) {
    //console.log(msg);
};

var replyClick = function (event) {
    event.preventDefault();
    // close other open inputs
    AJS.$('.commentreplyarea').hide();
    AJS.$('.commentreply').show();

    // show current selected inputs
    AJS.$(this).next().show();
    AJS.$(this).next().find('.replycommentbutton').removeClass('hiddenthrobber');
    AJS.$(this).next().find('.replycommentbutton').show();
    AJS.$(this).next().find('.replycommentcancel').removeClass('hiddenthrobber');
    AJS.$(this).next().find("textarea").focus();

    AJS.$(this).hide();
};

var replyCommentAdd = function () {

    var currButton = AJS.$(this);

    if (currButton.attr("disabled")) {
        debug("Click on a disable element. Returning.");
        return;
    }

    var commentTextArea = currButton.parent().parent().parent().parent().parent().parent().find(".textarea");

    var newComment = commentTextArea.val();
    debug("Reply invoked " + newComment);
    if (newComment.length == 0) {
        debug("empty input");
        return;
    }

    currButton.attr("disabled", true);
    currButton.parent().find('.hiddenthrobber').removeClass('hiddenthrobber');
    currButton.parent().parent().find('.replycommentcancel').hide();
    commentTextArea.attr("disabled", true);

    var encoded = AJS.$('<div/>').text(newComment).html();
    var postData = {};
    postData.commentbody = newComment;
    postData.parentcommentid = AJS.$(this).attr('data');
    postData.issueid = issueID;

    debug("new data " + postData);
    AJS.$.ajax({
        url: AJS.contextPath() + "/rest/handlecomments/latest/hdata/addcomment",
        data: JSON.stringify(postData),
        type: "POST",
        contentType: "application/json",
        success: function (data) {
            console.log("New comment added :" + data);
            JIRA.trigger(JIRA.Events.REFRESH_ISSUE_PAGE, [JIRA.Issue.getIssueId()]);
        },
        complete: function (data) {
            currButton.parent().find('.throbber').addClass('hiddenthrobber');
            currButton.removeAttr("disabled");
            currButton.parent().parent().find('.replycommentcancel').show();
            commentTextArea.removeAttr("disabled");

            // close controls on rapidboards
            currButton.parent().parent().parent().parent().parent().parent().toggle();
            currButton.closest('.issue-data-block').find('.commentreply').show();

            if (GH !== undefined && GH.DetailsView !== undefined) {
                GH.DetailsView.load(null);
            }
        }
    });
};

var cancelHandle = function (event) {
    event.preventDefault();

    AJS.$(this).parent().parent().parent().parent().parent().parent().toggle();
    AJS.$(this).closest('.issue-data-block').find('.commentreply').show();
};

var upVote = function (event) {
    event.preventDefault();
    AJS.$.ajax({
        url: AJS.contextPath() + "/rest/handlecomments/latest/hdata/upvote?commentid=" + AJS.$(this).attr('commentid') + '&issueid=' + issueID,
        success: function () {
            debug('Up voted');
            showCurrentVotes();
        }
    });
};

var downVote = function (event) {
    event.preventDefault();
    AJS.$.ajax({
        url: AJS.contextPath() + "/rest/handlecomments/latest/hdata/downvote?commentid=" + AJS.$(this).attr('commentid') + '&issueid=' + issueID,
        success: function () {
            debug('Down voted');
            showCurrentVotes();
        }
    });
};


var addCurrentVoteBlock = function () {
    debug("addCurrentVoteBlock called");
    var commentBlock = AJS.$(this).children()[0];
    var commentId = AJS.$(this).attr('id').split('-')[1];
    debug("Checking block for comment - " + commentId);

    AJS.$(commentBlock).find('.action-links').each(function () {
        //Add the current votes
        var cmData = commentData["comment-" + commentId];

        if (cmData && cmData.downvotes) {
            debug("Adding dislike block for comment - " + commentId);
            var plu = cmData.downvotes > 1 ? 's' : '';
            AJS.$(this).before(
                AJS.$('<div class="description currentvotes dislikes">' + cmData.downvotes + ' dislike' + plu + '</div>')
            );
        }
        if (cmData && cmData.upvotes) {
            debug("Adding like block for comment - " + commentId);

            var plu = cmData.upvotes > 1 ? 's' : '';
            AJS.$(this).before(
                AJS.$('<div class="description currentvotes likes">' + cmData.upvotes + ' like' + plu + '</div>')
            );
        }
    });
};

var addCurrentVotes = function (data) {
    debug("addCurrentVotes called");

    AJS.$.each(data, function () {
        commentData['comment-' + this.commentid] = this;
    });
    AJS.$('.currentvotes').remove();

    debug("all existing vote blocks removed");
    AJS.$('.currentvotes').each(function () {
        console.log(this);
    });

    AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(addCurrentVoteBlock);
};

var showCurrentVotes = function () {
    debug("showCurrentVotes called");

    //reset the cache
    commentData = {};

    AJS.$.getJSON(AJS.contextPath() + "/rest/handlecomments/latest/hdata/commentsvotes?issueid=" + issueID, addCurrentVotes);
};

var moveComment = function () {
    debug("moveComment called");
    var commentId = AJS.$(this).attr('id').split('-')[1];

    var parent = parents[commentId];
    debug("Rearranging comment - " + commentId);
    if (parent) {
        var parentId = '#comment-' + parent;
        if (AJS.$(parentId).length != 0) {
            debug("found parent in dom");
            AJS.$(this).addClass('movedcomment');
            AJS.$(this).appendTo(parentId);
        }
    }
    else {
        debug("no parent found for " + commentId);
    }
};

var rearrangeComments = function () {
    debug("rearrangeComments called");

    if (!issueKey || issueKey === "") {
        return;
    }

    //Reset the cache
    parents = {};

    //Load the relationships and then move comments around
    AJS.$.getJSON(AJS.contextPath() + "/rest/handlecomments/latest/hdata/commentdata?issueid=" + issueID, function (data) {
        AJS.$.each(data, function () {
            debug("Current commentId = " + this.commentid + ", parentId = " + this.parentcommentid);
            parents[this.commentid] = this.parentcommentid;
        });
        AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(moveComment);
        AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(moveComment);
    });
};

function addCommentButtons() {
    debug("addCommentButtons called");

    if (!issueKey || issueKey == "") {
        return;
    }

    AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(checkAndAddButtons);
};

var checkAndAddButtons = function () {
    debug("checkAndAddButtons called");
    var commentId = AJS.$(this).attr('id').split('-')[1];
    var commentUser = AJS.$(this).find('.action-details a').attr("rel");
    var commentBlock = AJS.$(this).children()[0];

    debug("Adding button for " + "," + commentId + "," + commentUser);


    if (AJS.$(commentBlock).find('.commentreply').length == 0) {
        debug("Adding reply block for commentId - " + commentId);

        addCommentButtonsToBlock(commentId, commentBlock);

        //Add the vote buttons (only if the comment is from someone else)
        if (loggedInUser != commentUser) {
            AJS.$(commentBlock).find('.action-links').each(function () {
                addVoteLinks.call(this, commentId)
            });
        } else {
            debug("Not adding like/dislike button for commentId = " + commentId);
        }
    } else {
        debug("Reply buttons already exist");
    }
};

var addCommentButtonsToBlock = function (commentId, commentBlock) {
    debug("addCommentButtonsToBlock called");
    AJS.$.ajax({
        async: false,
        cache: false,
        url: AJS.contextPath() + "/plugins/servlet/threaded-comments/helper?commentId=" + commentId + '&issueKey=' + issueKey + '&projectKey=' + projectKey,
        success: function (data) {
            debug('Up voted');
            var block = document.createElement("div");
            block.innerHTML = data;
            commentBlock.append(block);
        }
    });
};

var addVoteLinks = function (commentId) {
    debug("addVoteLinks called");
    AJS.$(this).append(AJS.$('<a class="upvote" commentid=' + commentId + ' title="Up votes this comment">' +
        '<img class="emoticon" src="' + AJS.contextPath() + '/images/icons/emoticons/thumbs_up.gif" height="16" width="16" align="absmiddle" alt="" border="0"></a>' +
        '<a class="downvote" commentid=' + commentId + ' title="Down votes this comment">' +
        '<img class="emoticon" src="' + AJS.contextPath() + '/images/icons/emoticons/thumbs_down.gif" height="16" width="16" align="absmiddle" alt="" border="0"></a>'));
};


jQuery(document).ready(function() {
    JIRA.bind(JIRA.Events.ISSUE_REFRESHED, function (e, context, reason) {
        if (!intialized) {
            return;
        }

        if (issueKey !== undefined && JIRA.Issue.getIssueKey() === issueKey) {
            debug("Issue was switched on board");
            addCommentButtons();
            rearrangeComments();
            showCurrentVotes();
        } else {
            intialized = false;
            doAll();
        }
    });
    
    if (typeof(GH) != "undefined" && typeof(GH.DetailsView) != "undefined") {
        JIRA.bind(GH.DetailsView.API_EVENT_DETAIL_VIEW_UPDATED, function (e, context, reason) {
            if (!intialized) {
                return;
            }

            if (issueKey !== undefined && JIRA.Issue.getIssueKey() === issueKey) {
                debug("Issue was switched on board");
                addCommentButtons();
                rearrangeComments();
                showCurrentVotes();
            } else {
                intialized = false;
                doAll();
            }
        });
    }
});
