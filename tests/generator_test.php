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
 * PHPUnit data generator tests.
 *
 * @package    mod_hypervideo
 * @category   test
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * PHPUnit data generator testcase.
 *
 * @package    mod_hypervideo
 * @category   test
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class generator_test extends advanced_testcase {
    /**
     * Test the module generator.
     *
     * @return void
     */
    public function test_generator(): void {
        global $DB, $SITE;

        $this->resetAfterTest(true);

        $this->assertEquals(0, $DB->count_records('hypervideo'));

        /** @var mod_hypervideo_generator $generator */
        $generator = $this->getDataGenerator()->get_plugin_generator('mod_hypervideo');
        $this->assertInstanceOf('mod_hypervideo_generator', $generator);
        $this->assertEquals('hypervideo', $generator->get_modulename());

        $generator->create_instance(['course' => $SITE->id]);
        $generator->create_instance(['course' => $SITE->id]);
        $hypervideo = $generator->create_instance(['course' => $SITE->id]);
        $this->assertEquals(3, $DB->count_records('hypervideo'));

        $cm = get_coursemodule_from_instance('hypervideo', $hypervideo->id);
        $this->assertEquals($hypervideo->id, $cm->instance);
        $this->assertEquals('hypervideo', $cm->modname);
        $this->assertEquals($SITE->id, $cm->course);

        $context = context_module::instance($cm->id);
        $this->assertEquals($hypervideo->cmid, $context->instanceid);
    }
}
