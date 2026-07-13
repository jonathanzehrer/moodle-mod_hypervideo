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
 * Module instance settings form.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/course/moodleform_mod.php');

/**
 * Module instance settings form.
 *
 * @package    mod_hypervideo
 * @copyright  2024 Niels Seidel <niels.seidel@fernuni-hagen.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mod_hypervideo_mod_form extends moodleform_mod {
    /**
     * Defines forms elements.
     */
    public function definition() {
        global $CFG;
        $mform = $this->_form;

        // Adding the "general" fieldset.
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field.
        $mform->addElement('text', 'name', get_string('name'), ['size' => '64']);
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Adding the standard "intro" and "introformat" fields.
        $this->standard_intro_elements();

        // Adding a text field "url" for the video URL.
        $mform->addElement('text', 'url', get_string('videourl', 'hypervideo'), ['size' => '64']);
        $mform->setType('url', PARAM_URL);
        $mform->addRule('url', null, 'required', null, 'client');
        $mform->addHelpButton('url', 'videourl', 'hypervideo');

        // Chapters textarea: one chapter per line, format "mm:ss Title" or "h:mm:ss Title".
        $mform->addElement('textarea', 'chapters', get_string('chapters', 'hypervideo'),
            ['rows' => 8, 'cols' => 64]);
        $mform->setType('chapters', PARAM_TEXT);
        $mform->addHelpButton('chapters', 'chapters', 'hypervideo');

        // Player style dropdown.
        $playerstyles = [
            'AppVariant1.vue' => get_string('playerstyle_plain', 'hypervideo'),
            'AppVariant2.vue' => get_string('playerstyle_chapters', 'hypervideo'),
            'AppVariant3.vue' => get_string('playerstyle_playlist', 'hypervideo'),
            'random' => get_string('playerstyle_random', 'hypervideo'),
        ];
        $mform->addElement('select', 'playerstyle', get_string('playerstyle', 'hypervideo'), $playerstyles);
        $mform->setDefault('playerstyle', 'AppVariant1.vue');
        $mform->setType('playerstyle', PARAM_TEXT);

        // Add standard elements, common to all modules.
        $this->standard_coursemodule_elements();

        // Add standard action buttons.
        $this->add_action_buttons();
    }

    /**
     * Form validation.
     *
     * @param array $data Form data
     * @param array $files Uploaded files
     * @return array Validation errors
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);
        return $errors;
    }
}
