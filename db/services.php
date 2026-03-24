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
 * Hypervideo external functions and service definitions.
 *
 * @package    mod_hypervideo
 * @category   external
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

$functions = [
    'mod_hypervideo_get_info' => [
        'classname' => 'mod_hypervideo\\external\\hypervideo_services',
        'methodname' => 'get_info',
        'description' => 'Get hypervideo instance information',
        'type' => 'read',
        'capabilities' => 'mod/hypervideo:view',
        'ajax' => true,
    ],
    'mod_hypervideo_log' => [
        'classname' => 'mod_hypervideo\\external\\log_services',
        'methodname' => 'log',
        'description' => 'Log a video interaction event',
        'type' => 'write',
        'capabilities' => 'mod/hypervideo:view',
        'ajax' => true,
    ],
    'mod_hypervideo_get_video_progress' => [
        'classname' => 'mod_hypervideo\\external\\hypervideo_services',
        'methodname' => 'get_video_progress',
        'description' => 'Get video playback progress for the current user',
        'type' => 'read',
        'capabilities' => 'mod/hypervideo:view',
        'ajax' => true,
    ],
    'mod_hypervideo_view_hypervideo' => [
        'classname' => 'mod_hypervideo\\external\\hypervideo_services',
        'methodname' => 'view_hypervideo',
        'description' => 'Trigger the course module viewed event and completion',
        'type' => 'write',
        'capabilities' => 'mod/hypervideo:view',
        'ajax' => true,
    ],
];
