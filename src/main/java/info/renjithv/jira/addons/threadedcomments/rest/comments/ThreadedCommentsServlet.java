package info.renjithv.jira.addons.threadedcomments.rest.comments;

import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.issue.fields.renderer.JiraRendererPlugin;
import com.atlassian.jira.plugin.renderer.JiraRendererModuleDescriptor;
import com.atlassian.jira.project.Project;
import com.atlassian.jira.project.ProjectManager;
import com.atlassian.plugin.spring.scanner.annotation.component.ClasspathComponent;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.sal.api.auth.LoginUriProvider;
import com.atlassian.sal.api.user.UserManager;
import com.atlassian.templaterenderer.TemplateRenderer;
import com.google.common.collect.Maps;
import info.renjithv.jira.addons.threadedcomments.rest.data.Constants;
import info.renjithv.jira.addons.threadedcomments.rest.data.ThreadedCommentsConfiguration;
import org.apache.commons.lang.StringEscapeUtils;

import javax.inject.Inject;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class ThreadedCommentsServlet extends HttpServlet
{

    @ComponentImport
    private final UserManager userManager;
    @ComponentImport
    private final LoginUriProvider loginUriProvider;
    @ComponentImport
    private final TemplateRenderer renderer;
    @ComponentImport
    private final ProjectManager projectManager;
    @ClasspathComponent
    private final ThreadedCommentsConfiguration threadedCommentsConfiguration;

    @Inject
    public ThreadedCommentsServlet(final UserManager userManager, final LoginUriProvider loginUriProvider,
                    final TemplateRenderer renderer, final ProjectManager projectManager,
                    final ThreadedCommentsConfiguration threadedCommentsConfiguration)
    {
        this.userManager = userManager;
        this.loginUriProvider = loginUriProvider;
        this.renderer = renderer;
        this.projectManager = projectManager;
        this.threadedCommentsConfiguration = threadedCommentsConfiguration;
    }

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException
    {
        Map<String, Object> data = Maps.newHashMap();

        for (Map.Entry<String, String[]> o : request.getParameterMap().entrySet())
        {
            data.put(o.getKey(), StringEscapeUtils.escapeHtml(o.getValue()[0]));
        }

        Boolean threadedCommentsEnabled = this.threadedCommentsConfiguration.getThreadedCommentsEnabledGlobaly();

        if (!threadedCommentsEnabled)
        {
            Project pro = this.projectManager.getProjectObjByKey((String) data.get("projectKey"));
            threadedCommentsEnabled = this.threadedCommentsConfiguration.getThreadedCommentsEnabledProjects().contains(String.valueOf(pro.getId()));
        }

        data.put(Constants.THREATEDCOMMENTS_ENABLED, threadedCommentsEnabled);

        JiraRendererPlugin renderer = ComponentAccessor.getRendererManager().getRendererForType("atlassian-wiki-renderer");
        JiraRendererModuleDescriptor rendererDescriptor = renderer.getDescriptor();
        data.put("rendererDescriptor", rendererDescriptor);
        data.put("rendererParams", new HashMap<String, Object>());

        response.setContentType("text/html;charset=utf-8");
        this.renderer.render("threadedComments.vm", data, response.getWriter());
    }
}
