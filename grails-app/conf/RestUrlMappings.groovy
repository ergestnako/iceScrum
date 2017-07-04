/*
 * Copyright (c) 2012 Kagilum.
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
 *
 */

class RestUrlMappings {

    static mappings = {

        "/ws/version" {
            action = [GET: 'version']
            controller = 'scrumOS'
        }

        // User
        "/ws/user" {
            controller = 'user'
            action = [GET: 'index', POST: 'save']
        }
        "/ws/user/$id" {
            controller = 'user'
            action = [GET: 'show', PUT: 'update', POST: 'update', DELETE: 'delete']
            constraints {
                id(matches: /\d*/)
            }
        }

        // Team
        "/ws/team" {
            controller = 'team'
            action = [GET: 'index']
        }
        "/ws/team/$id" {
            controller = 'team'
            action = [GET: 'show']
            constraints {
                id(matches: /d*/)
            }
        }
        //team of a project
        "/ws/team/project/$id" {
            controller = 'team'
            action = [GET: 'show']
            constraints {
                id(matches: /[0-9A-Z]*/)
            }
        }

        // Project
        "/ws/project" {
            controller = 'project'
            action = [GET: 'index', POST: 'save']
        }
        "/ws/project/$project" {
            controller = 'project'
            action = [GET: 'show', PUT: 'update', POST: 'update', DELETE: 'delete']
            constraints {
                project(matches: /[0-9A-Z]*/)
            }
        }
        "/ws/project/$project/$action" {
            controller = 'project'
            constraints {
                project(matches: /[0-9A-Z]*/)
                action(inList: ['export'])
            }
            method = 'GET'
        }

        // Resources
        "/ws/project/$project/$controller" {
            action = [GET: 'index', POST: 'save']
            constraints {
                project(matches: /[0-9A-Z]*/)
                controller(inList: ['story', 'acceptanceTest', 'feature', 'actor', 'task', 'release', 'sprint'])
            }
        }
        "/ws/project/$project/$controller/$id" {
            action = [GET: 'show', PUT: 'update', POST: 'update', DELETE: 'delete']
            constraints {
                project(matches: /[0-9A-Z]*/)
                controller(inList: ['story', 'acceptanceTest', 'feature', 'actor', 'task', 'release', 'sprint'])
                id(matches: /\d*/)
            }
        }

        // story nested actions
        "/ws/project/$project/story/$id/$action" {
            controller = 'story'
            constraints {
                project(matches: /[0-9A-Z]*/)
                id(matches: /\d*/)
                action(inList: ['accept', 'returnToSandbox', 'turnIntoFeature', 'turnIntoTask', 'copy', 'plan', 'unPlan', 'shiftToNextSprint', 'done', 'unDone'])
            }
            method = 'POST'
        }
        // story nested actions
        "/ws/project/$project/story/$id/$action" {
            controller = 'story'
            constraints {
                project(matches: /[0-9A-Z]*/)
                id(matches: /\d*/)
                action(inList: ['activities'])
            }
            method = 'GET'
        }
        // story filter by backlog / actor / sprint / feature
        "/ws/project/$project/story/$type/$typeId" {
            controller = 'story'
            action = 'index'
            constraints {
                project(matches: /[0-9A-Z]*/)
                type(inList: ['backlog','actor','sprint', 'feature'])
                typeId(matches: /\d*/)
            }
            method = 'GET'
        }

        // feature nested actions
        "/ws/project/$project/feature/$id/$action" {
            controller = 'feature'
            constraints {
                project(matches: /[0-9A-Z]*/)
                id(matches: /\d*/)
                action(inList: ['copyToBacklog'])
            }
            method = 'POST'
        }
        // feature nested actions
        "/ws/project/$project/feature/$id/$action" {
            controller = 'feature'
            constraints {
                project(matches: /[0-9A-Z]*/)
                id(matches: /\d*/)
                action(inList: ['activities'])
            }
            method = 'GET'
        }

        // release nested actions
        "/ws/project/$project/release/$id/$action" {
            controller = 'release'
            constraints {
                project(matches: /[0-9A-Z]*/)
                id(matches: /\d*/)
                action(inList: ['activate', 'close','unPlan'])
            }
            method = 'POST'
        }
        //plan a release with a capacity
        "/ws/project/$project/release/$id/autoPlan/$capacity" {
            controller = 'release'
            action = 'autoPlan'
            constraints {
                project(matches: /[0-9A-Z]*/)
                capacity(matches: /\d*/)
            }
            method = 'POST'
        }

        // sprint nested actions
        "/ws/project/$project/sprint/$id/$action" {
            controller = 'sprint'
            constraints {
                project(matches: /[0-9A-Z]*/)
                id(matches: /\d*/)
                action(inList: ['activate', 'close', 'unPlan', 'copyRecurrentTasks'])
            }
            method = 'POST'
        }
        //plan a sprint with a capacity
        "/ws/project/$project/sprint/$id/autoPlan/$capacity" {
            controller = 'sprint'
            action = 'autoPlan'
            constraints {
                project(matches: /[0-9A-Z]*/)
                capacity(matches: /\d*/)
            }
            method = 'POST'
        }

        //generate sprint for a release
        "/ws/project/$project/sprint/generateSprints/$releaseId" {
            controller = 'sprint'
            action = 'generateSprints'
            constraints {
                project(matches: /[0-9A-Z]*/)
                releaseId(matches: /\d*/)
            }
            method = 'POST'
        }
        // sprint filter by release
        "/ws/project/$project/sprint/release/$releaseId" {
            controller = 'sprint'
            action = 'index'
            constraints {
                project(matches: /[0-9A-Z]*/)
                releaseId(matches: /\d*/)
            }
            method = 'GET'
        }

        // tasks nested actions
        "/ws/project/$project/task/$id/$action" {
            controller = 'task'
            constraints {
                project(matches: /[0-9A-Z]*/)
                id(matches: /\d*/)
                action(inList: ['makeStory', 'take', 'unassign', 'copy'])
            }
            method = 'POST'
        }
        // task filter by sprint / story
        "/ws/project/$project/task/$type/$id" {
            controller = 'task'
            action = 'index'
            constraints {
                project(matches: /[0-9A-Z]*/)
                type(inList: ['sprint', 'story'])
                id(matches: /\d*/)
            }
            method = 'GET'
        }

        // filter acceptanceTests by story
        "/ws/project/$project/acceptanceTest/story/$parentStory" {
            controller = 'acceptanceTest'
            action = 'index'
            constraints {
                project(matches: /[0-9A-Z]*/)
                parentStory(matches: /\d*/)
            }
            method = 'GET'
        }
    }
}
