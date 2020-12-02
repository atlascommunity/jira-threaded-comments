/* (C)2020 */
package info.renjithv.jira.addons.threadedcomments.rest;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "commentvotes")
@XmlAccessorType(XmlAccessType.FIELD)
public class VoteCommentsModel {

  @XmlElement(name = "commentid")
  private Long commentId;

  @XmlElement(name = "upvotes")
  private Integer upVotes;

  @XmlElement(name = "userupvoted")
  private Boolean userUpVoted;

  @XmlElement(name = "downvotes")
  private Integer downVotes;

  @XmlElement(name = "userdownvoted")
  private Boolean userDownVoted;

  public VoteCommentsModel() {}

  public VoteCommentsModel(
      Long commentId,
      Integer upVotes,
      Boolean userUpVoted,
      Integer downVotes,
      Boolean userDownVoted) {
    this.commentId = commentId;
    this.upVotes = upVotes;
    this.userUpVoted = userUpVoted;
    this.downVotes = downVotes;
    this.userDownVoted = userDownVoted;
  }

  public Integer getDownVotes() {
    return downVotes;
  }

  public void setDownVotes(Integer downVotes) {
    this.downVotes = downVotes;
  }

  public Integer getUpVotes() {
    return upVotes;
  }

  public void setUpVotes(Integer upVotes) {
    this.upVotes = upVotes;
  }

  public Long getCommentId() {
    return commentId;
  }

  public void setCommentId(Long commentId) {
    this.commentId = commentId;
  }

  public Boolean getUserDownVoted() {
    return userDownVoted;
  }

  public void setUserDownVoted(Boolean userDownVoted) {
    this.userDownVoted = userDownVoted;
  }

  public Boolean getUserUpVoted() {
    return userUpVoted;
  }

  public void setUserUpVoted(Boolean userUpVoted) {
    this.userUpVoted = userUpVoted;
  }
}
