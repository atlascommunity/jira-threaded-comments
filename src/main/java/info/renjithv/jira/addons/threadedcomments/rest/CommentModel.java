package info.renjithv.jira.addons.threadedcomments.rest;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
@XmlRootElement(name = "comment")
@XmlAccessorType(XmlAccessType.FIELD)
public class CommentModel {

    @XmlElement(name = "commentbody")
    private String commentBody;

    @XmlElement(name = "parentcommentid")
    private Long parentCommentId;

    @XmlElement(name = "issueid")
    private Long issueId;

    public Long getCommentId() {
        return commentId;
    }

    public void setCommentId(Long commentId) {
        this.commentId = commentId;
    }

    @XmlElement(name = "commentid")
    private Long commentId;


    public CommentModel(){

    }
    public CommentModel(String commentBody, Long parentCommentId, Long issueId, Long commentId) {
        this.commentBody = commentBody;
        this.parentCommentId = parentCommentId;
        this.issueId = issueId;
        this.commentId = commentId;
    }

    public String getCommentBody() {
        return commentBody;
    }

    public void setCommentBody(String commentBody) {
        this.commentBody = commentBody;
    }

    public Long getIssueId() {
        return issueId;
    }

    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }

    public Long getParentCommentId() {
        return parentCommentId;
    }

    public void setParentCommentId(Long parentCommentId) {
        this.parentCommentId = parentCommentId;
    }
}
