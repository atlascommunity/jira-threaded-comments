package ut.com.atlassian.jira.threadedcomments.rest;

import org.junit.Test;
import org.junit.After;
import org.junit.Before;
import org.mockito.Mockito;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;
import com.atlassian.jira.threadedcomments.rest.HandleComments;
import com.atlassian.jira.threadedcomments.rest.HandleCommentsModel;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.GenericEntity;

public class HandleCommentsTest {

    @Before
    public void setup() {

    }

    @After
    public void tearDown() {

    }

    @Test
    public void messageIsValid() {
        HandleComments resource = new HandleComments();

        Response response = resource.getMessage();
        final HandleCommentsModel message = (HandleCommentsModel) response.getEntity();

        assertEquals("wrong message","Hello World",message.getMessage());
    }
}
