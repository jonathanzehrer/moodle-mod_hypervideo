<br>
<div align="center">

<img src="pix/hypervideo.png" width="500" />

</div>

<br>
<h1 align="center">Hypervideo</h1>

## _Hypervideo_ is a Moodle activity plugin for playing videos and collecting fine-grained playback and clickstream data about video usage

_Hypervideo_ (mod_hypervideo) is a ready to use Moodle activity plugin for serving videos loaded from a provided URL. user interactions with the video such as play, pause, seek, playbackspeed, and fullscreen are logged. Also the video playback is captured for every 2 seconds segment that has been played back completely. This fine-grained data collection enables detailed analytics of watching behavior and resource usage.

<!-- development-related badges -->

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/CATALPAresearch/mod_hypervideo/commit-activity)
[![github latest commit](https://badgen.net/github/last-commit/CATALPAresearch/mod_hypervideo)](https://github.com/CATALPAresearch/mod_hypervideo/commit/)
[![github contributors](https://badgen.net/github/contributors/CATALPAresearch/mod_hypervideo)](https://github.com/CATALPAresearch/mod_hypervideo/contributors/)
[![github issues](https://img.shields.io/github/issues/CATALPAresearch/mod_hypervideo.svg)](https://github.com/CATALPAresearch/mod_hypervideo/issues/)
[![GPLv3 license](https://img.shields.io/badge/License-GPLv3-green.svg)](http://perso.crans.org/besson/LICENSE.html)

![https://img.shields.io/badge/any_text-you_like-blue](https://img.shields.io/badge/Tested_Moodle_versions-3.5_to_3.11-green)
![](https://img.shields.io/badge/PHP-7.4_to_8.0.29-green)
![](https://img.shields.io/badge/NPM-~10.2.3-green)
![](https://img.shields.io/badge/node.js-~18.17.0-green)
![](https://img.shields.io/badge/vue.js-2-green)

<!-- Maturity-related badges
see: https://github.com/mkenney/software-guides/blob/master/STABILITY-BADGES.md
-->

[![stability-mature](https://img.shields.io/badge/stability-mature-008000.svg)](https://github.com/mkenney/software-guides/blob/master/STABILITY-BADGES.md#mature)
![](https://img.shields.io/badge/years_in_productive_use-3-darkgreen)
![](https://img.shields.io/badge/used_in_unique_courses-3-darkgreen)

<!-- AI-related and LA-related badges -->
<!--
https://nutrition-facts.ai/

Privacy Ladder Level
Feature is Optional
Model type
Base model
Base Model Trained with Customer Data
Customer Data is Shared with Model Vendor
Training Data Anonymized
Data Deletion
Human in the Loop
Data Retention
Compliance
-->

![](https://img.shields.io/badge/collects_clickstream_data-yes-blue)
![](https://img.shields.io/badge/collects_playback_data-yes-blue)
![](https://img.shields.io/badge/collects_scroll_data-no-blue)
![](https://img.shields.io/badge/collects_mouse_data-no-blue)
![](https://img.shields.io/badge/collects_audio_data-no-blue)
![](https://img.shields.io/badge/collects_video_data-no-blue)
![](https://img.shields.io/badge/data_shared_with_vendor-no-blue)

<br><br>

<p align="center" hidden>
  
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#download">Download</a> •
  <a href="#credits">Credits</a> •
  <a href="#related">Related</a> •
  <a href="#citation">Citation</a> •
  <a href="#license">License</a>
</p>

## Key Features

**Video player:**

- Lean HTML 5 video player
- responsive design for mobile use
- flash surveys are included
- chapter marks

**Learning Analytics included**

- collection of clickstream data
- capturing playback activities for every 2 seconds segment of the video

## Roadmap and Limitations

**Roadmap**

- add further interactive elements like user defined annotations, comments, highligts
- add video assessments

**Limitations**

- _Hypervideo_ stores a massive load of log data.

## How To Use

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
1. Clone  the repository to /your-moodle/mod/
$ git clone git@github.com:catalparesearch/mod_hypervideo.git

# Rename the folder to 'hypervideo'
$ mv mod_hypervideo hypervideo

# Go into the repository
$ cd hypervideo

# Install dependencies
$ cd vue
$ npm install

# Build the plugin by transpiling the vue code into javascript
$ npm run build

# Open the page https://<moodle>/admin/index.php?cache=1 and follow the install instructions for the plugin or
$ php admin/cli/uninstall_plugins.php --plugins=mod_hypervideo --run

# To install the *Hypervideo* plugin afterwards, copy the repository downloaded in the 1. step into the `mod` folder in the folder your Moodle installation is located in replacing the current `mod/hypervideo` folder containing the regular *Page* plugin. Now, login to your Moodle running as an administrator. The install/update GUI should open automatically. Just follow the steps the GUI presents to you and you should have installed the *Hypervideo* plugin successfully afterwards. As an alternative to using the GUI for installation, you can also run the update script from within the folder of your Moodle installation:
$ php admin/cli/upgrade.php

# Open a Moodle course of you choice and add hypervideo as an activity to your course.

```

## Download

You can [download](https://github.com/catalparesearch/mod_hypervideo/releases/tag/latest) the latest installable version of _Hypervideo_ for Moodle 3.11.

## Getting into Development

Client-side code is located in the folder vue/. The file view.php contains the root DOM element of the video player. The webservice for accessing Moodle database can be found at db/external.php.

You can start a demo of the player outside of Moodle by running
```bash
cd vue
npm run dev:hdr
```

You can run regression tests by running
```bash
cd vue
npx playwright install
npx playwright test
```
If the player visually changed and the screenshots no longer match you can re-initialize them with
```
npx playwright test --update-snapshots
```

## Emailware

_Hypervideo_ is an [emailware](https://en.wiktionary.org/wiki/emailware). Meaning, if you liked using this plugin or it has helped you in any way, I'd like you send me an email at <niels.seidel@fernuni-hagen.de> about anything you'd want to say about this software. I'd really appreciate it!

## Credits

This software uses the following open source packages:
[vue.js](https://vuejs.org/),
[vue core video player](https://github.com/core-player/vue-core-video-player),
[vuex](https://vuex.vuejs.org/),
[vue-router](https://router.vuejs.org/),
[node.js](https://nodejs.org/).

Icons: [Material Symbols](https://fonts.google.com/icons) by Google, used under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0).

## Related

tba

## Citation

> Seidel, N. (2024). Hypervideo - An activity plugin for hypervideos in Moodle. https://doi.org/10.17605/OSF.IO/YP2XU

````
@misc{Seidel2024-MoodleHypervideo,
author = {Seidel, Niels},
doi = {10.17605/OSF.IO/YP2XU},
keywords = {P-APLE-II,open data,software},
title = {{Hypervideo - An activity plugin for hypervideos in Moodle}},
url = {https://github.com/CATALPAresearch/mod{\_}hypervideo},
year = {2024}
}
```

## You may also like ...

* [mod_hypercast](https://github.com/nise/mod_hypercast) - Hyperaudio player for course texts supporting audio cues, text2speech conversion, text comments, and collaborative listining experiences
* [mod_hypervideo](https//github.com/catalparesearch/mod_hypervideo) - Usenet client for Moodle
* [mod_usenet](https//github.com/catalparesearch/mod_usenet) - Usenet client for Moodle


## License

[GNU GPL v3 or later](http://www.gnu.org/copyleft/gpl.html)


## Contributors
* Niels Seidel [@nise81](https://twitter.com/nise81)

---
<a href="https://www.fernuni-hagen.de/english/research/clusters/catalpa/"><img src="pix/promotion/catalpa.jpg" width="300" /></a>
<a href="https://www.fernuni-hagen.de/"><img src="pix/promotion/fernuni.jpg" width="250" /></a>


````
