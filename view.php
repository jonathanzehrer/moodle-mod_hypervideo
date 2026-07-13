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
 * Display a hypervideo instance.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require('../../config.php');
require_once('lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course Module ID.
$g  = optional_param('g', 0, PARAM_INT);  // Hypervideo ID.

if (!empty($id)) {
    $cm = get_coursemodule_from_id('hypervideo', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);
    $hypervideo = $DB->get_record('hypervideo', ['id' => $cm->instance], '*', MUST_EXIST);
} else if (!empty($g)) {
    $hypervideo = $DB->get_record('hypervideo', ['id' => $g], '*', MUST_EXIST);
    $course = $DB->get_record('course', ['id' => $hypervideo->course], '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('hypervideo', $hypervideo->id, $course->id, false, MUST_EXIST);
    $id = $cm->id;
} else {
    throw new \moodle_exception('invalidid', 'hypervideo');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/hypervideo:view', $context);

// Trigger view event and completion.
hypervideo_view($hypervideo, $course, $cm, $context);

$PAGE->set_url('/mod/hypervideo/view.php', ['id' => $cm->id]);
$PAGE->set_title($course->shortname . ': ' . format_string($hypervideo->name));
$PAGE->set_heading(format_string($hypervideo->name));
$PAGE->set_context($context);
$PAGE->set_pagelayout('base');

// Pre-load language strings for the Vue frontend.
$stringman = get_string_manager();
$lang = current_language();
$allstrings = $stringman->load_component_strings('mod_hypervideo', $lang);
$i18nstrings = [];
foreach ($allstrings as $key => $value) {
    $i18nstrings[str_replace(':', '_', $key)] = $value;
}
// Parse chapters from the instance field (one per line: "mm:ss Title" or "h:mm:ss Title").
$chapters = [];
if (!empty($hypervideo->chapters)) {
    $lines = preg_split('/\r\n|\r|\n/', trim($hypervideo->chapters));
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '') {
            continue;
        }
        // Match "h:mm:ss Title", "mm:ss Title", or "ss Title".
        if (preg_match('/^(\d{1,2}(?::\d{2}){1,2})\s+(.+)$/', $line, $m)) {
            $parts = array_map('intval', explode(':', $m[1]));
            if (count($parts) === 3) {
                $seconds = $parts[0] * 3600 + $parts[1] * 60 + $parts[2];
            } else {
                $seconds = $parts[0] * 60 + $parts[1];
            }
            $chapters[] = ['time' => $seconds, 'title' => clean_param($m[2], PARAM_TEXT)];
        }
    }
    // Sort chapters by time in case they were defined out of order.
    usort($chapters, function($a, $b) {
        return $a['time'] - $b['time'];
    });
}

$initialdata = [
    'i18nStrings' => $i18nstrings,
    'lang' => $lang,
    'chapters' => $chapters,
];

echo $OUTPUT->header();
echo '<div id="app"></div>';

$PAGE->requires->js_call_amd('mod_hypervideo/app-lazy', 'init', [
    $cm->id,
    $context->id,
    $course->id,
    $hypervideo->id,
    'mod_hypervideo',
    $hypervideo->url,
    format_string($hypervideo->name),
    $initialdata,
    $USER->id,
    $hypervideo->playerstyle ?? 'AppVariant1.vue',
]);

echo $OUTPUT->footer();


