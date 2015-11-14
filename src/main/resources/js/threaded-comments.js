var issueKey = AJS.Meta.get('issue-key');
var loggedInUser = AJS.Meta.get('remote-user');
var issueID;
var projectKey;

var parents = {};
var commentData = {};

AJS.$('document').ready(function () {
    debug("doc ready");

    AJS.$(document).on("click", '.commentreply', replyClick);
    AJS.$(document).on("click", '.replycommentbutton', replyCommentAdd);
    AJS.$(document).on("click", '.replycommentcancel', cancelHandle);
    AJS.$(document).on("click", '.upvote', upVote);
    AJS.$(document).on("click", '.downvote', downVote);

    issueID = AJS.$(".issue-header-content  #key-val").attr("rel");

    AJS.$.getJSON(AJS.contextPath() + "/rest/api/latest/issue/" + issueKey, function (data) {
        projectKey = data.fields.project.key;
        debug("threaded comments context - " + issueKey + "," + issueID + "," + loggedInUser);

        addCommentButtons();
        rearrangeComments();
        showCurrentVotes();
    } );

    JIRA.ViewIssueTabs.onTabReady(function () {
        debug("Tab ready");
        debug(this);
        addCommentButtons();
        rearrangeComments();
        showCurrentVotes();
    } );
} );



var debug = function (msg) {
    //console.log(msg);
};

var replyClick = function (event) {
    event.preventDefault();
    AJS.$('.commentreplyarea').hide();
    AJS.$('.commentreply').show();
    AJS.$(this).next().toggle();
    AJS.$(this).next().find("textarea").focus();

    AJS.$(this).hide();
};

var replyCommentAdd = function () {
    var newComment = AJS.$(this).parent().parent().parent().children("textarea").val();
    debug("Reply invoked " + newComment);
    if (newComment.length == 0) {
      debug("empty input");
      return;
    }
    AJS.$(this).attr( "disabled", true );
    AJS.$(this).find('.hiddenthrobber').removeClass('hiddenthrobber');

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
            JIRA.trigger(JIRA.Events.REFRESH_ISSUE_PAGE, [JIRA.Issue.getIssueId(), {
                complete: function () {
                }
            }]);
        },
        complete: function (data) {
            AJS.$(this).find('.throbber').addClass('hiddenthrobber');
            AJS.$(this).attr( "disabled", false );
        }
    } );
};

var cancelHandle = function (event) {
   event.preventDefault();
   AJS.$(this).parent().parent().parent().toggle();
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
     } );
};

var downVote = function (event) {
    event.preventDefault();
    AJS.$.ajax({
        url: AJS.contextPath() + "/rest/handlecomments/latest/hdata/downvote?commentid=" + AJS.$(this).attr('commentid') + '&issueid=' + issueID,
        success: function () {
            debug('Down voted');
            showCurrentVotes();
        }
    } );
};


var addCurrentVoteBlock = function () {
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
    } );
};

var addCurrentVotes = function (data) {
    AJS.$.each(data, function () {
        commentData['comment-' + this.commentid] = this;
    } );
    AJS.$('.currentvotes').remove();

    AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(addCurrentVoteBlock);
};

var showCurrentVotes = function () {
    if (!issueKey || issueKey === "") {
        return;
    }

    AJS.$.getJSON(AJS.contextPath() + "/rest/handlecomments/latest/hdata/commentsvotes?issueid=" + issueID, addCurrentVotes);
};

var moveComment = function () {
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

    //Load the relationships and then move comments around
    AJS.$.getJSON(AJS.contextPath() + "/rest/handlecomments/latest/hdata/commentdata?issueid=" + issueID, function (data) {
        AJS.$.each(data, function () {
            debug("Current commentId = " + this.commentid +", parentId = " + this.parentcommentid);
            parents[this.commentid] = this.parentcommentid;
        } );
        AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(moveComment);
    } );
};

function addCommentButtons() {
    debug("addCommentButtons called");

    if (!issueKey || issueKey == "") {
        return;
    }

    AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(checkAndAddButtons);
};

var checkAndAddButtons = function () {
    var commentId = AJS.$(this).attr('id').split('-')[1];
    var commentUser = AJS.$(this).find('.action-details a').attr("rel");
    var commentBlock = AJS.$(this).children()[0];

    debug("Adding button for " + "," + commentId + "," + commentUser);


    if (AJS.$(commentBlock).find('.commentreply').length == 0) {
        debug("Adding reply block for commentId - " + commentId);

        addCommentButtonsToBlock(commentId, commentBlock);

       //Add the vote buttons (only if the comment is from someone else)
        if (loggedInUser != commentUser) {
            AJS.$(commentBlock).find('.action-links').each(function () {addVoteLinks.call(this,commentId)} );
        } else {
            debug("Not adding like/dislike button for commentId = " + commentId);
        }
    } else {
        debug("Reply buttons already exist");
    }
};

var addCommentButtonsToBlock = function (commentId, commentBlock) {
    AJS.$(commentBlock).append(AJS.$('<a class="commentreply" href="#">Reply</a>'));

    AJS.$(commentBlock).append(AJS.$('<div class="commentreplyarea">' +
        '<textarea class="textcommentreply textarea long-field mentionable" cols="60" rows="10" wrap="virtual" ' +
        'data-projectkey="' + projectKey + '" data-issuekey="' + issueKey + '" style="overflow-y: auto; height: 200px;"></textarea>' +
        '<ul class="ops">' +
        '<li><a href="#" data="' + commentId + '" class="aui-button replycommentbutton">Add</a></li>' +
        '<li><a href="#" data="' + commentId + '" class="aui-button aui-button-link cancel replycommentcancel">Cancel</a></li>' +
        '<span class="icon throbber loading hiddenthrobber"></span>' +
        '</ul>' +
        '</div><br/>'));
};

var addVoteLinks = function (commentId) {
   AJS.$(this).append(AJS.$('<a class="upvote" commentid=' + commentId + ' title="Up votes this comment">' +
       '<img class="emoticon" src="' + AJS.contextPath() + '/images/icons/emoticons/thumbs_up.gif" height="16" width="16" align="absmiddle" alt="" border="0"></a>' +
       '<a class="downvote" commentid=' + commentId + ' title="Down votes this comment">' +
       '<img class="emoticon" src="' + AJS.contextPath() + '/images/icons/emoticons/thumbs_down.gif" height="16" width="16" align="absmiddle" alt="" border="0"></a>'));
};


JIRA.bind(JIRA.Events.REFRESH_ISSUE_PAGE, function (e, context, reason) {
    debug("Page refreshed");
    addCommentButtons();
    rearrangeComments();
    showCurrentVotes();
} );
