package info.renjithv.jira.addons.threadedcomments.rest;

import net.java.ao.Entity;

public interface VoteInfo extends Entity {
    Long getIssueId();
    Long getCommentId();
    String getUserName();
    Integer getVoteCount();

    void setIssueId(Long issueId);
    void setCommentId(Long commentId);
    void setUserName(String userName);
    void setVoteCount(int voteCount);
}