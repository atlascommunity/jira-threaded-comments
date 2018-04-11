package info.renjithv.jira.addons.threadedcomments.rest.admin;

import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.sal.api.pluginsettings.PluginSettings;
import com.atlassian.sal.api.pluginsettings.PluginSettingsFactory;
import com.atlassian.sal.api.transaction.TransactionTemplate;
import com.atlassian.sal.api.user.UserKey;
import com.atlassian.sal.api.user.UserManager;

import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@Path("/")
public class ConfigResource {
    @ComponentImport
    private final UserManager userManager;
    @ComponentImport
    private final PluginSettingsFactory pluginSettingsFactory;
    @ComponentImport
    private final TransactionTemplate transactionTemplate;

    @Inject
    public ConfigResource(UserManager userManager, PluginSettingsFactory pluginSettingsFactory,
                          TransactionTemplate transactionTemplate) {
        this.userManager = userManager;
        this.pluginSettingsFactory = pluginSettingsFactory;
        this.transactionTemplate = transactionTemplate;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response get(@Context HttpServletRequest request) {
        UserKey user = this.userManager.getRemoteUserKey(request);
        if (user == null || !this.userManager.isSystemAdmin(user)) {
            return Response.status(Status.UNAUTHORIZED).build();
        }

        return Response.ok(this.transactionTemplate.execute(() -> {
            PluginSettings settings = this.pluginSettingsFactory.createGlobalSettings();
            Config config = new Config();

            String globalactive = (String) settings.get(Config.class.getName() + ".globalactive");
            if (globalactive != null) {
                config.setGlobalactive(Boolean.valueOf(globalactive));
            } else {
                config.setGlobalactive(true);
            }

            return config;
        })).build();
    }


    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    public Response put(final Config config, @Context HttpServletRequest request) {
        UserKey user = this.userManager.getRemoteUserKey(request);
        if (user == null || !this.userManager.isSystemAdmin(user)) {
            return Response.status(Status.UNAUTHORIZED).build();
        }

        this.transactionTemplate.execute(() -> {
            PluginSettings pluginSettings = ConfigResource.this.pluginSettingsFactory.createGlobalSettings();
            pluginSettings.put(Config.class.getName() + ".globalactive", config.getGlobalactive().toString());
            return null;
        });
        return Response.noContent().build();
    }

    @XmlRootElement
    @XmlAccessorType(XmlAccessType.FIELD)
    public static final class Config {
        @XmlElement
        private Boolean globalactive = true;

        public Boolean getGlobalactive() {
            return this.globalactive;
        }

        public void setGlobalactive(Boolean globalactive) {
            this.globalactive = globalactive;
        }
    }
}
