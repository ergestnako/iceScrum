/*
 * Copyright (c) 2015 Kagilum SAS.
 *
 * This file is part of iceScrum.
 *
 * iceScrum is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License.
 *
 * iceScrum is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Authors:
 *
 * Vincent Barrier (vbarrier@kagilum.com)
 * Nicolas Noullet (nnoullet@kagilum.com)
 *
 */

// Depends on TaskService to instantiate Task push listeners (necessary to maintain counts). We should think of a better way to systematically register the listeners
extensibleController('storyCtrl', ['$scope', '$uibModal', '$filter', 'IceScrumEventType', 'ProjectService', 'StoryService', 'TaskService', '$state', 'Session', 'StoryStatesByName', 'AcceptanceTestStatesByName', function($scope, $uibModal, $filter, IceScrumEventType, ProjectService, StoryService, TaskService, $state, Session, StoryStatesByName, AcceptanceTestStatesByName) {
    // Functions
    $scope.retrieveTags = function() {
        if (_.isEmpty($scope.tags)) {
            ProjectService.getTags().then(function(tags) {
                $scope.tags = tags;
            });
        }
    };
    $scope.acceptToBacklog = function(story) {
        StoryService.acceptToBacklog(story).then(function() {
            $scope.notifySuccess('todo.is.ui.story.accepted');
        });
    };
    $scope.acceptAs = function(story, target) {
        StoryService.acceptAs(story, target).then(function() {
            $scope.notifySuccess('todo.is.ui.story.acceptedAs' + target);
        });
    };
    $scope.returnToSandbox = function(story) {
        StoryService.returnToSandbox(story).then(function() {
            $scope.notifySuccess('todo.is.ui.story.returnedToSandbox');
        });
    };
    $scope.unPlan = function(story) {
        StoryService.unPlan(story).then(function() {
            $scope.notifySuccess('todo.is.ui.story.unplanned');
        });
    };
    $scope.shiftToNext = function(story) {
        StoryService.shiftToNext(story).then(function() {
            $scope.notifySuccess('todo.is.ui.story.shiftedToNext');
        });
    };
    $scope.done = function(story) {
        StoryService.done(story).then(function() {
            $scope.notifySuccess('todo.is.ui.story.done');
        });
    };
    $scope.unDone = function(story) {
        StoryService.unDone(story).then(function() {
            $scope.notifySuccess('todo.is.ui.story.unDone');
        });
    };
    $scope.follow = function(story) {
        StoryService.follow(story);
    };
    $scope.copy = function(story) {
        StoryService.copy(story).then(function() {
            $scope.notifySuccess('todo.is.ui.story.copied');
        });
    };
    $scope['delete'] = function(story) {
        //fake delete
        StoryService.crudMethods[IceScrumEventType.DELETE](story);
        var notif = $scope.notifySuccess('todo.is.ui.deleted', {
            actions: [{
                label: $scope.message('todo.is.ui.undo'),
                fn: function() {
                    notif.data.close = angular.noop;
                    StoryService.crudMethods[IceScrumEventType.CREATE](story);
                    $state.go('backlog.backlog.story.details', {id: story.id});
                    $scope.notifySuccess('todo.is.ui.deleted.cancelled');
                }
            }],
            close: function() {
                StoryService.delete(story);
            },
            duration: 5000
        });
    };
    $scope.authorizedStory = function(action, story) {
        return StoryService.authorizedStory(action, story);
    };
    $scope.menus = [
        {
            name: 'todo.is.ui.details',
            priority: function(story, defaultPriority, viewType) {
                return viewType === 'list' ? 100 : defaultPriority;
            },
            visible: function(story, viewType) { return viewType !== 'details'; },
            action: function(story) { $state.go('.story.details', {storyId: story.id}); }
        },
        {
            name: 'is.ui.backlog.menu.acceptAsStory',
            visible: function(story) { return $scope.authorizedStory('accept', story) },
            action: function(story) { $scope.acceptToBacklog(story); }
        },
        {
            name: 'is.ui.backlog.menu.acceptAsFeature',
            visible: function(story) { return $scope.authorizedStory('accept', story) },
            action: function(story) { $scope.confirm({message: $scope.message('is.ui.backlog.menu.acceptAsFeature.confirm'), callback: $scope.acceptAs, args: [story, 'Feature']}); }
        },
        {
            name: 'is.ui.backlog.menu.acceptAsUrgentTask',
            visible: function(story) { return $scope.authorizedStory('accept', story) },
            action: function(story) { $scope.confirm({message: $scope.message('is.ui.backlog.menu.acceptAsUrgentTask.confirm'), callback: $scope.acceptAs, args: [story, 'Task']}); }
        },
        {
            name: 'is.ui.releasePlan.menu.story.done',
            visible: function(story) { return $scope.authorizedStory('done', story) },
            action: function(story) {
                var remainingAcceptanceTests = story.testState != AcceptanceTestStatesByName.SUCCESS && story.acceptanceTests_count;
                var remainingTasks = story.countDoneTasks != story.tasks_count;
                if (remainingAcceptanceTests || remainingTasks) {
                    var messages = [];
                    if (remainingAcceptanceTests) {
                        messages.push('todo.is.ui.story.done.acceptanceTest.confirm');
                    }
                    if (remainingTasks) {
                        messages.push('todo.is.ui.story.done.task.confirm');
                    }
                    $scope.confirm({
                        message: _.map(messages, $scope.message).join('<br/><br/>'),
                        callback: $scope.done,
                        args: [story]
                    });
                } else {
                    $scope.done(story);
                }
            }
        },
        {
            name: 'is.ui.releasePlan.menu.story.undone',
            visible: function(story) { return $scope.authorizedStory('unDone', story) },
            action: function(story) { $scope.unDone(story); }
        },
        {
            name: 'is.ui.releasePlan.menu.story.dissociate',
            visible: function(story) { return $scope.authorizedStory('unPlan', story) },
            action: function(story) { $scope.unPlan(story); }
        },
        {
            name: 'is.ui.sprintPlan.menu.postit.shiftToNext',
            visible: function(story) { return $scope.authorizedStory('shiftToNext', story)},
            action: function(story) { $scope.shiftToNext(story); }
        },
        {
            name: 'is.ui.backlog.menu.estimate',
            visible: function(story) { return $scope.authorizedStory('updateEstimate', story) },
            action: function(story) { $scope.showEditEffortModal(story); }
        },
        {
            name: 'is.ui.backlog.menu.returnToSandbox',
            visible: function(story) { return $scope.authorizedStory('returnToSandbox', story) },
            action: function(story) { $scope.returnToSandbox(story); }
        },
        {
            name: 'is.ui.backlog.menu.split',
            visible: function(story) { return $scope.authorizedStory('split', story) },
            action: function(story) { $scope.showStorySplitModal(story); }
        },
        {
            name: 'is.ui.releasePlan.menu.story.clone',
            visible: function(story) { return $scope.authorizedStory('copy', story) },
            action: function(story) { $scope.copy(story); }
        }, {
            name: 'todo.is.ui.permalink.copy',
            visible: function(story) { return true },
            action: function(story) { $scope.showCopyModal($scope.message('is.permalink'), ($filter('permalink')(story.uid, 'story'))); }
        },
        {
            name: 'is.ui.backlog.menu.delete',
            visible: function(story) { return $scope.authorizedStory('delete', story) },
            action: function(story) { $scope.delete(story); }
        }
    ];
    $scope.tasksProgress = function(story) {
        return story.tasks_count > 0 && story.state < StoryStatesByName.DONE && story.state >= StoryStatesByName.PLANNED;
    };
    $scope.isEffortCustom = function() {
        return Session.getProject().planningPokerGameType == 2;
    };
    $scope.effortSuite = function(isNullable) {
        if (isNullable) {
            return Session.getProject().planningPokerGameType == 0 ? $scope.integerSuiteNullable : $scope.fibonacciSuiteNullable;
        } else {
            return Session.getProject().planningPokerGameType == 0 ? $scope.integerSuite : $scope.fibonacciSuite;
        }
    };
    $scope.isEffortNullable = function(story) {
        return story.state <= StoryStatesByName.ESTIMATED;
    };
    var scrollTable = function(dontAnimate, nbItems) {
        var ths = angular.element('.table-scrollable').find('th');
        var titleWidth = angular.element(ths[0]).prop('offsetWidth');
        var tableWidth = ths.size() > 0 ? angular.element(angular.element('.table-scrollable').find('th')[1]).prop('offsetWidth') : titleWidth;
        var scrollLeft = titleWidth + (nbItems - 1) * tableWidth;
        if (dontAnimate) {
            $('.table-scrollable').scrollLeft(scrollLeft);
        } else {
            $('.table-scrollable').animate({
                scrollLeft: scrollLeft
            }, 400);
        }
    };
    $scope.showEditEffortModal = function(story, $event) {
        if (StoryService.authorizedStory('updateEstimate', story)) {
            var parentScope = $scope;
            $uibModal.open({
                templateUrl: 'story.effort.html',
                controller: ['$scope', '$timeout', function($scope, $timeout) {
                    $scope.editableStory = angular.copy(story);
                    if ($scope.editableStory.effort == undefined) {
                        $scope.editableStory.effort = '?';
                    }
                    $scope.initialEffort = $scope.editableStory.effort;
                    var initialEfforts = [];
                    var initialStoriesByEffort = [];
                    var initialCount = [];
                    $scope.efforts = [];
                    $scope.storyRows = [];
                    $scope.count = [];
                    $scope.isEffortCustom = parentScope.isEffortCustom;
                    if (!$scope.isEffortCustom()) {
                        $scope.effortSuiteValues = parentScope.effortSuite(parentScope.isEffortNullable);
                        $scope.sliderEffort = {
                            min: 0,
                            step: 1,
                            max: $scope.effortSuiteValues.length - 1,
                            labelValue: $scope.effortSuiteValues.indexOf($scope.initialEffort),
                            formatter: function(val) {
                                return $scope.effortSuiteValues[val.value];
                            },
                            rangeHighlights: [
                                {"start": 0, "end": $scope.effortSuiteValues.indexOf(5)},
                                {"start": $scope.effortSuiteValues.indexOf(5), "end": $scope.effortSuiteValues.indexOf(13)},
                                {"start": $scope.effortSuiteValues.indexOf(13), "end": $scope.effortSuiteValues.length - 1}
                            ],
                            sliderid: "slider-effort"
                        };
                        $scope.$watch('sliderEffort.labelValue', function(newVal) {
                            $scope.editableStory.effort = $scope.effortSuiteValues[newVal];
                        });
                    }
                    StoryService.listByField('effort').then(function(effortsAndStories) {
                        initialEfforts = effortsAndStories.fieldValues;
                        var indexOfNull = initialEfforts.indexOf(null);
                        if (indexOfNull != -1) {
                            initialEfforts.splice(indexOfNull, 1, '?');
                        }
                        initialStoriesByEffort = effortsAndStories.stories;
                        initialCount = effortsAndStories.count;
                        $scope.updateTable(true)
                    });
                    $scope.updateTable = function(dontAnimate) {
                        var effort = $scope.editableStory.effort;
                        $scope.efforts = angular.copy(initialEfforts);
                        var storiesByEffort = angular.copy(initialStoriesByEffort);
                        $scope.count = angular.copy(initialCount);
                        // Required because of mix of strings (native select options) and numbers returned by the server
                        var effortIndex = _.findIndex($scope.efforts, function(effort2) {
                            return effort2 == effort;
                        });
                        if (effortIndex == -1) {
                            effortIndex = _.sortedIndex($scope.efforts, effort);
                            $scope.efforts.splice(effortIndex, 0, effort);
                            storiesByEffort.splice(effortIndex, 0, []);
                            $scope.count.splice(effortIndex, 0, 0);
                        }
                        var initialEffortIndex = $scope.efforts.indexOf($scope.initialEffort);
                        _.remove(storiesByEffort[initialEffortIndex], {id: $scope.editableStory.id});
                        storiesByEffort[effortIndex].unshift($scope.editableStory);
                        $scope.storiesByEffort = storiesByEffort;
                        $timeout(function() {
                            scrollTable(dontAnimate, effortIndex);
                        });
                    };
                    $scope.setEffort = function(effort) {
                        $scope.editableStory.effort = effort;
                        $scope.sliderEffort.labelValue = $scope.effortSuiteValues.indexOf(effort);
                        $scope.updateTable();
                    };
                    $scope.submit = function(story) {
                        StoryService.update(story).then(function() {
                            $scope.$close();
                            $scope.notifySuccess('todo.is.ui.story.effort.updated');
                        });
                    };
                }]
            });
            if ($event) {
                $event.stopPropagation();
            }
        }
    };
    $scope.showEditValueModal = function(story, $event) {
        if (StoryService.authorizedStory('update', story)) {
            $uibModal.open({
                templateUrl: 'story.value.html',
                controller: ["$scope", '$timeout', function($scope, $timeout) {
                    $scope.editableStory = angular.copy(story);
                    $scope.initialValue = $scope.editableStory.value;
                    var initialValues = [];
                    var initialStoriesByValue = [];
                    var initialCount = [];
                    $scope.values = [];
                    $scope.storyRows = [];
                    $scope.count = [];
                    StoryService.listByField('value').then(function(valuesAndStories) {
                        initialValues = valuesAndStories.fieldValues;
                        initialStoriesByValue = valuesAndStories.stories;
                        initialCount = valuesAndStories.count;
                        $scope.updateTable(true)
                    });
                    $scope.updateTable = function(dontAnimate) {
                        var value = $scope.editableStory.value;
                        $scope.values = angular.copy(initialValues);
                        var storiesByValue = angular.copy(initialStoriesByValue);
                        $scope.count = angular.copy(initialCount);
                        var valueIndex = $scope.values.indexOf(value);
                        if (valueIndex == -1) {
                            valueIndex = _.sortedIndex($scope.values, value);
                            $scope.values.splice(valueIndex, 0, value);
                            storiesByValue.splice(valueIndex, 0, []);
                            $scope.count.splice(valueIndex, 0, 0);
                        }
                        var initialValueIndex = $scope.values.indexOf($scope.initialValue);
                        _.remove(storiesByValue[initialValueIndex], {id: $scope.editableStory.id});
                        storiesByValue[valueIndex].unshift($scope.editableStory);
                        $scope.storiesByValue = storiesByValue;
                        $timeout(function() {
                            scrollTable(dontAnimate, valueIndex);
                        });
                    };
                    $scope.setValue = function(value) {
                        $scope.editableStory.value = value;
                        $scope.sliderEffort.labelValue = $scope.values.indexOf($scope.value);
                        $scope.updateTable();
                    };
                    $scope.submit = function(story) {
                        StoryService.update(story).then(function() {
                            $scope.$close();
                            $scope.notifySuccess('todo.is.ui.story.value.updated');
                        });
                    };
                }]
            });
            if ($event) {
                $event.stopPropagation();
            }
        }
    };
    $scope.retrieveParentSprintEntries = function() {
        if (_.isEmpty($scope.parentSprintEntries)) {
            StoryService.getParentSprintEntries().then(function(parentSprintEntries) {
                $scope.parentSprintEntries = parentSprintEntries;
            });
        }
    };
    $scope.showStorySplitModal = function(story) {
        var parentScope = $scope;
        $uibModal.open({
            templateUrl: 'story.split.html',
            controller: ['$scope', '$controller', '$q', function($scope, $controller, $q) {
                $controller('storyAtWhoCtrl', {$scope: $scope});
                // Functions
                $scope.onChangeSplitNumber = function() {
                    if ($scope.stories.length < $scope.splitCount) {
                        while ($scope.stories.length < $scope.splitCount) {
                            var newStory = angular.copy(story);
                            newStory.name = "";
                            newStory.id = null;
                            newStory.notes = "";
                            newStory.description = "";
                            newStory.origin = story.name;
                            newStory.state = story.state >= StoryStatesByName.ACCEPTED ? StoryStatesByName.ACCEPTED : StoryStatesByName.SUGGESTED;
                            $scope.stories.push(newStory);
                        }
                    } else if ($scope.stories.length > $scope.splitCount) {
                        while ($scope.stories.length > $scope.splitCount) {
                            $scope.stories.splice($scope.stories.length - 1, 1);
                        }
                    }
                    //split effort from original story
                    if (originalEffort > 0) {
                        var effort = parseInt(originalEffort / $scope.splitCount);
                        effort = effort >= 1 ? effort : 1;
                        _.each($scope.stories, function(story) {
                            story.effort = effort;
                        });
                    }
                    if (originalValue > 0) {
                        var value = parseInt(originalValue / $scope.splitCount);
                        value = value >= 1 ? value : 1;
                        _.each($scope.stories, function(story) {
                            story.value = value;
                        });
                    }
                };
                $scope.submit = function(stories) {
                    var tasks = [];
                    _.each(stories, function(story) {
                        if (story.id) {
                            tasks.push(function() {
                                return StoryService.update(story)
                            });
                        } else {
                            var effort = story.effort;
                            tasks.push({
                                success: function() {
                                    return StoryService.save(story);
                                }
                            });
                            if (effort >= 0) {
                                tasks.push({
                                    success: function(createdStory) {
                                        createdStory.effort = effort;
                                        return StoryService.update(createdStory);
                                    }
                                })
                            }
                        }
                    });
                    tasks.push({
                        success: function() {
                            $scope.$close();
                            $scope.notifySuccess('todo.is.ui.story.effort.updated');
                            return $q.when();
                        }
                    });
                    $q.serial(tasks);
                };
                $scope.isEffortCustom = parentScope.isEffortCustom;
                $scope.effortSuite = parentScope.effortSuite;
                $scope.isEffortNullable = parentScope.isEffortNullable;
                $scope.authorizedStory = parentScope.authorizedStory;
                // Init
                $scope.loadAtWhoActors();
                $scope.stories = [];
                $scope.stories.push(angular.copy(story));
                $scope.splitCount = 2;
                var originalValue = story.value;
                var originalEffort = story.effort;
                $scope.onChangeSplitNumber();
            }]
        });
    };
    // Init
    $scope.tags = [];
}]);

controllers.controller('storyAtWhoCtrl', ['$scope', 'ActorService', function($scope, ActorService) {
    // Functions
    $scope.loadAtWhoActors = function() {
        return ActorService.list().then(function(actors) {
            _.each($scope.atOptions, function(options) {
                options.data = _.map(actors, function(actor) {
                    return {uid: actor.uid, name: actor.name};
                });
            });
        });
    };
    // Init
    var actorTag = 'A[${uid}-${name}]';
    var atWhoLimit = 100;
    $scope.atOptions = [
        {
            insertTpl: '${atwho-at}' + actorTag,
            at: $scope.message('is.story.template.as') + ' ',
            limit: atWhoLimit
        },
        {
            insertTpl: actorTag,
            at: '@',
            limit: atWhoLimit
        }
    ];
}]);

extensibleController('storyDetailsCtrl', ['$scope', '$controller', '$state', '$timeout', '$filter', 'TaskConstants', 'StoryStatesByName', "StoryTypesByName", "TaskStatesByName", 'Session', 'StoryService', 'FormService', 'FeatureService', 'ProjectService', 'UserService', 'detailsStory',
    function($scope, $controller, $state, $timeout, $filter, TaskConstants, StoryStatesByName, StoryTypesByName, TaskStatesByName, Session, StoryService, FormService, FeatureService, ProjectService, UserService, detailsStory) {
        $controller('storyCtrl', {$scope: $scope});
        $controller('storyAtWhoCtrl', {$scope: $scope});
        $controller('attachmentCtrl', {$scope: $scope, attachmentable: detailsStory, clazz: 'story'});
        // Functions
        $scope.searchCreator = function(val) {
            if ($scope.formHolder.editing) { // Could do better, e.g. check if permission to update creator or even better load only if dropdown opens (same as task responsible)
                UserService.search(val).then(function(users) {
                    $scope.creators = _.map(users, function(member) {
                        member.name = $filter('userFullName')(member);
                        return member;
                    });
                });
            }
        };
        $scope.update = function(story) {
            $scope.formHolder.submitting = true;
            StoryService.update(story).then(function() {
                $scope.resetStoryForm();
                $scope.notifySuccess('todo.is.ui.story.updated');
            });
        };
        $scope.clickDescriptionPreview = function($event, template) {
            if ($event.target.nodeName != 'A' && $scope.formEditable()) {
                $scope.loadAtWhoActors();
                $scope.showDescriptionTextarea = true;
                var $el = angular.element($event.currentTarget);
                $el.prev().css('height', $el.outerHeight());
                $scope.editForm(true);
                if (!$scope.editableStory.description && $scope.editableStory.type == StoryTypesByName.USER_STORY) {
                    ($scope.editableStory.description = template);
                }
            }
        };
        $scope.focusDescriptionPreview = function($event) {
            if (!$scope.descriptionPreviewMouseDown) {
                $timeout(function() {
                    angular.element($event.target).triggerHandler('click');
                });
            }
        };
        $scope.blurDescription = function(template) {
            if (!$('.atwho-view:visible').length && $scope.formHolder.storyForm.description.$valid) { // ugly hack on atwho
                $scope.showDescriptionTextarea = false;
                if ($scope.editableStory.description == null || $scope.editableStory.description.trim() == template.trim()) {
                    $scope.editableStory.description = '';
                }
            }
        };
        $scope.groupSprintByParentRelease = function(sprint) {
            return sprint.parentRelease.name;
        };
        $scope.retrieveDependenceEntries = function(story) {
            if (_.isEmpty($scope.dependenceEntries)) {
                StoryService.getDependenceEntries(story).then(function(dependenceEntries) {
                    $scope.dependenceEntries = dependenceEntries;
                });
            }
        };
        $scope.retrieveVersions = function() {
            if (_.isEmpty($scope.versions)) {
                ProjectService.getVersions().then(function(versions) {
                    $scope.versions = versions;
                });
            }
        };
        $scope.tabUrl = function(storyTabId) {
            var stateName = $state.params.storyTabId ? (storyTabId ? '.' : '^') : (storyTabId ? '.tab' : '.');
            return $state.href(stateName, {storyTabId: storyTabId});
        };
        $scope.currentStateUrl = function(id) {
            return $state.href($state.current.name, {storyId: id});
        };
        $scope.closeUrl = function() {
            var stateName = $state.params.storyTabId ? '^.^' : '^';
            if ($state.current.name.indexOf('.story.') != '-1') {
                stateName += '.^'
            }
            return $state.href(stateName);
        };
        // Init
        $controller('updateFormController', {$scope: $scope, item: detailsStory, type: 'story'});
        $scope.dependenceEntries = [];
        $scope.parentSprintEntries = [];
        $scope.versions = [];
        $scope.creators = [];
        $scope.features = Session.getProject().features;
        FeatureService.list();
        $scope.project = Session.getProject();
        // For header
        //$scope.previousStory = FormService.previous(list, $scope.story);
        //$scope.nextStory = FormService.next(list, $scope.story);
        $scope.tasksOrderBy = TaskConstants.ORDER_BY;
        $scope.storyStatesByName = StoryStatesByName;
        $scope.taskStatesByName = TaskStatesByName;
    }]);

extensibleController('storyMultipleCtrl', ['$scope', '$controller', 'StoryService', 'storyListId', 'Session', 'FeatureService', function($scope, $controller, StoryService, storyListId, Session, FeatureService) {
    $controller('storyCtrl', {$scope: $scope}); // inherit from storyCtrl
    // Functions
    $scope.deleteMultiple = function() {
        StoryService.deleteMultiple(storyListId).then(function() {
            $scope.notifySuccess('todo.is.ui.multiple.deleted');
        });
    };
    $scope.copyMultiple = function() {
        StoryService.copyMultiple(storyListId).then(function() {
            $scope.notifySuccess('todo.is.ui.story.multiple.copied');
        });
    };
    $scope.updateMultiple = function(updatedFields) {
        StoryService.updateMultiple(storyListId, updatedFields).then(function() {
            $scope.notifySuccess('todo.is.ui.story.multiple.updated');
        });
    };
    $scope.acceptToBacklogMultiple = function() {
        StoryService.acceptToBacklogMultiple(storyListId).then(function() {
            $scope.notifySuccess('todo.is.ui.story.multiple.accepted');
        });
    };
    $scope.returnToSandboxMultiple = function() {
        StoryService.returnToSandboxMultiple(storyListId).then(function() {
            $scope.notifySuccess('todo.is.ui.story.multiple.updated');
        });
    };
    $scope.followMultiple = function(follow) {
        StoryService.followMultiple(storyListId, follow).then(function() {
            refreshStories();
        });
    };
    $scope.acceptAsMultiple = function(target) {
        StoryService.acceptAsMultiple(storyListId, target).then(function() {
            $scope.notifySuccess('todo.is.ui.story.multiple.acceptedAs' + target);
        });
    };
    $scope.authorizedStories = function(action, stories) {
        return StoryService.authorizedStories(action, stories);
    };
    // Init
    $scope.selectableOptions.selectingMultiple = true;
    $scope.topStory = {};
    $scope.storyPreview = {};
    $scope.stories = [];
    $scope.storyListId = storyListId; // For child controllers
    $scope.features = Session.getProject().features;
    FeatureService.list();
    $scope.allFollowed = function(stories) {
        return _.every(stories, 'followed');
    };
    $scope.noneFollowed = function(stories) {
        return !_.some(stories, 'followed');
    };
    function refreshStories() {
        StoryService.getMultiple(storyListId).then(function(stories) {
            $scope.topStory = _.head(stories);
            $scope.storyPreview = {
                value: _.every(stories, {value: $scope.topStory.value}) ? $scope.topStory.value : null,
                effort: _.every(stories, {value: $scope.topStory.effort}) ? $scope.topStory.effort : null,
                feature: _.every(stories, {feature: $scope.topStory.feature}) ? $scope.topStory.feature : null,
                type: _.every(stories, {type: $scope.topStory.type}) ? $scope.topStory.type : null,
                tags: _.intersection.apply(null, _.map(stories, 'tags'))
            };
            $scope.stories = stories;
        });
    }

    refreshStories();
}]);

extensibleController('storyNewCtrl', ['$scope', '$state', '$timeout', '$controller', 'Session', 'StoryService', 'FeatureService', 'hotkeys', 'StoryStatesByName', function($scope, $state, $timeout, $controller, Session, StoryService, FeatureService, hotkeys, StoryStatesByName) {
    $controller('storyCtrl', {$scope: $scope}); // inherit from storyCtrl
    // Functions
    $scope.resetStoryForm = function() {
        $scope.story = {
            state: $scope.story ? $scope.story.state : StoryStatesByName.SUGGESTED,
            feature: $scope.story && $scope.story.feature ? $scope.story.feature : undefined
        };
        $scope.resetFormValidation($scope.formHolder.storyForm);
    };
    $scope.save = function(story, andContinue) {
        StoryService.save(story).then(function(story) {
            if (andContinue) {
                $scope.resetStoryForm();
            } else {
                $scope.setInEditingMode(true);
                $state.go('^.details', {storyId: story.id});
            }
            $scope.notifySuccess('todo.is.ui.story.saved');
        });
    };
    $scope.findDuplicates = function(term) {
        if (term == null || term.length <= 5) {
            $scope.messageDuplicate = '';
        } else if (term.length >= 5) {
            var trimmedTerm = term.trim();
            //TODO maybe local search ?
            $timeout.cancel($scope.timerDuplicate);
            $scope.timerDuplicate = $timeout(function() {
                if ($scope.lastSearchedTerm != trimmedTerm) {
                    StoryService.findDuplicates(trimmedTerm).then(function(messageDuplicate) {
                        $scope.lastSearchedTerm = trimmedTerm;
                        $scope.messageDuplicate = messageDuplicate ? messageDuplicate : '';
                    });
                }
            }, 500);
        }
    };
    $scope.featureChanged = function() {
        $scope.storyPreview.feature = $scope.story.feature;
    };
    // Init
    $scope.formHolder = {};
    $scope.storyPreview = {};
    $scope.resetStoryForm();
    $scope.newStoryStates = [StoryStatesByName.SUGGESTED, StoryStatesByName.ACCEPTED];
    $scope.features = Session.getProject().features;
    FeatureService.list();
    hotkeys.bindTo($scope).add({
        combo: 'esc',
        allowIn: ['INPUT'],
        callback: $scope.resetStoryForm
    });
}]);

controllers.controller('storyBacklogCtrl', ['$controller', '$scope', '$filter', function($controller, $scope, $filter) {
    $controller('storyCtrl', {$scope: $scope}); // inherit from storyCtrl
    // Don't use orderBy filter on ng-repeat because it triggers sort on every single digest on the page, which happens all the time...
    // We are only interested in story updates
    var updateOrder = function() {
        $scope.backlogStories = $scope.orderBy ? $filter('orderBy')($scope.backlog.stories, $scope.orderBy.current.value, $scope.orderBy.reverse) : $scope.backlog.stories;
    };
    $scope.$watch('backlog.stories', updateOrder, true);
    $scope.$watch('orderBy', updateOrder, true);
}]);
