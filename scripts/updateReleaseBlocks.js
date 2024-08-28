import * as fs from 'fs';

let releaseVersion;

/**
 * Creates a RegExp for the block in CHANGELOG.md, which should be updated
 * @private
 *
 * @returns {RegExp} Block pattern
 */
function getChangelogRegexp() {
  const { version, versionDate, filterDate, linkStart, linkCommonFilter } = {
    version: '[0-9\\.]+',
    versionDate: '[0-9\\.\\s]+',
    filterDate: '[0-9%B\\-\\:\\s]+',
    linkStart: 'https:\\/\\/gerrit\\.ericsson\\.se\\/#\\/dashboard\\/\\?title=GAS\\+Release',
    linkCommonFilter: 'project:EEA\\/adp-ui-service\\+is:merged',
  };

  return RegExp(
    `(## Versions)\\s+` +
      `(### ${version} \\- \\(${versionDate} \\- \\))\\s+` +
      `(\\[See all the changes here\\]\\(${linkStart}&${version}=${linkCommonFilter}\\+after:"${filterDate}"\\))`,
  );
}

function getFormatedDateParts() {
  const releaseDate = new Date();

  const year = releaseDate.getFullYear();
  const month = `0${releaseDate.getMonth() + 1}`.slice(-2);
  const day = `0${releaseDate.getDate()}`.slice(-2);
  const time = releaseDate.toTimeString().split(' ')[0];
  // Timezone without GTM prefix
  const timezone = releaseDate.toTimeString().split(' ')[1].replace('GMT', '');

  return {
    year,
    month,
    day,
    time,
    timezone,
  };
}

/**
 * Generates a block with an updated dashboard link for the previous release version and a section
 * with new version title and link.
 * @private
 *
 * @param {string} fileData - Content of the CHANGELOG.md
 * @param {RegExp} updateRegexp - RegExp for the block which will be updated
 * @returns {string} Updated block
 */
function getChangelogUpdatedBlock(fileData, updateRegexp) {
  const LINK_START = 'https://gerrit-gamma.gic.ericsson.se/#/dashboard/?title=GAS+Release&';
  const LINK_COMMON_FILTER = 'project:EEA/adp-ui-service+is:merged';

  const updateBlockParts = fileData.match(updateRegexp);
  const [, versionsCommonLine, prevVersionTitle, prevVersionLink] = updateBlockParts;

  const { year, month, day, time, timezone } = getFormatedDateParts();
  const dateForTitle = `${year}. ${month}. ${day}`;
  const dateForLink = `${year}-${month}-${day}%20${time}%20${timezone.replace('+', '%252B')}`;

  const nextVersionTitle = `### ${releaseVersion} - (${dateForTitle} - )`;
  // TODO: correct link accuracy with mergedbefore and mergedafter search operators when Gerrit will be updated
  const nextVersionLink = `[See all the changes here](${LINK_START}${releaseVersion}=${LINK_COMMON_FILTER}+after:"${dateForLink}")`;
  // Remove closing bracket and add the rest of the header
  const prevVersionTitleUpdated = `${prevVersionTitle.slice(0, -1)} ${dateForTitle})`;
  // Remove closing backquote and add the rest of the link
  const prevVersionLinkUpdated = `${prevVersionLink.slice(0, -1)}+before:"${dateForLink}")`;

  return (
    `${versionsCommonLine}\n\n` +
    `${nextVersionTitle}\n\n` +
    `${nextVersionLink}\n\n` +
    `${prevVersionTitleUpdated}\n\n` +
    `${prevVersionLinkUpdated}`
  );
}

/**
 * Generates a block with new version section and it's subsection
 * @private
 *
 * @param {string} fileData - Content of the CHANGELOG.md
 * @param {RegExp} updateRegexp - RegExp for the block which will be updated
 * @returns {string} Updated block
 */
function getReleaseNotesUpdatedBlock(fileData, updateRegexp) {
  const prevVersionTitle = fileData.match(updateRegexp)[0];

  return (
    `## ${releaseVersion}\n\n` +
    'Migration:\n\n' +
    'Features:\n\n' +
    'Improvements:\n\n' +
    'Bug-fixes:\n\n' +
    `${prevVersionTitle}`
  );
}

/**
 * Updates release relative block, found by given RegExp.
 * @private
 *
 * @param {object} options
 * @param {string} options.fileName - Name of the file to update.
 * @param {string} options.releaseTitleMarker - The string contains a part of the next release
 * title, which will be used to check if the block has already been updated.
 * @param {RegExp} options.updateRegexp - Pattern for the block, which should be updated.
 * @param {Function} options.getUpdatedBlockFunc - Function to get an updated block.
 */
function updateReleaseBlock({ fileName, releaseTitleMarker, updateRegexp, getUpdatedBlockFunc }) {
  const fileData = fs.readFileSync(fileName, 'utf8');
  const isNextVersionBlockExist = fileData.includes(releaseTitleMarker);

  if (!isNextVersionBlockExist) {
    const updatedBlock = getUpdatedBlockFunc(fileData, updateRegexp);
    const updatedFileData = fileData.replace(updateRegexp, updatedBlock);

    try {
      fs.writeFileSync(fileName, updatedFileData);
      console.log(`SUCCESS: ${fileName} has just been updated`);
    } catch (err) {
      console.log(`Error occurs while updating ${fileName}`, err);
    }
  }
}

try {
  releaseVersion = fs.readFileSync('VERSION_PREFIX', 'utf8');

  const updateFileOptionList = [
    {
      fileName: './CHANGELOG.md',
      releaseTitleMarker: `### ${releaseVersion} - (`,
      updateRegexp: getChangelogRegexp(),
      getUpdatedBlockFunc: getChangelogUpdatedBlock,
    },
    {
      fileName: './docs/release/content/release_notes.md',
      releaseTitleMarker: `## ${releaseVersion}`,
      updateRegexp: /## [0-9\\.]+/,
      getUpdatedBlockFunc: getReleaseNotesUpdatedBlock,
    },
  ];

  updateFileOptionList.forEach(updateReleaseBlock);
} catch (err) {
  console.log('Error occurs while reading VERSION_PREFIX file', err);
}
