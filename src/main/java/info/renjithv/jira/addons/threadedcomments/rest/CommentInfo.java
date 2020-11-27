package info.renjithv.jira.addons.threadedcomments.rest;

import net.java.ao.Entity;
import net.java.ao.schema.Indexed;

public interface CommentInfo extends Entity {
    @Indexed
    Long getIssueId();
    Long getCommentId();
    Long getParentCommentId();

    void setIssueId(Long issueId);
    void setCommentId(Long commentId);
    void setParentCommentId(Long commentId);
}