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
 * Unit tests for hypervideo_services external API.
 *
 * @package    mod_hypervideo
 * @category   test
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_hypervideo\external;

use mod_hypervideo\external\hypervideo_services;

defined('MOODLE_INTERNAL') || die();

global $CFG;

require_once($CFG->dirroot . '/webservice/tests/helpers.php');

/**
 * Unit tests for hypervideo_services external API.
 *
 * @package    mod_hypervideo
 * @category   test
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers \mod_hypervideo\external\hypervideo_services
 * @runTestsInSeparateProcesses
 */
final class hypervideo_services_test extends \externallib_advanced_testcase {
    /** @var \stdClass Course */
    private $course;

    /** @var \stdClass Hypervideo instance */
    private $hypervideo;

    /** @var \stdClass Course module */
    private $cm;

    /** @var \stdClass Student user */
    private $student;

    /** @var \stdClass Teacher user */
    private $teacher;

    /**
     * Set up test data.
     */
    protected function setUp(): void {
        global $DB;
        parent::setUp();

        $this->resetAfterTest(true);

        $this->course = $this->getDataGenerator()->create_course();

        $this->hypervideo = $this->getDataGenerator()->create_module('hypervideo', [
            'course' => $this->course->id,
            'name' => 'Test Hypervideo',
            'url' => 'https://example.com/test.mp4',
        ]);

        $this->cm = get_coursemodule_from_instance('hypervideo', $this->hypervideo->id, $this->course->id);

        $this->student = $this->getDataGenerator()->create_user();
        $this->teacher = $this->getDataGenerator()->create_user();

        $studentrole = $DB->get_record('role', ['shortname' => 'student']);
        $teacherrole = $DB->get_record('role', ['shortname' => 'editingteacher']);

        $this->getDataGenerator()->enrol_user($this->student->id, $this->course->id, $studentrole->id);
        $this->getDataGenerator()->enrol_user($this->teacher->id, $this->course->id, $teacherrole->id);
    }

    /**
     * Test getting hypervideo info.
     *
     * @covers \mod_hypervideo\external\hypervideo_services::get_info
     */
    public function test_get_info(): void {
        $this->setUser($this->student);

        $result = hypervideo_services::get_info($this->cm->id);

        $this->assertIsArray($result);
        $this->assertTrue($result['success']);
        $this->assertNotEmpty($result['data']);

        $data = json_decode($result['data']);
        $this->assertEquals('Test Hypervideo', $data->name);
        $this->assertEquals('https://example.com/test.mp4', $data->url);
    }

    /**
     * Test getting info without permission.
     *
     * @covers \mod_hypervideo\external\hypervideo_services::get_info
     */
    public function test_get_info_without_permission(): void {
        $unenrolleduser = $this->getDataGenerator()->create_user();
        $this->setUser($unenrolleduser);

        $this->expectException(\require_login_exception::class);
        hypervideo_services::get_info($this->cm->id);
    }

    /**
     * Test getting video progress.
     *
     * @covers \mod_hypervideo\external\hypervideo_services::get_video_progress
     */
    public function test_get_video_progress(): void {
        $this->setUser($this->student);

        $result = hypervideo_services::get_video_progress([
            'course' => $this->course->id,
            'hypervideo' => $this->hypervideo->id,
        ]);

        $this->assertTrue($result['success']);
        $data = json_decode($result['data']);
        $this->assertEquals(0, $data->videoprogress);
    }

    /**
     * Test getting video progress with log entries.
     *
     * @covers \mod_hypervideo\external\hypervideo_services::get_video_progress
     */
    public function test_get_video_progress_with_logs(): void {
        global $DB;

        $this->setUser($this->student);

        // Insert some playback log entries.
        for ($i = 0; $i < 5; $i++) {
            $DB->insert_record('hypervideo_log', [
                'hypervideo' => $this->hypervideo->id,
                'userid' => $this->student->id,
                'course' => $this->course->id,
                'url' => 'https://example.com/test.mp4',
                'context' => 'player',
                'position' => (string)($i * 2),
                'actions' => 'playback',
                'val' => (string)$i,
                'duration' => 100,
                'timemodified' => time(),
            ]);
        }

        $result = hypervideo_services::get_video_progress([
            'course' => $this->course->id,
            'hypervideo' => $this->hypervideo->id,
        ]);

        $this->assertTrue($result['success']);
        $data = json_decode($result['data']);
        $this->assertEquals(5, $data->videoprogress);
    }

    /**
     * Test viewing a hypervideo triggers event.
     *
     * @covers \mod_hypervideo\external\hypervideo_services::view_hypervideo
     */
    public function test_view_hypervideo(): void {
        $this->setUser($this->student);

        $result = hypervideo_services::view_hypervideo($this->hypervideo->id);

        $this->assertIsArray($result);
        $this->assertTrue($result['status']);
        $this->assertEmpty($result['warnings']);
    }

    /**
     * Test viewing hypervideo triggers correct event.
     *
     * @covers \mod_hypervideo\external\hypervideo_services::view_hypervideo
     */
    public function test_view_hypervideo_triggers_event(): void {
        $this->setUser($this->student);

        $sink = $this->redirectEvents();

        hypervideo_services::view_hypervideo($this->hypervideo->id);

        $events = $sink->get_events();
        $sink->close();

        $this->assertCount(1, $events);
        $event = reset($events);

        $this->assertInstanceOf('\mod_hypervideo\event\course_module_viewed', $event);
        $this->assertEquals($this->hypervideo->id, $event->objectid);
        $this->assertEquals($this->student->id, $event->userid);
    }

    /**
     * Test viewing hypervideo without permission.
     *
     * @covers \mod_hypervideo\external\hypervideo_services::view_hypervideo
     */
    public function test_view_hypervideo_without_permission(): void {
        $unenrolleduser = $this->getDataGenerator()->create_user();
        $this->setUser($unenrolleduser);

        $this->expectException(\require_login_exception::class);
        hypervideo_services::view_hypervideo($this->hypervideo->id);
    }

    /**
     * Test viewing hypervideo with invalid ID.
     *
     * @covers \mod_hypervideo\external\hypervideo_services::view_hypervideo
     */
    public function test_view_hypervideo_invalid_id(): void {
        $this->setUser($this->student);

        $this->expectException(\dml_missing_record_exception::class);
        hypervideo_services::view_hypervideo(99999);
    }
}
