var SidebarManager = {
    panelViews: {
        "tag-panel": Sidebar.TagPanel
    },

    panels: {},

    prevUserName: "",

    build: function SM_build() {
        let loggedIn = !!User.user;
        if (loggedIn && User.user.name === this.prevUserName) return;
        this.prevUserName = loggedIn ? User.user.name : "";

        for (let [id, panel] in Iterator(this.panels)) {
            if (panel.destroy) panel.destroy();
            delete this.panels[id];
        }
        this.loginNotification.collapsed = loggedIn;
        this.content.collapsed = !loggedIn;
        if (!loggedIn) return;

        let selectedPanelId = "tag-panel";
        this.selectPanel(selectedPanelId);
    },

    selectPanel: function SM_selectPanel(id) {
        if (id in this.panels) return;
        let element = document.getElementById(id);
        this.panels[id] = new this.panelViews[id](element);
    }
};

//window.addEventListener("load", method(SidebarManager, "build"), false);
//EventService.createListener("UserChange", method(SidebarManager, "build"));

Sidebar.manager = SidebarManager;
