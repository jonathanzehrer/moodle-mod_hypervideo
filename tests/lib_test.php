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
 * Unit tests for mod_hypervideo lib.
 *
 * @package    mod_hypervideo
 * @category   test
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Unit tests for mod_hypervideo lib.
 *
 * @package    mod_hypervideo
 * @category   test
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class lib_test extends advanced_testcase {
    /**
     * Prepares things before this test case is initialised.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        global $CFG;
        require_once($CFG->dirroot . '/mod/hypervideo/lib.php');
        parent::setUpBeforeClass();
    }

    /**
     * Test hypervideo_view triggers event and completion.
     *
     * @return void
     */
    public function test_hypervideo_view(): void {
        global $CFG;

        $CFG->enablecompletion = 1;
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course(['enablecompletion' => 1]);
        $hypervideo = $this->getDataGenerator()->create_module(
            'hypervideo',
            ['course' => $course->id],
            ['completion' => 2, 'completionview' => 1]
        );
        $context = context_module::instance($hypervideo->cmid);
        $cm = get_coursemodule_from_instance('hypervideo', $hypervideo->id);

        // Trigger and capture the event.
        $sink = $this->redirectEvents();

        $this->setAdminUser();
        hypervideo_view($hypervideo, $course, $cm, $context);

        $events = $sink->get_events();
        // 2 additional events thanks to completion.
        $this->assertCount(3, $events);
        $event = array_shift($events);

        // Checking that the event contains the expected values.
        $this->assertInstanceOf('\mod_hypervideo\event\course_module_viewed', $event);
        $this->assertEquals($context, $event->get_context());
        $moodleurl = new \moodle_url('/mod/hypervideo/view.php', ['id' => $cm->id]);
        $this->assertEquals($moodleurl, $event->get_url());
        $this->assertEventContextNotUsed($event);
        $this->assertNotEmpty($event->get_name());

        // Check completion status.
        $completion = new completion_info($course);
        $completiondata = $completion->get_data($cm);
        $this->assertEquals(1, $completiondata->completionstate);
    }

    /**
     * Test hypervideo supports.
     *
     * @return void
     */
    public function test_hypervideo_supports(): void {
        $this->assertTrue(hypervideo_supports(FEATURE_MOD_INTRO));
        $this->assertTrue(hypervideo_supports(FEATURE_BACKUP_MOODLE2));
        $this->assertTrue(hypervideo_supports(FEATURE_SHOW_DESCRIPTION));
        $this->assertTrue(hypervideo_supports(FEATURE_COMPLETION_TRACKS_VIEWS));
        $this->assertNull(hypervideo_supports(FEATURE_GROUPS));
    }

    /**
     * Test calendar event action.
     *
     * @return void
     */
    public function test_hypervideo_core_calendar_provide_event_action(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course();
        $hypervideo = $this->getDataGenerator()->create_module('hypervideo', ['course' => $course->id]);

        $event = $this->create_action_event(
            $course->id,
            $hypervideo->id,
            \core_completion\api::COMPLETION_EVENT_TYPE_DATE_COMPLETION_EXPECTED
        );

        $factory = new \core_calendar\action_factory();
        $actionevent = mod_hypervideo_core_calendar_provide_event_action($event, $factory);

        $this->assertInstanceOf('\core_calendar\local\event\value_objects\action', $actionevent);
        $this->assertEquals(get_string('view'), $actionevent->get_name());
        $this->assertInstanceOf('moodle_url', $actionevent->get_url());
        $this->assertEquals(1, $actionevent->get_item_count());
        $this->assertTrue($actionevent->is_actionable());
    }

    /**
     * Test calendar event action when already completed.
     *
     * @return void
     */
    public function test_hypervideo_core_calendar_provide_event_action_already_completed(): void {
        global $CFG;

        $this->resetAfterTest();
        $this->setAdminUser();
        $CFG->enablecompletion = 1;

        $course = $this->getDataGenerator()->create_course(['enablecompletion' => 1]);
        $hypervideo = $this->getDataGenerator()->create_module(
            'hypervideo',
            ['course' => $course->id],
            ['completion' => 2, 'completionview' => 1, 'completionexpected' => time() + DAYSECS]
        );
        $cm = get_coursemodule_from_instance('hypervideo', $hypervideo->id);

        $event = $this->create_action_event(
            $course->id,
            $hypervideo->id,
            \core_completion\api::COMPLETION_EVENT_TYPE_DATE_COMPLETION_EXPECTED
        );

        $completion = new completion_info($course);
        $completion->set_module_viewed($cm);

        $factory = new \core_calendar\action_factory();
        $actionevent = mod_hypervideo_core_calendar_provide_event_action($event, $factory);

        $this->assertNull($actionevent);
    }

    /**
     * Creates an action event.
     *
     * @param int $courseid The course id.
     * @param int $instanceid The instance id.
     * @param string $eventtype The event type.
     * @return bool|calendar_event
     */
    private function create_action_event($courseid, $instanceid, $eventtype) {
        $event = new stdClass();
        $event->name = 'Calendar event';
        $event->modulename = 'hypervideo';
        $event->courseid = $courseid;
        $event->instance = $instanceid;
        $event->type = CALENDAR_EVENT_TYPE_ACTION;
        $event->eventtype = $eventtype;
        $event->timestart = time();

        return calendar_event::create($event);
    }
}
