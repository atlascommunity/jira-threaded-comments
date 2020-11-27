package info.renjithv.jira.addons.threadedcomments.rest;

import net.java.ao.Entity;
import net.java.ao.schema.Index;
import net.java.ao.schema.Indexed;
import net.java.ao.schema.Indexes;

@Indexes({
        @Index(name = "commentUserIssue", methodNames = {"getCommentId", "getUserName", "getIssueId"}),
})
public interface VoteInfo extends Entity {
    @Indexed
    Long getIssueId();
    Long getCommentId();
    String getUserName();
    Integer getVoteCount();

    void setIssueId(Long issueId);
    void setCommentId(Long commentId);
    void setUserName(String userName);
    void setVoteCount(int voteCount);
}