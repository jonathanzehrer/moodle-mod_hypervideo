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
 * List of all hypervideo instances in course.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require('../../config.php');

$id = required_param('id', PARAM_INT); // Course id.

$course = $DB->get_record('course', ['id' => $id], '*', MUST_EXIST);

require_course_login($course, true);

// Trigger instances list viewed event.
$event = \mod_hypervideo\event\course_module_instance_list_viewed::create([
    'context' => context_course::instance($course->id),
]);
$event->add_record_snapshot('course', $course);
$event->trigger();

$strhypervideo    = get_string('modulename', 'hypervideo');
$strhypervideos   = get_string('modulenameplural', 'hypervideo');
$strname          = get_string('name');
$strintro         = get_string('moduleintro');
$strlastmodified  = get_string('lastmodified');

$PAGE->set_url('/mod/hypervideo/index.php', ['id' => $course->id]);
$PAGE->set_title($course->shortname . ': ' . $strhypervideos);
$PAGE->set_heading($course->fullname);
$PAGE->navbar->add($strhypervideos);
echo $OUTPUT->header();
echo $OUTPUT->heading($strhypervideos);

if (!$hypervideos = get_all_instances_in_course('hypervideo', $course)) {
    notice(get_string('thereareno', 'moodle', $strhypervideos), "$CFG->wwwroot/course/view.php?id=$course->id");
    exit;
}

$usesections = course_format_uses_sections($course->format);

$table = new html_table();
$table->attributes['class'] = 'generaltable mod_index';

if ($usesections) {
    $strsectionname = get_string('sectionname', 'format_' . $course->format);
    $table->head  = [$strsectionname, $strname, $strintro];
    $table->align = ['center', 'left', 'left'];
} else {
    $table->head  = [$strlastmodified, $strname, $strintro];
    $table->align = ['left', 'left', 'left'];
}

$modinfo = get_fast_modinfo($course);
$currentsection = '';
foreach ($hypervideos as $hypervideo) {
    $cm = $modinfo->cms[$hypervideo->coursemodule];
    if ($usesections) {
        $printsection = '';
        if ($hypervideo->section !== $currentsection) {
            if ($hypervideo->section) {
                $printsection = get_section_name($course, $hypervideo->section);
            }
            if ($currentsection !== '') {
                $table->data[] = 'hr';
            }
            $currentsection = $hypervideo->section;
        }
    } else {
        $printsection = '<span class="smallinfo">' . userdate($hypervideo->timemodified) . '</span>';
    }

    $class = $hypervideo->visible ? '' : 'class="dimmed"';

    $table->data[] = [
        $printsection,
        "<a $class href=\"view.php?id=$cm->id\">" . format_string($hypervideo->name) . '</a>',
        format_module_intro('hypervideo', $hypervideo, $cm->id),
    ];
}

echo html_writer::table($table);

echo $OUTPUT->footer();
