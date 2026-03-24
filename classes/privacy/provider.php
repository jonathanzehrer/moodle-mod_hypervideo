<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Privacy subsystem implementation for mod_hypervideo.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_hypervideo\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;

defined('MOODLE_INTERNAL') || die();

/**
 * Privacy provider for mod_hypervideo.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider,
    \core_privacy\local\request\core_userlist_provider {

    /**
     * Returns metadata about this plugin's data storage.
     *
     * @param collection $collection The initialised collection to add items to.
     * @return collection A listing of user data stored through this system.
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table(
            'hypervideo_log',
            [
                'userid' => 'privacy:metadata:hypervideo_log:userid',
                'course' => 'privacy:metadata:hypervideo_log:course',
                'url' => 'privacy:metadata:hypervideo_log:url',
                'context' => 'privacy:metadata:hypervideo_log:context',
                'position' => 'privacy:metadata:hypervideo_log:position',
                'actions' => 'privacy:metadata:hypervideo_log:actions',
                'val' => 'privacy:metadata:hypervideo_log:val',
                'duration' => 'privacy:metadata:hypervideo_log:duration',
                'timemodified' => 'privacy:metadata:hypervideo_log:timemodified',
            ],
            'privacy:metadata:hypervideo_log'
        );
        return $collection;
    }

    /**
     * Get the list of contexts that contain user information for the specified user.
     *
     * @param int $userid The user to search.
     * @return contextlist The contextlist containing the list of contexts used in this plugin.
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();

        $sql = "SELECT ctx.id
                  FROM {context} ctx
                  JOIN {course_modules} cm ON cm.id = ctx.instanceid AND ctx.contextlevel = :contextlevel
                  JOIN {modules} m ON m.id = cm.module AND m.name = :modulename
                  JOIN {hypervideo} h ON h.id = cm.instance
                  JOIN {hypervideo_log} hl ON hl.hypervideo = h.id
                 WHERE hl.userid = :userid";

        $params = [
            'contextlevel' => CONTEXT_MODULE,
            'modulename' => 'hypervideo',
            'userid' => $userid,
        ];

        $contextlist->add_from_sql($sql, $params);

        return $contextlist;
    }

    /**
     * Get the list of users who have data within a context.
     *
     * @param userlist $userlist The userlist containing the list of users.
     */
    public static function get_users_in_context(userlist $userlist): void {
        $context = $userlist->get_context();

        if (!$context instanceof \context_module) {
            return;
        }

        $sql = "SELECT hl.userid
                  FROM {hypervideo_log} hl
                  JOIN {hypervideo} h ON h.id = hl.hypervideo
                  JOIN {course_modules} cm ON cm.instance = h.id
                  JOIN {modules} m ON m.id = cm.module AND m.name = :modulename
                 WHERE cm.id = :cmid";

        $params = [
            'modulename' => 'hypervideo',
            'cmid' => $context->instanceid,
        ];

        $userlist->add_from_sql('userid', $sql, $params);
    }

    /**
     * Export all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist The approved contexts to export information for.
     */
    public static function export_user_data(approved_contextlist $contextlist): void {
        global $DB;

        if (empty($contextlist->count())) {
            return;
        }

        $user = $contextlist->get_user();

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel != CONTEXT_MODULE) {
                continue;
            }

            $cm = get_coursemodule_from_id('hypervideo', $context->instanceid);
            if (!$cm) {
                continue;
            }

            $logs = $DB->get_records('hypervideo_log', [
                'hypervideo' => $cm->instance,
                'userid' => $user->id,
            ]);

            if (!empty($logs)) {
                $data = (object) [
                    'logs' => array_values(array_map(function($log) {
                        return (object) [
                            'url' => $log->url,
                            'context' => $log->context,
                            'position' => $log->position,
                            'actions' => $log->actions,
                            'val' => $log->val,
                            'duration' => $log->duration,
                            'timemodified' => \core_privacy\local\request\transform::datetime($log->timemodified),
                        ];
                    }, $logs)),
                ];

                writer::with_context($context)->export_data(
                    [get_string('pluginname', 'mod_hypervideo')],
                    $data
                );
            }
        }
    }

    /**
     * Delete all data for all users in the specified context.
     *
     * @param \context $context The specific context to delete data for.
     */
    public static function delete_data_for_all_users_in_context(\context $context): void {
        global $DB;

        if ($context->contextlevel != CONTEXT_MODULE) {
            return;
        }

        $cm = get_coursemodule_from_id('hypervideo', $context->instanceid);
        if (!$cm) {
            return;
        }

        $DB->delete_records('hypervideo_log', ['hypervideo' => $cm->instance]);
    }

    /**
     * Delete all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist The approved contexts and user information to delete information for.
     */
    public static function delete_data_for_user(approved_contextlist $contextlist): void {
        global $DB;

        if (empty($contextlist->count())) {
            return;
        }

        $user = $contextlist->get_user();

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel != CONTEXT_MODULE) {
                continue;
            }

            $cm = get_coursemodule_from_id('hypervideo', $context->instanceid);
            if (!$cm) {
                continue;
            }

            $DB->delete_records('hypervideo_log', [
                'hypervideo' => $cm->instance,
                'userid' => $user->id,
            ]);
        }
    }

    /**
     * Delete multiple users within a single context.
     *
     * @param approved_userlist $userlist The approved context and user information to delete information for.
     */
    public static function delete_data_for_users(approved_userlist $userlist): void {
        global $DB;

        $context = $userlist->get_context();

        if ($context->contextlevel != CONTEXT_MODULE) {
            return;
        }

        $cm = get_coursemodule_from_id('hypervideo', $context->instanceid);
        if (!$cm) {
            return;
        }

        $userids = $userlist->get_userids();
        if (empty($userids)) {
            return;
        }

        [$insql, $inparams] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED);
        $inparams['hypervideoid'] = $cm->instance;

        $DB->delete_records_select(
            'hypervideo_log',
            "hypervideo = :hypervideoid AND userid $insql",
            $inparams
        );
    }
}
