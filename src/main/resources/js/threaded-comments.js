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
  var commentTextArea = currButton.parent(".field-group").find(".textarea");
  var postData = formingReplyCommentData(currButton);
  if (postData) {
    addCommentRequest(postData, currButton, commentTextArea);
  }
};

var formSubmit = function (event) {
    var formButton = AJS.$(event.target).find(".replycommentbutton").get(0);
    if (formButton) {
        var commentTextArea = AJS.$(formButton)
            .parent(".field-group")
            .find(".textarea");
        var postData = formingReplyCommentData(AJS.$(formButton));
        if (postData) {
            addCommentRequest(postData, AJS.$(formButton), commentTextArea);
        }
    }
};

var addCommentRequest = function (postData, currButton, commentTextArea) {
  debug("new data " + postData);
  AJS.$.ajax({
    url: AJS.contextPath() + "/rest/handlecomments/latest/hdata/addcomment",
    data: JSON.stringify(postData),
    type: "POST",
    contentType: "application/json",
    success: function (data) {
      console.log("New comment added :" + data);
      JIRA.trigger(JIRA.Events.REFRESH_ISSUE_PAGE, [JIRA.Issue.getIssueId()]);

      // close controls on rapidboards
      currButton.parent().parent().parent().parent().parent().parent().toggle();
      currButton.closest(".issue-data-block").find(".commentreply").show();
    },
    error: function (xhr) {
      AJS.flag({
        type: "error",
        body: "Comment creation failed (Status " + xhr.status + ")",
      });
    },
    complete: function (data) {
      currButton.parent().find(".throbber").addClass("hiddenthrobber");
      currButton.removeAttr("disabled");
      currButton.parent().parent().find(".replycommentcancel").show();
      commentTextArea.removeAttr("disabled");

      if (GH !== undefined && GH.DetailsView !== undefined) {
        GH.DetailsView.load(null);
      }
    },
  });
};

var formingReplyCommentData = function (currButton) {
  if (currButton.attr("disabled")) {
    debug("Click on a disable element. Returning.");
    return;
  }

  var commentTextArea = currButton.parent(".field-group").find(".textarea");

  var newComment = commentTextArea.val();
  debug("Reply invoked " + newComment);
  if (newComment.length == 0) {
    debug("empty input");
    return;
  }

  currButton.attr("disabled", true);
  currButton.parent().find(".hiddenthrobber").removeClass("hiddenthrobber");
  currButton.parent().parent().find(".replycommentcancel").hide();
  commentTextArea.attr("disabled", true);

  var encoded = AJS.$("<div/>").text(newComment).html();
  var postData = {};
  postData.commentbody = newComment;
  postData.parentcommentid = currButton.attr("data");
  postData.issueid = issueID;
  return postData;
};

var cancelHandle = function (event) {
    event.preventDefault();

    AJS.$(this).closest(".commentreplyarea").hide();
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
    var commentElement = AJS.$(this);
    var commentId = commentElement.attr('id').split('-')[1];

    var parent = parents[commentId];
    debug("Rearranging comment - " + commentId);
    if (parent) {
        var parentId = '#comment-' + parent;
        if (AJS.$(parentId).length != 0) {
            debug("found parent in dom");
            if (!commentElement.hasClass('movedcomment')) {
                commentElement.addClass('movedcomment');
                commentElement.appendTo(parentId);
            }
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

    AJS.$.getJSON(AJS.contextPath() + "/rest/handlecomments/latest/hdata/configuration?issueId=" + JIRA.Issue.getIssueId(), function (data) {
        AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(function() {
            var commentId = AJS.$(this).attr('id').split('-')[1];
            var commentUser = AJS.$(this).find('.action-details a').attr("rel");
            var commentBlock = AJS.$(this).children()[0];

            debug("Adding button for " + "," + commentId + "," + commentUser);

            if (AJS.$(commentBlock).find('.commentreply').length == 0) {
                debug("Adding reply block for commentId - " + commentId);

                addCommentButtonsToBlock(commentId, commentBlock, data.threadedEnabled, data.editorHtml);

                //Add the vote buttons (only if the comment is from someone else)
                if (loggedInUser != commentUser) {
                    AJS.$(commentBlock).find('.action-links').each(function () {
                        addVoteLinks.call(this, commentId, data.voteEnabled)
                    });
                } else {
                    debug("Not adding like/dislike button for commentId = " + commentId);
                }
            } else {
                debug("Reply buttons already exist");
            }
        });
    });
}

var addCommentButtonsToBlock = function (commentId, commentBlock, threadedEnabled, editorHtml) {
    debug("addCommentButtonsToBlock called");
    if (AJS.$(commentBlock).find('.commentreply').length !== 0) {
        return;
    }
    AJS.$(commentBlock).append(JIRA.Templates.Plugins.ThreadedComments.replyCommentEditor({
        threadedEnabled: threadedEnabled,
        editorHtml: editorHtml,
        commentId: commentId
    }));
    AJS.$(commentBlock)
      .find(".commentreplyform")
      .on("submit", function (event) {
        formSubmit(event);
        event.preventDefault();
      });
};

var addVoteLinks = function (commentId, voteEnabled) {
    debug("addVoteLinks called");
    AJS.$(this).append(JIRA.Templates.Plugins.ThreadedComments.addVote({
        voteEnabled: voteEnabled,
        commentId: commentId,
        contextPath: AJS.contextPath()
    }));
};

var handleIssueUpdated = function (e, context, reason) {
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
};

AJS.toInit(function (){
    JIRA.bind(JIRA.Events.NEW_CONTENT_ADDED, function(e, context, reason) {
        if (reason === JIRA.CONTENT_ADDED_REASON.panelRefreshed && context.is('#activitymodule')) {
            handleIssueUpdated(e, context, reason);
        }
    });

    if (typeof(GH) != "undefined" && typeof(GH.DetailsView) != "undefined") {        
        JIRA.bind('issueUpdated', handleIssueUpdated);
        JIRA.bind(GH.DetailsView.API_EVENT_DETAIL_VIEW_UPDATED, handleIssueUpdated);
    }
});
