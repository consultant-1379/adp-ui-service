# Project comparison configs for WinMerge

This folder contains config files for project comparison. By this [WinMerge](https://winmerge.org/)
can be used to compare GAS with other NodeJS projects in an efficient way.

Currently the config files are adopted for a GAS vs HA comparison, but can be updated for any other
NodeJS project.

_Note_: this is a Windows only tool.

## Setup

1. install [WinMerge](https://winmerge.org/)
2. apply the `winmerge-substitution-filters.reg` registry settings for Substitution Filters

## Usage

Open WinMerge, then use _File_ / _Open..._ to start a new folder comparison.
Select GAS for the first folder, and HA for the second folder.

In the _Folder: Filter_ section click _Select..._ and load the `gitignore.flt` file from this folder
to add ignore rules for the common runtime folders (like .git, .bob, node_modules, etc.)

If the `winmerge-substitution-filters.reg` Substitution Filters were applied the naming differences
between GAS and HA are ignored in the overall diff. Check the _Substitution Filters_ tab for the
currently active filters. Also these can be edited here.

Then click _Compare_ to see the differences in the projects.

## Substitution Filters

Substitution Filters are used to ignore some natural differences between GAS and HA projects to help
finding relevant differences.
The logic is to replace the GAS or HA specific strings to a common representation.
The order of the filters is relevant as it determines the order of replaces.

To save and export the Substitution Filters open the RegEdit program and export the following key:
`HKEY_USERS\S-1-12-1-3911357614-1084388122-4213584314-1229643203\SOFTWARE\Thingamahoochie\WinMerge\SubstitutionFilters`
