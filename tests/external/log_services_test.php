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
 * Unit tests for log_services external API.
 *
 * @package    mod_hypervideo
 * @category   test
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_hypervideo\external;

use mod_hypervideo\external\log_services;

defined('MOODLE_INTERNAL') || die();

global $CFG;

require_once($CFG->dirroot . '/webservice/tests/helpers.php');

/**
 * Unit tests for log_services external API.
 *
 * @package    mod_hypervideo
 * @category   test
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers \mod_hypervideo\external\log_services
 * @runTestsInSeparateProcesses
 */
final class log_services_test extends \externallib_advanced_testcase {
    /** @var \stdClass Course */
    private $course;

    /** @var \stdClass Hypervideo instance */
    private $hypervideo;

    /** @var \stdClass Student user */
    private $student;

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
            'name' => 'Test Video',
            'url' => 'https://example.com/test.mp4',
        ]);

        $this->student = $this->getDataGenerator()->create_user();

        $studentrole = $DB->get_record('role', ['shortname' => 'student']);
        $this->getDataGenerator()->enrol_user($this->student->id, $this->course->id, $studentrole->id);
    }

    /**
     * Test logging a video event.
     *
     * @covers \mod_hypervideo\external\log_services::log
     */
    public function test_log(): void {
        global $DB;

        $this->setUser($this->student);

        $entry = json_encode([
            'location' => ['url' => 'https://example.com/test.mp4'],
            'value' => [
                'context' => 'player',
                'action' => 'play',
                'values' => '',
                'currenttime' => 10.5,
                'duration' => 120.0,
            ],
        ]);

        $result = log_services::log([
            'courseid' => $this->course->id,
            'hypervideoid' => $this->hypervideo->id,
            'action' => 'play',
            'utc' => time(),
            'entry' => $entry,
        ]);

        $this->assertTrue($result['success']);

        // Verify the log was written.
        $logs = $DB->get_records('hypervideo_log', [
            'hypervideo' => $this->hypervideo->id,
            'userid' => $this->student->id,
        ]);
        $this->assertCount(1, $logs);

        $log = reset($logs);
        $this->assertEquals('play', $log->actions);
        $this->assertEquals('player', $log->context);
    }

    /**
     * Test logging a playback event.
     *
     * @covers \mod_hypervideo\external\log_services::log
     */
    public function test_log_playback(): void {
        global $DB;

        $this->setUser($this->student);

        $entry = json_encode([
            'location' => ['url' => 'https://example.com/test.mp4'],
            'value' => [
                'context' => 'player',
                'action' => 'playback',
                'values' => 5,
                'currenttime' => 30.0,
                'duration' => 120.0,
            ],
        ]);

        $result = log_services::log([
            'courseid' => $this->course->id,
            'hypervideoid' => $this->hypervideo->id,
            'action' => 'playback',
            'utc' => time(),
            'entry' => $entry,
        ]);

        $this->assertTrue($result['success']);

        $log = $DB->get_record('hypervideo_log', [
            'hypervideo' => $this->hypervideo->id,
            'actions' => 'playback',
        ]);
        $this->assertNotEmpty($log);
        $this->assertEquals('5', $log->val);
    }
}
