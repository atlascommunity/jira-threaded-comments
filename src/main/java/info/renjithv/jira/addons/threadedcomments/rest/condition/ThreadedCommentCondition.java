package info.renjithv.jira.addons.threadedcomments.rest.condition;

import com.atlassian.plugin.PluginParseException;
import com.atlassian.plugin.webresource.QueryParams;
import com.atlassian.plugin.webresource.condition.UrlReadingCondition;
import com.atlassian.plugin.webresource.url.UrlBuilder;

import java.util.Map;

public class ThreadedCommentCondition implements UrlReadingCondition {


    @Override
    public void init(Map<String, String> map) throws PluginParseException {

    }

    @Override
    public void addToUrl(UrlBuilder urlBuilder) {

    }

    @Override
    public boolean shouldDisplay(QueryParams queryParams) {
        return false;
    }
}
