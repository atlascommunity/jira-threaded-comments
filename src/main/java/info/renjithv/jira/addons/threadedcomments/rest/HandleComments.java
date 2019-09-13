package info.renjithv.jira.addons.threadedcomments.rest;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.entity.property.JsonEntityPropertyManager;
import com.atlassian.jira.issue.IssueManager;
import com.atlassian.jira.issue.MutableIssue;
import com.atlassian.jira.issue.comments.Comment;
import com.atlassian.jira.issue.comments.CommentManager;
import com.atlassian.jira.permission.ProjectPermissions;
import com.atlassian.jira.security.PermissionManager;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.log4j.LogManager;
import org.apache.log4j.Logger;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.Hashtable;

import static com.google.common.base.Preconditions.checkNotNull;

/**
 * A resource of message.
 */
@Path("/hdata")
public class HandleComments {

    private static final Logger log = LogManager.getLogger("handlecomments");
    private ActiveObjects ao;
    private IssueManager issueManager;
    private PermissionManager permissionManager;
    private CommentManager commentManager;

    public HandleComments(ActiveObjects ao, IssueManager issueManager, PermissionManager permissionManager, CommentManager commentManager) {
        this.ao = checkNotNull(ao);
        this.issueManager = issueManager;
        this.permissionManager = permissionManager;
        this.commentManager = commentManager;
    }

    @GET
    @AnonymousAllowed
    @Produces({MediaType.APPLICATION_JSON})
    @Path("commentdata")
    public Response commentData(@QueryParam("issueid") final Long issueid) {
        if (null == issueid) {
            return badRequest("Issue Id missing");
        } else {
            log.debug("Issueid - " + issueid);
        }
        final ApplicationUser loggedInUser = ComponentAccessor.getJiraAuthenticationContext().getLoggedInUser();
        if (null == loggedInUser) {
            log.debug("Anonymous user.");
        }

        final MutableIssue issueObject = this.issueManager.getIssueObject(issueid);
        final Hashtable<Integer, CommentModel> commentData = new Hashtable<>();
        if (null != issueObject && this.permissionManager.hasPermission(ProjectPermissions.BROWSE_PROJECTS, issueObject, loggedInUser)) {
            this.ao.executeInTransaction(() -> {
                CommentInfo[] commentInfos = HandleComments.this.ao.find(CommentInfo.class, "ISSUE_ID = ?", issueid);
                for (CommentInfo c : commentInfos) {
                    commentData.put(c.getID(), new CommentModel("", c.getParentCommentId(), c.getIssueId(), c.getCommentId()));
                }
                return null;
            });

        } else {
            log.warn("Get comment request ignored");
        }
        return Response.ok(commentData.values()).build();
    }

    @POST
    @AnonymousAllowed
    @Produces({MediaType.APPLICATION_JSON})
    @Path("addcomment")
    public Response addComment(final CommentModel comment) {
        final Comment commentObj = this.commentManager.getCommentById(comment.getParentCommentId());

        if (null == comment || (null == comment.getIssueId()) ||
                (null == comment.getParentCommentId()) ||
                (null == comment.getCommentBody())) {
            return badRequest("Required parameters missing");
        }
        if (null == commentObj) {
            return badRequest("Wrong comment id");
        }

        final ApplicationUser loggedInUser = ComponentAccessor.getJiraAuthenticationContext().getLoggedInUser();
        if (null == loggedInUser) {
            log.debug("Anonymous user.");
        }
        final MutableIssue issueObject = this.issueManager.getIssueObject(comment.getIssueId());
        if (!this.permissionManager.hasPermission(ProjectPermissions.ADD_COMMENTS, issueObject, loggedInUser)) {
            return Response.status(Response.Status.FORBIDDEN).entity("No Permission").build();
        }

        final Comment newComment = this.commentManager.create(issueObject, loggedInUser,
                StringEscapeUtils.unescapeHtml4(comment.getCommentBody().replaceAll("\\n", "\n")),
                commentObj.getGroupLevel(),
                commentObj.getRoleLevelId(),
                true);
        log.debug(newComment.getId());
        this.ao.executeInTransaction(() -> {
            final CommentInfo commentInfo = HandleComments.this.ao.create(CommentInfo.class);
            commentInfo.setCommentId(newComment.getId());
            commentInfo.setParentCommentId(comment.getParentCommentId());
            commentInfo.setIssueId(comment.getIssueId());
            commentInfo.save();
            return null;
        });
        comment.setCommentId(newComment.getId());
        final JsonEntityPropertyManager jsonEntityPropertyManager = ComponentAccessor.getComponent(JsonEntityPropertyManager.class);
        jsonEntityPropertyManager.put(loggedInUser, "sd.comment.property", newComment.getId(), "sd.public.comment", "{ \"internal\" : true}", (java.util.function.BiFunction) null, false);
        return Response.ok(comment).build();
    }

    @GET
    @AnonymousAllowed
    @Produces({MediaType.APPLICATION_JSON})
    @Path("commentsvotes")
    public Response getIssueCommentsVotes(@QueryParam("issueid") final Long issueid) {
        if (null == issueid) {
            return badRequest("Issue Id missing");
        } else {
            log.debug("Issueid - " + issueid);
        }

        final ApplicationUser loggedInUser = ComponentAccessor.getJiraAuthenticationContext().getLoggedInUser();
        final String userName = this.getUserName(loggedInUser);
        final Hashtable<Long, VoteCommentsModel> data = new Hashtable<>();
        final MutableIssue issueObject = this.issueManager.getIssueObject(issueid);

        if (null != issueObject && this.permissionManager.hasPermission(ProjectPermissions.BROWSE_PROJECTS, issueObject, loggedInUser)) {
            this.ao.executeInTransaction(() -> {
                VoteInfo[] votes = HandleComments.this.ao.find(VoteInfo.class, "ISSUE_ID = ?", issueid);
                for (VoteInfo voteInfo : votes) {
                    log.debug("Vote id - " + voteInfo.getID());
                    VoteCommentsModel inData = new VoteCommentsModel(voteInfo.getCommentId(), 0, false, 0, false);
                    if (data.containsKey(voteInfo.getCommentId())) {
                        inData = data.get(voteInfo.getCommentId());
                    }

                    switch (voteInfo.getVoteCount()) {
                        case -1:
                            inData.setDownVotes(inData.getDownVotes() + 1);
                            if (0 == userName.compareTo(voteInfo.getUserName().toLowerCase())) {
                                inData.setUserDownVoted(true);
                            }
                            break;
                        case 1:
                            inData.setUpVotes(inData.getUpVotes() + 1);
                            if (0 == userName.compareTo(voteInfo.getUserName().toLowerCase())) {
                                inData.setUserUpVoted(true);
                            }
                            break;
                        default:
                            log.error("No way this can happen");
                    }
                    data.put(voteInfo.getCommentId(), inData);
                }
                return null;
            });
        } else {
            log.warn("Get votes request ignored");
        }
        return Response.ok(data.values()).build();
    }

    private String getUserName(ApplicationUser loggedInUser) {
        String derivedUserName;
        if (null == loggedInUser) {
            log.debug("Anonymous user.");
            derivedUserName = "Anonymous-" + System.currentTimeMillis();
        } else {
            derivedUserName = loggedInUser.getName().toLowerCase();
        }
        return derivedUserName;
    }

    @GET
    @AnonymousAllowed
    @Produces({MediaType.APPLICATION_JSON})
    @Path("upvote")
    public Response upvoteComment(@QueryParam("commentid") final Long commentid, @QueryParam("issueid") final Long issueid) {
        if (null == issueid || null == commentid) {
            return badRequest("Required parameters missing");
        }
        this.updateVote(1, commentid, issueid);
        return Response.ok(new VoteCommentsModel(commentid, 0, true, 0, false)).build();
    }

    @GET
    @AnonymousAllowed
    @Produces({MediaType.APPLICATION_JSON})
    @Path("downvote")
    public Response downvoteComment(@QueryParam("commentid") Long commentid, @QueryParam("issueid") final Long issueid) {
        if (null == issueid || null == commentid) {
            return badRequest("Required parameters missing");
        }
        this.updateVote(-1, commentid, issueid);
        return Response.ok(new VoteCommentsModel(commentid, 0, false, 0, true)).build();
    }

    private void updateVote(final Integer increment, final Long commentid, final Long issueid) {
        final ApplicationUser loggedInUser = ComponentAccessor.getJiraAuthenticationContext().getLoggedInUser();
        if (null == loggedInUser) {
            log.debug("Anonymous user.");
        }

        final MutableIssue issueObject = this.issueManager.getIssueObject(issueid);
        final Comment comment = this.commentManager.getCommentById(commentid);
        final String userName = this.getUserName(loggedInUser);


        if (null != issueObject &&
                this.permissionManager.hasPermission(ProjectPermissions.ADD_COMMENTS, issueObject, loggedInUser) &&
                null != comment &&
                (null == loggedInUser || !loggedInUser.equals(comment.getAuthorApplicationUser()))
                ) {

            this.ao.executeInTransaction(() -> {
                VoteInfo[] votes = HandleComments.this.ao.find(VoteInfo.class, "COMMENT_ID = ? AND USER_NAME = ? AND ISSUE_ID = ?",
                        commentid, userName, issueid);
                switch (votes.length) {
                    case 0:
                        final VoteInfo voteInfo = HandleComments.this.ao.create(VoteInfo.class);
                        voteInfo.setCommentId(commentid);
                        voteInfo.setIssueId(issueid);
                        voteInfo.setUserName(userName);
                        voteInfo.setVoteCount(increment);
                        voteInfo.save();
                        break;
                    case 1:
                        log.debug("Existing vote found for this user, comment and issue");
                        Integer vote = votes[0].getVoteCount();
                        vote = vote + increment;
                        /*
                         * -1 + 1  = 0 = delete
                         * 0  + 1  => This is not possible
                         * 1  + 1  => 2 = 1
                         * -1 + -1 => -2 = -1
                         * 0  + -1 => This is not possible
                         * 1  + -1 = 0 = delete
                         * */
                        switch (vote) {
                            case 0:
                                HandleComments.this.ao.delete(votes[0]);
                                break;
                            case 2:
                                vote = 1;
                                votes[0].setVoteCount(vote);
                                votes[0].save();
                                break;
                            case -2:
                                vote = -1;
                                votes[0].setVoteCount(vote);
                                votes[0].save();
                                break;
                            default:
                                log.warn("This case should never come for vote count");
                                break;
                        }
                        break;
                    default:
                        log.error("More that one vote found for the same comment from same user, this should never happen");
                }
                return null;
            });
        } else {
            log.warn("Update vote request ignored");
        }
    }

    private Response badRequest(String message) {
        return Response.status(Response.Status.BAD_REQUEST).entity(message).build();
    }
}