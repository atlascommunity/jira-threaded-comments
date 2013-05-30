package it.com.atlassian.jira.threadedcomments.rest;

import org.junit.Test;
import org.junit.After;
import org.junit.Before;
import org.mockito.Mockito;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;
import com.atlassian.jira.threadedcomments.rest.HandleComments;
import com.atlassian.jira.threadedcomments.rest.HandleCommentsModel;
import org.apache.wink.client.Resource;
import org.apache.wink.client.RestClient;

public class HandleCommentsFuncTest {

    @Before
    public void setup() {

    }

    @After
    public void tearDown() {

    }

    @Test
    public void messageIsValid() {

        String baseUrl = System.getProperty("baseurl");
        String resourceUrl = baseUrl + "/rest/handlecomments/1.0/message";

        RestClient client = new RestClient();
        Resource resource = client.resource(resourceUrl);

        HandleCommentsModel message = resource.get(HandleCommentsModel.class);

        assertEquals("wrong message","Hello World",message.getMessage());
    }
}
