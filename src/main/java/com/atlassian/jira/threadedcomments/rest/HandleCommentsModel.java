package com.atlassian.jira.threadedcomments.rest;

import javax.xml.bind.annotation.*;
@XmlRootElement(name = "message")
@XmlAccessorType(XmlAccessType.FIELD)
public class HandleCommentsModel {

    @XmlElement(name = "value")
    private String message;

    public HandleCommentsModel() {
    }

    public HandleCommentsModel(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}