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
 * English language strings for mod_hypervideo.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Module naming.
$string['modulename'] = 'Hypervideo';
$string['modulenameplural'] = 'Hypervideos';
$string['modulename_help'] = 'The hypervideo activity module enables a teacher to add an interactive video with logging of user interactions.';
$string['pluginadministration'] = 'Hypervideo administration';
$string['pluginname'] = 'Hypervideo';
$string['hypervideo:view'] = 'View hypervideo';
$string['hypervideo:addinstance'] = 'Add a new hypervideo';

// Form.
$string['videourl'] = 'Video URL';
$string['videourl_help'] = 'The URL of the video to be displayed. Supported formats include MP4 and WebM.';
$string['chapters'] = 'Chapters';
$string['chapters_help'] = 'Enter one chapter per line in the format: time title. For example:\n0:00 Introduction\n2:30 Main topic\n1:05:00 Summary';

// Errors.
$string['invalidid'] = 'Invalid hypervideo ID';
$string['invalidcmid'] = 'Invalid course module ID';

// Privacy.
$string['privacy:metadata:hypervideo_log'] = 'Information about the user\'s video watching interactions.';
$string['privacy:metadata:hypervideo_log:userid'] = 'The ID of the user who interacted with the video.';
$string['privacy:metadata:hypervideo_log:course'] = 'The ID of the course.';
$string['privacy:metadata:hypervideo_log:url'] = 'The URL of the video.';
$string['privacy:metadata:hypervideo_log:context'] = 'The context of the interaction.';
$string['privacy:metadata:hypervideo_log:position'] = 'The playback position in the video.';
$string['privacy:metadata:hypervideo_log:actions'] = 'The action performed (play, pause, seek, etc.).';
$string['privacy:metadata:hypervideo_log:val'] = 'Additional value associated with the action.';
$string['privacy:metadata:hypervideo_log:duration'] = 'The duration of the video.';
$string['privacy:metadata:hypervideo_log:timemodified'] = 'The time the log entry was created.';

// Events.
$string['eventvideointeractionlogged'] = 'Video interaction logged';

// Vue frontend strings.
$string['player_error'] = 'The video could not be loaded. Please check the URL or try again later.';
$string['player_loading'] = 'Loading video...';
$string['player_videonotavailable'] = 'Video not available';

// Accessibility.
$string['aria_videoplayer'] = 'Video player';
$string['aria_videonotsupported'] = 'Your browser does not support embedded video. Please update your browser or use a different one.';

// Chapters.
$string['chapters_title'] = 'Chapters';
$string['chapters_nav'] = 'Video chapters';
$string['chapters_goto'] = 'Jump to';