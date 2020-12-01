/* (C)2020 */
package info.renjithv.jira.addons.threadedcomments.rest.admin;

import com.atlassian.jira.project.ProjectManager;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.sal.api.auth.LoginUriProvider;
import com.atlassian.sal.api.user.UserKey;
import com.atlassian.sal.api.user.UserManager;
import com.atlassian.templaterenderer.TemplateRenderer;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import info.renjithv.jira.addons.threadedcomments.rest.data.Constants;
import info.renjithv.jira.addons.threadedcomments.rest.data.ThreadedCommentsConfiguration;
import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileItemFactory;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;

public class AdminServlet extends HttpServlet {
  private final UserManager userManager;
  private final LoginUriProvider loginUriProvider;
  private final TemplateRenderer renderer;
  private final ProjectManager projectManager;
  private final ThreadedCommentsConfiguration threadedCommentsConfiguration;

  public AdminServlet(
      @ComponentImport UserManager userManager,
      @ComponentImport LoginUriProvider loginUriProvider,
      @ComponentImport TemplateRenderer renderer,
      @ComponentImport ProjectManager projectManager,
      ThreadedCommentsConfiguration threadedCommentsConfiguration) {
    this.userManager = userManager;
    this.loginUriProvider = loginUriProvider;
    this.renderer = renderer;
    this.projectManager = projectManager;
    this.threadedCommentsConfiguration = threadedCommentsConfiguration;
  }

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    UserKey user = this.userManager.getRemoteUserKey(request);
    if (user == null || !this.userManager.isSystemAdmin(user)) {
      this.redirectToLogin(request, response);
      return;
    }

    response.setContentType("text/html;charset=utf-8");
    this.renderer.render(
        "admin.vm", this.configToMap(this.threadedCommentsConfiguration), response.getWriter());
  }

  @Override
  public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    Map<String, Object> map;

    try {
      map = this.handlePost(req, resp);
    } catch (Exception e) {
      e.printStackTrace(resp.getWriter());
      return;
    }

    resp.setContentType("text/html;charset=utf-8");
    this.renderer.render("admin.vm", map, resp.getWriter());
  }

  private Map<String, Object> handlePost(HttpServletRequest request, HttpServletResponse resp)
      throws IOException {
    UserKey user = this.userManager.getRemoteUserKey(request);
    if (user == null || !this.userManager.isSystemAdmin(user)) {
      this.redirectToLogin(request, resp);
      return null;
    }

    FileItemFactory factory = new DiskFileItemFactory();
    ServletFileUpload upload = new ServletFileUpload(factory);
    List<FileItem> items;

    try {
      // Unfortunately "multipart" makes it so every field comes through as a "FileItem"
      items = upload.parseRequest(request);
    } catch (FileUploadException e) {
      e.printStackTrace(resp.getWriter());
      return null;
    }
    this.setAllFields(items);

    return this.configToMap(this.threadedCommentsConfiguration);
  }

  private void setAllFields(final List<FileItem> items) {
    Set<String> allFields = Sets.newHashSet();
    List<String> threadedCommentsEnabledProjects = Lists.newArrayList();
    List<String> voteCommentsEnabledProjects = Lists.newArrayList();

    for (FileItem item : items) {
      final String fieldName = item.getFieldName();
      allFields.add(fieldName);

      if (Constants.THREATEDCOMMENTS_PROJECTS.equals(fieldName)) {
        threadedCommentsEnabledProjects.add(item.getString());
      } else if (Constants.COMMENTVOTE_PROJECTS.equals(fieldName))
        voteCommentsEnabledProjects.add(item.getString());
    }

    // checkboxes get submit on selected state only
    this.threadedCommentsConfiguration.setThreadedCommentsEnabledGlobaly(
        allFields.contains(Constants.THREATEDCOMMENTS_ENABLED));
    this.threadedCommentsConfiguration.setVoteCommentsEnabledGlobaly(
        allFields.contains(Constants.COMMENTVOTE_ENABLED));

    this.threadedCommentsConfiguration.setThreadedCommentsEnabledProjects(
        threadedCommentsEnabledProjects);
    this.threadedCommentsConfiguration.setVoteCommentsEnabledProjects(voteCommentsEnabledProjects);
  }

  private Map<String, Object> configToMap(final ThreadedCommentsConfiguration config) {
    Map<String, Object> map = new HashMap<>();

    map.put(Constants.THREATEDCOMMENTS_ENABLED, config.getThreadedCommentsEnabledGlobaly());
    map.put(Constants.COMMENTVOTE_ENABLED, config.getVoteCommentsEnabledGlobaly());

    map.put(
        Constants.THREATEDCOMMENTS_PROJECTS,
        config.getThreadedCommentsEnabledProjects().stream()
            .map(Long::parseLong)
            .map(this.projectManager::getProjectObj)
            .collect(Collectors.toList()));
    map.put(
        Constants.COMMENTVOTE_PROJECTS,
        config.getVoteCommentsEnabledProjects().stream()
            .map(Long::parseLong)
            .map(this.projectManager::getProjectObj)
            .collect(Collectors.toList()));

    map.put(Constants.ALL_PROJECTS, this.projectManager.getProjects());
    return map;
  }

  private void redirectToLogin(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    response.sendRedirect(this.loginUriProvider.getLoginUri(this.getUri(request)).toASCIIString());
  }

  private URI getUri(HttpServletRequest request) {
    StringBuffer builder = request.getRequestURL();
    if (request.getQueryString() != null) {
      builder.append("?");
      builder.append(request.getQueryString());
    }
    return URI.create(builder.toString());
  }
}
