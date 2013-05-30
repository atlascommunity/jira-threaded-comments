package com.atlassian.jira.threadedcomments.rest;

import net.java.ao.Entity;

public interface CommentInfo extends Entity {
    Long getIssueId();
    Long getCommentId();
    Long getParentCommentId();

    void setIssueId(Long issueId);
    void setCommentId(Long commentId);
    void setParentCommentId(Long commentId);
}