<script type="text/ng-template" id="projectsList.panel.html">
    <div ng-init="type='public'">
        <div class="panel panel-primary" ng-controller="projectListCtrl">
            <div class="panel-heading">
                <h4 class="panel-title">${message(code: 'is.panel.project.public')}</h4>
            </div>
            <accordion>
                <accordion-group is-open="openedProjects[project.id]"
                                 ng-repeat="project in projects">
                    <accordion-heading>
                        {{ project.name }}
                        <button type="button"
                                class="btn btn-default"
                                ng-click="$event.stopPropagation(); openProject(project)"
                                tooltip="${message(code:'todo.is.ui.project.open')}"
                                tooltip-append-to-body="true"
                                tooltip-placement="top">
                            <span class="fa fa-expand"></span>
                        </button>
                    </accordion-heading>
                    <div ng-include="'project.details.html'"></div>
                </accordion-group>
            </accordion>
        </div>
    </div>
</script>
