/* (C)2020 */
package info.renjithv.jira.addons.threadedcomments.rest.data;

import com.atlassian.plugin.spring.scanner.annotation.component.JiraComponent;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.sal.api.pluginsettings.PluginSettings;
import com.atlassian.sal.api.pluginsettings.PluginSettingsFactory;
import com.google.common.collect.Lists;
import java.util.List;
import javax.inject.Inject;

@JiraComponent
public class ThreadedCommentsConfiguration {

  private static final String PLUGIN_STORAGE_KEY =
      "info.renjithv.jira.addons.threadedcomments.data";
  public static final String COMMENTVOTE_ENABLED = "COMMENTVOTE_ENABLED";

  private final PluginSettings settings;

  @Inject
  public ThreadedCommentsConfiguration(
      @ComponentImport PluginSettingsFactory pluginSettingsFactory) {
    this.settings = pluginSettingsFactory.createSettingsForKey(PLUGIN_STORAGE_KEY);
  }

  public Boolean getThreadedCommentsEnabledGlobaly() {
    String enabled = (String) this.settings.get(Constants.THREATEDCOMMENTS_ENABLED);
    return enabled == null ? true : Boolean.valueOf(enabled);
  }

  public void setThreadedCommentsEnabledGlobaly(Boolean enabled) {
    this.settings.put(Constants.THREATEDCOMMENTS_ENABLED, String.valueOf(enabled));
  }

  public List<String> getThreadedCommentsEnabledProjects() {
    List<String> threadedCommentsEnabledProjects =
        (List) this.settings.get(Constants.THREATEDCOMMENTS_PROJECTS);
    return threadedCommentsEnabledProjects != null
        ? threadedCommentsEnabledProjects
        : Lists.newArrayList();
  }

  public void setThreadedCommentsEnabledProjects(
      final List<String> threadedCommentsEnabledProjects) {
    this.settings.put(Constants.THREATEDCOMMENTS_PROJECTS, threadedCommentsEnabledProjects);
  }

  public Boolean getVoteCommentsEnabledGlobaly() {
    String enabled = (String) this.settings.get(COMMENTVOTE_ENABLED);
    return enabled == null ? true : Boolean.valueOf(enabled);
  }

  public void setVoteCommentsEnabledGlobaly(Boolean enabled) {
    this.settings.put(COMMENTVOTE_ENABLED, String.valueOf(enabled));
  }

  public List<String> getVoteCommentsEnabledProjects() {
    List<String> threadedCommentsEnabledProjects =
        (List) this.settings.get(Constants.COMMENTVOTE_PROJECTS);
    return threadedCommentsEnabledProjects != null
        ? threadedCommentsEnabledProjects
        : Lists.newArrayList();
  }

  public void setVoteCommentsEnabledProjects(final List<String> threadedCommentsEnabledProjects) {
    this.settings.put(Constants.COMMENTVOTE_PROJECTS, threadedCommentsEnabledProjects);
  }
}
